-- Create function to increment click count
CREATE OR REPLACE FUNCTION increment_click_count(link_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE affiliate_links 
  SET click_count = click_count + 1,
      updated_at = NOW()
  WHERE id = link_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to record conversion
CREATE OR REPLACE FUNCTION record_conversion(link_id UUID, revenue_amount DECIMAL)
RETURNS VOID AS $$
BEGIN
  UPDATE affiliate_links 
  SET conversion_count = conversion_count + 1,
      revenue_generated = revenue_generated + revenue_amount,
      updated_at = NOW()
  WHERE id = link_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to get affiliate stats
CREATE OR REPLACE FUNCTION get_affiliate_stats(provider_id_param UUID DEFAULT NULL)
RETURNS TABLE (
  provider_name TEXT,
  total_links INTEGER,
  total_clicks BIGINT,
  total_conversions BIGINT,
  total_revenue DECIMAL,
  conversion_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.name as provider_name,
    COUNT(al.id)::INTEGER as total_links,
    COALESCE(SUM(al.click_count), 0) as total_clicks,
    COALESCE(SUM(al.conversion_count), 0) as total_conversions,
    COALESCE(SUM(al.revenue_generated), 0) as total_revenue,
    CASE 
      WHEN SUM(al.click_count) > 0 THEN 
        ROUND((SUM(al.conversion_count)::DECIMAL / SUM(al.click_count)) * 100, 2)
      ELSE 0 
    END as conversion_rate
  FROM providers p
  LEFT JOIN affiliate_links al ON p.id = al.provider_id AND al.is_active = true
  WHERE (provider_id_param IS NULL OR p.id = provider_id_param)
  GROUP BY p.id, p.name
  ORDER BY total_revenue DESC;
END;
$$ LANGUAGE plpgsql;
