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

export default function LandingPage() {
  const featuresRef = useRef(null);
  const featuresInView = useInView(featuresRef, { once: true, amount: 0.3 });
  const { scrollYProgress } = useScroll();
  const scrollOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0]);
  
  // State for orbs that will be generated client-side only
  const [orbs, setOrbs] = useState<Orb[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  
  // Generate orbs only on the client side after component mounts
  useEffect(() => {
    setIsMounted(true);
    
    const generatedOrbs = Array.from({ length: 15 }).map(() => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      width: `${Math.random() * 100 + 20}px`,
      height: `${Math.random() * 100 + 20}px`,
      duration: Math.random() * 10 + 10,
      delay: Math.random() * 5,
    }));
    
    setOrbs(generatedOrbs);
  }, []);

  // Add animation styles to head
  useEffect(() => {
    if (typeof window !== 'undefined') {
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
    }
  }, []);

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center py-20 px-4 bg-[#10182B] overflow-hidden">
        {/* Radial gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#10182B] via-[#10182B] to-[#0c1324]"></div>
        
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            {isMounted && orbs.map((orb, i) => (
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
          >
            <span className="bg-gradient-to-r from-[#42b9e5] to-[#4f83ed] bg-clip-text text-transparent">ReFocused</span>
          </motion.h1>
          
          <motion.h2
            className="text-4xl md:text-6xl font-bold mb-10 text-white"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
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
                <h3 className="text-white font-semibold mb-1">Research-Backed</h3>
                <p className="text-slate-300 text-sm">Methods proven by productivity and focus research</p>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            className="flex flex-col sm:flex-row justify-center gap-4 mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Link href="/app" className="relative text-white bg-gradient-to-r from-[#2e7fd8] to-[#35bfc0] hover:from-[#2a75c8] hover:to-[#30b0b1] focus:ring-4 focus:ring-blue-300/50 font-medium rounded-lg text-lg px-12 py-4 flex items-center justify-center transition duration-300 ease-in-out border border-[#42b9e5]/30">
              <motion.span
                whileHover={{ x: 5 }}
                className="flex items-center"
              >
                Start with ReFocused
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                </svg>
              </motion.span>
            </Link>
            
            <Link href="#features" className="text-white bg-slate-700 hover:bg-slate-600 focus:ring-4 focus:ring-slate-300 font-medium rounded-lg text-lg px-8 py-4 flex items-center justify-center transition duration-300 ease-in-out">
              Learn More
            </Link>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
          style={{ opacity: scrollOpacity }}
        >
          <motion.div
            className="w-8 h-12 rounded-full border-2 border-blue-400 flex justify-center p-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
          >
            <motion.div
              className="w-1 h-3 bg-blue-400 rounded-full"
              animate={{ 
                y: [0, 10, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatType: "loop",
              }}
            />
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" ref={featuresRef} className="py-20 px-4 relative overflow-hidden">
        {/* Background gradients */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/30 via-slate-900 to-slate-800"></div>
        
        {/* Animated gradient orbs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <motion.div 
            className="absolute -left-[25%] top-[10%] w-[60%] h-[60%] rounded-full bg-gradient-radial from-blue-500/20 via-blue-600/5 to-transparent blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 50, 0],
              opacity: [0.2, 0.3, 0.2],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute -right-[25%] top-[40%] w-[70%] h-[70%] rounded-full bg-gradient-radial from-indigo-500/10 via-purple-600/5 to-transparent blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              x: [0, -30, 0],
              opacity: [0.2, 0.25, 0.2],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          />
          <motion.div 
            className="absolute left-[30%] -bottom-[30%] w-[80%] h-[80%] rounded-full bg-gradient-radial from-cyan-500/10 via-blue-600/5 to-transparent blur-3xl"
            animate={{
              scale: [1, 1.1, 1],
              y: [0, -20, 0],
              opacity: [0.15, 0.2, 0.15],
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 5 }}
          />
        </div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0" 
            style={{
              backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px)`,
              backgroundSize: `40px 40px`,
              backgroundPosition: `-19px -19px`,
            }}>
        </div>
        
        <div className="container mx-auto text-center mb-16 relative z-10">
          <motion.div
            initial={{ opacity: 0 }}
            animate={featuresInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-block px-6 py-2 rounded-full bg-blue-900/30 text-blue-400 mb-6"
          >
            <FiZap className="inline mr-2" /> ReFocused Features
          </motion.div>
          
          <motion.h2 
            className="text-4xl md:text-5xl font-bold mb-6 text-white"
            initial={{ opacity: 0, y: 20 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Everything You Need to <span className="text-blue-400">Succeed</span>
          </motion.h2>
          
          <motion.p
            className="text-lg text-slate-300 max-w-3xl mx-auto mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            Experience simple yet effective tools designed to help you succeed with an 
            easy-to-use interface and intuitive navigation that keeps you focused on what matters.
          </motion.p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {[
              {
                icon: <FiTarget className="w-12 h-12 text-blue-400" />,
                title: "Daily Momentum",
                description: "Set and track goals with our gamified system featuring daily, weekly, and monthly scoring based on your effort and difficulty level. Progress at your own pace and celebrate every achievement."
              },
              {
                icon: <FiClock className="w-12 h-12 text-blue-400" />,
                title: "Premium Focus Sessions",
                description: "Studying made simple with customizable Pomodoro timers, flashcards, progress tracking, easy note-taking, and intuitive to-do lists all in one seamless experience."
              },
              {
                icon: <FiCalendar className="w-12 h-12 text-blue-400" />,
                title: "Intelligent Habit Building",
                description: "Habit tracking reimagined for simplicity and effectiveness. Our intuitive system helps you not only create new habits but maintain them long-term with minimal friction."
              },
              {
                icon: <FiBook className="w-12 h-12 text-blue-400" />,
                title: "Guided Reflection",
                description: "Journaling made simple yet profound with premade challenges, thoughtful prompts, and creative ideas that inspire deeper self-awareness and personal growth."
              },
              {
                icon: <FiHeart className="w-12 h-12 text-blue-400" />,
                title: "Mindful Restoration",
                description: "Access a comprehensive collection of guided breathing exercises and meditation sessions designed to reduce stress, improve focus, and restore mental clarity."
              },
              {
                icon: <FiBarChart2 className="w-12 h-12 text-blue-400" />,
                title: "Smart Recommendations",
                description: "Receive subtle, non-intrusive AI recommendations precisely when you need them, designed specifically to help you overcome obstacles and maintain momentum."
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-8 flex flex-col items-center text-center hover:bg-slate-700/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-900/20 border border-slate-700"
                initial={{ opacity: 0, y: 20 }}
                animate={featuresInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <div className="mb-4 p-4 rounded-full bg-slate-700/50">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                <p className="text-slate-300">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Assistant Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-slate-900 to-blue-900/30 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0" 
              style={{
                backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px)`,
                backgroundSize: `40px 40px`,
                backgroundPosition: `-19px -19px`,
              }}>
          </div>
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
            <motion.div 
              className="absolute right-[10%] top-[20%] w-[40%] h-[40%] rounded-full bg-gradient-radial from-teal-500/10 via-teal-600/5 to-transparent blur-3xl"
              animate={{
                scale: [1, 1.1, 1],
                x: [0, -20, 0],
                opacity: [0.15, 0.2, 0.15],
              }}
              transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </div>

        <div className="container mx-auto text-center relative z-10">
                     {/* Removed the Meet Your AI Assistant label */}
          
                     <motion.h2 
             className="text-4xl md:text-5xl font-bold mb-6 text-white"
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.5, delay: 0.2 }}
             viewport={{ once: true }}
           >
             <span className="bg-gradient-to-r from-[#2dd4bf] to-[#14b8a6] bg-clip-text text-transparent">ReFocused AI</span>
           </motion.h2>
          
          <motion.p
            className="text-lg text-slate-300 max-w-3xl mx-auto mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true }}
          >
            ReFocused offers an intelligent AI companion specifically designed to accelerate your personal growth.
            Trained on hundreds of thousands of examples across self-help, academic studies, productivity methods, and development
            strategies, our AI delivers personalized guidance that generic assistants simply cannot match.
          </motion.p>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
            {[
              {
                icon: (
                  <svg className="w-8 h-8 text-teal-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 15C15.866 15 19 11.866 19 8C19 4.13401 15.866 1 12 1C8.13401 1 5 4.13401 5 8C5 11.866 8.13401 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 15V23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M15 19H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
                title: "Self-Help Focused",
                description: "Trained specifically for personal development and productivity guidance"
              },
              {
                icon: (
                  <svg className="w-8 h-8 text-teal-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
                title: "Conversational Guidance",
                description: "Natural conversations that provide personalized advice and support"
              },
              {
                icon: (
                  <svg className="w-8 h-8 text-teal-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18457 2.99721 7.13633 4.39828 5.49707C5.79935 3.85782 7.69279 2.71538 9.79619 2.24015C11.8996 1.76493 14.1003 1.98232 16.07 2.86" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
                title: "Goal-Oriented",
                description: "Helps you set, track, and achieve your personal and professional goals"
              },
              {
                icon: (
                  <svg className="w-8 h-8 text-teal-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M23 6L13.5 15.5L8.5 10.5L1 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M17 6H23V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
                title: "Growth Mindset",
                description: "Encourages continuous improvement and positive habit formation"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 flex flex-col items-center text-center hover:bg-slate-700/50 transition-all duration-300 hover:shadow-lg hover:shadow-teal-900/20 border border-slate-700"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
              >
                <div className="mb-4 p-4 rounded-full bg-slate-700/50">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                <p className="text-slate-300">{feature.description}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="max-w-4xl mx-auto bg-slate-800/50 backdrop-blur-sm rounded-xl p-8 border border-slate-700"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-teal-900/50 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-teal-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 17C14.7614 17 17 14.7614 17 12C17 9.23858 14.7614 7 12 7C9.23858 7 7 9.23858 7 12C7 14.7614 9.23858 17 12 17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 14C13.1046 14 14 13.1046 14 12C14 10.8954 13.1046 10 12 10C10.8954 10 10 10.8954 10 12C10 13.1046 10.8954 14 12 14Z" fill="currentColor"/>
                </svg>
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-white">Built for Your Success</h3>
            <p className="text-slate-300 leading-relaxed">
              Our AI doesn't just answer questions—it understands your journey, celebrates your 
              progress, and provides the encouragement and practical guidance you need to 
              overcome obstacles and achieve your goals. Every interaction is designed to move 
              you forward on your path to personal growth.
            </p>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-slate-800 to-slate-900">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Ready to Transform Your <span className="text-blue-400">Productivity</span>?
            </h2>
            
            <p className="text-lg text-slate-300 mb-10">
              Join thousands of users who have already improved their focus, productivity, and wellbeing with ReFocused.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Link href="/sign-in" className="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-lg px-8 py-4 flex items-center justify-center">
                  Sign In to ReFocused
                </Link>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Link href="/sign-up" className="text-white bg-teal-600 hover:bg-teal-700 focus:ring-4 focus:ring-teal-300 font-medium rounded-lg text-lg px-8 py-4 flex items-center justify-center">
                  <span className="flex items-center">
                    Join ReFocused
                    <span className="ml-2">✨</span>
                  </span>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
} 