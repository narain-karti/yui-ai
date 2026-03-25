import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, MapPin, Plus, Calendar, Settings2, PlaneTakeoff, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';
import { generatePlan } from '../../services/agentService';

interface Message {
  id: string;
  role: 'user' | 'aria';
  content: string;
}

export default function ChatInterface({ onPlanComplete, onEvent, events, compact }: any) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [stops, setStops] = useState<string[]>([]);
  const [days, setDays] = useState(3);
  const [tags, setTags] = useState<string[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [calendarTokens, setCalendarTokens] = useState<any>(null);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickTags = ['Business Trip', 'Leisure', 'Regulatory Meeting', 'Trade Visit', 'Group Travel', 'Solo', 'Budget Friendly', 'Luxury'];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (!event.origin.endsWith('.run.app') && !event.origin.includes('localhost')) return;
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        setCalendarTokens(event.data.tokens);
        try {
          const res = await fetch('/api/calendar/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tokens: event.data.tokens })
          });
          const data = await res.json();
          if (data.events) {
            setCalendarEvents(data.events);
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'aria', content: `Successfully connected Google Calendar. Found ${data.events.length} upcoming events.` }]);
          }
        } catch (e) {
          console.error('Failed to fetch calendar events', e);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleConnectCalendar = async () => {
    try {
      const response = await fetch('/api/auth/url');
      if (!response.ok) throw new Error('Failed to get auth URL');
      const { url } = await response.json();
      window.open(url, 'oauth_popup', 'width=600,height=700');
    } catch (error) {
      console.error('OAuth error:', error);
      alert('Failed to connect to Google Calendar. Check console for details.');
    }
  };

  const handleSubmit = async () => {
    if (!input && !origin && !destination) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input || `Plan a trip from ${origin} to ${destination} for ${days} days.` };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);
    onEvent([]); // Clear previous events

    try {
      const graph = await generatePlan({
        query: userMsg.content,
        origin,
        destination,
        stops,
        days,
        tags,
        budget: tags.includes('Budget Friendly') ? 'Economy' : 'Standard',
        calendarEvents: calendarEvents.length > 0 ? calendarEvents : undefined
      }, (data) => {
        onEvent((prev: any) => [...prev, data]);
        if (data.type === 'PLAN_COMPLETE' && data.status === 'done') {
          onPlanComplete(data.data.graph);
          setMessages(prev => [...prev, { id: Date.now().toString(), role: 'aria', content: 'I have generated your personalized travel plan. Check the flowchart below.' }]);
          setIsThinking(false);
        }
      });
    } catch (error) {
      console.error(error);
      setIsThinking(false);
    }
  };

  const toggleTag = (tag: string) => {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  return (
    <div className="flex flex-col h-full bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl relative">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, x: msg.role === 'user' ? 40 : -40 }}
              animate={{ opacity: 1, x: 0 }}
              className={clsx(
                "max-w-[80%] p-4 rounded-2xl border",
                msg.role === 'user' 
                  ? "ml-auto bg-accent/15 border-accent/30 rounded-tr-sm" 
                  : "mr-auto bg-[#0F6E56]/10 border-[#0F6E56]/25 rounded-tl-sm"
              )}
            >
              <p className="text-sm leading-relaxed text-white/90">{msg.content}</p>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/10 bg-black/40 relative">
        {compact ? (
          <div className="flex flex-col gap-4">
            <button 
              onClick={() => {
                onPlanComplete(null);
                setMessages([]);
                onEvent([]);
              }}
              className="w-full py-2 rounded-full border border-white/20 text-white/70 hover:text-white hover:bg-white/5 transition-colors text-sm font-medium"
            >
              Start New Plan
            </button>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask ARIA to modify the plan..."
                className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white outline-none focus:border-accent transition-colors"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSubmit();
                }}
              />
              <button 
                onClick={handleSubmit}
                disabled={isThinking || !input}
                className="p-2 rounded-full bg-accent text-white disabled:opacity-50 hover:bg-accent/80 transition-colors"
              >
                {isThinking ? <Settings2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Days Badge */}
            <div className="absolute -top-4 right-6 bg-surface border border-white/10 rounded-full px-4 py-1 flex items-center gap-3 shadow-lg shadow-black/50">
              <button onClick={() => setDays(Math.max(1, days - 1))} className="text-white/50 hover:text-white transition-colors">◂</button>
              <span className="text-xs font-bold tracking-widest">{days} DAYS</span>
              <button onClick={() => setDays(days + 1)} className="text-white/50 hover:text-white transition-colors">▸</button>
            </div>

            {/* Origin / Destination Row */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 hover:bg-white/10 transition-colors focus-within:border-accent">
                <span className="text-[10px] font-bold text-white/50 tracking-wider">ORIGIN</span>
                <input 
                  type="text" 
                  placeholder="Where from?" 
                  className="bg-transparent border-none outline-none text-sm w-24 text-white placeholder:text-white/30"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                />
              </div>
              
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent relative">
                 <motion.div 
                   animate={{ x: [0, 100, 0] }}
                   transition={{ duration: 2, repeat: Infinity }}
                   className="absolute top-[-2px] left-1/2 w-1 h-1 rounded-full bg-accent"
                 />
              </div>

              {stops.map((stop, i) => (
                <div key={i} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2">
                  <span className="text-[10px] font-bold text-white/50 tracking-wider">STOP</span>
                  <input 
                    type="text" 
                    className="bg-transparent border-none outline-none text-sm w-20 text-white"
                    value={stop}
                    onChange={(e) => {
                      const newStops = [...stops];
                      newStops[i] = e.target.value;
                      setStops(newStops);
                    }}
                  />
                </div>
              ))}

              {stops.length < 5 && (
                <button 
                  onClick={() => setStops([...stops, ''])}
                  className="p-2 rounded-full border border-dashed border-white/20 text-white/50 hover:text-white hover:border-white/40 transition-colors"
                >
                  <Plus size={16} />
                </button>
              )}

              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

              <div className="flex items-center gap-2 bg-[#0F6E56]/10 border border-[#0F6E56]/30 rounded-full px-4 py-2 hover:bg-[#0F6E56]/20 transition-colors focus-within:border-[#0F6E56]">
                <span className="text-[10px] font-bold text-[#0F6E56] tracking-wider">DEST</span>
                <input 
                  type="text" 
                  placeholder="Where to?" 
                  className="bg-transparent border-none outline-none text-sm w-24 text-white placeholder:text-white/30"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                />
              </div>
            </div>

            {/* Textarea */}
            <div className="relative mb-4">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="I'm flying to Delhi for a regulatory meeting on the 15th..."
                className="w-full bg-transparent border-none outline-none resize-none text-sm text-white/90 placeholder:text-white/30 min-h-[60px]"
              />
              <div className={clsx("absolute bottom-0 right-0 text-[10px]", input.length > 480 ? "text-red-500" : input.length > 400 ? "text-amber-500" : "text-white/30")}>
                {input.length} / 500
              </div>
            </div>

            {/* Tags & Submit */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex gap-2 overflow-x-auto no-scrollbar py-2 flex-1">
                <button
                  onClick={handleConnectCalendar}
                  className={clsx(
                    "whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 flex items-center gap-1.5",
                    calendarTokens
                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                      : "bg-white/5 text-white/60 hover:bg-white/10 border border-white/5"
                  )}
                >
                  <Calendar size={12} />
                  {calendarTokens ? 'Calendar Connected' : 'Connect Calendar'}
                </button>
                {quickTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={clsx(
                      "whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300",
                      tags.includes(tag) 
                        ? "bg-accent text-white shadow-[0_0_15px_rgba(255,79,0,0.4)] transform -translate-y-0.5" 
                        : "bg-white/5 text-white/60 hover:bg-white/10 border border-white/5"
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>

              <button
                onClick={handleSubmit}
                disabled={isThinking || (!input && !origin && !destination)}
                className="group relative px-6 py-2.5 rounded-full bg-surface border border-white/10 text-sm font-bold overflow-hidden transition-all disabled:opacity-50"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-accent to-[#0F6E56] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <span className="relative z-10 flex items-center gap-2">
                  {isThinking ? (
                    <span className="flex items-center gap-2">
                      <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
                        <Settings2 size={16} />
                      </motion.span>
                      ARIA is Thinking...
                    </span>
                  ) : (
                    <>Plan with ARIA <PlaneTakeoff size={16} /></>
                  )}
                </span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
