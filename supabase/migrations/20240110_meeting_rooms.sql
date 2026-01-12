-- Create meeting_rooms table
CREATE TABLE IF NOT EXISTS public.meeting_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  owner_id UUID REFERENCES public.admin_data(id), 
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.meeting_rooms ENABLE ROW LEVEL SECURITY;

-- Allow anyone to see rooms if they have the link
CREATE POLICY "Public rooms are viewable by everyone" 
ON public.meeting_rooms FOR SELECT 
USING (true);

-- Allow admins to manage rooms
CREATE POLICY "Admins can manage rooms" 
ON public.meeting_rooms FOR ALL 
USING (true); -- Adjust this based on your admin auth logic
