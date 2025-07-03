import { ExternalLink, MessageCircle, Book, Droplets } from "lucide-react"

export function ResourcesSection() {
  const resources = [
    {
      title: "Documentation",
      description: "Learn more about the game mechanics and tokenomics",
      icon: <Book className="w-6 h-6" />,
      url: "https://docs.gorbagana.wtf/",
    },
    {
      title: "Get Testnet Tokens",
      description: "Claim free GORB tokens for testing",
      icon: <Droplets className="w-6 h-6" />,
      url: "https://faucet.gorbagana.wtf/",
    },
    {
      title: "Telegram Community",
      description: "Join our community for support and updates",
      icon: <MessageCircle className="w-6 h-6" />,
      url: "https://t.me/gorbagana_portal",
    },
  ]

  return (
    <section className="py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-white">Resources & Support</h2>
          <p className="text-gray-400">Everything you need to get started with CryptoDave</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {resources.map((resource, index) => (
            <a key={index} href={resource.url} target="_blank" rel="noopener noreferrer" className="block group">
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 h-full hover:border-white/20 transition-colors">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center mb-4 text-white">
                  {resource.icon}
                </div>
                <h3 className="font-semibold mb-2 flex items-center gap-2 text-white">
                  {resource.title}
                  <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
                <p className="text-sm text-gray-400">{resource.description}</p>
              </div>
            </a>
          ))}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="font-semibold mb-2 text-white">Network Information</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400 mb-1">RPC URL:</p>
              <code className="bg-black px-2 py-1 rounded text-orange-500 border border-white/10">
                https://rpc.gorbagana.wtf
              </code>
            </div>
            <div>
              <p className="text-gray-400 mb-1">Faucet:</p>
              <code className="bg-black px-2 py-1 rounded text-orange-500 border border-white/10">
                https://faucet.gorbagana.wtf/
              </code>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
