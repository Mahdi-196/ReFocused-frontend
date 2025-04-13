// src/components/Header.tsx
import Link from 'next/link';
import { MdNotifications, MdPersonOutline } from 'react-icons/md';
import DevTools from './DevTools';

const Header = () => {
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
              <Link href="/" className="text-gray-700 hover:text-blue-500">
                Home
              </Link>
            </li>
            <li>
              <Link href="/track" className="text-gray-700 hover:text-blue-500">
                Track
              </Link>
            </li>
            <li>
              <Link href="/study" className="text-gray-700 hover:text-blue-500">
                Study
              </Link>
            </li>
            <li>
              <Link href="/journal" className="text-gray-700 hover:text-blue-500">
                Journal
              </Link>
            </li>
            <li>
              <Link href="/relax" className="text-gray-700 hover:text-blue-500">
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
