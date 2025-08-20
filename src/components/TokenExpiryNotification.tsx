'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw, X } from 'lucide-react';

interface TokenExpiryNotificationProps {
  onRefresh?: () => void;
  onDismiss?: () => void;
}

export const TokenExpiryNotification: React.FC<TokenExpiryNotificationProps> = () => null;