'use client';

import dynamic from 'next/dynamic';

// Completely disable SSR for the entire landing page
const LandingPageWithoutSSR = dynamic(
  () => import('./client-page'),
  { 
    ssr: false,
    loading: () => (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#10182B',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          textAlign: 'center',
          color: '#42b9e5',
          fontSize: '24px'
        }}>
          ReFocused
          <div style={{
            fontSize: '14px',
            color: '#9ca3af',
            marginTop: '8px'
          }}>
            Loading...
          </div>
        </div>
      </div>
    )
  }
);

export default function LandingPage() {
  return <LandingPageWithoutSSR />;
} 