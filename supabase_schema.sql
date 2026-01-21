-- Profiles table to store extended user information
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  custom_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  city_location TEXT,
  participation_mode TEXT NOT NULL, -- 'offline' | 'online'
  attendance_frequency TEXT, -- 'daily' | 'some_days' (for offline)
  online_regularity TEXT, -- 'yes' | 'mostly' | 'ocassionally' (for online)
  category TEXT NOT NULL, -- 'kids_teens' | 'adult'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contest Progress table for tracking the 70-day challenge
CREATE TABLE IF NOT EXISTS public.contest_progress (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  progress_mask TEXT NOT NULL DEFAULT '0000000000000000000000000000000000000000000000000000000000000000000000',
  last_check_in_date DATE,
  category TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_progress ENABLE ROW LEVEL SECURITY;

-- Policies for Profiles
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" 
  ON public.profiles FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Policies for Contest Progress
CREATE POLICY "Contest progress is viewable by everyone" 
  ON public.contest_progress FOR SELECT USING (true);

CREATE POLICY "Users can update their own progress" 
  ON public.contest_progress FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for all users" 
  ON public.contest_progress FOR INSERT WITH CHECK (true);

-- Function to generate the custom MXXXXXXXXX ID
CREATE OR REPLACE FUNCTION generate_next_custom_id() 
RETURNS TEXT AS $$
DECLARE
    next_seq INTEGER;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(custom_id FROM 2) AS INTEGER)), 0) + 1 INTO next_seq FROM public.profiles;
    RETURN 'M' || LPAD(next_seq::TEXT, 9, '0');
END;
$$ LANGUAGE plpgsql;

-- Grant permissions for RPC
GRANT EXECUTE ON FUNCTION public.generate_next_custom_id() TO anon, authenticated;

-- Table for 70-day Bible reading contest schedule
CREATE TABLE IF NOT EXISTS public.contest_readings (
  id SERIAL PRIMARY KEY,
  day INTEGER NOT NULL,
  category TEXT NOT NULL, -- 'kids_teens' | 'adult'
  psalms TEXT,
  proverbs TEXT,
  new_testament TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(day, category)
);

-- Enable RLS
ALTER TABLE public.contest_readings ENABLE ROW LEVEL SECURITY;

-- Policies for Contest Readings
CREATE POLICY "Contest readings are viewable by everyone" 
  ON public.contest_readings FOR SELECT USING (true);

CREATE POLICY "Admins can manage contest readings" 
  ON public.contest_readings FOR ALL USING (true); -- Simplified for admin use, in prod restrict to admin role
