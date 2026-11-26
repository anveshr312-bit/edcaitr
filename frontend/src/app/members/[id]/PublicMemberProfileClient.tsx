'use client';

import React from 'react';
import { PublicMemberProfilePage } from '../../../components/identity/PublicMemberProfilePage';
import { PortalProvider } from '../../../context/PortalContext';
import { MotionProvider } from '../../../context/MotionContext';
import { ThemeProvider } from '../../../context/ThemeContext';

export function PublicMemberProfileClient({ memberId }: { memberId: string }) {
  return (
    <ThemeProvider>
      <MotionProvider>
        <PortalProvider>
          <div className="py-8">
            <PublicMemberProfilePage memberId={memberId} />
          </div>
        </PortalProvider>
      </MotionProvider>
    </ThemeProvider>
  );
}
