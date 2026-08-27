export type CreatorTreeTheme = 'solar' | 'dark' | 'glass' | 'monochrome' | 'neo';

export interface CreatorTreeAppearance {
  background?: {
    type: 'color' | 'gradient' | 'image' | 'video';
    value: string; // hex, linear-gradient(...), or url(...)
    overlayOpacity?: number; // 0 to 100
  };
  buttonStyle?: {
    variant: 'solid' | 'outline' | 'glass' | 'soft';
    rounding: 'none' | 'sm' | 'md' | 'lg' | 'full';
    shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    color?: string;
    textColor?: string;
  };
  fontFamily?: 'sans' | 'serif' | 'mono' | 'outfit';
  textColor?: string;
}

export interface CreatorTreeSettings {
  theme_key: CreatorTreeTheme;
  appearance: CreatorTreeAppearance;
}
