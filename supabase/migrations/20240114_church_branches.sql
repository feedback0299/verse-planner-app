-- Create church_branches table
CREATE TABLE IF NOT EXISTS church_branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  is_headquarters BOOLEAN DEFAULT false,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE church_branches ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public read branches" ON church_branches
  FOR SELECT USING (true);

CREATE POLICY "Admin manage branches" ON church_branches
  FOR ALL USING (auth.role() = 'authenticated');

-- Insert Headquarters (Thanjavur)
INSERT INTO church_branches (name, address, latitude, longitude, is_headquarters)
VALUES ('Athumanesar Thanjavur', 'Thanjavur, Tamil Nadu, India', 10.7870, 79.1378, true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Admin manage branches" ON church_branches;
CREATE POLICY "Admin manage branches" ON church_branches
  FOR ALL USING (true);
