-- Hotfix: align trigger function with new plan_tier enum values
-- Run this in PostgreSQL database after enum migration.

CREATE OR REPLACE FUNCTION core.create_free_subscription_for_new_user()
RETURNS TRIGGER AS $$
DECLARE
    free_plan_id UUID;
BEGIN
    -- Preferred: active default individual free plan
    SELECT id INTO free_plan_id
    FROM core.plans
    WHERE tier = 'individual_free'
      AND target_user_type IN ('individual', 'both')
      AND is_default = TRUE
      AND is_active = TRUE
    LIMIT 1;

    -- Fallback: any active individual free plan
    IF free_plan_id IS NULL THEN
        SELECT id INTO free_plan_id
        FROM core.plans
        WHERE tier = 'individual_free'
          AND target_user_type IN ('individual', 'both')
          AND is_active = TRUE
        ORDER BY is_default DESC, created_at ASC
        LIMIT 1;
    END IF;

    IF free_plan_id IS NULL THEN
        RAISE EXCEPTION 'No active individual_free plan found. Please create one (ideally is_default=TRUE)';
    END IF;

    INSERT INTO core.subscriptions (
        user_id,
        plan_id,
        status,
        current_period_start,
        current_period_end,
        cancel_at_period_end
    ) VALUES (
        NEW.id,
        free_plan_id,
        'active',
        NOW(),
        NOW() + INTERVAL '100 years',
        FALSE
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
