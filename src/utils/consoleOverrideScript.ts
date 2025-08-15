/**
 * Console Override Script
 * This script can be injected into the HTML head to catch console logs
 * before any other JavaScript executes
 */

export const consoleOverrideScript = `
(function() {
  'use strict';
  
  // Check if we're in development mode
  var isDevelopment = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' || 
                     window.location.hostname.includes('localhost') ||
                     (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_APP_ENV === 'development');
  
  // Store original console methods
  var originalConsole = {
    log: console.log,
    info: console.info,
    debug: console.debug,
    trace: console.trace,
    group: console.group,
    groupEnd: console.groupEnd,
    table: console.table
  };
  
  // Override console methods if not in development
  if (!isDevelopment) {
    console.log = function() {};
    console.info = function() {};
    console.debug = function() {};
    console.trace = function() {};
    console.group = function() {};
    console.groupEnd = function() {};
    console.table = function() {};
    
    // Keep warn and error for critical messages
    // console.warn and console.error remain unchanged
  }
  
  // Store override status for later use
  window.__consoleOverrideStatus = {
    isDevelopment: isDevelopment,
    isInitialized: true,
    logsHidden: !isDevelopment,
    originalConsole: originalConsole
  };
  
  // Log initialization status
  if (isDevelopment) {
    console.log('🔧 Console override initialized in development mode');
  } else {
    console.log('🚫 Console override initialized - logs hidden in production');
  }
})();
`;

export default consoleOverrideScript;
