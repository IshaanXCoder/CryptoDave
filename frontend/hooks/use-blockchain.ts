"use client"

import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { useCallback, useState } from "react"
import { 
  PublicKey, 
  Transaction, 
  SystemProgram, 
  LAMPORTS_PER_SOL,
  TransactionInstruction
} from "@solana/web3.js"
import { Program, AnchorProvider, web3, BN } from "@project-serum/anchor"
import { IDL } from "../types/rps_staking"

const PROGRAM_ID = new PublicKey("HsLWrDBvv7LT5cjj879Th7HKsPme7MF3XMNYxCMKExsz")
const DEV_WALLET = new PublicKey("HsLWrDBvv7LT5cjj879Th7HKsPme7MF3XMNYxCMKExsz") // Replace with actual dev wallet
const STAKE_AMOUNT = 0.1 * LAMPORTS_PER_SOL // 0.1 SOL in lamports

export function useBlockchain() {
  const { connection } = useConnection()
  const { publicKey, sendTransaction } = useWallet()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getProvider = useCallback(() => {
    if (!publicKey) throw new Error("Wallet not connected")
    
    const provider = new AnchorProvider(
      connection,
      {
        publicKey,
        signTransaction: async (tx) => {
          // This will be handled by the wallet adapter
          return tx
        },
        signAllTransactions: async (txs) => {
          // This will be handled by the wallet adapter
          return txs
        }
      },
      { commitment: "confirmed" }
    )

    return new Program(IDL, PROGRAM_ID, provider)
  }, [connection, publicKey])

  const createGame = useCallback(async () => {
    if (!publicKey) throw new Error("Wallet not connected")
    setLoading(true)
    setError(null)
    try {
      const program = getProvider()
      // Find PDA for the game
      const [gamePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("game"), publicKey.toBuffer()],
        program.programId
      )
      // Create the transaction
      const tx = await program.methods
        .createGame(new BN(STAKE_AMOUNT))
        .accounts({
          player1: publicKey,
          game: gamePda,
          systemProgram: SystemProgram.programId,
        })
        .transaction()
      // Send the transaction through the wallet
      const signature = await sendTransaction(tx, connection)
      await connection.confirmTransaction(signature, "confirmed")
      return { success: true, gameAddress: gamePda.toString(), tx: signature }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to create game"
      setError(errorMsg)
      throw err
    } finally {
      setLoading(false)
    }
  }, [publicKey, getProvider, sendTransaction, connection])

  const joinGame = useCallback(async (player1Address: string) => {
    if (!publicKey) throw new Error("Wallet not connected")
    
    setLoading(true)
    setError(null)
    
    try {
      const program = getProvider()
      const player1Pubkey = new PublicKey(player1Address)
      
      // Find PDA for the game
      const [gamePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("game"), player1Pubkey.toBuffer()],
        program.programId
      )

      // Create the transaction
      const tx = await program.methods
        .joinGame(new BN(STAKE_AMOUNT))
        .accounts({
          player2: publicKey,
          game: gamePda,
          systemProgram: SystemProgram.programId,
        })
        .transaction()

      // Send the transaction through the wallet
      const signature = await sendTransaction(tx, connection)
      await connection.confirmTransaction(signature, "confirmed")

      return { success: true, gameAddress: gamePda.toString(), tx: signature }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to join game"
      setError(errorMsg)
      throw err
    } finally {
      setLoading(false)
    }
  }, [publicKey, getProvider, sendTransaction, connection])

  const declareWinner = useCallback(async (player1Address: string, winnerAddress: string) => {
    if (!publicKey) throw new Error("Wallet not connected")
    
    setLoading(true)
    setError(null)
    
    try {
      const program = getProvider()
      const player1Pubkey = new PublicKey(player1Address)
      const winnerPubkey = new PublicKey(winnerAddress)
      
      // Find PDA for the game
      const [gamePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("game"), player1Pubkey.toBuffer()],
        program.programId
      )

      // Create the transaction
      const tx = await program.methods
        .declareWinner(winnerPubkey)
        .accounts({
          signer: publicKey,
          game: gamePda,
          winner: winnerPubkey,
          devWallet: DEV_WALLET,
          systemProgram: SystemProgram.programId,
        })
        .transaction()

      // Send the transaction through the wallet
      const signature = await sendTransaction(tx, connection)
      await connection.confirmTransaction(signature, "confirmed")

      return { success: true, tx: signature }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to declare winner"
      setError(errorMsg)
      throw err
    } finally {
      setLoading(false)
    }
  }, [publicKey, getProvider, sendTransaction, connection])

  const generateUsername = useCallback((address: string) => {
    // Generate a username from the first 6 characters of the wallet address
    return `Player_${address.slice(0, 6)}`
  }, [])

  return {
    createGame,
    joinGame,
    declareWinner,
    generateUsername,
    loading,
    error,
    stakeAmount: STAKE_AMOUNT / LAMPORTS_PER_SOL, // Return in SOL
  }
} 