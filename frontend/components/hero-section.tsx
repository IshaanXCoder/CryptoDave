import { Button } from "@/components/ui/button"
import { Play, Users, Coins } from "lucide-react"

export function HeroSection() {
  return (
    <section className="pt-32 pb-16 px-6 hero-gradient">
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 mb-6">
            <div className="w-2 h-2 bg-orange-500 rounded-full pulse-orange"></div>
            <span className="text-sm text-white">Live on Gorbagana Testnet</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight text-white">
            Crypto
            <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">Dave</span>
          </h1>

          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Multiplayer crypto game where you stake tokens, avoid fire, and compete for the highest score. Connect with
            friends using room codes!
          </p>
        </div>

        <div className="flex flex-wrap gap-4 justify-center mb-12">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-4 py-2">
            <Users className="w-5 h-5 text-white" />
            <span className="text-sm text-white">Multiplayer</span>
          </div>
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-4 py-2">
            <Coins className="w-5 h-5 text-orange-500" />
            <span className="text-sm text-white">0.1 GORB Stake</span>
          </div>
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-4 py-2">
            <div className="w-5 h-5 bg-red-500 rounded"></div>
            <span className="text-sm text-white">Avoid Fire</span>
          </div>
        </div>

        <Button
          size="lg"
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-lg px-8 py-6 gap-2"
        >
          <Play className="w-5 h-5" />
          Start Playing
        </Button>
      </div>
    </section>
  )
}
