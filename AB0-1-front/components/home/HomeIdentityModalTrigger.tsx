'use client';

import React, { useState, useEffect } from 'react';
import IdentityBridgeModal from '@/components/ui/IdentityBridgeModal';

export default function HomeIdentityModalTrigger() {
  const [isOpen, setIsOpen] = useState(false);

  // Trigger modal after 5 seconds for demonstration, or when checking certain data
  useEffect(() => {
    const timer = setTimeout(() => {
      // Check if user has already seen it or is logged in (simulated)
      const hasSeenModal = localStorage.getItem('as_identity_bridge_seen');
      if (!hasSeenModal) {
        setIsOpen(true);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    // Mark as seen for session
    localStorage.setItem('as_identity_bridge_seen', 'true');
  };

  const handleLogin = () => {
    // Redirect to login or open login modal
    console.log('Redirecting to login...');
    window.location.href = '/login';
  };

  return (
    <IdentityBridgeModal 
      isOpen={isOpen} 
      onClose={handleClose} 
      onLogin={handleLogin} 
    />
  );
}
