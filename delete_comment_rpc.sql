-- Atomic RPC for comment deletion with proper orphaning
-- Soft if has children; otherwise hard. Orphans *direct* children on soft.
-- Returns: {"mode":"soft"|"hard","movedChildren":[uuid,...]}

CREATE OR REPLACE FUNCTION public.delete_comment_apply(p_comment_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  has_kids BOOLEAN;
  moved UUID[];
BEGIN
  -- Lock the target row to avoid concurrent races
  PERFORM 1 FROM public.comments WHERE id = p_comment_id FOR UPDATE;

  -- Check if comment has children (regardless of deleted status)
  SELECT EXISTS (SELECT 1 FROM public.comments WHERE parent_id = p_comment_id)
    INTO has_kids;

  IF has_kids THEN
    -- Collect child ids
    SELECT COALESCE(ARRAY_AGG(id), '{}') INTO moved
    FROM public.comments
    WHERE parent_id = p_comment_id;

    -- Soft delete the parent
    UPDATE public.comments
       SET deleted    = TRUE,
           body       = '[deleted]',
           updated_at = NOW()
     WHERE id = p_comment_id;

    -- Orphan direct children (do not touch grandchildren)
    UPDATE public.comments
       SET parent_id  = NULL,
           updated_at = NOW()
     WHERE parent_id = p_comment_id;

    RETURN jsonb_build_object('mode','soft','movedChildren', moved);
  ELSE
    -- Hard delete: completely remove
    DELETE FROM public.comments WHERE id = p_comment_id;
    RETURN jsonb_build_object('mode','hard','movedChildren', '[]'::jsonb);
  END IF;
END $$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.delete_comment_apply(UUID) TO anon, authenticated;
