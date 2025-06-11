'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { FiZap, FiTarget, FiClock, FiCalendar, FiBook, FiHeart, FiBarChart2, FiAward } from 'react-icons/fi';
import { FaBrain } from 'react-icons/fa';
import Footer from '@/components/footer';

// Keyframes for floating animations
const floatKeyframes = `
  @keyframes float {
    0% { transform: translateY(0) translateX(0) rotate(0); }
    33% { transform: translateY(-10px) translateX(5px) rotate(1deg); }
    66% { transform: translateY(5px) translateX(-5px) rotate(-1deg); }
    100% { transform: translateY(0) translateX(0) rotate(0); }
  }
  @keyframes float-delayed {
    0% { transform: translateY(0) translateX(0) rotate(0); }
    33% { transform: translateY(8px) translateX(-7px) rotate(-1deg); }
    66% { transform: translateY(-5px) translateX(3px) rotate(1deg); }
    100% { transform: translateY(0) translateX(0) rotate(0); }
  }
`;

// Type for orb configuration
type Orb = {
  top: string;
  left: string;
  width: string;
  height: string;
  duration: number;
  delay: number;
};

export default function LandingPageClient() {
  const featuresRef = useRef(null);
  const featuresInView = useInView(featuresRef, { once: true, amount: 0.3 });
  const { scrollYProgress } = useScroll();
  const scrollOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0]);
  
  // State for orbs
  const [orbs, setOrbs] = useState<Orb[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  
  // Ensure client-side only execution
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Generate orbs after component mounts
  useEffect(() => {
    if (!isMounted) return;
    
    const generatedOrbs = Array.from({ length: 15 }).map(() => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      width: `${Math.random() * 100 + 20}px`,
      height: `${Math.random() * 100 + 20}px`,
      duration: Math.random() * 10 + 10,
      delay: Math.random() * 5,
    }));
    
    setOrbs(generatedOrbs);
  }, [isMounted]);

  // Add animation styles to head
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      ${floatKeyframes}
      .animate-float {
        animation: float 12s ease-in-out infinite;
      }
      .animate-float-delayed {
        animation: float-delayed 15s ease-in-out infinite;
      }
      .animate-glow-pulse {
        animation: pulse 4s ease-in-out infinite;
      }
      .animate-glow-pulse-delayed {
        animation: pulse 6s ease-in-out infinite;
      }
      @keyframes pulse {
        0%, 100% { opacity: 0.7; }
        50% { opacity: 0.9; }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center py-20 px-4 bg-[#10182B] overflow-hidden">
        {/* Radial gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#10182B] via-[#10182B] to-[#0c1324]"></div>
        
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            {orbs.map((orb, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-blue-400"
                style={{
                  top: orb.top,
                  left: orb.left,
                  width: orb.width,
                  height: orb.height,
                }}
                initial={{ opacity: 0.1, scale: 0 }}
                animate={{ 
                  opacity: [0.1, 0.3, 0.1],
                  scale: [0, 1, 0],
                  y: [0, -30, 0]
                }}
                transition={{
                  duration: orb.duration,
                  repeat: Infinity,
                  delay: orb.delay,
                }}
              />
            ))}
          </div>
        </div>

        <div className="container mx-auto text-center relative z-10 py-8 px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-6"
          >
            <div className="inline-block px-6 py-2 rounded-full bg-[#10182B]/50 backdrop-blur-sm border border-blue-500/20 text-blue-400 mb-6">
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 1 }}
                className="flex items-center justify-center"
              >
                <FiZap className="inline mr-2" />
                Powered by Focus & Productivity
              </motion.span>
            </div>
          </motion.div>
          
          <motion.h1 
            className="text-5xl md:text-7xl font-bold mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            suppressHydrationWarning={true}
          >
            <span className="bg-gradient-to-r from-[#42b9e5] to-[#4f83ed] bg-clip-text text-transparent">ReFocused</span>
          </motion.h1>
          
          <motion.h2
            className="text-4xl md:text-6xl font-bold mb-10 text-white"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            suppressHydrationWarning={true}
          >
            <span className="text-white">Transform Your</span><br />
            <span className="bg-gradient-to-r from-[#42b9e5] to-[#4f83ed] bg-clip-text text-transparent">Productivity</span>
          </motion.h2>
          
          <motion.p
            className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            Experience the future of personal development with ReFocused's
            revolutionary platform designed to help you build better habits, maintain
            focus, and unlock your full potential through proven productivity methods.
          </motion.p>
          
          {/* Features highlights */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <div className="p-4 flex items-start">
              <div className="bg-gradient-to-br from-[#42b9e5]/20 to-[#4f83ed]/20 p-3 rounded-lg mr-4">
                <FaBrain className="w-6 h-6 text-[#42b9e5]" />
              </div>
              <div className="text-left">
                <h3 className="text-white font-semibold mb-1">Smart Productivity</h3>
                <p className="text-slate-300 text-sm">Personalized recommendations based on your unique patterns</p>
              </div>
            </div>
            
            <div className="p-4 flex items-start">
              <div className="bg-gradient-to-br from-[#42b9e5]/20 to-[#4f83ed]/20 p-3 rounded-lg mr-4 shadow-[0_0_10px_rgba(66,185,229,0.2)]">
                <FiAward className="w-6 h-6 text-[#42b9e5]" />
              </div>
              <div className="text-left">
                <h3 className="text-white font-semibold mb-1">Achievement System</h3>
                <p className="text-slate-300 text-sm">Gamified progress tracking with meaningful rewards</p>
              </div>
            </div>
          </motion.div>
          
          {/* CTA buttons */}
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Link 
              href="/app"
              className="px-8 py-4 bg-gradient-to-r from-[#42b9e5] to-[#4f83ed] text-white font-semibold rounded-xl shadow-lg hover:shadow-[0_0_30px_rgba(66,185,229,0.4)] transition-all duration-300 transform hover:scale-105"
            >
              Start Your Journey
            </Link>
            <Link 
              href="#features"
              className="px-8 py-4 border-2 border-[#42b9e5] text-[#42b9e5] font-semibold rounded-xl hover:bg-[#42b9e5] hover:text-white transition-all duration-300"
            >
              Learn More
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Rest of the component content would go here */}
      <Footer />
    </div>
  );
} 