"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { Volume2, VolumeX, Menu, X } from "lucide-react";

import { useState, useCallback, memo } from "react";
import AuthButton from './AuthButton';
import { useGlobalAudio } from '@/contexts/AudioContext';

const Header = () => {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isGloballyMuted, toggleGlobalMute } = useGlobalAudio();

  const navItems = [
    { href: "/home", label: "Home" },
    { href: "/track", label: "Track" },
    { href: "/study", label: "Study" },
    { href: "/journal", label: "Journal" },
    { href: "/relax", label: "Relax" },
  ];

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

  const toggleSound = useCallback(() => {
    toggleGlobalMute();
  }, [toggleGlobalMute]);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  return (
    <>
      <motion.header 
        className="fixed top-0 left-0 right-0 bg-[#1A2537]/90 backdrop-blur-md shadow py-4 border-b border-gray-400/20 z-50"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
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
            <motion.div className="hidden md:flex items-center space-x-2">
              <img src="/favicon.svg" alt="Brain Logo" className="w-10 h-10" width="40" height="40" />
              <Link href="/ai">
                <span className="text-xl font-bold bg-gradient-to-r from-[#42b9e5] to-[#4f83ed] bg-clip-text text-transparent">
                  ReFocused
                </span>
              </Link>
            </motion.div>
          </div>

          {/* Center - Logo and Name (Mobile) / Navigation (Desktop) */}
          <div className="flex items-center">
            {/* Mobile Logo - Centered */}
            <motion.div className="md:hidden flex items-center space-x-2">
              <img src="/favicon.svg" alt="Brain Logo" className="w-8 h-8" width="32" height="32" />
              <Link href="/ai">
                <span className="text-lg font-bold bg-gradient-to-r from-[#42b9e5] to-[#4f83ed] bg-clip-text text-transparent">
                  ReFocused
                </span>
              </Link>
            </motion.div>

            {/* Desktop Navigation - Centered */}
            <nav className="hidden md:block">
              <LayoutGroup id="header-nav">
                <ul className="flex space-x-6 relative">
                  {navItems.map((item, index) => (
                    <li key={item.href}>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2, delay: 0.05 * index }}
                      >
                        <Link
                          href={item.href}
                          className={`relative block px-4 text-center transition-all duration-200 h-10 ${
                            pathname === item.href 
                              ? "text-[#42b9e5] font-medium" 
                              : "text-gray-300 hover:text-[#42b9e5]"
                          }`}
                        >
                          {pathname === item.href && (
                            <motion.div
                              layoutId="nav-circle"
                              layout
                              initial={false}
                              className="absolute inset-0 bg-gradient-to-r from-[#42b9e5]/15 to-[#4f83ed]/15 rounded-full border border-[#42b9e5]/20"
                              transition={{
                                layout: { duration: 0.25 },
                                type: "spring",
                                stiffness: 400,
                                damping: 30,
                                mass: 1,
                              }}
                              style={{ willChange: 'transform' }}
                            />
                          )}
                          <span className="relative z-10 leading-10">{item.label}</span>
                        </Link>
                      </motion.div>
                    </li>
                  ))}
                </ul>
              </LayoutGroup>
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
              aria-label={!isGloballyMuted ? "Mute sounds" : "Enable sounds"}
              className="hidden sm:flex items-center justify-center p-1.5 rounded-full transition-all duration-200"
              style={{
                background: !isGloballyMuted ? "rgba(66, 185, 229, 0.15)" : "rgba(255, 100, 100, 0.15)",
              }}
            >
              {!isGloballyMuted ? (
                <Volume2 className="w-5 h-5 text-[#42b9e5]" />
              ) : (
                <VolumeX className="w-5 h-5 text-red-400" />
              )}
            </motion.button>
            {/* Profile/Auth Button restored */}
            <AuthButton />
          </motion.div>
        </div>
      </motion.header>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, transform: "translateX(-300px)" }}
            animate={{ opacity: 1, transform: "translateX(0px)" }}
            exit={{ opacity: 0, transform: "translateX(-300px)" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ willChange: 'transform, opacity' }}
            className="fixed top-[88px] left-0 right-0 bg-[#1A2537]/95 backdrop-blur-md border-b border-gray-400/20 z-40 md:hidden"
          >
            <nav className="px-4 py-6">
              <ul className="space-y-4">
                {navItems.map((item, index) => (
                  <li key={item.href}>
                    <motion.div
                      initial={{ opacity: 0, transform: "translateX(-50px)" }}
                      animate={{ opacity: 1, transform: "translateX(0px)" }}
                      transition={{ duration: 0.2, delay: 0.1 * index }}
                      style={{ willChange: 'transform, opacity' }}
                    >
                      <Link
                        href={item.href}
                        onClick={closeMobileMenu}
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
                  {!isGloballyMuted ? (
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
            onClick={closeMobileMenu}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default memo(Header);
