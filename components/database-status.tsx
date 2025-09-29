"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle } from "lucide-react"

interface DatabaseStatus {
    countries: {
        exists: boolean
        hasData: boolean
        error?: string
    }
    providers: {
        exists: boolean
        hasData: boolean
        error?: string
    }
    esim_plans: {
        exists: boolean
        hasData: boolean
        error?: string
    }
}

export function DatabaseStatus() {
    const [showSuccessMessage, setShowSuccessMessage] = useState(false)

    useEffect(() => {
        const checkDatabaseStatus = async () => {
            try {
                const response = await fetch("/api/init-db")
                const data = await response.json()

                if (data.success && data.database_status) {
                    const status = data.database_status
                    const allTablesExist = status.countries.exists && status.providers.exists && status.esim_plans.exists
                    const allTablesHaveData = status.countries.hasData && status.providers.hasData && status.esim_plans.hasData

                    if (allTablesExist && allTablesHaveData) {
                        setShowSuccessMessage(true)

                        // Auto-dismiss after 2 seconds
                        const timer = setTimeout(() => {
                            setShowSuccessMessage(false)
                        }, 2000)

                        return () => clearTimeout(timer)
                    }
                }
            } catch (err) {
                // Silently fail - don't show anything for errors
                console.error("Database status check failed:", err)
            }
        }

        checkDatabaseStatus()
    }, [])

    // Only show success message notification in bottom left corner
    if (showSuccessMessage) {
        return (
            <div className="fixed bottom-4 left-4 z-50">
                <Alert className="border-green-200 bg-green-50 shadow-lg">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800">Database Ready</AlertTitle>
                    <AlertDescription className="text-green-700">
                        All systems operational
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    return null
}