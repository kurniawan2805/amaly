-- Create quran_labels table
CREATE TABLE IF NOT EXISTS public.quran_labels (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, name)
);

-- Create quran_bookmarks table
CREATE TABLE IF NOT EXISTS public.quran_bookmarks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label_id uuid REFERENCES public.quran_labels(id) ON DELETE CASCADE,
  surah smallint NOT NULL,
  ayah smallint NOT NULL,
  page smallint NOT NULL,
  note text,
  position smallint DEFAULT 0 NOT NULL,
  is_private boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, surah, ayah)
);

-- Enable RLS
ALTER TABLE public.quran_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quran_bookmarks ENABLE ROW LEVEL SECURITY;

-- Policies for quran_labels
CREATE POLICY "Users can manage their own labels"
  ON public.quran_labels
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for quran_bookmarks
CREATE POLICY "Users can manage their own bookmarks"
  ON public.quran_bookmarks
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view public bookmarks of others"
  ON public.quran_bookmarks
  FOR SELECT
  USING (is_private = false OR auth.uid() = user_id);

-- Seed default labels for existing users (optional but helpful)
-- This is just a helper, ideally handled in app logic or trigger
