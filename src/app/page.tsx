"use client";

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { FiZap, FiTarget, FiClock, FiBook, FiHeart, FiBarChart2, FiUsers, FiTrendingUp, FiCheckCircle } from '@/components/icons';
import { FaBrain, FaRobot, FaMouse } from 'react-icons/fa';
import { HiSparkles } from 'react-icons/hi2';
// Lazy load non-critical components
const AuthModal = dynamic(() => import('@/components/AuthModal'), { ssr: false });

// Lazy load page sections
const FeaturesSection = dynamic(() => Promise.resolve(({ children }: { children: React.ReactNode }) => <>{children}</>), { ssr: false });
const AISection = dynamic(() => Promise.resolve(({ children }: { children: React.ReactNode }) => <>{children}</>), { ssr: false });
const CTASection = dynamic(() => Promise.resolve(({ children }: { children: React.ReactNode }) => <>{children}</>), { ssr: false });
import { useTime } from '@/contexts/TimeContext';
import ProductivityScore from './homeComponents/ProductivityScore';
import WordOfTheDay from './homeComponents/WordOfTheDay';
import MindFuel from './homeComponents/MindFuel';


// Type for task management
type Task = {
  id: string;
  text: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
};

export default function HomePage() {
  
  const { getCurrentDateTime } = useTime();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completedTasksCount, setCompletedTasksCount] = useState(0);

  const [isMounted, setIsMounted] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  // Mouse scroll animation state
  const [showMouseScroll, setShowMouseScroll] = useState(true);
  
  
  // Cache testing state
  
  
  // Ensure client-side only execution
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle scroll to hide/show mouse scroll animation
  useEffect(() => {
    if (!isMounted) return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      // Hide mouse scroll animation when user starts scrolling
      setShowMouseScroll(scrollY < 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMounted]);

  

  // Removed dev-only testing functions and state

  const addTask = (text: string, priority: 'high' | 'medium' | 'low' = 'medium') => {
    const newTask: Task = {
      id: Date.now().toString(),
      text,
      completed: false,
      priority,
      createdAt: getCurrentDateTime() // Use time service for consistent timestamps
    };
    
    setTasks(prev => [...prev, newTask]);
  };

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section id="top" className="relative min-h-[85vh] flex items-center justify-center py-16 px-4 bg-[#10182B] overflow-hidden">
        {/* Base gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#10182B] via-[#10182B] to-[#0c1324]"></div>
        
        {/* Optimized floating dots background - reduced from 15 to 8 for better performance */}
        <div className="absolute inset-0 overflow-hidden opacity-60">
          <div className="absolute w-3 h-3 bg-[#42b9e5]/60 rounded-full float-1" style={{ top: '20%', left: '15%' }}></div>
          <div className="absolute w-2 h-2 bg-[#4f83ed]/70 rounded-full float-2" style={{ top: '35%', left: '80%' }}></div>
          <div className="absolute w-2.5 h-2.5 bg-[#4f83ed]/65 rounded-full float-4" style={{ top: '75%', left: '70%' }}></div>
          <div className="absolute w-2 h-2 bg-[#4f83ed]/70 rounded-full float-3" style={{ top: '18%', left: '75%' }}></div>
          <div className="absolute w-5 h-5 bg-[#42b9e5]/45 rounded-full float-2" style={{ top: '80%', left: '40%' }}></div>
          <div className="absolute w-2.5 h-2.5 bg-[#42b9e5]/65 rounded-full float-1" style={{ top: '12%', left: '35%' }}></div>
          <div className="absolute w-2 h-2 bg-[#42b9e5]/70 rounded-full float-3" style={{ top: '25%', left: '65%' }}></div>
          <div className="absolute w-1.5 h-1.5 bg-[#42b9e5]/75 rounded-full float-5" style={{ top: '40%', left: '10%' }}></div>
        </div>

        {/* Global CSS for animations */}
        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes moveFloat1 {
              0%, 100% { transform: translate(0px, 0px) scale(1); }
              25% { transform: translate(15px, -10px) scale(1.05); }
              50% { transform: translate(-8px, -18px) scale(0.95); }
              75% { transform: translate(-12px, 5px) scale(1.02); }
            }
            @keyframes moveFloat2 {
              0%, 100% { transform: translate(0px, 0px) scale(1); }
              33% { transform: translate(-12px, 15px) scale(0.98); }
              66% { transform: translate(18px, -8px) scale(1.03); }
            }
            @keyframes moveFloat3 {
              0%, 100% { transform: translate(0px, 0px) scale(1); }
              20% { transform: translate(10px, -12px) scale(1.02); }
              40% { transform: translate(-14px, -8px) scale(0.97); }
              60% { transform: translate(-6px, 16px) scale(1.04); }
              80% { transform: translate(8px, 6px) scale(0.99); }
            }
            @keyframes moveFloat4 {
              0%, 100% { transform: translate(0px, 0px) scale(1); }
              50% { transform: translate(-10px, -15px) scale(1.06); }
            }
            @keyframes moveFloat5 {
              0%, 100% { transform: translate(0px, 0px) scale(1); }
              30% { transform: translate(12px, -6px) scale(0.96); }
              70% { transform: translate(-8px, 10px) scale(1.03); }
            }
            .float-1 { animation: moveFloat1 12s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite !important; }
            .float-2 { animation: moveFloat2 16s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite !important; }
            .float-3 { animation: moveFloat3 20s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite !important; }
            .float-4 { animation: moveFloat4 14s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite !important; }
            .float-5 { animation: moveFloat5 18s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite !important; }
          `
        }} />

        <div className="container mx-auto text-center relative z-10 py-8 px-4">
          <div className="mb-6">
            <div className="inline-block px-6 py-2 rounded-full bg-[#10182B]/50 backdrop-blur-sm border border-blue-500/20 text-blue-400 mb-6">
              <span className="flex items-center justify-center">
                <FiZap className="inline mr-2 w-5 h-5" />
                Powered by Focus & Productivity
              </span>
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-[#42b9e5] to-[#4f83ed] bg-clip-text text-transparent">ReFocused</span>
          </h1>
          
          <h2 className="text-3xl md:text-5xl font-bold mb-8 text-white">
            <span className="text-white">Transform Your</span><br />
            <span className="bg-gradient-to-r from-[#42b9e5] to-[#4f83ed] bg-clip-text text-transparent">Productivity</span>
          </h2>
          
          <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed">
            Experience the future of personal development with ReFocused's revolutionary platform designed to help you build better habits, maintain focus, and unlock your full potential through proven productivity methods.
          </p>
          
          {/* Features highlights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto mb-10">
            <div className="p-4 flex items-start">
              <div className="bg-gradient-to-br from-[#42b9e5]/20 to-[#4f83ed]/20 p-3 rounded-lg mr-4 shadow-[0_0_10px_rgba(66,185,229,0.2)]">
                <FaBrain className="w-6 h-6 text-[#42b9e5]" />
              </div>
              <div className="text-left">
                <h3 className="text-white font-semibold mb-1">Smart Productivity</h3>
                <p className="text-slate-300 text-sm">Personalized recommendations based on your unique patterns</p>
              </div>
            </div>
            
            <div className="p-4 flex items-start">
              <div className="bg-gradient-to-br from-[#42b9e5]/20 to-[#4f83ed]/20 p-3 rounded-lg mr-4 shadow-[0_0_10px_rgba(66,185,229,0.2)]">
                <FiCheckCircle className="w-6 h-6 text-[#42b9e5]" />
              </div>
              <div className="text-left">
                <h3 className="text-white font-semibold mb-1">Research-Backed</h3>
                <p className="text-slate-300 text-sm">Methods proven by productivity and focus research</p>
              </div>
            </div>
          </div>
          
          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-20 mb-8">
            <button 
              onClick={() => setIsAuthModalOpen(true)}
              className="px-8 py-3 bg-gradient-to-r from-[#42b9e5] to-[#4f83ed] text-white font-semibold rounded-xl shadow-lg hover:shadow-[0_0_30px_rgba(66,185,229,0.4)] transition-all duration-300 transform hover:scale-105 min-h-[52px] flex items-center justify-center"
            >
              Start with ReFocused
            </button>
            <Link 
              href="#features"
              className="px-8 py-3 border-2 border-[#42b9e5] text-[#42b9e5] font-semibold rounded-xl hover:bg-[#42b9e5] hover:text-white transition-all duration-300 min-h-[52px] flex items-center justify-center"
            >
              Learn More
            </Link>
          </div>

          {/* Mouse Scroll Animation */}
          <div className={`flex flex-col items-center mt-20 transition-opacity duration-700 ease-out ${
            showMouseScroll && isMounted ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}>
            <p className="text-slate-400 text-sm mb-4 animate-pulse">Scroll down to explore</p>
            <div className="animate-bounce">
              <FaMouse className="w-8 h-8 text-[#42b9e5] opacity-70" />
            </div>
          </div>

          {/* Cache Testing Section - Development Only */}
          {/* {process.env.NEXT_PUBLIC_APP_ENV === 'development' && (
            <div className="bg-gradient-to-br from-gray-800/20 to-gray-900/20 backdrop-blur-sm border border-gray-600/30 rounded-xl p-6 max-w-2xl mx-auto">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <HiBeaker className="w-5 h-5 mr-2 text-purple-400" />
                Cache System Testing
                <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded ml-2">DEVELOPMENT</span>
              </h3>
              
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <button 
                  onClick={setupTestAuth}
                  className="px-4 py-2 bg-blue-600/20 border border-blue-500/30 text-blue-300 rounded-lg hover:bg-blue-600/30 transition-all duration-200 text-sm"
                >
                  Setup Test Auth
                </button>
                <button 
                  onClick={testAuthCache}
                  disabled={isTestingCache}
                  className="px-4 py-2 bg-purple-600/20 border border-purple-500/30 text-purple-300 rounded-lg hover:bg-purple-600/30 transition-all duration-200 text-sm disabled:opacity-50"
                >
                  Test Auth Cache
                </button>
                <button 
                  onClick={testStudySetsCache}
                  disabled={isTestingCache}
                  className="px-4 py-2 bg-green-600/20 border border-green-500/30 text-green-300 rounded-lg hover:bg-green-600/30 transition-all duration-200 text-sm disabled:opacity-50"
                >
                  Test Study Sets Cache
                </button>
              </div>
              
              {isTestingCache && (
                <div className="text-blue-300 text-sm mb-4 flex items-center">
                  <div className="w-4 h-4 border-2 border-blue-300 border-t-transparent rounded-full animate-spin mr-2"></div>
                  Testing cache...
                </div>
              )}
              
              {cacheTestResult && (
                <div className="bg-gray-900/50 border border-gray-600/30 rounded-lg p-4">
                  <pre className="text-xs text-gray-300 whitespace-pre-wrap overflow-x-auto">
                    {cacheTestResult}
                  </pre>
                </div>
              )}
              
              <p className="text-xs text-gray-400 mt-2">
                Open browser console to see detailed cache logs (<HiUser className="inline w-3 h-3 mx-1" /> for auth, <HiAcademicCap className="inline w-3 h-3 mx-1" /> for study sets)
              </p>
            </div>
          )} */}
        </div>
      </section>

      {/* ReFocused Features Section */}
      <FeaturesSection>
      <section id="features" className="py-12 px-4 bg-gradient-to-b from-[#0c1324] to-[#10182B]">
        <div className="container mx-auto">
          <div className="text-center mb-10">
            <div className="inline-block px-4 py-1.5 rounded-full bg-gradient-to-r from-[#42b9e5]/20 to-[#4f83ed]/20 text-[#42b9e5] mb-4 text-sm">
              <FiZap className="inline mr-1 w-4 h-4" />
              ReFocused Features
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Everything You Need to <span className="bg-gradient-to-r from-[#42b9e5] to-[#4f83ed] bg-clip-text text-transparent">Succeed</span>
            </h2>
            <p className="text-base text-slate-300 max-w-xl mx-auto">
              Experience simple yet effective tools designed to help you succeed with an easy-to-use interface and intuitive navigation that keeps you focused on what matters.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Daily Momentum */}
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-600/30 rounded-xl p-5 hover:border-blue-500/30 transition-all duration-300">
              <div className="bg-gradient-to-br from-[#42b9e5]/20 to-[#4f83ed]/20 p-3 rounded-lg w-fit mb-4">
                <FiTarget className="w-5 h-5 text-[#42b9e5]" />
              </div>
              <h3 className="text-lg font-bold text-white mb-3">Daily Momentum</h3>
              <p className="text-slate-300 leading-relaxed text-sm">
                Set and track goals with our gamified system featuring daily, weekly, and monthly scoring based on your effort and difficulty level. Progress at your own pace and celebrate every achievement.
              </p>
            </div>

            {/* Premium Focus Sessions */}
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-600/30 rounded-xl p-5 hover:border-blue-500/30 transition-all duration-300">
              <div className="bg-gradient-to-br from-[#42b9e5]/20 to-[#4f83ed]/20 p-3 rounded-lg w-fit mb-4">
                <FiClock className="w-5 h-5 text-[#42b9e5]" />
              </div>
              <h3 className="text-lg font-bold text-white mb-3">Premium Focus Sessions</h3>
              <p className="text-slate-300 leading-relaxed text-sm">
                Studying made simple with customizable Pomodoro timers, flashcards, progress tracking, easy note-taking, and intuitive to-do lists all in one seamless experience.
              </p>
            </div>

            {/* Intelligent Habit Building */}
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-600/30 rounded-xl p-5 hover:border-blue-500/30 transition-all duration-300">
              <div className="bg-gradient-to-br from-[#42b9e5]/20 to-[#4f83ed]/20 p-3 rounded-lg w-fit mb-4">
                <FaBrain className="w-5 h-5 text-[#42b9e5]" />
              </div>
              <h3 className="text-lg font-bold text-white mb-3">Intelligent Habit Building</h3>
              <p className="text-slate-300 leading-relaxed text-sm">
                Habit tracking reimagined for simplicity and effectiveness. Our intuitive system helps you not only create new habits but maintain them long-term with minimal friction.
              </p>
            </div>

            {/* Guided Reflection */}
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-600/30 rounded-xl p-5 hover:border-blue-500/30 transition-all duration-300">
              <div className="bg-gradient-to-br from-[#42b9e5]/20 to-[#4f83ed]/20 p-3 rounded-lg w-fit mb-4">
                <FiBook className="w-5 h-5 text-[#42b9e5]" />
              </div>
              <h3 className="text-lg font-bold text-white mb-3">Guided Reflection</h3>
              <p className="text-slate-300 leading-relaxed text-sm">
                Journaling made simple yet profound with premade challenges, thoughtful prompts, and creative ideas that inspire deeper self-awareness and personal growth.
              </p>
            </div>

            {/* Mindful Restoration */}
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-600/30 rounded-xl p-5 hover:border-blue-500/30 transition-all duration-300">
              <div className="bg-gradient-to-br from-[#42b9e5]/20 to-[#4f83ed]/20 p-3 rounded-lg w-fit mb-4">
                <FiHeart className="w-5 h-5 text-[#42b9e5]" />
              </div>
              <h3 className="text-lg font-bold text-white mb-3">Mindful Restoration</h3>
              <p className="text-slate-300 leading-relaxed text-sm">
                Access a comprehensive collection of guided breathing exercises and meditation sessions designed to reduce stress, improve focus, and restore mental clarity.
              </p>
            </div>

            {/* Smart Recommendations */}
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-600/30 rounded-xl p-5 hover:border-blue-500/30 transition-all duration-300">
              <div className="bg-gradient-to-br from-[#42b9e5]/20 to-[#4f83ed]/20 p-3 rounded-lg w-fit mb-4">
                <FiBarChart2 className="w-5 h-5 text-[#42b9e5]" />
              </div>
              <h3 className="text-lg font-bold text-white mb-3">Smart Recommendations</h3>
              <p className="text-slate-300 leading-relaxed text-sm">
                Receive subtle, non-intrusive AI recommendations precisely when you need them, designed specifically to help you overcome obstacles and maintain momentum.
              </p>
            </div>
          </div>
        </div>
      </section>
      </FeaturesSection>

      {/* ReFocused AI Section */}
      <AISection>
      <section className="py-12 px-4 bg-[#10182B]">
        <div className="container mx-auto">
          <div className="text-center mb-10">
            <div className="inline-block px-4 py-1.5 rounded-full bg-gradient-to-r from-green-500/20 to-teal-500/20 text-green-400 mb-4 text-sm">
              <FaRobot className="inline mr-1 w-4 h-4" />
              ReFocused AI
            </div>
            <p className="text-base text-slate-300 max-w-3xl mx-auto leading-relaxed">
              ReFocused offers an intelligent AI companion specifically designed to accelerate your personal growth. Trained on hundreds of thousands of examples across self-help, academic studies, productivity methods, and development strategies, our AI delivers personalized guidance that generic assistants simply cannot match.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {/* Self-Help Focused */}
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-600/30 rounded-xl p-5 hover:border-green-500/30 transition-all duration-300">
              <div className="bg-gradient-to-br from-green-500/20 to-teal-500/20 p-3 rounded-lg w-fit mb-4">
                <FaBrain className="w-5 h-5 text-green-400" />
              </div>
              <h3 className="text-base font-bold text-white mb-3">Self-Help Focused</h3>
              <p className="text-slate-300 text-xs leading-relaxed">
                Trained specifically for personal development and productivity guidance
              </p>
            </div>

            {/* Conversational Guidance */}
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-600/30 rounded-xl p-5 hover:border-green-500/30 transition-all duration-300">
              <div className="bg-gradient-to-br from-green-500/20 to-teal-500/20 p-3 rounded-lg w-fit mb-4">
                <FiUsers className="w-5 h-5 text-green-400" />
              </div>
              <h3 className="text-base font-bold text-white mb-3">Conversational Guidance</h3>
              <p className="text-slate-300 text-xs leading-relaxed">
                Natural conversations that provide personalized advice and support
              </p>
            </div>

            {/* Goal-Oriented */}
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-600/30 rounded-xl p-5 hover:border-green-500/30 transition-all duration-300">
              <div className="bg-gradient-to-br from-green-500/20 to-teal-500/20 p-3 rounded-lg w-fit mb-4">
                <FiTarget className="w-5 h-5 text-green-400" />
              </div>
              <h3 className="text-base font-bold text-white mb-3">Goal-Oriented</h3>
              <p className="text-slate-300 text-xs leading-relaxed">
                Helps you set, track, and achieve your personal and professional goals
              </p>
            </div>

            {/* Growth Mindset */}
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-600/30 rounded-xl p-5 hover:border-green-500/30 transition-all duration-300">
              <div className="bg-gradient-to-br from-green-500/20 to-teal-500/20 p-3 rounded-lg w-fit mb-4">
                <FiTrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <h3 className="text-base font-bold text-white mb-3">Growth Mindset</h3>
              <p className="text-slate-300 text-xs leading-relaxed">
                Encourages continuous improvement and positive habit formation
              </p>
            </div>
          </div>


        </div>
      </section>
      </AISection>

      {/* Final CTA Section */}
      <CTASection>
      <section className="py-12 px-4 bg-gradient-to-b from-[#10182B] to-[#0c1324]">
        <div className="container mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Ready to Transform Your <span className="bg-gradient-to-r from-[#42b9e5] to-[#4f83ed] bg-clip-text text-transparent">Productivity</span>?
          </h2>
          <p className="text-base text-slate-300 max-w-xl mx-auto mb-8">
            Join thousands of users who have already improved their focus, productivity, and wellbeing with ReFocused.
          </p>
          
          <div className="flex justify-center">
            <button 
              onClick={() => {
                // Scroll to top smoothly
                window.scrollTo({ top: 0, behavior: 'smooth' });
                // Wait for scroll to complete, then trigger the modal
                setTimeout(() => {
                  setIsAuthModalOpen(true);
                }, 800);
              }}
              className="px-6 py-3 border-2 border-[#42b9e5] text-[#42b9e5] font-semibold rounded-xl hover:bg-[#42b9e5] hover:text-white transition-all duration-300 min-h-[48px] flex items-center justify-center text-sm"
            >
              <HiSparkles className="w-4 h-4 mr-2" />
              Join ReFocused
            </button>
          </div>
        </div>
      </section>
      </CTASection>
      
      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultTab="register"
      />

      {/* Debug panel temporarily moved to ProductivityScore component */}
    </div>
  );
}
