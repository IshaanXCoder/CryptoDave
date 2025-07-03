import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { GameContainer } from "@/components/game-container"
import { HowToPlay } from "@/components/how-to-play"
import { ResourcesSection } from "@/components/resources-section"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <main className="min-h-screen bg-black">
      <Header />
      <HeroSection />
      <GameContainer />
      <HowToPlay />
      <ResourcesSection />
      <Footer />
    </main>
  )
}
