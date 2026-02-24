-- =====================================================
-- HOTFIX: Remove 'both' reference from trigger function
-- =====================================================
-- Description: Fixes the create_free_subscription_for_new_user() function
-- to use only 'individual' target_user_type instead of IN ('individual', 'both')
-- Reason: 'both' value does not exist in plan_target_type enum
-- =====================================================

CREATE OR REPLACE FUNCTION core.create_free_subscription_for_new_user()
RETURNS TRIGGER AS $$
DECLARE
    free_plan_id UUID;
BEGIN
    -- Get the default free plan
    SELECT id INTO free_plan_id 
    FROM core.plans 
        WHERE tier = 'individual_free'
            AND target_user_type = 'individual'
      AND is_default = TRUE 
      AND is_active = TRUE
    LIMIT 1;

        -- Fallback: if no default exists, use any active individual free plan
        IF free_plan_id IS NULL THEN
                SELECT id INTO free_plan_id
                FROM core.plans
                WHERE tier = 'individual_free'
                    AND target_user_type = 'individual'
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

COMMENT ON FUNCTION core.create_free_subscription_for_new_user() IS 
'Automatically creates a free subscription for new users upon registration (HOTFIX: removed both from target_user_type)';

-- Verify the fix
SELECT 
    p.proname AS function_name,
    pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'core'
  AND p.proname = 'create_free_subscription_for_new_user';
