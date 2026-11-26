'use client';

import React from 'react';
import { IdentityStudioPage } from '../../../components/identity/IdentityStudioPage';
import { PortalProvider } from '../../../context/PortalContext';
import { MotionProvider } from '../../../context/MotionContext';
import { ThemeProvider } from '../../../context/ThemeContext';

export default function ProfilePage() {
  return (
    <ThemeProvider>
      <MotionProvider>
        <PortalProvider>
          <div className="py-8">
            <IdentityStudioPage />
          </div>
        </PortalProvider>
      </MotionProvider>
    </ThemeProvider>
  );
}
