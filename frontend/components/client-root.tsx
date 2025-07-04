"use client"
import { WalletContextProvider } from "@/components/wallet-provider"
import type { ReactNode } from "react"

export function ClientRoot({ children }: { children: ReactNode }) {
  return <WalletContextProvider>{children}</WalletContextProvider>
} 