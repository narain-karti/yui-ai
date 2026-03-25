import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, MapPin, Plane, Train, Car, Bus, Building, Briefcase, Coffee, Clock } from 'lucide-react';
import clsx from 'clsx';
import { updateNodeChat } from '../../../services/agentService';

export default function NodePopup({ node, onClose, fullPlanContext, onUpdateNode }: any) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async () => {
    if (!input) return;

    const userMsg = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    try {
      await updateNodeChat({
        nodeId: node.id,
        userMessage: userMsg.content,
        fullPlanContext
      }, (data) => {
        if (data.type === 'AGENT_THOUGHT') {
          setMessages(prev => [...prev, { id: Date.now().toString(), role: 'aria', content: data.data.text, isThought: true }]);
        } else if (data.type === 'NODE_UPDATED') {
          onUpdateNode(data.data.updatedNode);
          setMessages(prev => [...prev, { id: Date.now().toString(), role: 'aria', content: 'I have updated this leg of your journey.' }]);
          setIsThinking(false);
        }
      });
    } catch (error) {
      console.error(error);
      setIsThinking(false);
    }
  };

  const getIcon = () => {
    switch (node.subtype) {
      case 'flight': return Plane;
      case 'train': return Train;
      case 'taxi': return Car;
      case 'bus': return Bus;
      case 'airport': return MapPin;
      case 'hotel': return Building;
      case 'venue': return Briefcase;
      case 'restaurant': return Coffee;
      default: return Clock;
    }
  };

  const Icon = getIcon();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-full max-w-5xl h-[80vh] bg-surface border-t border-white/10 rounded-t-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Left Panel: Details */}
          <div className="w-full md:w-1/2 p-8 border-r border-white/10 flex flex-col overflow-y-auto">
            <button onClick={onClose} className="absolute top-6 right-6 md:hidden p-2 bg-white/5 rounded-full text-white/50 hover:text-white">
              <X size={20} />
            </button>
            
            <div className="flex items-center gap-4 mb-6">
              <motion.div animate={{ y: [-5, 5, -5] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="p-4 bg-accent/10 rounded-2xl text-accent">
                <Icon size={32} />
              </motion.div>
              <div>
                <h2 className="text-2xl font-display font-bold text-white">{node.label}</h2>
                <p className="text-sm text-white/50 uppercase tracking-wider">{node.subtype}</p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              {Object.entries(node.data || {}).map(([key, value]) => {
                if (key === 'alternatives') return null;
                return (
                  <div key={key} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                    <span className="text-xs text-white/40 uppercase tracking-wider">{key}</span>
                    <span className="text-sm font-medium text-white/90">{String(value)}</span>
                  </div>
                );
              })}
            </div>

            {node.data?.alternatives && (
              <div>
                <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Alternatives</h3>
                <div className="space-y-2">
                  {node.data.alternatives.map((alt: any, i: number) => (
                    <div key={i} className="p-3 bg-black/20 rounded-xl border border-white/5 flex items-center justify-between hover:border-accent/30 cursor-pointer transition-colors">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white/80">{alt.flight || alt.mode}</span>
                        <span className="text-xs text-white/40">{alt.time || alt.duration}</span>
                      </div>
                      <span className="text-sm font-mono text-accent">₹{alt.cost}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Panel: Chat */}
          <div className="w-full md:w-1/2 flex flex-col bg-black/20 relative">
            <button onClick={onClose} className="absolute top-6 right-6 hidden md:block p-2 bg-white/5 rounded-full text-white/50 hover:text-white z-10">
              <X size={20} />
            </button>
            
            <div className="p-6 border-b border-white/5">
              <h3 className="text-sm font-bold text-white/80">Modify this leg</h3>
              <p className="text-xs text-white/40">Ask ARIA to find cheaper options, change times, or switch transport modes.</p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <AnimatePresence>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={clsx(
                      "max-w-[85%] p-3 rounded-xl text-sm",
                      msg.role === 'user' ? "ml-auto bg-accent/20 text-white" : 
                      msg.isThought ? "mr-auto bg-transparent text-white/40 italic text-xs" : "mr-auto bg-white/10 text-white/90"
                    )}
                  >
                    {msg.content}
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-white/5 bg-surface">
              <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-full px-4 py-2 focus-within:border-accent/50 transition-colors">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  placeholder="e.g. Find a cheaper flight..."
                  className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-white/30"
                />
                <button 
                  onClick={handleSubmit}
                  disabled={isThinking || !input}
                  className="p-1.5 bg-accent text-white rounded-full disabled:opacity-50 hover:bg-accent-hover transition-colors"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
