'use client';

import React, { useState } from 'react';
import { FeedLeftRail } from './FeedLeftRail';
import { FeedRightRail } from './FeedRightRail';
import { FeedComposer } from './FeedComposer';
import { FeedTabs } from './FeedTabs';
import { InfiniteFeed } from './InfiniteFeed';

export function FeedShell() {
  const [activeView, setActiveView] = useState('for_you');

  return (
    <div className="max-w-[1240px] mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[250px_minmax(0,1fr)_300px] gap-6">
      {/* Left Rail Desktop */}
      <div className="hidden lg:block">
        <FeedLeftRail />
      </div>

      {/* Center Feed Column */}
      <main className="space-y-4">
        <FeedComposer />
        <FeedTabs activeView={activeView} onViewChange={setActiveView} />
        <InfiniteFeed view={activeView} />
      </main>

      {/* Right Rail Desktop */}
      <div className="hidden lg:block">
        <FeedRightRail />
      </div>
    </div>
  );
}
