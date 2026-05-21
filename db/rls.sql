-- ============================================================
-- Row Level Security policies
-- Assumes RLS is already ON for both tables.
-- ============================================================

-- ── items ────────────────────────────────────────────────────

-- Enable RLS on items (idempotent)
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all items; nobody writes through the client
CREATE POLICY "items_select_authenticated"
  ON public.items
  FOR SELECT
  TO authenticated
  USING (true);

-- ── favorites ────────────────────────────────────────────────

-- Users can only see their own favorites
CREATE POLICY "favorites_select_own"
  ON public.favorites
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert favorites only for themselves.
-- The edge function also enforces this server-side, but defense-in-depth is worth it.
CREATE POLICY "favorites_insert_own"
  ON public.favorites
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can delete only their own favorites
CREATE POLICY "favorites_delete_own"
  ON public.favorites
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- UPDATE is intentionally omitted: favorites have no mutable fields.
-- The only meaningful operation is insert (favorite) or delete (unfavorite).
