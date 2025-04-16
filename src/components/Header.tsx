"use client";

// src/components/Header.tsx
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MdNotifications, MdPersonOutline } from 'react-icons/md';
import DevTools from './devTools';

const Header = () => {
  const pathname = usePathname();

  return (
    <header className="bg-white shadow py-4">
      <div className="container mx-auto flex items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <img 
            src="/canva-brain.png" 
            alt="Brain Logo"
            className="w-10 h-10"
          />
          <DevTools/>
          <span className="text-xl font-bold text-gray-800">ReFocused</span>
        </div>
        {/* Navigation */}
        <nav>
          <ul className="flex space-x-6">
            <li>
              <Link 
                href="/" 
                className={`text-gray-700 hover:text-blue-500 transition-colors ${
                  pathname === '/' ? 'text-blue-500 font-medium' : ''
                }`}
              >
                Home
              </Link>
            </li>
            <li>
              <Link 
                href="/track" 
                className={`text-gray-700 hover:text-blue-500 transition-colors ${
                  pathname === '/track' ? 'text-blue-500 font-medium' : ''
                }`}
              >
                Track
              </Link>
            </li>
            <li>
              <Link 
                href="/study" 
                className={`text-gray-700 hover:text-blue-500 transition-colors ${
                  pathname === '/study' ? 'text-blue-500 font-medium' : ''
                }`}
              >
                Study
              </Link>
            </li>
            <li>
              <Link 
                href="/journal" 
                className={`text-gray-700 hover:text-blue-500 transition-colors ${
                  pathname === '/journal' ? 'text-blue-500 font-medium' : ''
                }`}
              >
                Journal
              </Link>
            </li>
            <li>
              <Link 
                href="/relax" 
                className={`text-gray-700 hover:text-blue-500 transition-colors ${
                  pathname === '/relax' ? 'text-blue-500 font-medium' : ''
                }`}
              >
                Relax
              </Link>
            </li>
          </ul>
        </nav>
        {/* Icons */}
        <div className="flex items-center space-x-4">
          <button aria-label="Notifications">
            <MdNotifications className="text-2xl text-gray-700 hover:text-blue-500" />
          </button>
          <button aria-label="Profile">
            <MdPersonOutline className="text-2xl text-gray-700 hover:text-blue-500" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
