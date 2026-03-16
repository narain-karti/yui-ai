/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Marquee from './components/Marquee';
import TechStackBlueprint from './components/TechStackBlueprint';
import DualLoopShowcase from './components/DualLoopShowcase';
import MultiModalEngine from './components/MultiModalEngine';
import TelegramMiniApp from './components/TelegramMiniApp';
import SystemArchitecture from './components/SystemArchitecture';
import ChatFlowCanvas from './components/ChatFlowCanvas';
import BookingEmail from './components/BookingEmail';
import AccessibilityFeatures from './components/AccessibilityFeatures';
import LocationConcierge from './components/LocationConcierge';
import Process from './components/Process';
import Team from './components/Team';
import FutureAIFeatures from './components/FutureAIFeatures';
import BusinessImpact from './components/BusinessImpact';
import RoadmapMetrics from './components/RoadmapMetrics';
import Footer from './components/Footer';

export default function App() {
  return (
    <div className="min-h-screen bg-bg text-primary selection:bg-accent selection:text-bg">
      <Navbar />
      <main>
        <Hero />
        <Marquee />
        <TechStackBlueprint />
        <DualLoopShowcase />
        <MultiModalEngine />
        <SystemArchitecture />
        <ChatFlowCanvas />
        <TelegramMiniApp />
        <BookingEmail />
        <AccessibilityFeatures />
        <LocationConcierge />
        <Process />
        <Team />
        <FutureAIFeatures />
        <BusinessImpact />
        <RoadmapMetrics />
      </main>
      <Footer />
    </div>
  );
}
