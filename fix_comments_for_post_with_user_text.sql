-- Create comments_for_post_with_user RPC function using TEXT instead of post_type enum
CREATE OR REPLACE FUNCTION public.comments_for_post_with_user(
    p_post_id TEXT,
    p_type TEXT,
    p_user_id TEXT,
    p_max INTEGER DEFAULT 1000
)
RETURNS TABLE (
    id UUID,
    post_type TEXT,
    post_id TEXT,
    parent_id UUID,
    user_id TEXT,
    body TEXT,
    deleted BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    score INTEGER,
    up_count INTEGER,
    down_count INTEGER,
    my_vote INTEGER,
    author_name TEXT,
    avatar_url TEXT,
    avatar_color TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.post_type,
        c.post_id,
        c.parent_id,
        c.user_id,
        c.body,
        c.deleted,
        c.created_at,
        c.updated_at,
        COALESCE(cs.score, 0) as score,
        COALESCE(cs.up_count, 0) as up_count,
        COALESCE(cs.down_count, 0) as down_count,
        COALESCE(cv.value, 0) as my_vote,
        COALESCE(up.username, 'User ' || SUBSTRING(c.user_id, 1, 8)) as author_name,
        up.avatar_url,
        up.avatar_color
    FROM public.comments c
    LEFT JOIN public.comment_scores cs ON c.id = cs.comment_id
    LEFT JOIN public.comment_votes cv ON c.id = cv.comment_id AND cv.user_id = p_user_id
    LEFT JOIN public.user_profiles up ON c.user_id = up.id
    WHERE c.post_id = p_post_id 
        AND c.post_type = p_type 
        AND c.deleted = FALSE
    ORDER BY COALESCE(cs.score, 0) DESC, c.created_at ASC
    LIMIT p_max;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.comments_for_post_with_user(TEXT, TEXT, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.comments_for_post_with_user(TEXT, TEXT, TEXT, INTEGER) TO anon;
