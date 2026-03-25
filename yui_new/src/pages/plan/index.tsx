import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';
import Navbar from '../../components/Navbar';
import ChatInterface from '../../components/plan/ChatInterface';
import ThinkingPanel from '../../components/plan/ThinkingPanel';
import JourneyCanvas from '../../components/plan/flowchart/JourneyCanvas';

export default function PlanJourney() {
  const [isReady, setIsReady] = useState(false);
  const [planData, setPlanData] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    // Entry animation delay
    const timer = setTimeout(() => setIsReady(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (planData) {
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 500);
    }
  }, [planData]);

  return (
    <div className="min-h-screen bg-bg text-primary overflow-hidden relative">
      <Navbar />
      
      {/* Background Blobs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <motion.div 
          animate={{ x: [0, 100, 0], y: [0, 50, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-accent/15 blur-[120px]"
        />
        <motion.div 
          animate={{ x: [0, -100, 0], y: [0, -50, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#0F6E56]/15 blur-[120px]"
        />
        <motion.div 
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[40%] left-[40%] w-[400px] h-[400px] rounded-full bg-[#185FA5]/10 blur-[120px]"
        />
      </div>

      {/* Entry Animations */}
      <AnimatePresence>
        {!isReady && (
          <motion.div
            initial={{ width: '100%' }}
            animate={{ width: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-40 bg-bg flex items-center justify-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ delay: 0.4 }}
              className="text-4xl font-display font-bold tracking-[0.5em] text-white/20"
            >
              ARIA
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative z-10 pt-24 pb-12 px-6 max-w-[1600px] mx-auto min-h-screen flex flex-col">
        {/* Status Bar */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: isReady ? 1 : 0, y: isReady ? 0 : -20 }}
          transition={{ delay: 0.8 }}
          className="flex items-center gap-4 mb-8 overflow-x-auto no-scrollbar py-2"
        >
          <StatusPill label="Calendar Connected" color="bg-green-500" delay={0} />
          <StatusPill label="Flight APIs Ready" color="bg-amber-500" delay={0.1} />
          <StatusPill label="Maps Active" color="bg-green-500" delay={0.2} />
          <StatusPill label="ARIA Agent Online" color="bg-blue-500" delay={0.3} pulse />
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8 flex-1 relative h-[80vh]">
          {/* Neural Link Divider */}
          {!planData && (
            <div className="hidden lg:block absolute left-[58%] top-0 bottom-0 w-px border-l border-dashed border-accent/30 -ml-4">
               <motion.div 
                 animate={{ y: [0, 1000] }}
                 transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                 className="w-1 h-4 bg-accent/50 rounded-full -ml-[2px]"
               />
            </div>
          )}

          {/* Left Column: Chat */}
          <motion.div 
            layout
            initial={{ opacity: 0, x: -40 }}
            animate={{ 
              opacity: isReady ? 1 : 0, 
              x: isReady ? 0 : -40
            }}
            transition={{ duration: 0.8, type: 'spring', bounce: 0.2 }}
            className={clsx(
              "flex flex-col h-full w-full transition-all duration-700",
              planData ? "lg:w-1/4" : "lg:w-[58%]"
            )}
          >
            <ChatInterface onPlanComplete={setPlanData} onEvent={setEvents} events={events} compact={!!planData} />
          </motion.div>

          {/* Right Column: Thinking Panel OR Journey Canvas */}
          <motion.div 
            layout
            initial={{ opacity: 0, x: 40 }}
            animate={{ 
              opacity: isReady ? 1 : 0, 
              x: isReady ? 0 : 40
            }}
            transition={{ duration: 0.8, type: 'spring', bounce: 0.2 }}
            className={clsx(
              "flex flex-col h-full w-full transition-all duration-700",
              planData ? "lg:w-3/4" : "lg:w-[42%]"
            )}
          >
            <AnimatePresence mode="wait">
              {!planData ? (
                <motion.div
                  key="thinking"
                  exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                  transition={{ duration: 0.4 }}
                  className="h-full w-full"
                >
                  <ThinkingPanel events={events} />
                </motion.div>
              ) : (
                <motion.div
                  key="canvas"
                  initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  transition={{ duration: 0.8, delay: 0.3, type: 'spring' }}
                  className="h-full w-full rounded-3xl overflow-hidden border border-accent/20 bg-[#07070E] relative shadow-[0_0_80px_rgba(255,79,0,0.15)]"
                >
                  <JourneyCanvas data={planData} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

function StatusPill({ label, color, delay, pulse = false }: { label: string, color: string, delay: number, pulse?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.8 + delay }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md whitespace-nowrap"
    >
      <span className="relative flex h-2 w-2">
        {pulse && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${color}`}></span>}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${color}`}></span>
      </span>
      <span className="text-xs font-medium text-white/80">{label}</span>
    </motion.div>
  );
}
