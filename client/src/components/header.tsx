import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import DevToolsMenu from './devTools';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
          <span className="text-[var(--color-primary1)] font-semibold">Menu</span>
        </div>
        {isMenuOpen && (
          <div className="absolute right-0 mt-2 bg-white border rounded shadow-md p-4 space-y-2 z-10 min-w-[150px]">
            <Link to="/dashboard" className="block text-[var(--color-primary1)]">
              Dashboard
            </Link>
            <Link to="/journal" className="block text-[var(--color-primary1)]">
              Journal
            </Link>
            <Link to="/landing" className="block text-[var(--color-primary1)]">
              Landing
            </Link>
            <Link to="/planner" className="block text-[var(--color-primary1)]">
              Planner
            </Link>
            <Link to="/settings" className="block text-[var(--color-primary1)]">
              Settings
            </Link>
            <Link to="/study" className="block text-[var(--color-primary1)]">
              Study
            </Link>
            <Link to="/visionBoard" className="block text-[var(--color-primary1)]">
              Vision Board
            </Link>
            <Link to="/pomodoro" className="block text-[var(--color-primary1)]">
              Pomodoro
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
