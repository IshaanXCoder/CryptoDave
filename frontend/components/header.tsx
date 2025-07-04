"use client"

import { Button } from "@/components/ui/button"
import { Wallet, Coins } from "lucide-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { useWallet } from "@solana/wallet-adapter-react"
import { useBlockchain } from "@/hooks/use-blockchain"

export function Header() {
  const { connected, publicKey } = useWallet()
  const { stakeAmount } = useBlockchain()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/80 border-b border-white/10">
      <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center font-bold text-lg text-white">
            CD
          </div>
          <div>
            <h1 className="font-bold text-xl text-white">CryptoDave</h1>
            <p className="text-xs text-gray-400">Multiplayer Crypto Game</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {connected && (
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Coins className="w-4 h-4" />
              <span>Stake: {stakeAmount} GORB</span>
            </div>
          )}
          <WalletMultiButton className="!bg-gradient-to-r !from-orange-500 !to-orange-600 hover:!from-orange-600 hover:!to-orange-700 !text-white" />
        </div>
      </div>
    </header>
  )
}
