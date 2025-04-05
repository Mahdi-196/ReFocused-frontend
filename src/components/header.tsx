"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import DevToolsMenu from "@/components/devTools";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <header className="bg-[var(--color-background)] p-5 flex justify-between items-center relative">
      <DevToolsMenu />
      <h1 className="text-[var(--color-primary1)] text-4xl font-bold text-center flex-1">
        Focus shift
      </h1>

      <div
        className="dropdown relative px-4 py-2"
        onMouseEnter={() => setIsMenuOpen(true)}
        onMouseLeave={() => setIsMenuOpen(false)}
      >
        <div className="flex items-center space-x-2 cursor-pointer">
          <Menu className="w-8 h-8 text-[var(--color-primary1)]" />
          <span className="text-[var(--color-primary1)] font-semibold">
            Menu
          </span>
        </div>

        {isMenuOpen && (
          <div className="absolute right-0 mt-2 bg-white border rounded shadow-md p-4 space-y-2 z-10 min-w-[150px]">
            <Link
              href="/dashboard"
              className="block text-[var(--color-primary1)]"
            >
              Dashboard
            </Link>
            <Link
              href="/journal"
              className="block text-[var(--color-primary1)]"
            >
              Journal
            </Link>
            <Link
              href="/landing"
              className="block text-[var(--color-primary1)]"
            >
              Landing
            </Link>
            <Link
              href="/planner"
              className="block text-[var(--color-primary1)]"
            >
              Planner
            </Link>
            {/* <Link
              href="/settings"
              className="block text-[var(--color-primary1)]"
            >
              Settings
            </Link>
            <Link href="/study" className="block text-[var(--color-primary1)]">
              Study
            </Link>
            <Link
              href="/visionBoard"
              className="block text-[var(--color-primary1)]"
            >
              Vision Board
            </Link> */}
            <Link
              href="/pomodoro"
              className="block text-[var(--color-primary1)]"
            >
              Pomodoro
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
