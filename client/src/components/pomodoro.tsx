import React, { useEffect, useRef, useState } from "react";
import { UserRoundCog, X } from "lucide-react";

// Theme color options
const COLOR_OPTIONS = [
  { hex: "#a35629", name: "Rust Brown" },
  { hex: "#71b1ab", name: "Muted Teal" }, // default
  { hex: "#FFF9C4", name: "Pastel Yellow" },
];

const Pomodoro = () => {
  // UI + theme states
  const [showSettings, setShowSettings] = useState(false);
  const [activeTheme, setActiveTheme] = useState(COLOR_OPTIONS[1].hex);
  const [tempTheme, setTempTheme] = useState(COLOR_OPTIONS[1].hex);

  // Preferences
  const [pomodoroTime, setPomodoroTime] = useState(25);
  const [shortBreakTime, setShortBreakTime] = useState(5);
  const [longBreakTime, setLongBreakTime] = useState(15);
  const [longBreakInterval, setLongBreakInterval] = useState(3);

  const [autoStartBreaks, setAutoStartBreaks] = useState(false);
  const [autoStartPomodoros, setAutoStartPomodoros] = useState(false);

  // Timer logic
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<"pomodoro" | "short" | "long">("pomodoro");
  const [rounds, setRounds] = useState(0);
  const [timeLeft, setTimeLeft] = useState(pomodoroTime * 60);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load theme on first mount
  useEffect(() => {
    const storedTheme = localStorage.getItem("timer-theme");
    if (storedTheme) {
      setActiveTheme(storedTheme);
      setTempTheme(storedTheme);
    }
    const storedPomodoroTime = localStorage.getItem("pomodoroTime");
    if (storedPomodoroTime) {
      setPomodoroTime(parseInt(storedPomodoroTime, 10));
    }
    const storedShortBreakTime = localStorage.getItem("shortBreakTime");
    if (storedShortBreakTime) {
      setShortBreakTime(parseInt(storedShortBreakTime, 10));
    }
    const storedLongBreakTime = localStorage.getItem("longBreakTime");
    if (storedLongBreakTime) {
      setLongBreakTime(parseInt(storedLongBreakTime, 10));
    }
    const storedLongBreakInterval = localStorage.getItem("longBreakInterval");
    if (storedLongBreakInterval) {
      setLongBreakInterval(parseInt(storedLongBreakInterval, 10));
    }
    const storedAutoStartBreaks = localStorage.getItem("autoStartBreaks");
    if (storedAutoStartBreaks) {
      setAutoStartBreaks(storedAutoStartBreaks === "true");
    }
    const storedAutoStartPomodoros = localStorage.getItem("autoStartPomodoros");
    if (storedAutoStartPomodoros) {
      setAutoStartPomodoros(storedAutoStartPomodoros === "true");
    }
  }, []);

  // Update timer when mode or preference changes
  useEffect(() => {
    if (mode === "pomodoro") setTimeLeft(pomodoroTime * 60);
    else if (mode === "short") setTimeLeft(shortBreakTime * 60);
    else setTimeLeft(longBreakTime * 60);
  }, [pomodoroTime, shortBreakTime, longBreakTime, mode]);

  // Countdown logic
  useEffect(() => {
    if (isRunning) {
      if (timeLeft > 0) {
        const timeout = setTimeout(() => {
          setTimeLeft(timeLeft - 1);
        }, 1000);
        return () => clearTimeout(timeout);
      } else {
        handleSessionComplete();
      }
    }
  }, [isRunning, timeLeft]);
  

  // On complete, switch modes
  const handleSessionComplete = () => {
    if (mode === "pomodoro") {
      const nextRound = rounds + 1;
      setRounds(nextRound);
      const nextMode = nextRound % longBreakInterval === 0 ? "long" : "short";
      setMode(nextMode);
      setIsRunning(autoStartBreaks);
    } else {
      setMode("pomodoro");
      setIsRunning(autoStartPomodoros);
    }
  };
  

  // Format seconds -> MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Limit input to 1–999 mins
  const handleInputChange =
    (setter: (value: number) => void) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = parseInt(e.target.value);
      if (isNaN(value)) value = 1;
      if (value < 1) value = 1;
      if (value > 999) value = 999;
      setter(value);
    };

  const handleSaveTheme = () => {
    setActiveTheme(tempTheme);
    localStorage.setItem("timer-theme", tempTheme);
    localStorage.setItem("pomodoroTime", pomodoroTime.toString());
    localStorage.setItem("shortBreakTime", shortBreakTime.toString());
    localStorage.setItem("longBreakTime", longBreakTime.toString());
    localStorage.setItem("longBreakInterval", longBreakInterval.toString());
    localStorage.setItem("autoStartBreaks", autoStartBreaks.toString());
    localStorage.setItem("autoStartPomodoros", autoStartPomodoros.toString());
    setShowSettings(false);
  };

  const changeMode = (newMode: "pomodoro" | "short" | "long") => {
    setMode(newMode);
    setIsRunning(false);
  };

  return (
    <div className="flex justify-center items-center h-screen text-white bg-gray-100">
      {/*  TIMER BOX  */}
      <div
        className="w-3/5 h-3/5 rounded-lg p-8 flex flex-col items-center justify-between relative overflow-visible transition-colors"
        style={{ backgroundColor: activeTheme }}
      >
        {/* Settings Icon */}
        <div className="absolute top-4 right-4">
          <UserRoundCog
            className="text-white w-6 h-6 cursor-pointer"
            onClick={() => setShowSettings(true)}
          />
        </div>

        {/* Mode Buttons */}
        <div className="flex space-x-4 text-lg font-semibold">
          <button
            onClick={() => changeMode("pomodoro")}
            className={`px-4 py-1 rounded ${
              mode === "pomodoro" ? "bg-white text-red-500" : ""
            }`}
          >
            Pomodoro
          </button>
          <button
            onClick={() => changeMode("short")}
            className={`px-4 py-1 rounded ${
              mode === "short" ? "bg-white text-red-500" : ""
            }`}
          >
            Short Break
          </button>
          <button
            onClick={() => changeMode("long")}
            className={`px-4 py-1 rounded ${
              mode === "long" ? "bg-white text-red-500" : ""
            }`}
          >
            Long Break
          </button>
        </div>

        {/* Time Display */}
        <div className="text-7xl font-bold">{formatTime(timeLeft)}</div>

        {/* Start/Pause */}
        <button
          onClick={() => setIsRunning(!isRunning)}
          className="bg-white text-red-500 px-6 py-2 text-xl font-bold rounded"
        >
          {isRunning ? "PAUSE" : "START"}
        </button>

        {/* Session Info */}
        <div className="text-sm mt-2 text-left p-1">
          #{rounds + 1}
          <br />
          {mode === "pomodoro"
            ? "Time to focus!"
            : mode === "short"
            ? "Short break time!"
            : "Long break time!"}
        </div>

        {/* Tasks */}
        <div className="w-full mt-4">
          <h2 className="text-lg font-semibold border-t border-white pt-4">
            Tasks
          </h2>
          <div className="mt-2 border-2 border-dashed border-white rounded px-4 py-2 text-left p-1">
            <button className="text-white">+ Add Task</button>
          </div>
        </div>

        {/*  SETTINGS MODAL  */}
        {showSettings && (
          <div className="absolute top-0 left-0 right-0 mx-auto bg-white text-black w-[380px] max-h-[90vh] overflow-y-auto rounded-lg p-6 shadow-xl z-50">
            <button
              className="absolute top-2 right-2 text-gray-600"
              onClick={() => setShowSettings(false)}
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-center mb-4">Customize</h2>

            <div className="space-y-4 text-sm">
              {/* TIMER Section */}
              <div>
                <h3 className="font-semibold mb-1">⏱️ TIMER</h3>
                <div className="flex justify-between mb-2">
                  <div className="flex flex-col items-center">
                    <label>Pomodoro</label>
                    <input
                      type="number"
                      className="w-20 text-left p-1 outline-none bg-[#ECEFF1] rounded border"
                      value={pomodoroTime}
                      onChange={handleInputChange(setPomodoroTime)}
                    />
                  </div>
                  <div className="flex flex-col items-center">
                    <label>Short Break</label>
                    <input
                      type="number"
                      className="w-20 text-left p-1 outline-none bg-[#ECEFF1] rounded border"
                      value={shortBreakTime}
                      onChange={handleInputChange(setShortBreakTime)}
                    />
                  </div>
                  <div className="flex flex-col items-center">
                    <label>Long Break</label>
                    <input
                      type="number"
                      className="w-20 text-left p-1 outline-none bg-[#ECEFF1] rounded border"
                      value={longBreakTime}
                      onChange={handleInputChange(setLongBreakTime)}
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span>Auto Start Breaks</span>
                  <input
                    type="checkbox"
                    checked={autoStartBreaks}
                    onChange={(e) => setAutoStartBreaks(e.target.checked)}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span>Auto Start Pomodoros</span>
                  <input
                    type="checkbox"
                    checked={autoStartPomodoros}
                    onChange={(e) => setAutoStartPomodoros(e.target.checked)}
                  />
                </div>

                <div className="mt-2 flex flex-col items-center">
                  <label className="p-1">Long Break Interval</label>
                  <input
                    type="number"
                    className="w-20 text-left p-1 outline-none bg-[#ECEFF1] rounded border"
                    value={longBreakInterval}
                    onChange={handleInputChange(setLongBreakInterval)}
                  />
                </div>
              </div>

              {/* TASK Section */}
              <div>
                <h3 className="font-semibold mt-4">☑️ TASK</h3>
                <div className="flex justify-between items-center">
                  <span>Auto Check Tasks</span>
                  <input type="checkbox" />
                </div>
                <div className="flex justify-between items-center">
                  <span>Auto Switch Tasks</span>
                  <input type="checkbox" defaultChecked />
                </div>
              </div>

              {/* SOUND Section */}
              <div>
                <h3 className="font-semibold mt-4">🔊 SOUND</h3>
                <label>Alarm Sound</label>
                <select className="block w-full border rounded px-2 mb-2 bg-[#ECEFF1]">
                  <option>Kitchen</option>
                </select>
                <input
                  type="range"
                  min="0"
                  max="100"
                  defaultValue="50"
                  className="w-full"
                />
                <div className="mt-2">
                  <label>repeat</label>
                  <input
                    className="block w-16 border rounded px-2 bg-[#ECEFF1]"
                    defaultValue="1"
                  />
                </div>
                <label className="mt-2">Ticking Sound</label>
                <select className="block w-full border rounded px-2 mb-2 bg-[#ECEFF1]">
                  <option>None</option>
                </select>
                <input
                  type="range"
                  min="0"
                  max="100"
                  defaultValue="50"
                  className="w-full"
                />
              </div>

              {/* THEME Section */}
              <div>
                <h3 className="font-semibold mt-4">🎨 THEME</h3>
                <div className="flex items-center space-x-2 mb-2">
                  <span>Color Themes</span>
                  <div className="flex space-x-2">
                    {COLOR_OPTIONS.map((color) => (
                      <div
                        key={color.name}
                        className={`cursor-pointer rounded border transition-all ${
                          tempTheme === color.hex
                            ? "border-black w-7 h-7"
                            : "w-5 h-5"
                        }`}
                        style={{ backgroundColor: color.hex }}
                        onClick={() => setTempTheme(color.hex)}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* NOTIFICATIONS Section */}
              <div>
                <h3 className="font-semibold mt-4">🔔 NOTIFICATION</h3>
                <div className="flex items-center mb-2 space-x-2">
                  <select className="border rounded px-2 bg-[#ECEFF1]">
                    <option>Last</option>
                    <option>First</option>
                  </select>
                  <input
                    type="number"
                    className="w-16 border rounded px-2 bg-[#ECEFF1]"
                    defaultValue="5"
                  />
                  <span>min</span>
                </div>
                <div className="text-blue-600 text-sm underline cursor-pointer">
                  + Add this device
                </div>
              </div>

              {/* Save Button */}
              <div className="mt-6 text-left p-1">
                <button
                  className="bg-red-500 text-white px-4 py-2 rounded font-semibold ml-auto block"
                  onClick={handleSaveTheme}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Pomodoro;
