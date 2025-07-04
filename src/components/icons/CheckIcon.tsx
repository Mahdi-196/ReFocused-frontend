import React from 'react';

interface CheckIconProps {
  className?: string;
  size?: number;
  color?: string;
}

export default function CheckIcon({ 
  className = "w-5 h-5", 
  size, 
  color = "#22c55e" 
}: CheckIconProps) {
  const iconSize = size ? { width: size, height: size } : {};
  
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24"
      height="24"
      viewBox="0 0 24 24" 
      fill="none" 
      stroke={color}
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={`lucide lucide-check-check ${className}`}
      style={iconSize}
    >
      <path d="M18 6 7 17l-5-5"/>
      <path d="m22 10-7.5 7.5L13 16"/>
    </svg>
  );
} 