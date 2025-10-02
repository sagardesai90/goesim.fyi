import Link from "next/link"
import { Smartphone } from "lucide-react"
import { cn } from "@/lib/utils"

interface HeaderProps {
    className?: string
}

export function Header({ className }: HeaderProps) {
    return (
        <header className={cn("sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60", className)}>
            <div className="container flex h-14 max-w-screen-2xl items-center px-4">
                <Link
                    href="/"
                    className="flex items-center space-x-2 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    aria-label="Go to homepage"
                >
                    <Smartphone className="h-6 w-6 text-primary" />
                    <span className="font-bold text-lg">goesim.fyi</span>
                </Link>
            </div>
        </header>
    )
}
