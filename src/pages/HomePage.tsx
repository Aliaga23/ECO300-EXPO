import { Header } from "@/components/Header"
import { Hero } from "@/components/Hero"
import { AnalysisSection } from "@/components/AnalysisSection"
import { Footer } from "@/components/Footer"

export function HomePage() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <Header />

      <main className="w-full">
        <Hero />
        <AnalysisSection />
      </main>

      <Footer />
    </div>
  )
}
