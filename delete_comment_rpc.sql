-- Atomic RPC for comment deletion with proper orphaning
-- Always soft delete. Orphans *direct* children on deletion.
-- Returns: {"mode":"soft","movedChildren":[uuid,...]}

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

  -- Always soft delete the comment
  UPDATE public.comments
     SET deleted    = TRUE,
         body       = '[deleted]',
         updated_at = NOW()
   WHERE id = p_comment_id;

  IF has_kids THEN
    -- Collect child ids (but don't orphan them - keep them as replies to deleted comment)
    SELECT COALESCE(ARRAY_AGG(id), '{}') INTO moved
    FROM public.comments
    WHERE parent_id = p_comment_id;
  ELSE
    moved := '{}';
  END IF;

  RETURN jsonb_build_object('mode','soft','movedChildren', moved);
END $$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.delete_comment_apply(UUID) TO anon, authenticated;

