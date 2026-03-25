import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Plane, Cloud, MapPin, Brain, Star, Network, AlertTriangle, Cpu, CheckCircle, ChevronDown, Zap, Activity } from 'lucide-react';
import clsx from 'clsx';

const TOOL_META: Record<string, any> = {
  REASONING: {
    icon: Cpu, color: 'border-purple-500', glow: 'shadow-purple-500/30',
    bg: 'bg-purple-500/5', badge: 'ARIA REASONING', accent: '#a855f7',
    description: 'ARIA is reasoning about your trip and building an execution plan',
    endpoint: 'internal://aria-brain',
  },
  CALENDAR_SCAN: {
    icon: Calendar, color: 'border-cyan-400', glow: 'shadow-cyan-400/30',
    bg: 'bg-cyan-400/5', badge: 'CALENDAR API', accent: '#22d3ee',
    description: 'Analyzes calendar events to align travel with your schedule',
    endpoint: 'googleapis.com/calendar/v3',
  },
  FLIGHT_SEARCH: {
    icon: Plane, color: 'border-blue-500', glow: 'shadow-blue-500/30',
    bg: 'bg-blue-500/5', badge: 'FLIGHT API', accent: '#3b82f6',
    description: 'Searches real-time flight availability, pricing and timing',
    endpoint: 'openrouter.ai → llm-grounded-search',
  },
  DISRUPTION_SIMULATION: {
    icon: AlertTriangle, color: 'border-red-500', glow: 'shadow-red-500/30',
    bg: 'bg-red-500/5', badge: 'DISRUPTION AI', accent: '#ef4444',
    description: 'Simulates delay scenarios and generates contingency plans',
    endpoint: 'aria://disruption-engine',
  },
  WEATHER_CHECK: {
    icon: Cloud, color: 'border-amber-400', glow: 'shadow-amber-400/30',
    bg: 'bg-amber-400/5', badge: 'WEATHER API', accent: '#fbbf24',
    description: 'Fetches live weather data and seasonal forecasts',
    endpoint: 'openweathermap.org/api/v3',
  },
  ROUTE_PLAN: {
    icon: MapPin, color: 'border-emerald-500', glow: 'shadow-emerald-500/30',
    bg: 'bg-emerald-500/5', badge: 'MAPS API', accent: '#10b981',
    description: 'Calculates optimized routes using Google Maps & Roads API',
    endpoint: 'maps.googleapis.com/maps/api',
  },
  CRITICALITY: {
    icon: Brain, color: 'border-orange-500', glow: 'shadow-orange-500/30',
    bg: 'bg-orange-500/5', badge: 'ARIA BRAIN', accent: '#f97316',
    description: 'Scores business criticality of meetings and events',
    endpoint: 'aria://criticality-scorer',
  },
  PLACE_SUGGEST: {
    icon: Star, color: 'border-yellow-400', glow: 'shadow-yellow-400/30',
    bg: 'bg-yellow-400/5', badge: 'PLACES API', accent: '#facc15',
    description: 'Discovers top-rated locations using Places API (New)',
    endpoint: 'places.googleapis.com/v1',
  },
  PLAN_COMPLETE: {
    icon: Network, color: 'border-white/40', glow: 'shadow-white/10',
    bg: 'bg-white/5', badge: 'ORCHESTRATOR', accent: '#ffffff',
    description: 'Synthesizing all gathered data into your journey canvas',
    endpoint: 'aria://graph-builder',
  },
};

export default function ThinkingPanel({ events }: { events: any[] }) {
  return (
    <div className="h-full bg-[#07070E]/80 border border-white/5 rounded-3xl overflow-hidden flex flex-col relative backdrop-blur-xl">
      {/* Animated grid background */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '24px 24px' }}
      />

      {/* Header */}
      <div className="relative flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              className="w-7 h-7 rounded-full border border-purple-500/40 flex items-center justify-center"
            >
              <Activity size={12} className="text-purple-400" />
            </motion.div>
            <motion.div
              animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-full bg-purple-500/20"
            />
          </div>
          <span className="text-xs font-mono tracking-[0.25em] text-white/50 uppercase">ARIA · Cognitive Process</span>
        </div>
        <div className="flex gap-1.5">
          {['#a855f7', '#22d3ee', '#10b981'].map((c, i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 1.5, delay: i * 0.3, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 relative no-scrollbar">
        {/* Vertical rail */}
        <div className="absolute left-7 top-4 bottom-4 w-px">
          <motion.div
            className="h-full w-full"
            style={{ background: 'linear-gradient(to bottom, #a855f7, #22d3ee, #10b981, #f97316)' }}
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </div>

        <AnimatePresence mode="popLayout">
          {events.map((event, index) => (
            <ThinkingCard key={`${event.type}-${index}`} event={event} isLast={index === events.length - 1} />
          ))}
        </AnimatePresence>

        {events.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4 py-12">
            <motion.div
              animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-16 h-16 rounded-2xl border border-white/10 flex items-center justify-center"
            >
              <Cpu size={24} className="text-white/20" />
            </motion.div>
            <p className="text-xs text-white/20 font-mono tracking-widest">AWAITING INPUT</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ThinkingCard({ event, isLast }: { event: any; isLast: boolean }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { type, status, data } = event;
  const cfg = TOOL_META[type] || TOOL_META.REASONING;
  const Icon = cfg.icon;

  const isDone = status === 'done' || status === 'complete';
  const isActive = status === 'active' || status === 'scanning' || status === 'searching' ||
    status === 'checking' || status === 'calculating' || status === 'thinking' || status === 'synthesizing' || status === 'fetching' || status === 'scoring';
  const isError = status === 'error';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 30, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -20, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className="relative ml-6"
    >
      {/* Timeline dot */}
      <div
        className="absolute -left-[27px] top-4 w-3 h-3 rounded-full border-2 z-10"
        style={{
          backgroundColor: isDone ? cfg.accent : isActive ? 'transparent' : '#1a1a2e',
          borderColor: cfg.accent,
          boxShadow: isActive ? `0 0 10px ${cfg.accent}` : 'none',
        }}
      >
        {isActive && (
          <motion.div
            animate={{ scale: [1, 2, 1], opacity: [0.8, 0, 0.8] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="absolute inset-0 rounded-full"
            style={{ backgroundColor: cfg.accent }}
          />
        )}
      </div>

      {/* Card */}
      <motion.div
        whileHover={{ scale: 1.01, y: -1 }}
        onClick={() => setIsExpanded(!isExpanded)}
        className={clsx(
          'relative overflow-hidden rounded-xl border cursor-pointer transition-all duration-300',
          cfg.bg,
          isActive ? `border-l-4 ${cfg.color} border-r border-t border-b border-r-white/5 border-t-white/5 border-b-white/5` : 'border border-white/5',
          isDone ? 'opacity-70' : 'opacity-100',
          isActive && `shadow-lg ${cfg.glow}`,
        )}
        style={isActive ? { boxShadow: `0 0 20px ${cfg.accent}20, inset 0 0 30px ${cfg.accent}05` } : {}}
      >
        {/* Scan-line animation on active */}
        {isActive && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{ background: `linear-gradient(180deg, transparent 0%, ${cfg.accent}15 50%, transparent 100%)`, height: '40%' }}
            animate={{ y: ['-100%', '250%'] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
          />
        )}

        {/* Header row */}
        <div className="flex items-center gap-3 p-3">
          {/* Icon */}
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${cfg.accent}15`, border: `1px solid ${cfg.accent}30` }}
          >
            {isActive ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
                <Icon size={14} style={{ color: cfg.accent }} />
              </motion.div>
            ) : isDone ? (
              <CheckCircle size={14} style={{ color: cfg.accent }} />
            ) : (
              <Icon size={14} style={{ color: cfg.accent }} />
            )}
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-widest uppercase" style={{ color: cfg.accent }}>{cfg.badge}</span>
              {isDone && (
                <motion.span initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
                  className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 font-bold">✓ DONE</motion.span>
              )}
              {isError && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold">✗ ERROR</span>}
            </div>
            <p className="text-xs text-white/60 mt-0.5 truncate">{data.text || 'Processing...'}</p>
          </div>

          {/* Expand chevron */}
          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={12} className="text-white/30" />
          </motion.div>
        </div>

        {/* Inline result data — always show key results */}
        {(data.flights || data.weather || data.routes || data.places || data.risk || data.scores || data.steps) && (
          <div className="px-3 pb-3 space-y-1.5 pl-14">
            {data.steps && (
              <div className="space-y-1">
                {data.steps.slice(0, 4).map((s: any, i: number) => (
                  <motion.div key={i} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                    className="text-xs text-white/50 flex items-start gap-2 bg-black/20 rounded-lg px-2.5 py-1.5">
                    <Zap size={10} style={{ color: cfg.accent, marginTop: 2, flexShrink: 0 }} />
                    <span>{s.reason}</span>
                  </motion.div>
                ))}
              </div>
            )}
            {data.flights?.map((f: string, i: number) => (
              <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-xs font-mono px-2.5 py-1.5 rounded-lg flex items-center justify-between"
                style={{ backgroundColor: `${cfg.accent}10`, border: `1px solid ${cfg.accent}20`, color: cfg.accent }}>
                {f}
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              </motion.div>
            ))}
            {data.weather && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-3"
                style={{ backgroundColor: `${cfg.accent}10`, color: 'rgba(255,255,255,0.7)' }}>
                <span className="text-base">{data.weather.temp}</span>
                <span>{data.weather.condition}</span>
              </motion.div>
            )}
            {data.routes?.map((r: string, i: number) => (
              <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-xs px-2.5 py-1.5 rounded-lg"
                style={{ backgroundColor: `${cfg.accent}10`, border: `1px solid ${cfg.accent}20`, color: cfg.accent }}>
                🗺️ {r}
              </motion.div>
            ))}
            {data.scores?.map((s: string, i: number) => (
              <motion.div key={i} initial={{ width: 0 }} animate={{ width: '100%' }}
                className="text-xs px-2.5 py-1.5 rounded-lg overflow-hidden whitespace-nowrap"
                style={{ backgroundColor: `${cfg.accent}10`, border: `1px solid ${cfg.accent}20`, color: cfg.accent }}>
                {s}
              </motion.div>
            ))}
            {data.places?.map((p: string, i: number) => (
              <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-xs px-2.5 py-1.5 rounded-lg"
                style={{ backgroundColor: `${cfg.accent}10`, color: cfg.accent }}>
                ⭐ {p}
              </motion.div>
            ))}
            {data.risk && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-xs px-2.5 py-2 rounded-lg border border-red-500/20 bg-red-500/5">
                <div className="font-bold text-red-400 mb-1">⚠ {data.risk}</div>
                {data.alternatives && <div className="text-white/40">Alt: {data.alternatives.join(' · ')}</div>}
              </motion.div>
            )}
          </div>
        )}

        {/* Hover-expanded detail panel */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden border-t border-white/5"
            >
              <div className="p-3 pl-14 space-y-3">
                <div className="text-[10px] text-white/30 font-mono tracking-wider">TOOL DETAILS</div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-black/30 rounded-lg p-2">
                    <div className="text-[9px] text-white/30 mb-1 uppercase tracking-wider">Endpoint</div>
                    <div className="text-[10px] font-mono text-white/60 truncate">{cfg.endpoint}</div>
                  </div>
                  <div className="bg-black/30 rounded-lg p-2">
                    <div className="text-[9px] text-white/30 mb-1 uppercase tracking-wider">Status</div>
                    <div className="text-[10px] font-mono" style={{ color: isDone ? '#4ade80' : isActive ? cfg.accent : '#ff4444' }}>
                      {isDone ? 'COMPLETE' : isActive ? 'PROCESSING' : isError ? 'FAILED' : 'PENDING'}
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-white/40 leading-relaxed">{cfg.description}</p>

                {/* Alternatives for transport steps */}
                {data.alternatives && Array.isArray(data.alternatives) && data.alternatives.length > 0 && typeof data.alternatives[0] === 'object' && (
                  <div>
                    <div className="text-[9px] text-white/30 font-mono mb-2 uppercase tracking-wider">Transport Alternatives</div>
                    <div className="space-y-1.5">
                      {data.alternatives.map((alt: any, i: number) => (
                        <div key={i} className="flex items-center justify-between rounded-lg px-2.5 py-1.5 cursor-pointer transition-all hover:opacity-100 opacity-80"
                          style={{ backgroundColor: `${cfg.accent}10`, border: `1px solid ${cfg.accent}20` }}>
                          <div>
                            <div className="text-xs font-medium text-white/80">{alt.mode}</div>
                            <div className="text-[10px] text-white/40">{alt.duration}</div>
                          </div>
                          <div className="text-xs font-mono" style={{ color: cfg.accent }}>₹{alt.cost?.toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
