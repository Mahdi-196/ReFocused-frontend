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
  const [soundOn, setSoundOn] = useState<boolean>(false);
  const [notificationSound, setNotificationSound] = useState<string>('gentle-chime');
  
  // === Temporary settings state (only applied when saved) ===
  const [tempPomodoroTime, setTempPomodoroTime] = useState<number>(25);
  const [tempShortBreakTime, setTempShortBreakTime] = useState<number>(5);
  const [tempLongBreakTime, setTempLongBreakTime] = useState<number>(15);
  const [tempLongBreakInterval, setTempLongBreakInterval] = useState<number>(3);
  const [tempAutoStartBreaks, setTempAutoStartBreaks] = useState<boolean>(false);
  const [tempAutoStartPomodoros, setTempAutoStartPomodoros] = useState<boolean>(false);
  const [tempSoundOn, setTempSoundOn] = useState<boolean>(false);
  const [tempNotificationSound, setTempNotificationSound] = useState<string>('gentle-chime');

  // === Timer Logic ===
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [mode, setMode] = useState<TimerMode>("pomodoro");
  const [rounds, setRounds] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(pomodoroTime * 60);

  // === Additional State ===
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [isClient, setIsClient] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // === COMPLETE SESSION HELPER - Defined immediately after state to avoid reference errors ===
  const completeSession = async (autoStart: boolean): Promise<void> => {
    // Play notification sound if enabled
    if (soundOn) {
      audioService.playNotificationSound(notificationSound);
    }

    if (mode === "pomodoro") {
      // Track completed focus session
      const completedTime = pomodoroTime; // Already in minutes, no conversion needed
      try {
        console.log('🎯 [POMODORO] Session completed! Focus time:', completedTime, 'minutes');
        
        // Record the focus time (original duration, not time left)
        await addFocusTime(completedTime);
        
        // Increment the session counter
        await incrementSessions();
        
        console.log('✅ [POMODORO] Statistics updated successfully');
      } catch (error) {
        console.error('Failed to record session statistics:', error);
      }

      setRounds((prev: number) => {
        const newRounds = prev + 1;
        const nextMode: TimerMode = newRounds % longBreakInterval === 0 ? "long" : "short";
        setMode(nextMode);
        // Only auto start if the session naturally ended (autoStart true)
        setIsRunning(autoStart ? autoStartBreaks : false);
        return newRounds;
      });
    } else {
      setMode("pomodoro");
      setIsRunning(autoStart ? autoStartPomodoros : false);
    }
  };

  // Use ref to store the current completeSession function
  const completeSessionRef = useRef<((autoStart: boolean) => Promise<void>) | null>(null);

  // Update ref whenever component renders - simpler approach
  completeSessionRef.current = completeSession;

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
        const storedSoundOn = await Promise.resolve(localStorage.getItem("soundOn"));
        if (storedSoundOn) {
          const value = storedSoundOn === "true";
          setSoundOn(value);
          setTempSoundOn(value);
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
        
        // If time is up while user was away
        if (newTimeLeft <= 0) {
          completeSession(true);
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
          completeSession(true);
        }
      }
    }, 100);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isRunning, timeLeft, isClient]);

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
    setTempSoundOn(soundOn);
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
    setSoundOn(tempSoundOn);
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
        localStorage.setItem("soundOn", tempSoundOn.toString());
        localStorage.setItem("notificationSound", tempNotificationSound);
      } catch (error) {
        console.error("Failed to save pomodoro settings to localStorage:", error);
      }
    }
    
    setShowSettings(false);
  };

  function handleSkip() {
    completeSession(false);
  }

  // === FORMAT TIME HELPER ===
  function formatTime(seconds: number) {
    const secs = Math.floor(seconds);
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  function handleReset() {
    if (mode === "pomodoro") setTimeLeft(pomodoroTime * 60);
    else if (mode === "short") setTimeLeft(shortBreakTime * 60);
    else setTimeLeft(longBreakTime * 60);
    setIsRunning(false);
  }

  function changeMode(newMode: "pomodoro" | "short" | "long") {
    setMode(newMode);
    setIsRunning(false);
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
    <div
      className="w-full md:max-w-5xl mx-auto rounded-2xl shadow-md p-6 relative"
      style={{ 
        minHeight: "450px", 
        background: "linear-gradient(135deg, #1F2938 0%, #1E2837 100%)" 
      }}
    >
      {/* Settings Icon (top-right) */}
      <div className="absolute top-4 right-4">
        <UserRoundCog
          className="w-6 h-6 text-gray-600 cursor-pointer"
          onClick={openSettings}
        />
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold text-center mb-6 text-white">
        Pomodoro Timer
      </h1>

      {/* Timer Display Section with Clock Animation */}
      <div className="flex flex-col items-center justify-center">
        <div className="relative w-56 h-56 flex items-center justify-center mb-2">
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 100 100"
            className="absolute inset-0"
          >
            {/* Background Circle (light gray) with thinner line */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="4"
            />
            {/* Progress Circle (blue) with thinner line */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#3B82F6"
              strokeWidth="4"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{
                transition: "stroke-dashoffset 0.3s linear",
                transform: "rotate(-90deg)",
                transformOrigin: "50% 50%",
              }}
            />
          </svg>
          <div className="z-10 text-center">
            <span className="text-5xl font-semibold text-white">
              {formatTime(timeLeft)}
            </span>
            <div className="text-base text-gray-300">
              {mode === "pomodoro"
                ? "Focus"
                : mode === "short"
                ? "Short Break"
                : "Long Break"}
            </div>
          </div>
        </div>

        {/* Dot Indicator for Sessions */}
        <div className="flex space-x-2 my-3">
          {Array.from({ length: longBreakInterval }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full ${
                i < sessionProgressValue ? "bg-blue-500" : "bg-gray-300"
              }`}
            />
          ))}
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-center space-x-6 mt-2 mb-4">
          <button
            onClick={handleReset}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
          >
            <RotateCw className="w-5 h-5" />
          </button>
          {isRunning ? (
            <button
              onClick={() => setIsRunning(false)}
              className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700"
            >
              <Pause className="w-6 h-6" />
            </button>
          ) : (
            <button
              onClick={() => {
                setIsRunning(true);
              }}
              className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700"
            >
              <Play className="w-6 h-6" />
            </button>
          )}
          <button
            onClick={handleSkip}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
          >
            <ChevronsRight className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Buttons */}
        <div className="flex space-x-2 my-2">
          <button
            onClick={() => changeMode("pomodoro")}
            className={`px-3 py-1 rounded ${
              mode === "pomodoro"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Pomodoro
          </button>
          <button
            onClick={() => changeMode("short")}
            className={`px-3 py-1 rounded ${
              mode === "short"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Short Break
          </button>
          <button
            onClick={() => changeMode("long")}
            className={`px-3 py-1 rounded ${
              mode === "long"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Long Break
          </button>
        </div>
      </div>

      {/* Settings Modal (Small Centered Modal) */}
      {showSettings && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="absolute inset-0 bg-black opacity-30"
            onClick={closeSettings}
          ></div>
          <div className="bg-gray-800 text-white rounded-lg shadow-lg p-6 z-50 w-80"
               style={{ background: "linear-gradient(135deg, #1F2938 0%, #1E2837 100%)" }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Settings</h2>
              <button onClick={closeSettings}>
                <X className="w-5 h-5 text-gray-300" />
              </button>
            </div>
            {/* Work Duration */}
            <div className="mb-5">
              <label className="block font-semibold mb-1 text-gray-300">
                Work Duration: {tempPomodoroTime} min
              </label>
              <input
                type="range"
                min={1}
                max={60}
                value={tempPomodoroTime}
                onChange={(e) => setTempPomodoroTime(parseInt(e.target.value, 10))}
                className="w-full accent-blue-500"
              />
            </div>
            {/* Short Break */}
            <div className="mb-5">
              <label className="block font-semibold mb-1 text-gray-300">
                Short Break: {tempShortBreakTime} min
              </label>
              <input
                type="range"
                min={1}
                max={30}
                value={tempShortBreakTime}
                onChange={(e) =>
                  setTempShortBreakTime(parseInt(e.target.value, 10))
                }
                className="w-full accent-blue-500"
              />
            </div>
            {/* Long Break */}
            <div className="mb-5">
              <label className="block font-semibold mb-1 text-gray-300">
                Long Break: {tempLongBreakTime} min
              </label>
              <input
                type="range"
                min={5}
                max={60}
                value={tempLongBreakTime}
                onChange={(e) => setTempLongBreakTime(parseInt(e.target.value, 10))}
                className="w-full accent-blue-500"
              />
            </div>
            {/* Sessions Before Long Break */}
            <div className="mb-5">
              <label className="block font-semibold mb-1 text-gray-300">
                Sessions Before Long Break: {tempLongBreakInterval}
              </label>
              <input
                type="range"
                min={1}
                max={10}
                value={tempLongBreakInterval}
                onChange={(e) =>
                  setTempLongBreakInterval(parseInt(e.target.value, 10))
                }
                className="w-full accent-blue-500"
              />
            </div>
            {/* Toggles */}
            <div className="flex items-center justify-between mb-4 text-gray-300">
              <span>Auto Start Breaks</span>
              <input
                type="checkbox"
                checked={tempAutoStartBreaks}
                onChange={(e) => setTempAutoStartBreaks(e.target.checked)}
                className="form-checkbox h-5 w-5 text-blue-500 rounded border-gray-600 bg-gray-700"
              />
            </div>
            <div className="flex items-center justify-between mb-4 text-gray-300">
              <span>Auto Start Work</span>
              <input
                type="checkbox"
                checked={tempAutoStartPomodoros}
                onChange={(e) => setTempAutoStartPomodoros(e.target.checked)}
                className="form-checkbox h-5 w-5 text-blue-500 rounded border-gray-600 bg-gray-700"
              />
            </div>
            <div className="flex items-center justify-between mb-4 text-gray-300">
              <span>Sound Notifications</span>
              <input
                type="checkbox"
                checked={tempSoundOn}
                onChange={(e) => setTempSoundOn(e.target.checked)}
                className="form-checkbox h-5 w-5 text-blue-500 rounded border-gray-600 bg-gray-700"
              />
            </div>
            {/* Notification Sound Selection */}
            {tempSoundOn && (
              <div className="mb-6">
                <label className="block font-semibold mb-2 text-gray-300">
                  Notification Sound
                </label>
                <div className="space-y-2">
                  {audioService.getAvailableNotificationSounds().map((sound) => (
                    <label key={sound.id} className="flex items-center text-gray-300 cursor-pointer">
                      <input
                        type="radio"
                        name="notificationSound"
                        value={sound.id}
                        checked={tempNotificationSound === sound.id}
                        onChange={() => setTempNotificationSound(sound.id)}
                        className="form-radio h-4 w-4 text-blue-500 border-gray-600 bg-gray-700 mr-3"
                      />
                      <span className="flex-1">{sound.name}</span>
                      <button
                        type="button"
                        onClick={() => audioService.playNotificationSound(sound.id)}
                        className="ml-2 px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 rounded transition-colors"
                      >
                        Test
                      </button>
                    </label>
                  ))}
                </div>
              </div>
            )}
            <button
              onClick={saveSettings}
              className="block w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
              Save Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pomodoro;
