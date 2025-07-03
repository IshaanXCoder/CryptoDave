export function Footer() {
  return (
    <footer className="border-t border-white/10 py-8 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center font-bold text-white">
            CD
          </div>
          <span className="font-bold text-lg text-white">CryptoDave</span>
        </div>
        <p className="text-gray-400 text-sm mb-4">Multiplayer crypto game on Gorbagana Testnet</p>
        <p className="text-gray-500 text-xs">© {new Date().getFullYear()} CryptoDave. Built with Phaser.js</p>
      </div>
    </footer>
  )
}
