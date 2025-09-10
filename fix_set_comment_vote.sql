-- Fix set_comment_vote RPC function to handle null user_id
CREATE OR REPLACE FUNCTION public.set_comment_vote(
    p_comment_id UUID,
    p_value INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id TEXT;
BEGIN
    -- Get current user ID
    current_user_id := auth.uid()::TEXT;
    
    -- Check if user is authenticated
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;
    
    -- If value is 0, remove the vote
    IF p_value = 0 THEN
        DELETE FROM public.comment_votes 
        WHERE comment_id = p_comment_id AND user_id = current_user_id;
    ELSE
        -- Upsert the vote (insert or update)
        INSERT INTO public.comment_votes (comment_id, user_id, value)
        VALUES (p_comment_id, current_user_id, p_value)
        ON CONFLICT (comment_id, user_id)
        DO UPDATE SET value = p_value;
    END IF;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.set_comment_vote(UUID, INTEGER) TO authenticated;
