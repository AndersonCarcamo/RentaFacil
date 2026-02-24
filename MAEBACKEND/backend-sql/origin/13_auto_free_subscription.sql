-- =====================================================
-- AUTO-ASSIGN FREE SUBSCRIPTION TO NEW USERS
-- =====================================================
-- Description: Automatically creates a free subscription when a new user registers
-- This ensures every user always has an active subscription
-- =====================================================

-- Function to create free subscription for new users
CREATE OR REPLACE FUNCTION core.create_free_subscription_for_new_user()
RETURNS TRIGGER AS $$
DECLARE
    free_plan_id UUID;
BEGIN
    -- Get the default free plan
    SELECT id INTO free_plan_id 
    FROM core.plans 
        WHERE tier = 'individual_free'
            AND target_user_type IN ('individual', 'both')
      AND is_default = TRUE 
      AND is_active = TRUE
    LIMIT 1;

        -- Fallback: if no default exists, use any active individual free plan
        IF free_plan_id IS NULL THEN
                SELECT id INTO free_plan_id
                FROM core.plans
                WHERE tier = 'individual_free'
                    AND target_user_type IN ('individual', 'both')
                    AND is_active = TRUE
                ORDER BY is_default DESC, created_at ASC
                LIMIT 1;
        END IF;
    
    -- If no free plan exists, raise error
    IF free_plan_id IS NULL THEN
        RAISE EXCEPTION 'No active individual_free plan found. Please create one (ideally is_default=TRUE)';
    END IF;
    
    -- Create subscription for the new user
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
        NOW() + INTERVAL '100 years',  -- Permanent for free plan
        FALSE
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on users table
DROP TRIGGER IF EXISTS trigger_create_free_subscription ON core.users;
CREATE TRIGGER trigger_create_free_subscription
    AFTER INSERT ON core.users
    FOR EACH ROW
    EXECUTE FUNCTION core.create_free_subscription_for_new_user();

COMMENT ON FUNCTION core.create_free_subscription_for_new_user() IS 
'Automatically creates a free subscription for new users upon registration';

COMMENT ON TRIGGER trigger_create_free_subscription ON core.users IS
'Creates a free subscription automatically when a new user is registered';

-- =====================================================
-- BACKFILL: Create subscriptions for existing users without one
-- =====================================================
-- Run this once to create free subscriptions for all existing users

DO $$
DECLARE
    free_plan_id UUID;
    user_record RECORD;
    created_count INTEGER := 0;
BEGIN
    -- Get the default free plan
    SELECT id INTO free_plan_id 
    FROM core.plans 
    WHERE tier = 'individual_free' 
      AND is_default = TRUE 
      AND is_active = TRUE
    LIMIT 1;
    
    -- If no free plan exists, skip backfill
    IF free_plan_id IS NULL THEN
        RAISE NOTICE 'No default free plan found. Skipping backfill. Please insert plans first.';
        RETURN;
    END IF;
    
    -- Create free subscription for users that don't have any active subscription
    FOR user_record IN 
        SELECT u.id 
        FROM core.users u
        LEFT JOIN core.subscriptions s ON s.user_id = u.id AND s.status = 'active'
        WHERE s.id IS NULL
    LOOP
        INSERT INTO core.subscriptions (
            user_id,
            plan_id,
            status,
            current_period_start,
            current_period_end,
            cancel_at_period_end
        ) VALUES (
            user_record.id,
            free_plan_id,   
            'active',
            NOW(),
            NOW() + INTERVAL '100 years',
            FALSE
        );
        
        created_count := created_count + 1;
    END LOOP;
    
    RAISE NOTICE 'Created % free subscriptions for existing users without subscription', created_count;
END $$;

-- =====================================================
-- AUTO-REFRESH VIEW ON SUBSCRIPTION CHANGES
-- =====================================================
-- Create function to refresh view when subscriptions change
CREATE OR REPLACE FUNCTION core.refresh_user_plan_view()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY core.v_user_current_plan;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop triggers if exist
DROP TRIGGER IF EXISTS trigger_refresh_plan_view_on_insert ON core.subscriptions;
DROP TRIGGER IF EXISTS trigger_refresh_plan_view_on_update ON core.subscriptions;

-- Create triggers to auto-refresh view
CREATE TRIGGER trigger_refresh_plan_view_on_insert
    AFTER INSERT ON core.subscriptions
    FOR EACH STATEMENT
    EXECUTE FUNCTION core.refresh_user_plan_view();

CREATE TRIGGER trigger_refresh_plan_view_on_update
    AFTER UPDATE ON core.subscriptions
    FOR EACH STATEMENT
    EXECUTE FUNCTION core.refresh_user_plan_view();

COMMENT ON FUNCTION core.refresh_user_plan_view() IS 
'Automatically refreshes v_user_current_plan materialized view when subscriptions change';

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check users without subscriptions (should be 0 after backfill)
SELECT 
    COUNT(*) as users_without_subscription
FROM core.users u
LEFT JOIN core.subscriptions s ON s.user_id = u.id AND s.status = 'active'
WHERE s.id IS NULL;

-- Show subscription distribution
SELECT 
    p.name as plan_name,
    p.tier,
    COUNT(s.id) as subscription_count
FROM core.plans p
LEFT JOIN core.subscriptions s ON s.plan_id = p.id AND s.status = 'active'
GROUP BY p.id, p.name, p.tier
ORDER BY p.tier;

-- Test: Show sample users with their subscriptions
SELECT 
    u.email,
    u.first_name,
    u.last_name,
    p.name as plan_name,
    p.tier,
    s.status,
    s.current_period_end
FROM core.users u
JOIN core.subscriptions s ON s.user_id = u.id AND s.status = 'active'
JOIN core.plans p ON p.id = s.plan_id
LIMIT 10;

-- Verify view has data
SELECT COUNT(*) as users_in_view FROM core.v_user_current_plan;
