"use client";

import { useEffect, useState } from "react";
import {
  X,
  Play,
  Pause,
  RotateCw,
  ChevronsRight,
  UserRoundCog,
} from "lucide-react";

const Pomodoro = () => {
  // === Timer Preferences ===
  const [pomodoroTime, setPomodoroTime] = useState(25);
  const [shortBreakTime, setShortBreakTime] = useState(5);
  const [longBreakTime, setLongBreakTime] = useState(15);
  const [longBreakInterval, setLongBreakInterval] = useState(3);

  const [autoStartBreaks, setAutoStartBreaks] = useState(false);
  const [autoStartPomodoros, setAutoStartPomodoros] = useState(false);
  const [soundOn, setSoundOn] = useState(false);

  // === Timer Logic ===
  // timeLeft (in seconds, may be fractional for smooth animation)
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<"pomodoro" | "short" | "long">("pomodoro");
  const [rounds, setRounds] = useState(0);
  const [timeLeft, setTimeLeft] = useState(pomodoroTime * 60);

  // === Additional State ===
  // Determines whether the stored settings have finished loading.
  const [isLoaded, setIsLoaded] = useState(false);
  // Settings Modal Visibility
  const [showSettings, setShowSettings] = useState(false);

  // === ASYNC LOAD PERSISTENT SETTINGS ===
  useEffect(() => {
    async function loadSettings() {
      // Using await with Promise.resolve to simulate asynchronous retrieval
      const storedPomodoroTime = await Promise.resolve(localStorage.getItem("pomodoroTime"));
      if (storedPomodoroTime) {
        setPomodoroTime(parseInt(storedPomodoroTime, 10));
      }
      const storedShortBreakTime = await Promise.resolve(localStorage.getItem("shortBreakTime"));
      if (storedShortBreakTime) {
        setShortBreakTime(parseInt(storedShortBreakTime, 10));
      }
      const storedLongBreakTime = await Promise.resolve(localStorage.getItem("longBreakTime"));
      if (storedLongBreakTime) {
        setLongBreakTime(parseInt(storedLongBreakTime, 10));
      }
      const storedLongBreakInterval = await Promise.resolve(localStorage.getItem("longBreakInterval"));
      if (storedLongBreakInterval) {
        setLongBreakInterval(parseInt(storedLongBreakInterval, 10));
      }
      const storedAutoStartBreaks = await Promise.resolve(localStorage.getItem("autoStartBreaks"));
      if (storedAutoStartBreaks) {
        setAutoStartBreaks(storedAutoStartBreaks === "true");
      }
      const storedAutoStartPomodoros = await Promise.resolve(localStorage.getItem("autoStartPomodoros"));
      if (storedAutoStartPomodoros) {
        setAutoStartPomodoros(storedAutoStartPomodoros === "true");
      }
      const storedSoundOn = await Promise.resolve(localStorage.getItem("soundOn"));
      if (storedSoundOn) {
        setSoundOn(storedSoundOn === "true");
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
      // Indicate that the settings have finished loading
      setIsLoaded(true);
    }
    loadSettings();
  }, []);

  // === PERSIST STATE ON CHANGES ===
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem("pomodoroMode", mode);
    localStorage.setItem("pomodoroRounds", rounds.toString());
    localStorage.setItem("pomodoroTimeLeft", timeLeft.toString());
    localStorage.setItem("pomodoroIsRunning", isRunning.toString());
    if (isRunning) {
      const targetTime = Date.now() + timeLeft * 1000;
      localStorage.setItem("pomodoroTargetTime", targetTime.toString());
    } else {
      localStorage.removeItem("pomodoroTargetTime");
    }
  }, [mode, rounds, timeLeft, isRunning, isLoaded]);

  // === UPDATE timeLeft WHEN mode OR PREFERENCES CHANGE ===
  useEffect(() => {
    if (mode === "pomodoro") setTimeLeft(pomodoroTime * 60);
    else if (mode === "short") setTimeLeft(shortBreakTime * 60);
    else setTimeLeft(longBreakTime * 60);
  }, [pomodoroTime, shortBreakTime, longBreakTime, mode]);

  // === SMOOTH COUNTDOWN (update every 100ms) ===
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0.1) {
          clearInterval(interval);
          completeSession(true);
          return 0;
        }
        return prev - 0.1;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [isRunning]);

  // === COMPLETE SESSION HELPER ===
  // autoStart: true if session ended naturally, false if skipped manually
  function completeSession(autoStart: boolean) {
    if (mode === "pomodoro") {
      setRounds((prev) => {
        const newRounds = prev + 1;
        const nextMode = newRounds % longBreakInterval === 0 ? "long" : "short";
        setMode(nextMode);
        // Only auto start if the session naturally ended (autoStart true)
        setIsRunning(autoStart ? autoStartBreaks : false);
        return newRounds;
      });
    } else {
      setMode("pomodoro");
      setIsRunning(autoStart ? autoStartPomodoros : false);
    }
  }

  function handleSessionComplete() {
    completeSession(true);
  }

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
      className="w-full md:max-w-3xl mx-auto bg-white rounded-2xl shadow-md p-6 relative"
      style={{ minHeight: "450px" }}
    >
      {/* Settings Icon (top-right) */}
      <div className="absolute top-4 right-4">
        <UserRoundCog
          className="w-6 h-6 text-gray-600 cursor-pointer"
          onClick={() => setShowSettings(true)}
        />
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold text-center mb-6">Pomodoro Timer</h1>

      {/* Timer Display Section with Clock Animation */}
      <div className="flex flex-col items-center justify-center">
        <div className="relative w-40 h-40 flex items-center justify-center mb-2">
          <svg width="100%" height="100%" viewBox="0 0 100 100" className="absolute inset-0">
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
            <span className="text-3xl font-semibold text-gray-800">
              {formatTime(timeLeft)}
            </span>
            <div className="text-sm text-gray-500">
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
              className={`w-3 h-3 rounded-full ${i < sessionProgressValue ? "bg-blue-500" : "bg-gray-300"
                }`}
            />
          ))}
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-center space-x-6 mt-2 mb-4">
          <button onClick={handleReset} className="p-2 rounded-full hover:bg-gray-100 text-gray-600">
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
          <button onClick={handleSkip} className="p-2 rounded-full hover:bg-gray-100 text-gray-600">
            <ChevronsRight className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Buttons */}
        <div className="flex space-x-2 my-2">
          <button
            onClick={() => changeMode("pomodoro")}
            className={`px-3 py-1 rounded ${mode === "pomodoro" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"
              }`}
          >
            Pomodoro
          </button>
          <button
            onClick={() => changeMode("short")}
            className={`px-3 py-1 rounded ${mode === "short" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"
              }`}
          >
            Short Break
          </button>
          <button
            onClick={() => changeMode("long")}
            className={`px-3 py-1 rounded ${mode === "long" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"
              }`}
          >
            Long Break
          </button>
        </div>
      </div>

      {/* Settings Modal (Small Centered Modal) */}
      {showSettings && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black opacity-30" onClick={() => setShowSettings(false)}></div>
          <div className="bg-white rounded-lg shadow-lg p-6 z-50 w-80">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Settings</h2>
              <button onClick={() => setShowSettings(false)}>
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            {/* Work Duration */}
            <div className="mb-5">
              <label className="block font-semibold mb-1">Work Duration: {pomodoroTime} min</label>
              <input
                type="range"
                min={1}
                max={60}
                value={pomodoroTime}
                onChange={(e) => setPomodoroTime(parseInt(e.target.value, 10))}
                className="w-full"
              />
            </div>
            {/* Short Break */}
            <div className="mb-5">
              <label className="block font-semibold mb-1">Short Break: {shortBreakTime} min</label>
              <input
                type="range"
                min={1}
                max={30}
                value={shortBreakTime}
                onChange={(e) => setShortBreakTime(parseInt(e.target.value, 10))}
                className="w-full"
              />
            </div>
            {/* Long Break */}
            <div className="mb-5">
              <label className="block font-semibold mb-1">Long Break: {longBreakTime} min</label>
              <input
                type="range"
                min={5}
                max={60}
                value={longBreakTime}
                onChange={(e) => setLongBreakTime(parseInt(e.target.value, 10))}
                className="w-full"
              />
            </div>
            {/* Sessions Before Long Break */}
            <div className="mb-5">
              <label className="block font-semibold mb-1">Sessions Before Long Break: {longBreakInterval}</label>
              <input
                type="range"
                min={1}
                max={10}
                value={longBreakInterval}
                onChange={(e) => setLongBreakInterval(parseInt(e.target.value, 10))}
                className="w-full"
              />
            </div>
            {/* Toggles */}
            <div className="flex items-center justify-between mb-4">
              <span>Auto Start Breaks</span>
              <input
                type="checkbox"
                checked={autoStartBreaks}
                onChange={(e) => setAutoStartBreaks(e.target.checked)}
              />
            </div>
            <div className="flex items-center justify-between mb-4">
              <span>Auto Start Work</span>
              <input
                type="checkbox"
                checked={autoStartPomodoros}
                onChange={(e) => setAutoStartPomodoros(e.target.checked)}
              />
            </div>
            <div className="flex items-center justify-between mb-6">
              <span>Sound Notifications</span>
              <input
                type="checkbox"
                checked={soundOn}
                onChange={(e) => setSoundOn(e.target.checked)}
              />
            </div>
            <button
              onClick={() => {
                localStorage.setItem("pomodoroTime", pomodoroTime.toString());
                localStorage.setItem("shortBreakTime", shortBreakTime.toString());
                localStorage.setItem("longBreakTime", longBreakTime.toString());
                localStorage.setItem("longBreakInterval", longBreakInterval.toString());
                localStorage.setItem("autoStartBreaks", autoStartBreaks.toString());
                localStorage.setItem("autoStartPomodoros", autoStartPomodoros.toString());
                localStorage.setItem("soundOn", soundOn.toString());
                setShowSettings(false);
              }}
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
