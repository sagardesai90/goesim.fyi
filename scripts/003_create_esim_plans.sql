-- Create eSIM plans table
CREATE TABLE IF NOT EXISTS esim_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  country_id UUID NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  data_amount_gb DECIMAL(10,2) NOT NULL, -- Data amount in GB (e.g., 1.5, 5, 10, 999 for unlimited)
  validity_days INTEGER NOT NULL, -- How many days the plan is valid
  price_usd DECIMAL(10,2) NOT NULL, -- Price in USD
  currency TEXT DEFAULT 'USD',
  original_price DECIMAL(10,2), -- Original price if there's a discount
  is_unlimited BOOLEAN DEFAULT false, -- True if unlimited data
  network_type TEXT DEFAULT '4G/5G', -- 3G, 4G, 5G, 4G/5G
  coverage_type TEXT DEFAULT 'National', -- National, Regional, Global
  activation_policy TEXT, -- Auto-activate, Manual activation, etc.
  data_speed TEXT, -- High speed, Reduced after X GB, etc.
  hotspot_allowed BOOLEAN DEFAULT true,
  voice_calls BOOLEAN DEFAULT false,
  sms_included BOOLEAN DEFAULT false,
  plan_url TEXT, -- Direct link to purchase this plan
  affiliate_url TEXT, -- Affiliate link for revenue
  is_active BOOLEAN DEFAULT true,
  last_scraped_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Calculated fields for comparison
  price_per_gb DECIMAL(10,2) GENERATED ALWAYS AS (
    CASE 
      WHEN is_unlimited OR data_amount_gb = 0 THEN NULL
      ELSE price_usd / data_amount_gb
    END
  ) STORED,
  
  price_per_day DECIMAL(10,2) GENERATED ALWAYS AS (
    CASE 
      WHEN validity_days = 0 THEN NULL
      ELSE price_usd / validity_days
    END
  ) STORED
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_esim_plans_provider ON esim_plans(provider_id);
CREATE INDEX IF NOT EXISTS idx_esim_plans_country ON esim_plans(country_id);
CREATE INDEX IF NOT EXISTS idx_esim_plans_data_amount ON esim_plans(data_amount_gb);
CREATE INDEX IF NOT EXISTS idx_esim_plans_price ON esim_plans(price_usd);
CREATE INDEX IF NOT EXISTS idx_esim_plans_validity ON esim_plans(validity_days);
CREATE INDEX IF NOT EXISTS idx_esim_plans_active ON esim_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_esim_plans_price_per_gb ON esim_plans(price_per_gb);
CREATE INDEX IF NOT EXISTS idx_esim_plans_unlimited ON esim_plans(is_unlimited);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_esim_plans_country_data ON esim_plans(country_id, data_amount_gb);
CREATE INDEX IF NOT EXISTS idx_esim_plans_country_price ON esim_plans(country_id, price_usd);
CREATE INDEX IF NOT EXISTS idx_esim_plans_provider_country ON esim_plans(provider_id, country_id);
