-- Create scraping logs table to track data collection
CREATE TABLE IF NOT EXISTS scraping_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  scrape_type TEXT NOT NULL, -- 'full', 'incremental', 'single_country'
  status TEXT NOT NULL DEFAULT 'running', -- 'running', 'completed', 'failed'
  plans_found INTEGER DEFAULT 0,
  plans_updated INTEGER DEFAULT 0,
  plans_added INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_scraping_logs_provider ON scraping_logs(provider_id);
CREATE INDEX IF NOT EXISTS idx_scraping_logs_status ON scraping_logs(status);
CREATE INDEX IF NOT EXISTS idx_scraping_logs_date ON scraping_logs(started_at);

-- Create function to update scraping log duration
CREATE OR REPLACE FUNCTION update_scraping_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed_at IS NOT NULL AND OLD.completed_at IS NULL THEN
    NEW.duration_seconds = EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically calculate duration
DROP TRIGGER IF EXISTS trigger_update_scraping_duration ON scraping_logs;
CREATE TRIGGER trigger_update_scraping_duration
  BEFORE UPDATE ON scraping_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_scraping_duration();
