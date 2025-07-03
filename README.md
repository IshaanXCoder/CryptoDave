# CryptoDave

CryptoDave is a fast-paced multiplayer crypto game where you stake tokens, avoid fire, and compete for the highest score. Play with friends using room codes and win rewards on the Gorbagana Testnet!

## Game Overview
- **Multiplayer**: Join or create rooms and play with friends.
- **Stake to Play**: Each player stakes 0.1 GORB tokens per game.
- **Avoid Obstacles**: Navigate CryptoDave, dodge fire, and collect items.
- **Win Rewards**: The highest scorer wins the staked tokens from all players.

## Gorbagana Integration
- **Network**: [Gorbagana Testnet](https://rpc.gorbagana.wtf)
- **Token Faucet**: [Get GORB tokens](https://faucet.gorbagana.wtf/)
- **Wallets Supported**: Phantom, Solflare, Torus, Trust, Ledger
- **Smart Contract**: Built with Anchor, deployed to Gorbagana

## Quick Start

### 1. Get Testnet Tokens
- Visit the [Gorbagana Faucet](https://faucet.gorbagana.wtf/) and claim GORB tokens.

### 2. Run the Game
- **Frontend**
  ```sh
  cd frontend
  npm install
  npm run dev
  # Visit http://localhost:3000
  ```
- **Game Server**
  ```sh
  node server.js
  # Serves the Phaser game at http://localhost:3000
  ```

### 3. Play
- Connect your wallet, join or create a room, and start playing!

### 4. Smart Contract (Optional)
- Contracts are in `/contracts` (Anchor framework)
- To test:
  ```sh
  cd contracts
  yarn install
  yarn test
  ```

## Resources
- [Gorbagana Docs](https://docs.gorbagana.wtf/)
- [Telegram Community](https://t.me/gorbagana_portal)

---
Built with Phaser.js, Next.js, and Anchor. 