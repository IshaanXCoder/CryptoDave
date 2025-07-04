"use client"

import { useEffect, useRef } from "react"

export function GameContainer() {
  const gameDivRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Only run on client
    if (!gameDivRef.current) return

    // Dynamically load Phaser and Socket.io if not present
    const loadScript = (src: string) => {
      return new Promise<void>((resolve, reject) => {
        if (document.querySelector(`script[src='${src}']`)) return resolve()
        const script = document.createElement("script")
        script.src = src
        script.async = true
        script.onload = () => resolve()
        script.onerror = () => reject()
        document.body.appendChild(script)
      })
    }

    let destroyed = false

    Promise.resolve()
      .then(() => loadScript("https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.js"))
      .then(() => loadScript("https://cdn.socket.io/4.7.5/socket.io.min.js"))
      .then(() => loadScript("/game.js"))
      .then(() => {
        if (destroyed) return
        // @ts-ignore
        if ((window as any).Phaser && (window as any).onload) {
          (window as any).onload()
        }
      })
      .catch(() => {
        if (gameDivRef.current) {
          gameDivRef.current.innerHTML = "<div style='color:red'>Failed to load game scripts.</div>"
        }
      })

    return () => {
      destroyed = true
      // Try to destroy Phaser game instance if possible
      if ((window as any)["game"] && typeof (window as any)["game"].destroy === "function") {
        (window as any)["game"].destroy(true)
      }
      // Remove any canvas elements inside the container
      if (gameDivRef.current) {
        gameDivRef.current.innerHTML = ""
      }
    }
  }, [])

  return (
    <section className="py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4 text-white">Game Arena</h2>
          <p className="text-gray-400">CryptoDave game will load here</p>
        </div>
        <div className="game-container rounded-2xl p-4 aspect-video">
          <div
            id="game-container"
            ref={gameDivRef}
            className="w-full h-full bg-black rounded-xl flex items-center justify-center border border-white/10"
            style={{ 
              minHeight: 400,
              transform: 'scale(2)',  // 1.5x zoom
              transformOrigin: 'center center'
            }}
          />
        </div>
      </div>
    </section>
  )
}
