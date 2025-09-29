import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
    try {
        const supabase = await createClient()

        // Check if countries table exists and has data
        const { data: countries, error: countriesError } = await supabase
            .from("countries")
            .select("id")
            .limit(1)

        // Check if providers table exists and has data
        const { data: providers, error: providersError } = await supabase
            .from("providers")
            .select("id")
            .limit(1)

        // Check if esim_plans table exists and has data
        const { data: plans, error: plansError } = await supabase
            .from("esim_plans")
            .select("id")
            .limit(1)

        return NextResponse.json({
            success: true,
            database_status: {
                countries: {
                    exists: !countriesError,
                    hasData: countries && countries.length > 0,
                    error: countriesError?.message
                },
                providers: {
                    exists: !providersError,
                    hasData: providers && providers.length > 0,
                    error: providersError?.message
                },
                esim_plans: {
                    exists: !plansError,
                    hasData: plans && plans.length > 0,
                    error: plansError?.message
                }
            }
        })
    } catch (error) {
        console.error("Database check error:", error)
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 })
    }
}

export async function POST() {
    try {
        const supabase = await createClient()

        // This would run the SQL scripts to initialize the database
        // For now, we'll just return instructions
        return NextResponse.json({
            success: false,
            message: "Database initialization requires running SQL scripts manually",
            instructions: [
                "1. Connect to your Supabase project",
                "2. Go to the SQL Editor",
                "3. Run the scripts in order: 001_create_countries.sql, 002_create_providers.sql, etc.",
                "4. Or use the Supabase CLI to run the scripts"
            ]
        })
    } catch (error) {
        console.error("Database init error:", error)
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 })
    }
}
