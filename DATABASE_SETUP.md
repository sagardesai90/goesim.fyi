# Database Setup Instructions

## The Issue
The "Select a country" dropdown on the home page isn't working because the database tables haven't been created or populated yet.

## Solution
You need to run the SQL scripts to set up your Supabase database:

### Option 1: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the following scripts in order:
   - `scripts/001_create_countries.sql` - Creates countries table and inserts country data
   - `scripts/002_create_providers.sql` - Creates providers table and inserts provider data
   - `scripts/003_create_esim_plans.sql` - Creates eSIM plans table
   - `scripts/004_create_affiliate_links.sql` - Creates affiliate links tracking tables
   - `scripts/005_create_scraping_logs.sql` - Creates scraping logs table
   - `scripts/006_insert_sample_data.sql` - Inserts sample eSIM plans for testing
   - `scripts/007_create_affiliate_functions.sql` - Creates database functions for affiliate tracking

### Option 2: Using Supabase CLI
```bash
# Install Supabase CLI if you haven't already
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Run the SQL scripts
supabase db reset
```

### Option 3: Copy and Paste
Copy the contents of each SQL script file and run them one by one in the Supabase SQL Editor.

## Environment Variables
Make sure you have the following environment variables set in your `.env` file:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Verification
After running the scripts, the home page should show:
1. A green "Database Ready" message at the top
2. A working country dropdown with countries listed
3. The ability to select a country and see eSIM plans

## Troubleshooting
If you still have issues:
1. Check the browser console for any error messages
2. Verify your environment variables are correct
3. Make sure your Supabase project is active and accessible
4. Check that the SQL scripts ran without errors in the Supabase dashboard

