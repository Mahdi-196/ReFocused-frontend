"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { FiZap, FiTarget, FiClock, FiBook, FiHeart, FiBarChart2, FiUsers, FiTrendingUp, FiCheckCircle } from '@/components/icons';
import { FaBrain, FaRobot } from 'react-icons/fa';
import AuthModal from '@/components/AuthModal';
import { getStudySets } from '@/services/studyService';
import { authService } from '@/api/services/authService';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentDate, useTime } from '@/contexts/TimeContext';

// Type for orb configuration
type Orb = {
  top: string;
  left: string;
  width: string;
  height: string;
  duration: number;
  delay: number;
};

// Type for task management
type Task = {
  id: string;
  text: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
};

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const currentDate = useCurrentDate();
  const { getCurrentDateTime } = useTime();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completedTasksCount, setCompletedTasksCount] = useState(0);

  // State for orbs
  const [orbs, setOrbs] = useState<Orb[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  // Cache testing state
  const [cacheTestResult, setCacheTestResult] = useState<string>('');
  const [isTestingCache, setIsTestingCache] = useState(false);
  
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

  // Cache testing functions
  const testStudySetsCache = async () => {
    setIsTestingCache(true);
    setCacheTestResult('');
    
    try {
      console.log('🧪 [CACHE TEST] Testing study sets caching...');
      
      // First call - should fetch from API
      const start1 = Date.now();
      const sets1 = await getStudySets();
      const time1 = Date.now() - start1;
      console.log('🧪 [CACHE TEST] First call took:', time1 + 'ms');
      
      // Second call - should use cache
      const start2 = Date.now();
      await getStudySets(); // Cache warmup
      const time2 = Date.now() - start2;
      console.log('🧪 [CACHE TEST] Second call took:', time2 + 'ms');
      
      setCacheTestResult(`✅ Cache test completed!
First call: ${time1}ms (API)
Second call: ${time2}ms (Cache)
Study sets found: ${sets1.length}
${time2 < time1 / 2 ? 'Cache is working! 🎉' : 'Cache may not be working properly 🤔'}`);
      
    } catch (error) {
      console.error('🧪 [CACHE TEST] Error:', error);
      setCacheTestResult(`❌ Cache test failed: ${error}`);
    } finally {
      setIsTestingCache(false);
    }
  };

  const testAuthCache = async () => {
    setIsTestingCache(true);
    setCacheTestResult('');
    
    try {
      console.log('🧪 [CACHE TEST] Testing auth caching...');
      
      // Test cached user data
      const cachedUser = authService.getCachedUser();
      console.log('🧪 [CACHE TEST] Cached user:', cachedUser);
      
      setCacheTestResult(`👤 Auth cache test:
Cached user: ${cachedUser ? JSON.stringify(cachedUser, null, 2) : 'No cached user found'}
Is authenticated: ${authService.isAuthenticated()}`);
      
    } catch (error) {
      console.error('🧪 [CACHE TEST] Auth error:', error);
      setCacheTestResult(`❌ Auth cache test failed: ${error}`);
    } finally {
      setIsTestingCache(false);
    }
  };

  const setupTestAuth = () => {
    // Set up a test authentication for cache testing
    localStorage.setItem('REF_TOKEN', 'test-token-for-cache-testing');
    localStorage.setItem('REF_USER', JSON.stringify({
      id: 1,
      email: 'test@refocused.app',
      name: 'Cache Test User',
      username: 'cachetest',
      createdAt: new Date().toISOString()
    }));
    
    setCacheTestResult('🧪 Test authentication set up! You can now test the study sets cache.');
  };

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
        {/* Radial gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#10182B] via-[#10182B] to-[#0c1324]"></div>
        
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            {orbs.map((orb, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-blue-400"
                style={{
                  top: orb.top,
                  left: orb.left,
                  width: orb.width,
                  height: orb.height,
                  opacity: 0.2,
                }}
              />
            ))}
          </div>
        </div>

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

          {/* Cache Testing Section */}
          <div className="bg-gradient-to-br from-gray-800/20 to-gray-900/20 backdrop-blur-sm border border-gray-600/30 rounded-xl p-6 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              🧪 Cache System Testing
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
              Open browser console to see detailed cache logs with emojis (👤 for auth, 📚 for study sets)
            </p>
          </div>
        </div>
      </section>

      {/* ReFocused Features Section */}
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

      {/* ReFocused AI Section */}
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

      {/* Final CTA Section */}
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
              Join ReFocused✨
            </button>
          </div>
        </div>
      </section>
      
      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultTab="register"
      />
    </div>
  );
}
