-- Create eSIM providers table
CREATE TABLE IF NOT EXISTS providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  website_url TEXT,
  logo_url TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert common eSIM providers
INSERT INTO providers (name, website_url, description) VALUES
  ('Airalo', 'https://www.airalo.com', 'Global eSIM marketplace with coverage in 200+ countries'),
  ('Holafly', 'https://holafly.com', 'Unlimited data eSIMs for travelers'),
  ('Nomad', 'https://www.getnomad.app', 'eSIM data plans for digital nomads'),
  ('Ubigi', 'https://cellulardata.ubigi.com', 'Global cellular data connectivity'),
  ('GigSky', 'https://www.gigsky.com', 'International mobile data for travelers'),
  ('Truphone', 'https://www.truphone.com', 'Global mobile connectivity solutions'),
  ('Maya Mobile', 'https://www.maya.net', 'International mobile data services'),
  ('RedteaGO', 'https://www.redteago.com', 'Global eSIM data plans'),
  ('Flexiroam', 'https://www.flexiroam.com', 'Global data roaming solutions'),
  ('Orange Holiday', 'https://travel.orange.com', 'European travel eSIM plans'),
  ('Three', 'https://www.three.co.uk', 'UK-based mobile network with international plans'),
  ('Vodafone', 'https://www.vodafone.com', 'Global mobile network operator'),
  ('KnowRoaming', 'https://www.knowroaming.com', 'Global roaming and eSIM solutions'),
  ('WorldSIM', 'https://www.worldsim.com', 'International SIM and eSIM provider'),
  ('Keepgo', 'https://www.keepgo.com', 'Global mobile data connectivity')
ON CONFLICT (name) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_providers_name ON providers(name);
CREATE INDEX IF NOT EXISTS idx_providers_active ON providers(is_active);
