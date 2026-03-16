import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { Smartphone, BrainCircuit, Server, Globe, Database, ArrowDown } from 'lucide-react';

const layers = [
  {
    id: 'ui',
    name: 'User Interface',
    tech: 'Telegram Bot + Mini App (React/Vite)',
    description: 'All user-facing interactions, notifications, and the TMA dashboard.',
    icon: <Smartphone className="w-8 h-8" />,
    color: 'from-blue-500/20 to-cyan-500/20',
    borderColor: 'border-blue-500/30',
    textColor: 'text-blue-400'
  },
  {
    id: 'ai',
    name: 'AI Brain',
    tech: 'Amazon Bedrock (Nova Pro + Nova Lite)',
    description: 'Intent routing, email parsing, autonomous reasoning, and decision-making.',
    icon: <BrainCircuit className="w-8 h-8" />,
    color: 'from-purple-500/20 to-pink-500/20',
    borderColor: 'border-purple-500/30',
    textColor: 'text-purple-400'
  },
  {
    id: 'orchestration',
    name: 'Orchestration',
    tech: 'FastAPI (Python 3.10) on Render',
    description: 'Agent tool execution, watchdog loop, webhook handling, Knowledge Graph logic.',
    icon: <Server className="w-8 h-8" />,
    color: 'from-accent/20 to-orange-500/20',
    borderColor: 'border-accent/30',
    textColor: 'text-accent'
  },
  {
    id: 'apis',
    name: 'External APIs',
    tech: 'Duffel, Geoapify, SearchApi.io',
    description: 'Flight booking/status, POI discovery, and live web data.',
    icon: <Globe className="w-8 h-8" />,
    color: 'from-emerald-500/20 to-teal-500/20',
    borderColor: 'border-emerald-500/30',
    textColor: 'text-emerald-400'
  },
  {
    id: 'persistence',
    name: 'Persistence',
    tech: 'Supabase (PostgreSQL + JSONB)',
    description: 'Chat history, user preferences, Knowledge Graph, and itinerary state.',
    icon: <Database className="w-8 h-8" />,
    color: 'from-rose-500/20 to-red-500/20',
    borderColor: 'border-rose-500/30',
    textColor: 'text-rose-400'
  }
];

export default function TechStackBlueprint() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);

  return (
    <section id="problems" className="section-padding bg-bg relative overflow-hidden" ref={containerRef}>
      {/* Blueprint Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_20%,transparent_100%)] pointer-events-none" />

      <div className="container-custom relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="tag mb-6">{'{ System Architecture }'}</span>
          <h2 className="text-4xl md:text-6xl font-display font-bold tracking-tighter mb-6">
            5-Layer Blueprint
          </h2>
          <p className="text-secondary text-lg">
            Built on the world's best infrastructure. Clean interfaces between UI, AI reasoning, orchestration, external data, and persistence.
          </p>
        </div>

        <motion.div style={{ y }} className="max-w-4xl mx-auto relative">
          {layers.map((layer, index) => (
            <div key={layer.id} className="relative">
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, delay: index * 0.15, type: "spring", bounce: 0.4 }}
                className={`p-6 md:p-8 rounded-3xl bg-surface/80 backdrop-blur-xl border ${layer.borderColor} shadow-2xl relative overflow-hidden group mb-6`}
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${layer.color} opacity-10 group-hover:opacity-20 transition-opacity duration-500`} />
                
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
                  <div className={`w-16 h-16 rounded-2xl bg-bg border ${layer.borderColor} flex items-center justify-center flex-shrink-0 ${layer.textColor} shadow-[0_0_30px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform duration-500`}>
                    {layer.icon}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-2 gap-2">
                      <h3 className="text-2xl font-display font-bold text-white">
                        {layer.name}
                      </h3>
                      <span className={`text-xs font-mono px-3 py-1 rounded-full border ${layer.borderColor} ${layer.textColor} bg-bg/50`}>
                        {layer.tech}
                      </span>
                    </div>
                    <p className="text-secondary leading-relaxed">
                      {layer.description}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Connector Line */}
              {index < layers.length - 1 && (
                <div className="flex justify-center -mt-4 mb-2 relative z-0">
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    whileInView={{ height: 40, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.15 + 0.4 }}
                    className="w-px bg-gradient-to-b from-white/20 to-white/5 flex items-center justify-center"
                  >
                    <ArrowDown className="w-4 h-4 text-white/20 absolute bottom-0 translate-y-1/2 bg-bg rounded-full" />
                  </motion.div>
                </div>
              )}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
