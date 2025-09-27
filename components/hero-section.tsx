import { Globe, Zap, DollarSign, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-muted/20 border-b">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold text-balance bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Find the Best eSIM Deals
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground text-pretty max-w-2xl mx-auto">
              Compare eSIM rates across countries and data amounts. Save money on your next trip with our comprehensive
              comparison tool.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8">
              <Link href="/search">
                <Search className="h-5 w-5 mr-2" />
                Advanced Search
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="flex flex-col items-center space-y-3">
              <div className="p-3 rounded-full bg-primary/10 text-primary">
                <Globe className="h-8 w-8" />
              </div>
              <h3 className="font-semibold text-lg">200+ Countries</h3>
              <p className="text-sm text-muted-foreground text-center">
                Coverage across all major destinations worldwide
              </p>
            </div>

            <div className="flex flex-col items-center space-y-3">
              <div className="p-3 rounded-full bg-primary/10 text-primary">
                <Zap className="h-8 w-8" />
              </div>
              <h3 className="font-semibold text-lg">Real-time Pricing</h3>
              <p className="text-sm text-muted-foreground text-center">
                Always up-to-date rates from top eSIM providers
              </p>
            </div>

            <div className="flex flex-col items-center space-y-3">
              <div className="p-3 rounded-full bg-primary/10 text-primary">
                <DollarSign className="h-8 w-8" />
              </div>
              <h3 className="font-semibold text-lg">Best Value</h3>
              <p className="text-sm text-muted-foreground text-center">
                Find the most cost-effective plans for your needs
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
