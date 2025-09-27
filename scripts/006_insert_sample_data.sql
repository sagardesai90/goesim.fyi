-- Insert sample eSIM plans for testing and demonstration
DO $$
DECLARE
  airalo_id UUID;
  holafly_id UUID;
  nomad_id UUID;
  us_id UUID;
  uk_id UUID;
  de_id UUID;
  fr_id UUID;
  jp_id UUID;
  au_id UUID;
BEGIN
  -- Get provider IDs
  SELECT id INTO airalo_id FROM providers WHERE name = 'Airalo';
  SELECT id INTO holafly_id FROM providers WHERE name = 'Holafly';
  SELECT id INTO nomad_id FROM providers WHERE name = 'Nomad';
  
  -- Get country IDs
  SELECT id INTO us_id FROM countries WHERE code = 'US';
  SELECT id INTO uk_id FROM countries WHERE code = 'GB';
  SELECT id INTO de_id FROM countries WHERE code = 'DE';
  SELECT id INTO fr_id FROM countries WHERE code = 'FR';
  SELECT id INTO jp_id FROM countries WHERE code = 'JP';
  SELECT id INTO au_id FROM countries WHERE code = 'AU';

  -- Insert sample plans for United States
  INSERT INTO esim_plans (provider_id, country_id, name, data_amount_gb, validity_days, price_usd, is_unlimited, plan_url) VALUES
    (airalo_id, us_id, 'USA 1GB - 7 Days', 1, 7, 4.50, false, 'https://www.airalo.com/usa-esim'),
    (airalo_id, us_id, 'USA 3GB - 30 Days', 3, 30, 11.00, false, 'https://www.airalo.com/usa-esim'),
    (airalo_id, us_id, 'USA 5GB - 30 Days', 5, 30, 16.00, false, 'https://www.airalo.com/usa-esim'),
    (airalo_id, us_id, 'USA 10GB - 30 Days', 10, 30, 26.00, false, 'https://www.airalo.com/usa-esim'),
    (airalo_id, us_id, 'USA 20GB - 30 Days', 20, 30, 42.00, false, 'https://www.airalo.com/usa-esim'),
    
    (holafly_id, us_id, 'USA Unlimited - 5 Days', 999, 5, 19.00, true, 'https://holafly.com/usa-esim'),
    (holafly_id, us_id, 'USA Unlimited - 7 Days', 999, 7, 27.00, true, 'https://holafly.com/usa-esim'),
    (holafly_id, us_id, 'USA Unlimited - 15 Days', 999, 15, 47.00, true, 'https://holafly.com/usa-esim'),
    (holafly_id, us_id, 'USA Unlimited - 30 Days', 999, 30, 69.00, true, 'https://holafly.com/usa-esim'),
    
    (nomad_id, us_id, 'USA 1GB - 7 Days', 1, 7, 5.00, false, 'https://www.getnomad.app/usa'),
    (nomad_id, us_id, 'USA 3GB - 30 Days', 3, 30, 12.00, false, 'https://www.getnomad.app/usa'),
    (nomad_id, us_id, 'USA 10GB - 30 Days', 10, 30, 28.00, false, 'https://www.getnomad.app/usa');

  -- Insert sample plans for United Kingdom
  INSERT INTO esim_plans (provider_id, country_id, name, data_amount_gb, validity_days, price_usd, is_unlimited, plan_url) VALUES
    (airalo_id, uk_id, 'UK 1GB - 7 Days', 1, 7, 4.50, false, 'https://www.airalo.com/uk-esim'),
    (airalo_id, uk_id, 'UK 3GB - 30 Days', 3, 30, 11.00, false, 'https://www.airalo.com/uk-esim'),
    (airalo_id, uk_id, 'UK 5GB - 30 Days', 5, 30, 16.00, false, 'https://www.airalo.com/uk-esim'),
    (airalo_id, uk_id, 'UK 10GB - 30 Days', 10, 30, 26.00, false, 'https://www.airalo.com/uk-esim'),
    
    (holafly_id, uk_id, 'UK Unlimited - 5 Days', 999, 5, 19.00, true, 'https://holafly.com/uk-esim'),
    (holafly_id, uk_id, 'UK Unlimited - 7 Days', 999, 7, 27.00, true, 'https://holafly.com/uk-esim'),
    (holafly_id, uk_id, 'UK Unlimited - 15 Days', 999, 15, 47.00, true, 'https://holafly.com/uk-esim'),
    
    (nomad_id, uk_id, 'UK 2GB - 14 Days', 2, 14, 8.00, false, 'https://www.getnomad.app/uk'),
    (nomad_id, uk_id, 'UK 5GB - 30 Days', 5, 30, 18.00, false, 'https://www.getnomad.app/uk');

  -- Insert sample plans for Germany
  INSERT INTO esim_plans (provider_id, country_id, name, data_amount_gb, validity_days, price_usd, is_unlimited, plan_url) VALUES
    (airalo_id, de_id, 'Germany 1GB - 7 Days', 1, 7, 4.50, false, 'https://www.airalo.com/germany-esim'),
    (airalo_id, de_id, 'Germany 3GB - 30 Days', 3, 30, 11.00, false, 'https://www.airalo.com/germany-esim'),
    (airalo_id, de_id, 'Germany 5GB - 30 Days', 5, 30, 16.00, false, 'https://www.airalo.com/germany-esim'),
    
    (holafly_id, de_id, 'Germany Unlimited - 5 Days', 999, 5, 19.00, true, 'https://holafly.com/germany-esim'),
    (holafly_id, de_id, 'Germany Unlimited - 15 Days', 999, 15, 47.00, true, 'https://holafly.com/germany-esim'),
    
    (nomad_id, de_id, 'Germany 3GB - 30 Days', 3, 30, 13.00, false, 'https://www.getnomad.app/germany');

  -- Insert sample plans for Japan
  INSERT INTO esim_plans (provider_id, country_id, name, data_amount_gb, validity_days, price_usd, is_unlimited, plan_url) VALUES
    (airalo_id, jp_id, 'Japan 1GB - 7 Days', 1, 7, 4.50, false, 'https://www.airalo.com/japan-esim'),
    (airalo_id, jp_id, 'Japan 3GB - 30 Days', 3, 30, 11.00, false, 'https://www.airalo.com/japan-esim'),
    (airalo_id, jp_id, 'Japan 5GB - 30 Days', 5, 30, 16.00, false, 'https://www.airalo.com/japan-esim'),
    (airalo_id, jp_id, 'Japan 10GB - 30 Days', 10, 30, 26.00, false, 'https://www.airalo.com/japan-esim'),
    
    (holafly_id, jp_id, 'Japan Unlimited - 5 Days', 999, 5, 19.00, true, 'https://holafly.com/japan-esim'),
    (holafly_id, jp_id, 'Japan Unlimited - 7 Days', 999, 7, 27.00, true, 'https://holafly.com/japan-esim'),
    (holafly_id, jp_id, 'Japan Unlimited - 15 Days', 999, 15, 47.00, true, 'https://holafly.com/japan-esim'),
    
    (nomad_id, jp_id, 'Japan 1GB - 7 Days', 1, 7, 6.00, false, 'https://www.getnomad.app/japan'),
    (nomad_id, jp_id, 'Japan 3GB - 30 Days', 3, 30, 15.00, false, 'https://www.getnomad.app/japan');

END $$;
