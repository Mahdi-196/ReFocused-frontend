"use client";

import { useEffect, useState, useRef } from "react";
import {
  X,
  Play,
  Pause,
  RotateCw,
  ChevronsRight,
  UserRoundCog,
} from "lucide-react";
import { addFocusTime, incrementSessions } from "@/services/statisticsService";
import audioService from "@/services/audioService";
import { useAudioSettings } from "@/hooks/useSettings";



type TimerMode = "pomodoro" | "short" | "long";

const Pomodoro: React.FC = () => {
  // Audio settings
  const { audioSettings } = useAudioSettings();
  
  // === Timer Preferences ===
  const [pomodoroTime, setPomodoroTime] = useState<number>(25);
  const [shortBreakTime, setShortBreakTime] = useState<number>(5);
  const [longBreakTime, setLongBreakTime] = useState<number>(15);
  const [longBreakInterval, setLongBreakInterval] = useState<number>(3);

  const [autoStartBreaks, setAutoStartBreaks] = useState<boolean>(false);
  const [autoStartPomodoros, setAutoStartPomodoros] = useState<boolean>(false);
  const [notificationSound, setNotificationSound] = useState<string>('soft-bell');
  
  // === Temporary settings state (only applied when saved) ===
  const [tempPomodoroTime, setTempPomodoroTime] = useState<number>(25);
  const [tempShortBreakTime, setTempShortBreakTime] = useState<number>(5);
  const [tempLongBreakTime, setTempLongBreakTime] = useState<number>(15);
  const [tempLongBreakInterval, setTempLongBreakInterval] = useState<number>(3);
  const [tempAutoStartBreaks, setTempAutoStartBreaks] = useState<boolean>(false);
  const [tempAutoStartPomodoros, setTempAutoStartPomodoros] = useState<boolean>(false);
  const [tempNotificationSound, setTempNotificationSound] = useState<string>('soft-bell');

  // === Timer Logic ===
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [mode, setMode] = useState<TimerMode>("pomodoro");
  const [rounds, setRounds] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(pomodoroTime * 60);

  // === Additional State ===
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [isClient, setIsClient] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  
  // === Session Tracking State ===
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [lastSessionEndTime, setLastSessionEndTime] = useState<number>(0);
  const [sessionMinimumDuration, setSessionMinimumDuration] = useState<number>(0.8); // 80% of session duration
  const [sessionsThisHour, setSessionsThisHour] = useState<number>(0);
  const [hourlySessionLimit, setHourlySessionLimit] = useState<number>(12); // Max 12 sessions per hour
  const [isInCooldown, setIsInCooldown] = useState<boolean>(false);

  // === SESSION VALIDATION HELPERS ===
  const isValidSession = (): boolean => {
    if (!sessionStartTime) return false;
    
    const sessionDuration = Date.now() - sessionStartTime;
    const expectedDuration = (mode === "pomodoro" ? pomodoroTime : 
                             mode === "short" ? shortBreakTime : longBreakTime) * 60 * 1000;
    const requiredDuration = expectedDuration * sessionMinimumDuration;
    
    // Check if session ran for minimum required duration
    const isLongEnough = sessionDuration >= requiredDuration;
    
    // Check cooldown period (3 seconds between valid sessions)
    const timeSinceLastSession = Date.now() - lastSessionEndTime;
    const hasCooldownPassed = timeSinceLastSession >= 3000;
    
    // Check hourly rate limiting (only for pomodoro sessions)
    const isWithinHourlyLimit = mode !== "pomodoro" || sessionsThisHour < hourlySessionLimit;
    
    // === DEVELOPMENT ONLY - Log validation details for debugging ===
    if (process.env.NEXT_PUBLIC_APP_ENV === 'development') {
      if (!isLongEnough) {
        console.log('⚠️ [VALIDATION] Session too short:', { sessionDuration, requiredDuration });
      }
      if (!hasCooldownPassed) {
        console.log('⚠️ [VALIDATION] Cooldown not passed:', { timeSinceLastSession });
      }
      if (!isWithinHourlyLimit) {
        console.log('⚠️ [VALIDATION] Hourly limit exceeded:', { sessionsThisHour, hourlySessionLimit });
      }
    }
    
    return isLongEnough && hasCooldownPassed && isWithinHourlyLimit;
  };

  // Reset hourly session counter every hour
  useEffect(() => {
    const resetHourlyCounter = () => {
      setSessionsThisHour(0);
      // === DEVELOPMENT ONLY - Debug logging ===
      if (process.env.NEXT_PUBLIC_APP_ENV === 'development') {
        console.log('🔄 [RATE_LIMIT] Hourly session counter reset');
      }
    };

    // Reset at the start of each hour
    const now = new Date();
    const nextHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0, 0, 0);
    const timeUntilNextHour = nextHour.getTime() - now.getTime();
    
    const timeout = setTimeout(() => {
      resetHourlyCounter();
      // Set up interval for subsequent hours
      const interval = setInterval(resetHourlyCounter, 60 * 60 * 1000);
      return () => clearInterval(interval);
    }, timeUntilNextHour);

    return () => clearTimeout(timeout);
  }, []);

  // === SESSION COMPLETION GUARD ===
  const sessionCompletionInProgress = useRef<boolean>(false);
  
  // === NATURAL SESSION COMPLETION - When timer reaches 0 ===
  const completeNaturalSession = async (autoStart: boolean): Promise<void> => {
    // Prevent duplicate calls
    if (sessionCompletionInProgress.current) {
      // === DEVELOPMENT ONLY - Debug logging ===
      if (process.env.NEXT_PUBLIC_APP_ENV === 'development') {
        console.log('⚠️ [TIMER] Session completion already in progress, ignoring duplicate call');
      }
      return;
    }
    
    sessionCompletionInProgress.current = true;
    // === DEVELOPMENT ONLY - Debug logging ===
    if (process.env.NEXT_PUBLIC_APP_ENV === 'development') {
      console.log('🎯 [TIMER] Natural session completion detected');
    }
    
    try {
      // Play notification sound for natural completion
      audioService.playNotificationSound(notificationSound).catch(error => {
        console.error('Failed to play notification sound:', error);
      });

      if (mode === "pomodoro" && isValidSession()) {
        // Track completed focus session only for valid natural completions
        const completedTime = pomodoroTime;
        try {
          // === DEVELOPMENT ONLY - Debug logging ===
          if (process.env.NEXT_PUBLIC_APP_ENV === 'development') {
            console.log('✅ [POMODORO] Valid session completed! Focus time:', completedTime, 'minutes');
          }
          
          // Record the focus time and increment sessions
          await addFocusTime(completedTime);
          await incrementSessions();
          
          // Update last session end time and increment hourly counter
          setLastSessionEndTime(Date.now());
          setSessionsThisHour(prev => prev + 1);
          
          // Start cooldown period
          setIsInCooldown(true);
          setTimeout(() => {
            setIsInCooldown(false);
            // === DEVELOPMENT ONLY - Debug logging ===
            if (process.env.NEXT_PUBLIC_APP_ENV === 'development') {
              console.log('✅ [COOLDOWN] Cooldown period ended');
            }
          }, 3000); // 3 second cooldown
          
          // === DEVELOPMENT ONLY - Debug logging ===
          if (process.env.NEXT_PUBLIC_APP_ENV === 'development') {
            console.log('📊 [STATISTICS] Updated successfully');
          }
        } catch (error) {
          console.error('❌ [ERROR] Failed to record session statistics:', error);
        }
      } else if (mode === "pomodoro") {
        // === DEVELOPMENT ONLY - Debug logging ===
        if (process.env.NEXT_PUBLIC_APP_ENV === 'development') {
          console.log('⚠️ [POMODORO] Session invalid - not counted in statistics');
        }
      }

      // Clear session tracking
      setSessionStartTime(null);

      // Handle mode transitions
      if (mode === "pomodoro") {
        setRounds((prev: number) => {
          const newRounds = prev + 1;
          const nextMode: TimerMode = newRounds % longBreakInterval === 0 ? "long" : "short";
          setMode(nextMode);
          setIsRunning(autoStart ? autoStartBreaks : false);
          return newRounds;
        });
      } else {
        setMode("pomodoro");
        setIsRunning(autoStart ? autoStartPomodoros : false);
      }
    } finally {
      // Always reset the guard after completion
      sessionCompletionInProgress.current = false;
    }
  };

  // === MANUAL SESSION COMPLETION - When manually skipped/reset ===
  const completeManualSession = (): void => {
    // === DEVELOPMENT ONLY - Debug logging ===
    if (process.env.NEXT_PUBLIC_APP_ENV === 'development') {
      console.log('🔄 [TIMER] Manual session completion (skip/reset) - no statistics recorded');
    }
    
    // NO notification sound for manual completion
    // NO statistics recording
    
    // Clear session tracking
    setSessionStartTime(null);

    // Handle mode transitions without auto-start
    if (mode === "pomodoro") {
      setRounds((prev: number) => {
        const newRounds = prev + 1;
        const nextMode: TimerMode = newRounds % longBreakInterval === 0 ? "long" : "short";
        setMode(nextMode);
        setIsRunning(false); // Never auto-start after manual completion
        return newRounds;
      });
    } else {
      setMode("pomodoro");
      setIsRunning(false);
    }
  };

  // Use ref to store the current completion functions
  const completeNaturalSessionRef = useRef<((autoStart: boolean) => Promise<void>) | null>(null);

  // Update ref whenever component renders
  completeNaturalSessionRef.current = completeNaturalSession;

  // Initialize client-side rendering flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Sync volume settings with audio service
  useEffect(() => {
    if (isClient) {
      audioService.setMasterVolume(audioSettings.masterVolume);
      audioService.setNotificationVolume(audioSettings.breathingVolume);
    }
  }, [audioSettings.masterVolume, audioSettings.breathingVolume, isClient]);

  // === ASYNC LOAD PERSISTENT SETTINGS ===
  useEffect(() => {
    if (!isClient) return;
    
    async function loadSettings() {
      try {
        // Using await with Promise.resolve to simulate asynchronous retrieval
        const storedPomodoroTime = await Promise.resolve(localStorage.getItem("pomodoroTime"));
        if (storedPomodoroTime) {
          const time = parseInt(storedPomodoroTime, 10);
          setPomodoroTime(time);
          setTempPomodoroTime(time);
        }
        const storedShortBreakTime = await Promise.resolve(localStorage.getItem("shortBreakTime"));
        if (storedShortBreakTime) {
          const time = parseInt(storedShortBreakTime, 10);
          setShortBreakTime(time);
          setTempShortBreakTime(time);
        }
        const storedLongBreakTime = await Promise.resolve(localStorage.getItem("longBreakTime"));
        if (storedLongBreakTime) {
          const time = parseInt(storedLongBreakTime, 10);
          setLongBreakTime(time);
          setTempLongBreakTime(time);
        }
        const storedLongBreakInterval = await Promise.resolve(localStorage.getItem("longBreakInterval"));
        if (storedLongBreakInterval) {
          const interval = parseInt(storedLongBreakInterval, 10);
          setLongBreakInterval(interval);
          setTempLongBreakInterval(interval);
        }
        const storedAutoStartBreaks = await Promise.resolve(localStorage.getItem("autoStartBreaks"));
        if (storedAutoStartBreaks) {
          const value = storedAutoStartBreaks === "true";
          setAutoStartBreaks(value);
          setTempAutoStartBreaks(value);
        }
        const storedAutoStartPomodoros = await Promise.resolve(localStorage.getItem("autoStartPomodoros"));
        if (storedAutoStartPomodoros) {
          const value = storedAutoStartPomodoros === "true";
          setAutoStartPomodoros(value);
          setTempAutoStartPomodoros(value);
        }
        const storedNotificationSound = await Promise.resolve(localStorage.getItem("notificationSound"));
        if (storedNotificationSound) {
          setNotificationSound(storedNotificationSound);
          setTempNotificationSound(storedNotificationSound);
        }
        // Load persistent timer state
        const storedMode = await Promise.resolve(localStorage.getItem("pomodoroMode"));
        if (storedMode) {
          setMode(storedMode as "pomodoro" | "short" | "long");
        }
        const storedRounds = await Promise.resolve(localStorage.getItem("pomodoroRounds"));
        if (storedRounds) {
          setRounds(parseInt(storedRounds, 10));
        }
        const storedTimeLeft = await Promise.resolve(localStorage.getItem("pomodoroTimeLeft"));
        if (storedTimeLeft) {
          setTimeLeft(parseFloat(storedTimeLeft));
        }
        const storedIsRunning = await Promise.resolve(localStorage.getItem("pomodoroIsRunning"));
        const storedTargetTime = await Promise.resolve(localStorage.getItem("pomodoroTargetTime"));
        if (storedIsRunning === "true" && storedTargetTime) {
          const targetTime = parseInt(storedTargetTime, 10);
          const newTimeLeft = Math.max((targetTime - Date.now()) / 1000, 0);
          setTimeLeft(newTimeLeft);
          setIsRunning(newTimeLeft > 0);
        }
      } catch (error) {
        console.error('Failed to load pomodoro settings from localStorage:', error);
      } finally {
        // Indicate that the settings have finished loading
        setIsLoaded(true);
      }
    }
    loadSettings();
  }, [isClient]);

  // === SMOOTH COUNTDOWN (update every 100ms) ===
  useEffect(() => {
    if (!isRunning) return;
    
    // Track session start time when timer begins
    if (!sessionStartTime) {
      setSessionStartTime(Date.now());
      // === DEVELOPMENT ONLY - Debug logging ===
      if (process.env.NEXT_PUBLIC_APP_ENV === 'development') {
        console.log('▶️ [TIMER] Session started:', new Date().toLocaleTimeString());
      }
    }
    
    // Store the exact end time when timer starts
    const timerEndTime = Date.now() + timeLeft * 1000;
    
    // Save target time to localStorage immediately 
    if (isClient) {
      localStorage.setItem("pomodoroTargetTime", timerEndTime.toString());
    }
    
    // Handle visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // When tab becomes visible again, recalculate timeLeft based on endTime
        const newTimeLeft = Math.max((timerEndTime - Date.now()) / 1000, 0);
        setTimeLeft(newTimeLeft);
        
        // If time is up while user was away - natural completion
        if (newTimeLeft <= 0 && completeNaturalSessionRef.current) {
          completeNaturalSessionRef.current(true);
        }
      }
    };
    
    // Add visibility change listener
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    const interval = setInterval(() => {
      // Only update UI normally when tab is visible
      if (document.visibilityState === 'visible') {
        // Calculate remaining time based on end time instead of decrementing
        const newTimeLeft = Math.max((timerEndTime - Date.now()) / 1000, 0);
        setTimeLeft(newTimeLeft);
        
        if (newTimeLeft <= 0.1) {
          clearInterval(interval);
          // Natural completion - timer reached 0
          if (completeNaturalSessionRef.current) {
            completeNaturalSessionRef.current(true);
          }
        }
      }
    }, 100);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isRunning, timeLeft, isClient, sessionStartTime]);

  // === PERSIST STATE ON CHANGES ===
  useEffect(() => {
    if (!isLoaded || !isClient) return;
    
    try {
      localStorage.setItem("pomodoroMode", mode);
      localStorage.setItem("pomodoroRounds", rounds.toString());
      localStorage.setItem("pomodoroTimeLeft", timeLeft.toString());
      localStorage.setItem("pomodoroIsRunning", isRunning.toString());
      // Target time gets set in the timer effect instead of here
      if (!isRunning) {
        localStorage.removeItem("pomodoroTargetTime");
      }
    } catch (error) {
      console.error('Failed to save pomodoro state to localStorage:', error);
    }
  }, [mode, rounds, timeLeft, isRunning, isLoaded, isClient]);

  // === UPDATE timeLeft WHEN mode OR PREFERENCES CHANGE ===
  useEffect(() => {
    if (mode === "pomodoro") setTimeLeft(pomodoroTime * 60);
    else if (mode === "short") setTimeLeft(shortBreakTime * 60);
    else setTimeLeft(longBreakTime * 60);
  }, [pomodoroTime, shortBreakTime, longBreakTime, mode]);

  // Initialize temporary settings when opening the modal
  const openSettings = () => {
    setTempPomodoroTime(pomodoroTime);
    setTempShortBreakTime(shortBreakTime);
    setTempLongBreakTime(longBreakTime);
    setTempLongBreakInterval(longBreakInterval);
    setTempAutoStartBreaks(autoStartBreaks);
    setTempAutoStartPomodoros(autoStartPomodoros);
    setTempNotificationSound(notificationSound);
    setShowSettings(true);
  };

  // Close settings modal without saving changes
  const closeSettings = () => {
    setShowSettings(false);
  };

  // Apply settings from temporary state
  const saveSettings = () => {
    setPomodoroTime(tempPomodoroTime);
    setShortBreakTime(tempShortBreakTime);
    setLongBreakTime(tempLongBreakTime);
    setLongBreakInterval(tempLongBreakInterval);
    setAutoStartBreaks(tempAutoStartBreaks);
    setAutoStartPomodoros(tempAutoStartPomodoros);
    setNotificationSound(tempNotificationSound);
    
    // Save to localStorage
    if (isClient) {
      try {
        localStorage.setItem("pomodoroTime", tempPomodoroTime.toString());
        localStorage.setItem("shortBreakTime", tempShortBreakTime.toString());
        localStorage.setItem("longBreakTime", tempLongBreakTime.toString());
        localStorage.setItem("longBreakInterval", tempLongBreakInterval.toString());
        localStorage.setItem("autoStartBreaks", tempAutoStartBreaks.toString());
        localStorage.setItem("autoStartPomodoros", tempAutoStartPomodoros.toString());
        localStorage.setItem("notificationSound", tempNotificationSound);
      } catch (error) {
        console.error("Failed to save pomodoro settings to localStorage:", error);
      }
    }
    
    setShowSettings(false);
  };

  function handleSkip() {
    // === DEVELOPMENT ONLY - Debug logging ===
    if (process.env.NEXT_PUBLIC_APP_ENV === 'development') {
      console.log('⏭️ [TIMER] Manual skip triggered');
    }
    setIsRunning(false);
    completeManualSession();
  }

  // === FORMAT TIME HELPER ===
  function formatTime(seconds: number) {
    const secs = Math.floor(seconds);
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  function handleReset() {
    // === DEVELOPMENT ONLY - Debug logging ===
    if (process.env.NEXT_PUBLIC_APP_ENV === 'development') {
      console.log('🔄 [TIMER] Manual reset triggered');
    }
    setIsRunning(false);
    setSessionStartTime(null); // Clear session tracking
    
    // Reset timer to full duration
    if (mode === "pomodoro") setTimeLeft(pomodoroTime * 60);
    else if (mode === "short") setTimeLeft(shortBreakTime * 60);
    else setTimeLeft(longBreakTime * 60);
  }

  function changeMode(newMode: "pomodoro" | "short" | "long") {
    // === DEVELOPMENT ONLY - Debug logging ===
    if (process.env.NEXT_PUBLIC_APP_ENV === 'development') {
      console.log('🔄 [TIMER] Mode changed to:', newMode);
    }
    setMode(newMode);
    setIsRunning(false);
    setSessionStartTime(null); // Clear session tracking on mode change
  }

  // === DOT INDICATOR ADJUSTMENT ===
  // Normally: rounds % longBreakInterval
  // But if mode === "long" and rounds > 0, force the last dot to fill.
  let sessionProgressValue = rounds % longBreakInterval;
  if (mode === "long" && rounds > 0 && sessionProgressValue === 0) {
    sessionProgressValue = longBreakInterval;
  }

  // === CIRCULAR PROGRESS LOGIC ===
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const totalTime =
    mode === "pomodoro"
      ? pomodoroTime * 60
      : mode === "short"
        ? shortBreakTime * 60
        : longBreakTime * 60;
  // progressFraction: fraction of elapsed time
  const progressFraction = (totalTime - timeLeft) / totalTime;
  // For a ring that starts empty and fills:
  const dashOffset = circumference * (1 - progressFraction);

  // === RENDER ===
  // Only render UI after stored settings have been loaded
  if (!isLoaded) {
    return <div className="text-center mt-8">Loading…</div>;
  }

  return (
    <>
    <div className="w-full max-w-7xl mx-auto bg-gradient-to-br from-gray-800/90 to-slate-800/90 backdrop-blur-lg border border-gray-700/60 rounded-2xl shadow-2xl p-8 relative flex flex-col min-h-[500px]">
      {/* Settings Icon (top-right) */}
      <div className="absolute top-4 right-4">
        <UserRoundCog
          className="w-6 h-6 text-gray-400 hover:text-blue-400 cursor-pointer transition-colors duration-200"
          onClick={openSettings}
        />
      </div>

      {/* Title */}
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold text-white mb-1">Pomodoro Timer</h1>
        <p className="text-gray-400 text-xs">Stay focused and productive with timed work sessions</p>
      </div>

      {/* Mode Buttons - Moved to Top */}
      <div className="flex justify-center mb-6">
        <div className="bg-gray-700/30 rounded-lg p-2 backdrop-blur-sm border border-gray-600/30">
          <div className="flex space-x-2">
            <button
              onClick={() => changeMode("pomodoro")}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                mode === "pomodoro"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                  : "text-gray-300 hover:text-white hover:bg-gray-600/50"
              }`}
            >
              Pomodoro
            </button>
            <button
              onClick={() => changeMode("short")}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                mode === "short"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                  : "text-gray-300 hover:text-white hover:bg-gray-600/50"
              }`}
            >
              Short Break
            </button>
            <button
              onClick={() => changeMode("long")}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                mode === "long"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                  : "text-gray-300 hover:text-white hover:bg-gray-600/50"
              }`}
            >
              Long Break
            </button>
          </div>
        </div>
      </div>

      {/* Main Timer Section - Centered */}
      <div className="flex-1 flex items-center justify-center py-4">
        <div className="flex flex-col items-center space-y-6">
          {/* Timer Circle */}
          <div className="relative w-52 h-52 flex items-center justify-center">
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 100 100"
              className="absolute inset-0 drop-shadow-lg"
            >
              {/* Background Circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#374151"
                strokeWidth="3"
              />
              {/* Progress Circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#3B82F6"
                strokeWidth="3"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                style={{
                  transition: "stroke-dashoffset 0.3s linear",
                  transform: "rotate(-90deg)",
                  transformOrigin: "50% 50%",
                  filter: "drop-shadow(0 0 6px rgba(59, 130, 246, 0.5))"
                }}
              />
            </svg>
            <div className="z-10 text-center">
              <span className="text-5xl font-bold text-white drop-shadow-lg">
                {formatTime(timeLeft)}
              </span>
              <div className="text-base text-blue-300 font-medium mt-1">
                {mode === "pomodoro"
                  ? "Focus Time"
                  : mode === "short"
                  ? "Short Break"
                  : "Long Break"}
              </div>
            </div>
          </div>

          {/* Timer Controls */}
          <div className="flex items-center justify-center space-x-3">
            <button
              onClick={handleReset}
              className="p-2.5 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white border border-gray-600/50 hover:border-gray-500/50 transition-all duration-200 backdrop-blur-sm"
              title="Reset Timer"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            {isRunning ? (
              <button
                onClick={() => setIsRunning(false)}
                className="p-3 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 border border-red-500/50 hover:border-red-400/50 transition-all duration-200 backdrop-blur-sm shadow-lg"
                title="Pause Timer"
              >
                <Pause className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => {
                  if (!isInCooldown) {
                    setIsRunning(true);
                  }
                }}
                disabled={isInCooldown}
                className={`p-3 rounded-lg transition-all duration-200 backdrop-blur-sm shadow-lg ${
                  isInCooldown 
                    ? "bg-gray-600/20 text-gray-500 border border-gray-600/50 cursor-not-allowed" 
                    : "bg-green-600/20 hover:bg-green-600/30 text-green-400 hover:text-green-300 border border-green-500/50 hover:border-green-400/50"
                }`}
                title={isInCooldown ? "Wait for cooldown to end" : "Start Timer"}
              >
                <Play className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={handleSkip}
              className="p-2.5 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white border border-gray-600/50 hover:border-gray-500/50 transition-all duration-200 backdrop-blur-sm"
              title="Skip Session"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section - Session Progress */}
      <div className="mt-4 flex justify-center">
        <div className="bg-gray-700/50 rounded-lg px-6 py-2 backdrop-blur-sm border border-gray-600/30">
          <div className="text-center mb-2">
            <span className="text-xs font-medium text-gray-300">Session Progress</span>
          </div>
          <div className="flex space-x-3 justify-center">
            {Array.from({ length: longBreakInterval }).map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full border-2 transition-all duration-300 ${
                  i < sessionProgressValue 
                    ? "bg-blue-500 border-blue-400 shadow-lg shadow-blue-500/50" 
                    : "bg-transparent border-gray-500 hover:border-gray-400"
                }`}
              />
            ))}
          </div>
          <div className="text-center mt-1">
            <span className="text-xs text-gray-400">
              {sessionProgressValue} of {longBreakInterval} completed
            </span>
          </div>
        </div>
      </div>

      
      {/* Custom Slider Styles */}
      <style jsx>{`
        .slider-blue::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3B82F6;
          cursor: pointer;
          border: 2px solid #1E40AF;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
          transition: all 0.2s ease;
        }
        .slider-blue::-webkit-slider-thumb:hover {
          background: #2563EB;
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.6);
        }
        .slider-blue::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3B82F6;
          cursor: pointer;
          border: 2px solid #1E40AF;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
          transition: all 0.2s ease;
        }
        .slider-blue::-moz-range-thumb:hover {
          background: #2563EB;
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.6);
        }
        .slider-blue::-moz-range-track {
          background: transparent;
        }
      `}</style>
    </div>

    {/* Settings Modal - Outside component container for viewport centering */}
    {showSettings && (
      <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center z-50 p-8" onClick={closeSettings}>
        <div className="bg-gray-800 text-white rounded-lg p-6 w-[570px] max-w-full max-h-[87vh] overflow-y-auto shadow-lg" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Timer Settings</h2>
            <button 
              onClick={closeSettings}
              className="p-1.5 rounded-md bg-gray-700/50 hover:bg-gray-600/50 transition-colors duration-200"
            >
              <X className="w-4 h-4 text-gray-300" />
            </button>
          </div>
          {/* Timer Durations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-gray-700/30 rounded-md p-2.5 border border-gray-600/30">
              <label className="block text-xs font-medium mb-1.5 text-white">
                Work Duration: <span className="text-blue-400">{tempPomodoroTime} min</span>
              </label>
              <input
                type="range"
                min={1}
                max={90}
                value={tempPomodoroTime}
                onChange={(e) => setTempPomodoroTime(parseInt(e.target.value, 10))}
                className="w-full h-1 bg-gray-600 rounded-sm appearance-none cursor-pointer slider-blue"
              />
            </div>
            
            <div className="bg-gray-700/30 rounded-md p-2.5 border border-gray-600/30">
              <label className="block text-xs font-medium mb-1.5 text-white">
                Short Break: <span className="text-blue-400">{tempShortBreakTime} min</span>
              </label>
              <input
                type="range"
                min={1}
                max={30}
                value={tempShortBreakTime}
                onChange={(e) => setTempShortBreakTime(parseInt(e.target.value, 10))}
                className="w-full h-1 bg-gray-600 rounded-sm appearance-none cursor-pointer slider-blue"
              />
            </div>
            
            <div className="bg-gray-700/30 rounded-md p-2.5 border border-gray-600/30">
              <label className="block text-xs font-medium mb-1.5 text-white">
                Long Break: <span className="text-blue-400">{tempLongBreakTime} min</span>
              </label>
              <input
                type="range"
                min={5}
                max={60}
                value={tempLongBreakTime}
                onChange={(e) => setTempLongBreakTime(parseInt(e.target.value, 10))}
                className="w-full h-1 bg-gray-600 rounded-sm appearance-none cursor-pointer slider-blue"
              />
            </div>
            
            <div className="bg-gray-700/30 rounded-md p-2.5 border border-gray-600/30">
              <label className="block text-xs font-medium mb-1.5 text-white">
                Sessions Before Long Break: <span className="text-blue-400">{tempLongBreakInterval}</span>
              </label>
              <input
                type="range"
                min={1}
                max={10}
                value={tempLongBreakInterval}
                onChange={(e) => setTempLongBreakInterval(parseInt(e.target.value, 10))}
                className="w-full h-1 bg-gray-600 rounded-sm appearance-none cursor-pointer slider-blue"
              />
            </div>
          </div>
          {/* Preferences */}
          <div className="mt-4">
            <h3 className="text-base font-semibold text-white mb-3">Preferences</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-gray-700/30 rounded-lg p-3 border border-gray-600/30">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white font-medium">Auto Start Breaks</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tempAutoStartBreaks}
                      onChange={(e) => setTempAutoStartBreaks(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <p className="text-xs text-gray-400 mt-1">Automatically start break sessions</p>
              </div>
              
              <div className="bg-gray-700/30 rounded-lg p-3 border border-gray-600/30">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white font-medium">Auto Start Work</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tempAutoStartPomodoros}
                      onChange={(e) => setTempAutoStartPomodoros(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <p className="text-xs text-gray-400 mt-1">Automatically start work sessions</p>
              </div>
            </div>
            
          </div>
          
          {/* Notification Sound Selection - Always shown */}
          <div className="mt-4 bg-gray-700/30 rounded-lg p-3 border border-gray-600/30">
            <h4 className="block text-base font-semibold mb-3 text-white">
              Notification Sound
            </h4>
            <p className="text-xs text-gray-400 mb-3">Choose the sound that plays when sessions complete</p>
            <div className="space-y-2">
              {audioService.getAvailableNotificationSounds().map((sound) => (
                <div key={sound.id} className="bg-gray-600/30 rounded-md p-2.5 border border-gray-500/30 hover:bg-gray-600/40 transition-all duration-200">
                  <label className="flex items-center text-white cursor-pointer">
                    <div className="relative">
                      <input
                        type="radio"
                        name="notificationSound"
                        value={sound.id}
                        checked={tempNotificationSound === sound.id}
                        onChange={() => {
                          setTempNotificationSound(sound.id);
                          audioService.playNotificationSound(sound.id).catch(error => {
                            console.error('Failed to play notification sound preview:', error);
                          });
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-4 h-4 rounded-full border-2 border-gray-500 bg-transparent transition-all duration-200 peer-checked:border-blue-500 peer-focus:ring-2 peer-focus:ring-blue-400/40 relative after:content-[''] after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:w-2 after:h-2 after:rounded-full after:bg-blue-500 after:opacity-0 peer-checked:after:opacity-100"></div>
                    </div>
                    <span className="ml-2.5 text-sm font-medium">{sound.name}</span>
                  </label>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <button
              onClick={closeSettings}
              className="flex-1 px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white border border-gray-600/50 hover:border-gray-500/50 rounded-lg transition-all duration-200 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={saveSettings}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default Pomodoro;
