import { useState, useRef, useEffect } from 'react';
import { ReactFlow, Background, Controls, useNodesState, useEdgesState, Node, Edge, Handle, Position } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { useAppSounds } from '../hooks/useAppSounds';
import { GoogleGenAI } from '@google/genai';

// Custom Minimalist Node
const LogicNode = ({ data }: any) => {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`px-4 py-3 rounded-xl border flex items-center justify-center text-center shadow-lg relative ${
        data.type === 'trigger' ? 'bg-red-500/10 border-red-500/50' :
        data.type === 'action' ? 'bg-accent/10 border-accent/50' :
        data.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/50' :
        'bg-surface border-white/10'
      }`}
    >
      <Handle type="target" position={Position.Left} className="opacity-0 w-full h-full absolute inset-0 z-0" />
      <span className="text-sm font-medium text-white relative z-10">{data.label}</span>
      <Handle type="source" position={Position.Right} className="opacity-0 w-full h-full absolute inset-0 z-0" />
    </motion.div>
  );
};

const nodeTypes = { logic: LogicNode };

const SUGGESTED_QUERIES = [
  "What happens if I miss my connecting flight?",
  "How does Yui handle a hotel overbooking?",
  "What if my train is delayed by 3 hours?",
];

// Initialize GenAI
const ai = new GoogleGenAI({ 
  apiKey: (import.meta as any).env.VITE_GEMINI_API_KEY || ''
});

export default function ChatFlowCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [messages, setMessages] = useState<{role: 'user' | 'bot', text: string}[]>([{
    role: 'bot', text: "Hello! I'm Yui. Ask me how I handle specific travel disruptions, or click one of the suggestions below to see my logic in action."
  }]);
  const [isTyping, setIsTyping] = useState(false);
  const [inputValue, setInputValue] = useState("");
  
  const { playClick, playHover, playPop, playSuccess, playAlert } = useAppSounds();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSubmit = async (query: string) => {
    if (!query.trim() || isTyping) return;
    
    playClick();
    
    // Clear graph
    setNodes([]);
    setEdges([]);
    
    // Add User Message
    setMessages(prev => [...prev, { role: 'user', text: query }]);
    setInputValue("");
    setIsTyping(true);

    try {
      const prompt = `
You are Yui AI, an autonomous travel disruption management system. 
The user asks: "${query}"

Respond with a JSON object containing EXACTLY this structure:
{
  "reply": "A concise paragraph explaining how you (Yui AI) detect and autonomously resolve this issue.",
  "nodes": [
    { "id": "1", "type": "logic", "position": { "x": 50, "y": 100 }, "data": { "label": "Short Action Description", "type": "trigger" } },
    { "id": "2", "type": "logic", "position": { "x": 300, "y": 100 }, "data": { "label": "Next Step", "type": "action" } }
  ],
  "edges": [
    { "id": "e1-2", "source": "1", "target": "2", "animated": true, "style": { "stroke": "rgba(255,255,255,0.3)", "strokeWidth": 2 } }
  ]
}

Rules for the nodes:
- "trigger" type should be used for the initial problem detection.
- "action" type should be used for AI reasoning or actions taken (like holding a seat).
- "success" type should be used for the final resolution node.
- Keep the x and y coordinates flowing roughly from left to right (e.g. x: 50, then x: 300, etc.).
- ONLY RETURN VALID JSON. Do not use markdown backticks around the json.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });

      const responseText = response.text || "{}";
      const parsedData = JSON.parse(responseText);

      setIsTyping(false);
      playSuccess();
      setMessages(prev => [...prev, { role: 'bot', text: parsedData.reply || "I simulated the resolution path on the canvas." }]);
      
      // Animate Nodes appearing one by one
      if (parsedData.nodes && Array.isArray(parsedData.nodes)) {
        parsedData.nodes.forEach((node: any, idx: number) => {
          setTimeout(() => {
            playPop();
            setNodes((nds) => [...nds, node]);
          }, idx * 500 + 400); // Stagger introduction
        });

        // Introduce edges slightly after nodes
        if (parsedData.edges && Array.isArray(parsedData.edges)) {
          setTimeout(() => {
            setEdges(parsedData.edges);
          }, parsedData.nodes.length * 500 + 800);
        }
      }

    } catch (error) {
      console.error("AI Generation Error:", error);
      setIsTyping(false);
      playAlert();
      setMessages(prev => [...prev, { role: 'bot', text: "Sorry, my cognitive engine hit a snag generating that flow. Please try again." }]);
    }
  };

  return (
    <section id="chat-flow" className="section-padding bg-bg relative border-b border-white/5">
      <div className="container-custom">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6 group hover:bg-accent/20 transition-colors">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-sm font-bold text-accent uppercase tracking-wider">Dynamic Logic</span>
          </div>
          <h2 className="text-4xl font-display font-bold tracking-tighter mb-4">
            Ask Yui How It Thinks
          </h2>
          <p className="text-secondary">
            Interact with the chat below. As Yui answers, watch its cognitive reasoning engine map out the solution in real-time on the canvas.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[700px] border border-white/10 rounded-[2.5rem] bg-surface/50 overflow-hidden shadow-2xl">
          
          {/* Left Pane: Chat Interface */}
          <div className="col-span-1 lg:col-span-4 bg-[#111] border-r border-white/5 flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-white/5 bg-surface/80 backdrop-blur-md flex items-center gap-3 shrink-0">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="font-bold text-white">Yui Support Simulation</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              <AnimatePresence>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9, originY: 1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-accent/20 text-accent' : 'bg-surface border border-white/10 text-white'}`}>
                      {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div className={`p-3 rounded-2xl text-sm leading-relaxed max-w-[85%] shadow-md ${msg.role === 'user' ? 'bg-accent text-white rounded-tr-none' : 'bg-surface border border-white/10 text-secondary rounded-tl-none'}`}>
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-surface border border-white/10 text-white flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="p-3 rounded-2xl bg-surface border border-white/10 text-secondary rounded-tl-none flex items-center gap-2">
                    <span className="w-2 h-2 bg-secondary/50 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-2 h-2 bg-secondary/50 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-2 h-2 bg-secondary/50 rounded-full animate-bounce"></span>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-surface/50 border-t border-white/5 shrink-0 flex flex-col gap-3">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none snap-x">
                {SUGGESTED_QUERIES.map((q, idx) => (
                  <button 
                    key={idx}
                    onClick={() => handleSubmit(q)}
                    onMouseEnter={playHover}
                    disabled={isTyping}
                    className="shrink-0 snap-start text-xs font-medium px-3 py-1.5 rounded-full bg-bg border border-white/10 hover:border-accent/50 text-secondary hover:text-white transition-all disabled:opacity-50 whitespace-nowrap"
                  >
                    {q}
                  </button>
                ))}
              </div>
              
              <div className="relative">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit(inputValue)}
                  placeholder="Ask a custom travel scenario..."
                  disabled={isTyping}
                  className="w-full bg-bg border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-white focus:outline-none focus:border-accent/50 transition-colors disabled:opacity-50"
                />
                <button
                  onClick={() => handleSubmit(inputValue)}
                  onMouseEnter={playHover}
                  disabled={isTyping || !inputValue.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-accent/20 text-accent hover:bg-accent/30 disabled:opacity-50 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Pane: React Flow Canvas */}
          <div className="col-span-1 lg:col-span-8 bg-[#0a0a0a] relative h-full min-h-[400px]">
            {nodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-secondary/30 pointer-events-none z-10">
                <span className="font-mono text-sm tracking-wider">Awaiting query to build logic flow...</span>
              </div>
            )}
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              fitView
              panOnScroll={true}
              zoomOnScroll={false}
              proOptions={{ hideAttribution: true }}
            >
              <Background color="#222" gap={24} size={1} />
              <Controls className="bg-surface border-white/10 fill-white" showInteractive={false} />
            </ReactFlow>
          </div>

        </div>
      </div>
    </section>
  );
}
