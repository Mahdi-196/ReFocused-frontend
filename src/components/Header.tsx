"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { MdNotifications } from "react-icons/md";
import DevTools from "./devTools";
import AuthButton from "./AuthButton";
import { useState } from "react";

const Header = () => {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/track", label: "Track" },
    { href: "/study", label: "Study" },
    { href: "/journal", label: "Journal" },
    { href: "/relax", label: "Relax" },
  ];

  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 bg-[#10182B]/80 backdrop-blur-md shadow py-4 border-b border-gray-400 z-50"
    >
      <div className="w-full flex items-center justify-between px-6">
        {/* Logo */}
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-center space-x-2"
        >
          <img src="/favicon.svg" alt="Brain Logo" className="w-10 h-10" />
          <span className="text-xl font-bold text-white">ReFocused</span>
          <DevTools />
        </motion.div>

        {/* Navigation - Centered */}
        <nav className="absolute left-1/2 transform -translate-x-1/2">
          <ul className="flex space-x-6">
            {navItems.map((item, index) => (
              <motion.li 
                key={item.href}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 * index }}
              >
                <Link
                  href={item.href}
                  className={`relative px-3 py-2 rounded-full transition-all duration-200 ${
                    pathname === item.href 
                      ? "bg-blue-400/20 text-blue-400 font-medium" 
                      : "text-gray-300 hover:text-blue-400 hover:bg-blue-400/10"
                  }`}
                >
                  {pathname === item.href && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-0 bg-blue-400/20 rounded-full"
                      transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                    />
                  )}
                  <span className="relative z-10">{item.label}</span>
                </Link>
              </motion.li>
            ))}
          </ul>
        </nav>

        {/* Auth and Notifications */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex items-center space-x-4"
        >
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Notifications"
          >
            <MdNotifications className="text-2xl text-gray-300 hover:text-blue-400" />
          </motion.button>
          <AuthButton />
        </motion.div>
      </div>
    </motion.header>
  );
};

export default Header;
