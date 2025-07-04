"use client"
import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { GameContainer } from "@/components/game-container"
import { HowToPlay } from "@/components/how-to-play"
import { ResourcesSection } from "@/components/resources-section"
import { Footer } from "@/components/footer"
import { RpsStakingTestPanel } from "@/components/rps-staking-test-panel"
import { WalletGate } from "@/components/wallet-gate"

export function AppClientShell() {
  return (
    <WalletGate>
      <main className="min-h-screen bg-black">
        <Header />
        <HeroSection />
        <GameContainer />
        <HowToPlay />
        <ResourcesSection />
        <Footer />
        <RpsStakingTestPanel />
      </main>
    </WalletGate>
  )
} 