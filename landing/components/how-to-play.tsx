import { Wallet, Users, Target, Trophy } from "lucide-react"

export function HowToPlay() {
  const steps = [
    {
      icon: <Wallet className="w-8 h-8 text-orange-500" />,
      title: "Connect Wallet",
      description: "Connect your wallet and ensure you have 0.1 GORB tokens to stake",
    },
    {
      icon: <Users className="w-8 h-8 text-white" />,
      title: "Join/Create Room",
      description: "Create a new room or join existing one using room code",
    },
    {
      icon: <Target className="w-8 h-8 text-red-500" />,
      title: "Avoid Fire & Score",
      description: "Navigate CryptoDave, avoid fire obstacles, and score as much as possible",
    },
    {
      icon: <Trophy className="w-8 h-8 text-orange-500" />,
      title: "Win Rewards",
      description: "Highest scorer wins the staked tokens from all players",
    },
  ]

  return (
    <section className="py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-white">How to Play</h2>
          <p className="text-gray-400">Simple steps to start your CryptoDave adventure</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 h-full">
                <div className="mb-4 flex justify-center">{step.icon}</div>
                <div className="text-2xl font-bold text-gray-500 mb-2">0{index + 1}</div>
                <h3 className="font-semibold mb-2 text-white">{step.title}</h3>
                <p className="text-sm text-gray-400">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
