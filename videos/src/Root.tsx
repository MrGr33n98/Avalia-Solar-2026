import React from 'react';
import {Composition} from 'remotion';
import {PromoVideo35s} from './PromoVideo35s';
import {PromoVideo60s} from './PromoVideo60s';
import {AvaliaHeroVideo25s} from './AvaliaHeroVideo25s';

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="AvaliaPromo35s"
        component={PromoVideo35s}
        durationInFrames={1050}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="AvaliaPromo60s"
        component={PromoVideo60s}
        durationInFrames={1800}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="AvaliaHero25s"
        component={AvaliaHeroVideo25s}
        durationInFrames={750}
        fps={30}
        width={1920}
        height={1080}
      />
      {/* 9:16 Vertical Versions for Instagram/Reels */}
      <Composition
        id="AvaliaPromo35sVertical"
        component={PromoVideo35s}
        durationInFrames={1050}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="AvaliaHero25sVertical"
        component={AvaliaHeroVideo25s}
        durationInFrames={750}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="AvaliaPromo60sVertical"
        component={PromoVideo60s}
        durationInFrames={1800}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
