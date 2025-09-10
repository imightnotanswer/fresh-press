-- Create set_comment_vote_with_user RPC function that accepts user_id as parameter
CREATE OR REPLACE FUNCTION public.set_comment_vote_with_user(
    p_comment_id UUID,
    p_user_id TEXT,
    p_value INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- If value is 0, remove the vote
    IF p_value = 0 THEN
        DELETE FROM public.comment_votes 
        WHERE comment_id = p_comment_id AND user_id = p_user_id;
    ELSE
        -- Upsert the vote (insert or update)
        INSERT INTO public.comment_votes (comment_id, user_id, value)
        VALUES (p_comment_id, p_user_id, p_value)
        ON CONFLICT (comment_id, user_id)
        DO UPDATE SET value = p_value;
    END IF;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.set_comment_vote_with_user(UUID, TEXT, INTEGER) TO authenticated;
