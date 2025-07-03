"use client"

import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";

const PROGRAM_ID = new PublicKey("HsLWrDBvv7LT5cjj879Th7HKsPme7MF3XMNYxCMKExsz");
const STAKE_AMOUNT = 100_000_000; // 0.1 GORB (assuming 9 decimals)

export function RpsStakingTestPanel() {
  const { connection } = useConnection();
  const { publicKey, signTransaction, wallet, sendTransaction } = useWallet();
  const [devWallet, setDevWallet] = useState("");
  const [player1, setPlayer1] = useState("");
  const [winner, setWinner] = useState("");
  const [txResult, setTxResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Helper: get Anchor provider
  function getProvider() {
    return new anchor.AnchorProvider(connection, wallet as any, { preflightCommitment: "confirmed" });
  }

  // Helper: get Anchor program
  function getProgram() {
    const idl = require("../../contracts/target/idl/rps_staking.json");
    return new anchor.Program(idl, PROGRAM_ID, getProvider());
  }

  // PDA for game
  function getGamePda(player1Key: PublicKey) {
    return PublicKey.findProgramAddressSync([
      Buffer.from("game"),
      player1Key.toBuffer(),
    ], PROGRAM_ID);
  }

  async function handleCreateGame() {
    setLoading(true); setTxResult(null);
    try {
      if (!publicKey || !devWallet) throw new Error("Connect wallet and enter dev wallet");
      const program = getProgram();
      const [gamePda] = getGamePda(publicKey);
      const tx = await program.methods.createGame(new anchor.BN(STAKE_AMOUNT), new PublicKey(devWallet)).accounts({
        player1: publicKey,
        game: gamePda,
        systemProgram: SystemProgram.programId,
      }).rpc();
      setTxResult(`Create Game TX: ${tx}`);
    } catch (e: any) {
      setTxResult(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleJoinGame() {
    setLoading(true); setTxResult(null);
    try {
      if (!publicKey || !player1) throw new Error("Connect wallet and enter player1 address");
      const program = getProgram();
      const player1Key = new PublicKey(player1);
      const [gamePda] = getGamePda(player1Key);
      const tx = await program.methods.joinGame(new anchor.BN(STAKE_AMOUNT)).accounts({
        player2: publicKey,
        game: gamePda,
        systemProgram: SystemProgram.programId,
      }).rpc();
      setTxResult(`Join Game TX: ${tx}`);
    } catch (e: any) {
      setTxResult(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeclareWinner() {
    setLoading(true); setTxResult(null);
    try {
      if (!publicKey || !player1 || !winner) throw new Error("Connect wallet and enter player1 and winner");
      const program = getProgram();
      const player1Key = new PublicKey(player1);
      const winnerKey = new PublicKey(winner);
      const [gamePda] = getGamePda(player1Key);
      const devWalletKey = devWallet ? new PublicKey(devWallet) : winnerKey; // fallback
      const tx = await program.methods.declareWinner(winnerKey).accounts({
        signer: publicKey,
        game: gamePda,
        winner: winnerKey,
        devWallet: devWalletKey,
        systemProgram: SystemProgram.programId,
      }).rpc();
      setTxResult(`Declare Winner TX: ${tx}`);
    } catch (e: any) {
      setTxResult(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 max-w-xl mx-auto my-8">
      <h2 className="text-xl font-bold mb-4 text-white">RPS Staking Contract Test Panel</h2>
      <div className="mb-4">
        <label className="block text-sm text-gray-300 mb-1">Dev Wallet Address (for create/declare):</label>
        <input type="text" className="w-full p-2 rounded bg-black text-white border border-white/10 mb-2" value={devWallet} onChange={e => setDevWallet(e.target.value)} placeholder="Dev wallet pubkey" />
        <button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded mr-2" onClick={handleCreateGame} disabled={loading}>Create Game</button>
      </div>
      <div className="mb-4">
        <label className="block text-sm text-gray-300 mb-1">Player1 Address (for join/declare):</label>
        <input type="text" className="w-full p-2 rounded bg-black text-white border border-white/10 mb-2" value={player1} onChange={e => setPlayer1(e.target.value)} placeholder="Player1 pubkey" />
        <button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded mr-2" onClick={handleJoinGame} disabled={loading}>Join Game</button>
      </div>
      <div className="mb-4">
        <label className="block text-sm text-gray-300 mb-1">Winner Address (for declare):</label>
        <input type="text" className="w-full p-2 rounded bg-black text-white border border-white/10 mb-2" value={winner} onChange={e => setWinner(e.target.value)} placeholder="Winner pubkey" />
        <button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded mr-2" onClick={handleDeclareWinner} disabled={loading}>Declare Winner</button>
      </div>
      {txResult && <div className="mt-4 p-2 bg-black text-orange-400 rounded break-all">{txResult}</div>}
    </div>
  );
} 