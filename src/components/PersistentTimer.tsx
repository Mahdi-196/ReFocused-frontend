'use client';

import { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCw } from 'lucide-react';

export default function PersistentTimer() {
  // State for timer
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<"pomodoro" | "short" | "long">("pomodoro");
  const [timeLeft, setTimeLeft] = useState(0);
  
  // Timer settings
  const [pomodoroTime, setPomodoroTime] = useState(25);
  const [shortBreakTime, setShortBreakTime] = useState(5);
  const [longBreakTime, setLongBreakTime] = useState(15);
  const [longBreakInterval, setLongBreakInterval] = useState(3);
  const [rounds, setRounds] = useState(0);
  const [autoStartBreaks, setAutoStartBreaks] = useState(false);
  const [autoStartPomodoros, setAutoStartPomodoros] = useState(false);
  
  // UI state
  const [isMinimized, setIsMinimized] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // Initialize client-side rendering flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Start the timer
  const startTimer = useCallback((durationMinutes: number) => {
    const targetTime = Date.now() + durationMinutes * 60 * 1000;
    localStorage.setItem("pomodoroTargetTime", targetTime.toString());
    localStorage.setItem("pomodoroIsRunning", "true");
    setIsRunning(true);
  }, []);

  // Complete session helper
  const completeSession = useCallback((autoStart: boolean) => {
    if (mode === "pomodoro") {
      const newRounds = rounds + 1;
      const nextMode = newRounds % longBreakInterval === 0 ? "long" : "short";
      setMode(nextMode);
      setRounds(newRounds);
      localStorage.setItem("pomodoroRounds", newRounds.toString());
      localStorage.setItem("pomodoroMode", nextMode);
      
      if (autoStart && autoStartBreaks) {
        startTimer(nextMode === "short" ? shortBreakTime : longBreakTime);
      } else {
        setIsRunning(false);
        setTimeLeft(nextMode === "short" ? shortBreakTime * 60 : longBreakTime * 60);
        localStorage.removeItem("pomodoroTargetTime");
        localStorage.setItem("pomodoroIsRunning", "false");
      }
    } else {
      setMode("pomodoro");
      localStorage.setItem("pomodoroMode", "pomodoro");
      
      if (autoStart && autoStartPomodoros) {
        startTimer(pomodoroTime);
      } else {
        setIsRunning(false);
        setTimeLeft(pomodoroTime * 60);
        localStorage.removeItem("pomodoroTargetTime");
        localStorage.setItem("pomodoroIsRunning", "false");
      }
    }
  }, [mode, rounds, longBreakInterval, autoStartBreaks, autoStartPomodoros, pomodoroTime, shortBreakTime, longBreakTime, startTimer]);
  
  // Load state from localStorage on component mount
  useEffect(() => {
    if (!isClient) return;
    
    try {
      // Load saved preferences
      const savedPomodoroTime = localStorage.getItem("pomodoroTime");
      if (savedPomodoroTime) setPomodoroTime(parseInt(savedPomodoroTime, 10));
      
      const savedShortBreakTime = localStorage.getItem("shortBreakTime");
      if (savedShortBreakTime) setShortBreakTime(parseInt(savedShortBreakTime, 10));
      
      const savedLongBreakTime = localStorage.getItem("longBreakTime");
      if (savedLongBreakTime) setLongBreakTime(parseInt(savedLongBreakTime, 10));
      
      const savedLongBreakInterval = localStorage.getItem("longBreakInterval");
      if (savedLongBreakInterval) setLongBreakInterval(parseInt(savedLongBreakInterval, 10));
      
      const savedAutoStartBreaks = localStorage.getItem("autoStartBreaks");
      if (savedAutoStartBreaks) setAutoStartBreaks(savedAutoStartBreaks === "true");
      
      const savedAutoStartPomodoros = localStorage.getItem("autoStartPomodoros");
      if (savedAutoStartPomodoros) setAutoStartPomodoros(savedAutoStartPomodoros === "true");
      
      // Load timer state
      const storedMode = localStorage.getItem("pomodoroMode");
      if (storedMode) setMode(storedMode as "pomodoro" | "short" | "long");
      
      const storedRounds = localStorage.getItem("pomodoroRounds");
      if (storedRounds) setRounds(parseInt(storedRounds, 10));
      
      const storedIsRunning = localStorage.getItem("pomodoroIsRunning");
      const storedTargetTime = localStorage.getItem("pomodoroTargetTime");
      
      if (storedIsRunning === "true" && storedTargetTime) {
        const targetTime = parseInt(storedTargetTime, 10);
        const newTimeLeft = Math.max((targetTime - Date.now()) / 1000, 0);
        
        if (newTimeLeft > 0) {
          setTimeLeft(newTimeLeft);
          setIsRunning(true);
        } else {
          // Timer finished while away, handle session completion
          completeSession(false);
        }
      } else {
        // Timer is not running, set appropriate time
        if (mode === "pomodoro") setTimeLeft(pomodoroTime * 60);
        else if (mode === "short") setTimeLeft(shortBreakTime * 60);
        else setTimeLeft(longBreakTime * 60);
      }
    } catch (error) {
      console.error('Failed to load timer state:', error);
    }
  }, [isClient, completeSession, mode, pomodoroTime, shortBreakTime, longBreakTime]);
  
  // Update timer every 100ms when running
  useEffect(() => {
    if (!isRunning || !isClient) return;
    
    const interval = setInterval(() => {
      const storedTargetTime = localStorage.getItem("pomodoroTargetTime");
      if (storedTargetTime) {
        const targetTime = parseInt(storedTargetTime, 10);
        const newTimeLeft = Math.max((targetTime - Date.now()) / 1000, 0);
        
        if (newTimeLeft <= 0.1) {
          clearInterval(interval);
          completeSession(true);
        } else {
          setTimeLeft(newTimeLeft);
        }
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [isRunning, isClient]);

  // Listen for storage events from other tabs/windows
  useEffect(() => {
    if (!isClient) return;
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "pomodoroTargetTime") {
        const targetTime = e.newValue ? parseInt(e.newValue, 10) : null;
        if (targetTime) {
          const newTimeLeft = Math.max((targetTime - Date.now()) / 1000, 0);
          setTimeLeft(newTimeLeft);
          setIsRunning(true);
        }
      } else if (e.key === "pomodoroIsRunning") {
        setIsRunning(e.newValue === "true");
      } else if (e.key === "pomodoroMode") {
        setMode(e.newValue as "pomodoro" | "short" | "long");
      } else if (e.key === "pomodoroRounds") {
        setRounds(e.newValue ? parseInt(e.newValue, 10) : 0);
      }
    };
    
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [isClient]);

  // Pause the timer
  const pauseTimer = () => {
    localStorage.setItem("pomodoroTimeLeft", timeLeft.toString());
    localStorage.setItem("pomodoroIsRunning", "false");
    localStorage.removeItem("pomodoroTargetTime");
    setIsRunning(false);
  };

  // Reset the timer
  const resetTimer = () => {
    let newTime = 0;
    if (mode === "pomodoro") newTime = pomodoroTime * 60;
    else if (mode === "short") newTime = shortBreakTime * 60;
    else newTime = longBreakTime * 60;

    setTimeLeft(newTime);
    setIsRunning(false);
    localStorage.setItem("pomodoroTimeLeft", newTime.toString());
    localStorage.setItem("pomodoroIsRunning", "false");
    localStorage.removeItem("pomodoroTargetTime");
  };

  // Format time helper
  function formatTime(seconds: number) {
    const secs = Math.floor(seconds);
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  // Only render on client-side
  if (!isClient) return null;
  
  // Determine the background color based on mode
  const getBgColor = () => {
    switch (mode) {
      case "pomodoro":
        return "bg-blue-600";
      case "short":
        return "bg-green-600";
      case "long":
        return "bg-purple-600";
    }
  };

  return (
    <>
      {isRunning && (
        <div 
          className={`fixed bottom-4 right-4 ${isMinimized ? 'w-auto' : 'w-64'} rounded-lg shadow-lg z-40 transition-all duration-300 ${getBgColor()}`}
        >
          <div className="flex justify-between items-center p-2 text-white cursor-pointer" onClick={() => setIsMinimized(!isMinimized)}>
            <div className="flex items-center space-x-2">
              <span className="font-bold">{formatTime(timeLeft)}</span>
              <span className="text-xs">
                {mode === "pomodoro" ? "Focus" : mode === "short" ? "Short Break" : "Long Break"}
              </span>
            </div>
            <div>{isMinimized ? '▲' : '▼'}</div>
          </div>
          
          {!isMinimized && (
            <div className="p-3 bg-opacity-90 bg-gray-800 rounded-b-lg">
              <div className="flex justify-center space-x-3 mb-2">
                <button onClick={resetTimer} className="p-2 rounded-full hover:bg-gray-700 text-gray-300">
                  <RotateCw size={16} />
                </button>
                
                {isRunning ? (
                  <button onClick={pauseTimer} className="p-2 rounded-full hover:bg-gray-700 text-gray-300">
                    <Pause size={16} />
                  </button>
                ) : (
                  <button 
                    onClick={() => {
                      if (mode === "pomodoro") startTimer(pomodoroTime);
                      else if (mode === "short") startTimer(shortBreakTime);
                      else startTimer(longBreakTime);
                    }} 
                    className="p-2 rounded-full hover:bg-gray-700 text-gray-300"
                  >
                    <Play size={16} />
                  </button>
                )}
              </div>
              
              <div className="flex justify-between text-xs text-gray-300">
                <button 
                  className={`px-2 py-1 rounded-sm ${mode === 'pomodoro' ? 'bg-blue-700 text-white' : ''}`}
                  onClick={() => {
                    setMode("pomodoro");
                    setTimeLeft(pomodoroTime * 60);
                    setIsRunning(false);
                    localStorage.setItem("pomodoroMode", "pomodoro");
                    localStorage.setItem("pomodoroTimeLeft", (pomodoroTime * 60).toString());
                    localStorage.removeItem("pomodoroTargetTime");
                    localStorage.setItem("pomodoroIsRunning", "false");
                  }}
                >
                  Focus
                </button>
                <button 
                  className={`px-2 py-1 rounded-sm ${mode === 'short' ? 'bg-green-700 text-white' : ''}`}
                  onClick={() => {
                    setMode("short");
                    setTimeLeft(shortBreakTime * 60);
                    setIsRunning(false);
                    localStorage.setItem("pomodoroMode", "short");
                    localStorage.setItem("pomodoroTimeLeft", (shortBreakTime * 60).toString());
                    localStorage.removeItem("pomodoroTargetTime");
                    localStorage.setItem("pomodoroIsRunning", "false");
                  }}
                >
                  Short Break
                </button>
                <button 
                  className={`px-2 py-1 rounded-sm ${mode === 'long' ? 'bg-purple-700 text-white' : ''}`}
                  onClick={() => {
                    setMode("long");
                    setTimeLeft(longBreakTime * 60);
                    setIsRunning(false);
                    localStorage.setItem("pomodoroMode", "long");
                    localStorage.setItem("pomodoroTimeLeft", (longBreakTime * 60).toString());
                    localStorage.removeItem("pomodoroTargetTime");
                    localStorage.setItem("pomodoroIsRunning", "false");
                  }}
                >
                  Long Break
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
} 