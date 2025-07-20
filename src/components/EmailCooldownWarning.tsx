"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { formatRemainingTime, formatAvailableTime } from '@/utils/timeFormatting';

interface EmailCooldownWarningProps {
  hoursRemaining: number;
  availableAt: string;
  className?: string;
}

const EmailCooldownWarning: React.FC<EmailCooldownWarningProps> = ({ 
  hoursRemaining, 
  availableAt,
  className = ''
}) => {
  const formattedTime = formatRemainingTime(hoursRemaining);
  const formattedAvailableTime = formatAvailableTime(availableAt);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 bg-orange-500/20 border border-orange-500/30 text-orange-400 rounded-lg ${className}`}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="flex-1">
          <div className="font-medium text-orange-300 mb-1">
            Email Recently Deleted
          </div>
          <div className="text-sm text-orange-200 mb-2">
            This email address was recently used for an account that was deleted. 
            For security reasons, you cannot create a new account with this email yet.
          </div>
          <div className="text-sm">
            <div className="flex flex-col space-y-1">
              <div>
                <span className="font-medium">Try again in:</span> {formattedTime}
              </div>
              <div className="text-xs text-orange-300">
                Available after: {formattedAvailableTime}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default EmailCooldownWarning;