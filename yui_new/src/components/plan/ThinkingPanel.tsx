import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Plane, Cloud, MapPin, Brain, Star, Network, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';

export default function ThinkingPanel({ events }: { events: any[] }) {
  return (
    <div className="h-full bg-surface/50 border border-white/5 rounded-3xl p-6 overflow-hidden flex flex-col relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <motion.h3 
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-xs font-display tracking-[0.2em] text-white/50 uppercase"
        >
          ARIA is Reasoning
        </motion.h3>
        <div className="flex gap-1">
          <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 1, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full bg-accent" />
          <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 1, delay: 0.2, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full bg-[#0F6E56]" />
          <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 1, delay: 0.4, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full bg-[#185FA5]" />
        </div>
      </div>

      {/* Progress Rail */}
      <div className="absolute left-6 top-16 bottom-6 w-px bg-gradient-to-b from-accent via-[#0F6E56] to-[#185FA5] opacity-20" />

      {/* Cards Stack */}
      <div className="flex-1 overflow-y-auto no-scrollbar pl-6 space-y-4 relative">
        <AnimatePresence mode="popLayout">
          {events.map((event, index) => (
            <ThinkingCard key={index} event={event} isLast={index === events.length - 1} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ThinkingCard({ event, isLast }: { event: any, isLast: boolean }) {
  const { type, status, data } = event;

  const config = {
    CALENDAR_SCAN: { icon: Calendar, color: 'border-l-accent', bg: 'bg-accent/5', badge: 'CALENDAR API' },
    FLIGHT_SEARCH: { icon: Plane, color: 'border-l-[#185FA5]', bg: 'bg-[#185FA5]/5', badge: 'AVIATIONSTACK' },
    DISRUPTION_SIMULATION: { icon: AlertTriangle, color: 'border-l-red-500', bg: 'bg-red-500/5', badge: 'DISRUPTION ENGINE' },
    WEATHER_CHECK: { icon: Cloud, color: 'border-l-[#854F0B]', bg: 'bg-[#854F0B]/5', badge: 'OPENWEATHER' },
    ROUTE_PLAN: { icon: MapPin, color: 'border-l-[#0F6E56]', bg: 'bg-[#0F6E56]/5', badge: 'GOOGLE MAPS' },
    CRITICALITY: { icon: Brain, color: 'border-l-[#993C1D]', bg: 'bg-[#993C1D]/5', badge: 'ARIA BRAIN' },
    PLACE_SUGGEST: { icon: Star, color: 'border-l-accent', bg: 'bg-accent/5', badge: 'PLACES API' },
    PLAN_COMPLETE: { icon: Network, color: 'border-l-white/50', bg: 'bg-white/5', badge: 'ARIA ORCHESTRATOR' },
  }[type as string] || { icon: Brain, color: 'border-l-white/20', bg: 'bg-white/5', badge: 'SYSTEM' };

  const Icon = config.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 40, scale: 0.95 }}
      animate={{ opacity: status === 'done' || status === 'complete' ? 0.6 : 1, x: 0, scale: 1 }}
      className={clsx(
        "relative p-4 rounded-r-xl border border-white/5 backdrop-blur-sm transition-all duration-300",
        config.color, config.bg,
        "border-l-4"
      )}
    >
      {/* Rail Connector */}
      <div className="absolute -left-[27px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-bg border-2 border-white/20 z-10" />

      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-white/5">
            <Icon size={16} className="text-white/70" />
          </div>
          <span className="text-sm font-medium text-white/90">{data.text || `Processing ${type}...`}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold tracking-wider text-white/40 uppercase bg-black/40 px-2 py-1 rounded-sm">
            {config.badge}
          </span>
          {(status === 'done' || status === 'complete') && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            </motion.div>
          )}
        </div>
      </div>

      {/* Dynamic Content based on event type */}
      <div className="mt-3 pl-11 space-y-2">
        {data.events?.map((e: string, i: number) => (
          <motion.div key={i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-white/60 bg-black/20 px-3 py-1.5 rounded-md">
            {e}
          </motion.div>
        ))}
        {data.flights?.map((f: string, i: number) => (
          <motion.div key={i} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="text-xs text-white/80 bg-[#185FA5]/10 border border-[#185FA5]/20 px-3 py-2 rounded-md flex items-center justify-between">
            {f}
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          </motion.div>
        ))}
        {data.weather && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-4 text-xs text-white/70 bg-[#854F0B]/10 p-2 rounded-md">
            <span className="text-xl">{data.weather.temp}</span>
            <span>{data.weather.condition}</span>
          </motion.div>
        )}
        {data.routes?.map((r: string, i: number) => (
          <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-[#0F6E56] bg-[#0F6E56]/10 px-3 py-1.5 rounded-md border border-[#0F6E56]/20">
            {r}
          </motion.div>
        ))}
        {data.scores?.map((s: string, i: number) => (
          <motion.div key={i} initial={{ width: 0 }} animate={{ width: '100%' }} className="text-xs text-[#993C1D] bg-[#993C1D]/10 px-3 py-1.5 rounded-md border border-[#993C1D]/20 overflow-hidden whitespace-nowrap">
            {s}
          </motion.div>
        ))}
        {data.places?.map((p: string, i: number) => (
          <motion.div key={i} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-accent bg-accent/10 px-3 py-1.5 rounded-md border border-accent/20">
            {p}
          </motion.div>
        ))}
        {data.risk && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-md border border-red-500/20">
            <div className="font-bold mb-1">Risk: {data.risk}</div>
            <div className="text-white/60">Alternatives: {data.alternatives?.join(', ')}</div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
