"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX, Menu, X } from "lucide-react";
import AuthButton from "./AuthButton";

import { useState } from "react";

const Header = () => {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/track", label: "Track" },
    { href: "/study", label: "Study" },
    { href: "/journal", label: "Journal" },
    { href: "/relax", label: "Relax" },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
    // Here you would also implement the actual sound toggling logic
    // For example, saving to localStorage or context
  };

  return (
    <>
      <motion.header 
        className="fixed top-0 left-0 right-0 bg-[#10182B]/80 backdrop-blur-md shadow py-4 border-b border-gray-400/20 z-50"
      >
        <div className="w-full flex items-center justify-between px-4 md:px-6">
          {/* Left Side - Hamburger Menu (Mobile) / Logo (Desktop) */}
          <div className="flex items-center">
            {/* Mobile Hamburger Menu */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleMobileMenu}
              className="md:hidden p-2 rounded-lg hover:bg-gray-700/50 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-white" />
              ) : (
                <Menu className="w-6 h-6 text-white" />
              )}
            </motion.button>

            {/* Desktop Logo */}
            <motion.div 
              className="hidden md:flex items-center space-x-2"
            >
              <img src="/favicon.svg" alt="Brain Logo" className="w-10 h-10" />
              <span className="text-xl font-bold bg-gradient-to-r from-[#42b9e5] to-[#4f83ed] bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(66,185,229,0.3)]">ReFocused</span>
            </motion.div>
          </div>

          {/* Center - Logo and Name (Mobile) / Navigation (Desktop) */}
          <div className="flex items-center">
            {/* Mobile Logo - Centered */}
            <motion.div 
              className="md:hidden flex items-center space-x-2"
            >
              <img src="/favicon.svg" alt="Brain Logo" className="w-8 h-8" />
              <span className="text-lg font-bold bg-gradient-to-r from-[#42b9e5] to-[#4f83ed] bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(66,185,229,0.3)]">ReFocused</span>
            </motion.div>

            {/* Desktop Navigation - Centered */}
            <nav className="hidden md:block">
              <ul className="flex space-x-6">
                {navItems.map((item, index) => (
                  <li key={item.href}>
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 * index }}
                    >
                      <Link
                        href={item.href}
                        className={`relative px-3 py-2 rounded-full transition-all duration-200 ${
                          pathname === item.href 
                            ? "bg-gradient-to-r from-[#42b9e5]/20 to-[#4f83ed]/20 text-[#42b9e5] font-medium" 
                            : "text-gray-300 hover:text-[#42b9e5] hover:bg-[#42b9e5]/10"
                        }`}
                      >
                        {pathname === item.href && (
                          <motion.div
                            layoutId="nav-indicator"
                            className="absolute inset-0 bg-gradient-to-r from-[#42b9e5]/20 to-[#4f83ed]/20 rounded-full"
                            transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                          />
                        )}
                        <span className="relative z-10">{item.label}</span>
                      </Link>
                    </motion.div>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Right Side - Sound Toggle & Profile */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex items-center space-x-2 md:space-x-4"
          >
            {/* Sound Toggle - Hidden on very small screens */}
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleSound}
              aria-label={soundEnabled ? "Mute sounds" : "Enable sounds"}
              className="hidden sm:flex items-center justify-center p-1.5 rounded-full transition-all duration-200"
              style={{
                background: soundEnabled ? "rgba(66, 185, 229, 0.15)" : "rgba(255, 100, 100, 0.15)",
              }}
            >
              {soundEnabled ? (
                <Volume2 className="w-5 h-5 text-[#42b9e5]" />
              ) : (
                <VolumeX className="w-5 h-5 text-red-400" />
              )}
            </motion.button>
            
            {/* Profile/Auth Button - Import AuthButton component */}
            <AuthButton />
          </motion.div>
        </div>
      </motion.header>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: -300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed top-[88px] left-0 right-0 bg-[#10182B]/95 backdrop-blur-md border-b border-gray-400/20 z-40 md:hidden"
          >
            <nav className="px-4 py-6">
              <ul className="space-y-4">
                {navItems.map((item, index) => (
                  <li key={item.href}>
                    <motion.div
                      initial={{ opacity: 0, x: -50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: 0.1 * index }}
                    >
                      <Link
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`block px-4 py-3 rounded-lg transition-all duration-200 ${
                          pathname === item.href 
                            ? "bg-gradient-to-r from-[#42b9e5]/20 to-[#4f83ed]/20 text-[#42b9e5] font-medium border-l-4 border-[#42b9e5]" 
                            : "text-gray-300 hover:text-[#42b9e5] hover:bg-[#42b9e5]/10"
                        }`}
                      >
                        <span className="text-lg">{item.label}</span>
                      </Link>
                    </motion.div>
                  </li>
                ))}
              </ul>
              
              {/* Mobile Sound Toggle */}
              <div className="mt-6 pt-6 border-t border-gray-600/30">
                <button 
                  onClick={toggleSound}
                  className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-[#42b9e5] hover:bg-[#42b9e5]/10 rounded-lg transition-all duration-200 w-full"
                >
                  {soundEnabled ? (
                    <>
                      <Volume2 className="text-xl text-[#42b9e5]" />
                      <span className="text-lg">Sound On</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="text-xl text-red-400" />
                      <span className="text-lg">Sound Off</span>
                    </>
                  )}
                </button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
