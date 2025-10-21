-- Add 20 popular travel destinations for digital nomads and tourists
-- These countries will appear in the dropdown once they have eSIM plans
INSERT INTO countries (name, code, region)
VALUES -- Southeast Asia (5 countries)
    ('Cambodia', 'KH', 'Asia'),
    ('Laos', 'LA', 'Asia'),
    ('Sri Lanka', 'LK', 'Asia'),
    ('Myanmar', 'MM', 'Asia'),
    ('Bangladesh', 'BD', 'Asia'),
    -- South America (5 countries)
    ('Ecuador', 'EC', 'Americas'),
    ('Uruguay', 'UY', 'Americas'),
    ('Bolivia', 'BO', 'Americas'),
    ('Paraguay', 'PY', 'Americas'),
    ('Costa Rica', 'CR', 'Americas'),
    -- Europe - Balkans & Eastern (7 countries)
    ('Georgia', 'GE', 'Asia'),
    ('Albania', 'AL', 'Europe'),
    ('Serbia', 'RS', 'Europe'),
    ('Bosnia and Herzegovina', 'BA', 'Europe'),
    ('Montenegro', 'ME', 'Europe'),
    ('North Macedonia', 'MK', 'Europe'),
    ('Moldova', 'MD', 'Europe'),
    -- Island/Beach Destinations (3 countries)
    ('Maldives', 'MV', 'Asia'),
    ('Mauritius', 'MU', 'Africa'),
    ('Fiji', 'FJ', 'Oceania') ON CONFLICT (code) DO NOTHING;
-- Create indexes if they don't exist (already should exist from 001)
CREATE INDEX IF NOT EXISTS idx_countries_code ON countries(code);
CREATE INDEX IF NOT EXISTS idx_countries_region ON countries(region);
-- Show summary of what was added
DO $$
DECLARE total_countries INTEGER;
countries_with_plans INTEGER;
BEGIN
SELECT COUNT(*) INTO total_countries
FROM countries;
SELECT COUNT(DISTINCT country_id) INTO countries_with_plans
FROM esim_plans
WHERE is_active = true;
RAISE NOTICE '===========================================';
RAISE NOTICE 'Countries Update Summary:';
RAISE NOTICE 'Total countries in database: %',
total_countries;
RAISE NOTICE 'Countries with eSIM plans: %',
countries_with_plans;
RAISE NOTICE 'Countries without plans: %',
(total_countries - countries_with_plans);
RAISE NOTICE '===========================================';
RAISE NOTICE 'NOTE: New countries will appear in dropdown after eSIM plans are added';
END $$;
