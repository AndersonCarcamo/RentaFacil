-- ===== Real Estate Marketplace MVP - Billing & Payments System =====
-- Invoices, payments, refunds, and revenue analytics

-- Invoices
CREATE TABLE IF NOT EXISTS core.invoices (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    subscription_id         UUID REFERENCES core.subscriptions(id) ON DELETE SET NULL,
    plan_id                 UUID REFERENCES core.plans(id),
    
    -- Invoice details
    invoice_number          TEXT UNIQUE,
    status                  core.invoice_status NOT NULL DEFAULT 'open',
    currency                CHAR(3) NOT NULL DEFAULT 'PEN',
    subtotal                NUMERIC(12,2) NOT NULL DEFAULT 0,
    tax_amount              NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_amount            NUMERIC(12,2) NOT NULL DEFAULT 0,
    amount_paid             NUMERIC(12,2) NOT NULL DEFAULT 0,
    
    -- External billing integration
    external_invoice_id     TEXT,
    
    -- Timestamps
    issued_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    due_at                  TIMESTAMPTZ,
    paid_at                 TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS invoices_user_idx ON core.invoices(user_id, status, issued_at DESC);

CREATE TABLE IF NOT EXISTS core.invoice_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id      UUID NOT NULL REFERENCES core.invoices(id) ON DELETE CASCADE,
    plan_id         UUID REFERENCES core.plans(id),
    description     TEXT NOT NULL,
    quantity        INTEGER NOT NULL DEFAULT 1,
    unit_amount     NUMERIC(12,2) NOT NULL,
    amount          NUMERIC(12,2) NOT NULL,
    currency        CHAR(3) NOT NULL DEFAULT 'PEN',
    period_start    TIMESTAMPTZ,
    period_end      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS invoice_items_invoice_idx ON core.invoice_items(invoice_id);

-- Payments
CREATE TABLE IF NOT EXISTS core.payments (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id              UUID NOT NULL REFERENCES core.invoices(id) ON DELETE CASCADE,
    user_id                 UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    provider                core.billing_provider NOT NULL,
    amount                  NUMERIC(12,2) NOT NULL,
    currency                CHAR(3) NOT NULL DEFAULT 'PEN',
    status                  core.payment_status NOT NULL DEFAULT 'pending',
    provider_payment_id     TEXT,
    method_brand            TEXT,  -- visa/master/culqi_card/etc
    method_last4            TEXT,
    receipt_url             TEXT,
    failure_code            TEXT,
    failure_message         TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    confirmed_at            TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS payments_invoice_idx ON core.payments(invoice_id, status, created_at DESC);

-- Refunds
CREATE TABLE IF NOT EXISTS core.refunds (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id          UUID NOT NULL REFERENCES core.payments(id) ON DELETE CASCADE,
    amount              NUMERIC(12,2) NOT NULL,
    reason              TEXT,
    status              TEXT NOT NULL DEFAULT 'succeeded', -- simple status
    provider_refund_id  TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS refunds_payment_idx ON core.refunds(payment_id);

-- Helper: activate subscription when invoice is paid
CREATE OR REPLACE FUNCTION core.activate_subscription_from_invoice(p_invoice_id UUID)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
    v_inv core.invoices%ROWTYPE;
    v_plan core.plans%ROWTYPE;
BEGIN
    SELECT * INTO v_inv FROM core.invoices WHERE id = p_invoice_id;
    IF NOT FOUND THEN RETURN; END IF;
    IF v_inv.subscription_id IS NULL THEN RETURN; END IF;

    SELECT p.* INTO v_plan FROM core.plans p WHERE p.id = v_inv.plan_id;
    IF NOT FOUND THEN RETURN; END IF;

    UPDATE core.subscriptions s
    SET status = 'active',
        current_period_start = COALESCE(
          (SELECT MIN(ii.period_start) FROM core.invoice_items ii WHERE ii.invoice_id = v_inv.id), now()
        ),
        current_period_end = COALESCE(
          (SELECT MAX(ii.period_end) FROM core.invoice_items ii WHERE ii.invoice_id = v_inv.id),
          (now() + make_interval(months => v_plan.period_months))
        ),
        updated_at = now()
    WHERE s.id = v_inv.subscription_id;
END $$;

-- Trigger: when a payment succeeds, mark invoice paid and activate subscription
CREATE OR REPLACE FUNCTION core.on_payment_succeeded()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.status = 'succeeded' THEN
        UPDATE core.invoices
        SET status = 'paid', paid_at = COALESCE(paid_at, now()), amount_paid = amount_paid + NEW.amount
        WHERE id = NEW.invoice_id;
        PERFORM core.activate_subscription_from_invoice(NEW.invoice_id);
        NEW.confirmed_at := COALESCE(NEW.confirmed_at, now());
    END IF;
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_payment_succeeded ON core.payments;
CREATE TRIGGER trg_payment_succeeded
AFTER INSERT OR UPDATE OF status ON core.payments
FOR EACH ROW EXECUTE FUNCTION core.on_payment_succeeded();

-- Revenue analytics (Materialized Views)
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.mv_revenue_daily AS
SELECT
  date_trunc('day', i.paid_at) AS day,
  i.currency,
  i.plan_id,
  COUNT(DISTINCT i.id) AS invoices_paid,
  SUM(i.amount_paid) AS revenue
FROM core.invoices i
WHERE i.status = 'paid'
GROUP BY 1,2,3;
CREATE INDEX IF NOT EXISTS mv_revenue_daily_idx ON analytics.mv_revenue_daily(day, currency, plan_id);

-- MRR (monthly recurring revenue) approximado por mes (normaliza anual a mensual)
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.mv_mrr_monthly AS
WITH subs AS (
  SELECT s.id, s.plan_id, date_trunc('month', s.current_period_start) AS m_start,
         p.period_months, p.price_amount, p.price_currency,
         CASE WHEN p.period_months = 0 THEN 0 ELSE (p.price_amount / p.period_months) END AS mrr
  FROM core.subscriptions s
  JOIN core.plans p ON p.id = s.plan_id
  WHERE s.status = 'active'
)
SELECT m_start AS month,
       price_currency AS currency,
       plan_id,
       COUNT(*) AS active_subscriptions,
       SUM(mrr) AS mrr
FROM subs
GROUP BY 1,2,3;
CREATE INDEX IF NOT EXISTS mv_mrr_monthly_idx ON analytics.mv_mrr_monthly(month, currency, plan_id);
