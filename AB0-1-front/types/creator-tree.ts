export type CreatorTreeTheme = 'solar' | 'dark' | 'glass' | 'monochrome' | 'neo';
export type CreatorTreePresetKey = 'solar' | 'executive' | 'midnight' | 'minimal' | 'ocean' | 'editorial' | 'tech' | 'glass';

export interface CreatorTreeAppearance {
  background?: {
    type: 'color' | 'gradient' | 'image' | 'video';
    value: string; // hex, linear-gradient(...), or url(...)
    fit?: 'cover' | 'contain';
    position?: string;
    overlayColor?: string;
    overlayOpacity?: number; // 0 to 100
    blur?: number; // px
  };
  buttonStyle?: {
    variant: 'solid' | 'outline' | 'glass' | 'soft';
    rounding: 'none' | 'sm' | 'md' | 'lg' | 'full';
    shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    color?: string;
    textColor?: string;
  };
  fontFamily?: 'sans' | 'serif' | 'mono';
  fontColor?: string;
  textColor?: string;
  fontScale?: 'sm' | 'md' | 'lg';
}

export interface CreatorTreeAppearancePreset {
  key: CreatorTreePresetKey;
  label: string;
  theme_key: string;
  appearance: CreatorTreeAppearance;
}

export interface CreatorTreeSettings {
  theme_key: string;
  appearance: CreatorTreeAppearance;
  config?: Record<string, any>; // SEO, tracking, etc
}
