"use client"

import { useWallet } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { Gamepad2 } from "lucide-react"

interface WalletGateProps {
  children: React.ReactNode
}

export function WalletGate({ children }: WalletGateProps) {
  const { connected } = useWallet()

  if (!connected) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-6 p-8">
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
            <Gamepad2 className="w-12 h-12 text-white" />
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-white">Welcome to CryptoDave</h1>
            <p className="text-gray-400 max-w-md mx-auto">
              Connect your wallet to start playing the multiplayer crypto game. 
              Stake GORB tokens and compete for rewards!
            </p>
          </div>
          <div className="flex flex-col items-center gap-4">
            <WalletMultiButton className="!bg-gradient-to-r !from-orange-500 !to-orange-600 hover:!from-orange-600 hover:!to-orange-700 !text-white !px-8 !py-3 !text-lg !font-semibold" />
            <p className="text-xs text-gray-500">
              Need GORB tokens? Get them from the Gorbagana faucet
            </p>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
} 