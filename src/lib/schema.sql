-- Create verses table for Daily Verse Planner
create table if not exists daily_verses (
  date date primary key,
  book_number integer,
  chapter_number integer,
  verse_numbers text, -- Supports multiple verses like "1,2,3" or "1-5"
  book_name text,
  verse_text text,
  reference text,
  note1 text,
  note2 text,
  note3 text,
  last_updated timestamptz default now()
);

-- Create admin_data table for Admin Management
create table if not exists admin_data (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text unique not null,
  password text not null, -- Stores user password
  created_at timestamptz default now(),
  created_by text,
  updated_at timestamptz,
  updated_by text
);

-- Enable Row Level Security (RLS) if you want to restrict access
-- For now, allowing public read/write if policies are open, or authenticated users only.
-- alter table daily_verses enable row level security;
-- alter table admin_data enable row level security;
