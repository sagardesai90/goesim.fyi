import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
    try {
        const { name, website_url, description } = await request.json()

        if (!name) {
            return NextResponse.json({ error: "Provider name is required" }, { status: 400 })
        }

        const supabase = await createClient()

        const { data, error } = await supabase
            .from("providers")
            .insert({
                name,
                website_url,
                description
            })
            .select()
            .single()

        if (error) {
            console.error("Error adding provider:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            provider: data
        })
    } catch (error: any) {
        console.error("Error in providers API:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function GET() {
    try {
        const supabase = await createClient()

        const { data: providers, error } = await supabase
            .from("providers")
            .select("*")
            .order("name")

        if (error) {
            console.error("Error fetching providers:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ providers })
    } catch (error: any) {
        console.error("Error in providers API:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}


