-- Update Saily affiliate links for specific countries
-- This script updates the affiliate URLs for Saily eSIM plans in the database
DO $$
DECLARE saily_provider_id UUID;
australia_id UUID;
canada_id UUID;
usa_id UUID;
france_id UUID;
germany_id UUID;
italy_id UUID;
netherlands_id UUID;
spain_id UUID;
uk_id UUID;
japan_id UUID;
singapore_id UUID;
BEGIN -- Get Saily provider ID (create if doesn't exist)
SELECT id INTO saily_provider_id
FROM providers
WHERE name = 'Saily';
IF saily_provider_id IS NULL THEN
INSERT INTO providers (name, website_url, description, is_active)
VALUES (
        'Saily',
        'https://saily.com',
        'Global eSIM provider by Nord Security',
        true
    )
RETURNING id INTO saily_provider_id;
RAISE NOTICE 'Created Saily provider with ID: %',
saily_provider_id;
ELSE RAISE NOTICE 'Found existing Saily provider with ID: %',
saily_provider_id;
END IF;
-- Get country IDs
SELECT id INTO australia_id
FROM countries
WHERE code = 'AU';
SELECT id INTO canada_id
FROM countries
WHERE code = 'CA';
SELECT id INTO usa_id
FROM countries
WHERE code = 'US';
SELECT id INTO france_id
FROM countries
WHERE code = 'FR';
SELECT id INTO germany_id
FROM countries
WHERE code = 'DE';
SELECT id INTO italy_id
FROM countries
WHERE code = 'IT';
SELECT id INTO netherlands_id
FROM countries
WHERE code = 'NL';
SELECT id INTO spain_id
FROM countries
WHERE code = 'ES';
SELECT id INTO uk_id
FROM countries
WHERE code = 'GB';
SELECT id INTO japan_id
FROM countries
WHERE code = 'JP';
SELECT id INTO singapore_id
FROM countries
WHERE code = 'SG';
-- Update affiliate URLs for Saily plans by country
-- Australia (url_id=645)
UPDATE esim_plans
SET affiliate_url = 'https://go.saily.site/aff_c?offer_id=101&aff_id=10849&url_id=645',
    updated_at = NOW()
WHERE provider_id = saily_provider_id
    AND country_id = australia_id
    AND (
        affiliate_url IS NULL
        OR affiliate_url != 'https://go.saily.site/aff_c?offer_id=101&aff_id=10849&url_id=645'
    );
RAISE NOTICE 'Updated % Australia plans',
FOUND;
-- Canada (url_id=638)
UPDATE esim_plans
SET affiliate_url = 'https://go.saily.site/aff_c?offer_id=101&aff_id=10849&source=goesim.fyi&url_id=638',
    updated_at = NOW()
WHERE provider_id = saily_provider_id
    AND country_id = canada_id
    AND (
        affiliate_url IS NULL
        OR affiliate_url != 'https://go.saily.site/aff_c?offer_id=101&aff_id=10849&source=goesim.fyi&url_id=638'
    );
RAISE NOTICE 'Updated % Canada plans',
FOUND;
-- United States (url_id=628)
UPDATE esim_plans
SET affiliate_url = 'https://go.saily.site/aff_c?offer_id=101&aff_id=10849&source=goesim.fyi&url_id=628',
    updated_at = NOW()
WHERE provider_id = saily_provider_id
    AND country_id = usa_id
    AND (
        affiliate_url IS NULL
        OR affiliate_url != 'https://go.saily.site/aff_c?offer_id=101&aff_id=10849&source=goesim.fyi&url_id=628'
    );
RAISE NOTICE 'Updated % United States plans',
FOUND;
-- France (url_id=634)
UPDATE esim_plans
SET affiliate_url = 'https://go.saily.site/aff_c?offer_id=101&aff_id=10849&source=goesim.fyi&url_id=634',
    updated_at = NOW()
WHERE provider_id = saily_provider_id
    AND country_id = france_id
    AND (
        affiliate_url IS NULL
        OR affiliate_url != 'https://go.saily.site/aff_c?offer_id=101&aff_id=10849&source=goesim.fyi&url_id=634'
    );
RAISE NOTICE 'Updated % France plans',
FOUND;
-- Germany (url_id=647)
UPDATE esim_plans
SET affiliate_url = 'https://go.saily.site/aff_c?offer_id=101&aff_id=10849&source=goesim.fyi&url_id=647',
    updated_at = NOW()
WHERE provider_id = saily_provider_id
    AND country_id = germany_id
    AND (
        affiliate_url IS NULL
        OR affiliate_url != 'https://go.saily.site/aff_c?offer_id=101&aff_id=10849&source=goesim.fyi&url_id=647'
    );
RAISE NOTICE 'Updated % Germany plans',
FOUND;
-- Italy (url_id=637)
UPDATE esim_plans
SET affiliate_url = 'https://go.saily.site/aff_c?offer_id=101&aff_id=10849&source=goesim.fyi&url_id=637',
    updated_at = NOW()
WHERE provider_id = saily_provider_id
    AND country_id = italy_id
    AND (
        affiliate_url IS NULL
        OR affiliate_url != 'https://go.saily.site/aff_c?offer_id=101&aff_id=10849&source=goesim.fyi&url_id=637'
    );
RAISE NOTICE 'Updated % Italy plans',
FOUND;
-- Netherlands (url_id=648)
UPDATE esim_plans
SET affiliate_url = 'https://go.saily.site/aff_c?offer_id=101&aff_id=10849&source=goesim.fyi&url_id=648',
    updated_at = NOW()
WHERE provider_id = saily_provider_id
    AND country_id = netherlands_id
    AND (
        affiliate_url IS NULL
        OR affiliate_url != 'https://go.saily.site/aff_c?offer_id=101&aff_id=10849&source=goesim.fyi&url_id=648'
    );
RAISE NOTICE 'Updated % Netherlands plans',
FOUND;
-- Spain (url_id=639)
UPDATE esim_plans
SET affiliate_url = 'https://go.saily.site/aff_c?offer_id=101&aff_id=10849&source=goesim.fyi&url_id=639',
    updated_at = NOW()
WHERE provider_id = saily_provider_id
    AND country_id = spain_id
    AND (
        affiliate_url IS NULL
        OR affiliate_url != 'https://go.saily.site/aff_c?offer_id=101&aff_id=10849&source=goesim.fyi&url_id=639'
    );
RAISE NOTICE 'Updated % Spain plans',
FOUND;
-- United Kingdom (url_id=636)
UPDATE esim_plans
SET affiliate_url = 'https://go.saily.site/aff_c?offer_id=101&aff_id=10849&source=goesim.fyi&url_id=636',
    updated_at = NOW()
WHERE provider_id = saily_provider_id
    AND country_id = uk_id
    AND (
        affiliate_url IS NULL
        OR affiliate_url != 'https://go.saily.site/aff_c?offer_id=101&aff_id=10849&source=goesim.fyi&url_id=636'
    );
RAISE NOTICE 'Updated % United Kingdom plans',
FOUND;
-- Japan (url_id=633)
UPDATE esim_plans
SET affiliate_url = 'https://go.saily.site/aff_c?offer_id=101&aff_id=10849&source=goesim.fyi&url_id=633',
    updated_at = NOW()
WHERE provider_id = saily_provider_id
    AND country_id = japan_id
    AND (
        affiliate_url IS NULL
        OR affiliate_url != 'https://go.saily.site/aff_c?offer_id=101&aff_id=10849&source=goesim.fyi&url_id=633'
    );
RAISE NOTICE 'Updated % Japan plans',
FOUND;
-- Singapore (url_id=2829)
UPDATE esim_plans
SET affiliate_url = 'https://go.saily.site/aff_c?offer_id=101&aff_id=10849&source=goesim.fyi&url_id=2829',
    updated_at = NOW()
WHERE provider_id = saily_provider_id
    AND country_id = singapore_id
    AND (
        affiliate_url IS NULL
        OR affiliate_url != 'https://go.saily.site/aff_c?offer_id=101&aff_id=10849&source=goesim.fyi&url_id=2829'
    );
RAISE NOTICE 'Updated % Singapore plans',
FOUND;
RAISE NOTICE 'Saily affiliate links update completed successfully!';
END $$;
-- Optional: Update or create entries in the affiliate_links table for tracking
-- This creates affiliate link tracking records for any Saily plans that don't have them yet
INSERT INTO affiliate_links (
        plan_id,
        provider_id,
        original_url,
        affiliate_url,
        affiliate_code,
        is_active
    )
SELECT ep.id as plan_id,
    ep.provider_id,
    COALESCE(ep.plan_url, 'https://saily.com') as original_url,
    ep.affiliate_url,
    'AFF_10849' as affiliate_code,
    true as is_active
FROM esim_plans ep
    JOIN providers p ON ep.provider_id = p.id
WHERE p.name = 'Saily'
    AND ep.affiliate_url IS NOT NULL
    AND NOT EXISTS (
        SELECT 1
        FROM affiliate_links al
        WHERE al.plan_id = ep.id
    );
-- Update existing affiliate link tracking records for Saily
UPDATE affiliate_links al
SET affiliate_url = ep.affiliate_url,
    updated_at = NOW()
FROM esim_plans ep
    JOIN providers p ON ep.provider_id = p.id
WHERE p.name = 'Saily'
    AND al.plan_id = ep.id
    AND ep.affiliate_url IS NOT NULL
    AND al.affiliate_url != ep.affiliate_url;
-- Create a verification query to check the results
DO $$
DECLARE total_saily_plans INTEGER;
plans_with_affiliates INTEGER;
BEGIN
SELECT COUNT(*) INTO total_saily_plans
FROM esim_plans ep
    JOIN providers p ON ep.provider_id = p.id
WHERE p.name = 'Saily';
SELECT COUNT(*) INTO plans_with_affiliates
FROM esim_plans ep
    JOIN providers p ON ep.provider_id = p.id
WHERE p.name = 'Saily'
    AND ep.affiliate_url IS NOT NULL;
RAISE NOTICE '===========================================';
RAISE NOTICE 'Verification Results:';
RAISE NOTICE 'Total Saily plans in database: %',
total_saily_plans;
RAISE NOTICE 'Saily plans with affiliate links: %',
plans_with_affiliates;
RAISE NOTICE '===========================================';
END $$;