"use client"

import { FC, ReactNode, useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
    PhantomWalletAdapter,
    SolflareWalletAdapter,
    TorusWalletAdapter,
    TrustWalletAdapter,
    LedgerWalletAdapter
} from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";

require("@solana/wallet-adapter-react-ui/styles.css");

export const SOLANA_NETWORK = "https://rpc.gorbagana.wtf";

export const WalletContextProvider: FC<{ children: ReactNode }> = ({ children }) => {
    // Memoize the wallet list to avoid re-creating on every render
    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter(),
            new TorusWalletAdapter(),
            new TrustWalletAdapter(),
            new LedgerWalletAdapter(),
        ],
        []
    );

    return (
        <ConnectionProvider endpoint={SOLANA_NETWORK}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>{children}</WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
}; 