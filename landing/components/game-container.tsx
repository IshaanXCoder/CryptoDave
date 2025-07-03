"use client"

export function GameContainer() {
  return (
    <section className="py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4 text-white">Game Arena</h2>
          <p className="text-gray-400">CryptoDave game will load here</p>
        </div>

        <div className="game-container rounded-2xl p-4 aspect-video">
          <div className="w-full h-full bg-black rounded-xl flex items-center justify-center border border-white/10">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full mx-auto mb-4 float"></div>
              <p className="text-xl font-semibold mb-2 text-white">Game will load here</p>
              <p className="text-gray-400">Phaser.js game integration point</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
