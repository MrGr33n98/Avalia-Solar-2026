export interface Banner {
  id: number;
  delivery_id?: string | null;
  title: string;
  description?: string | null;
  alt_text?: string | null;
  link?: string | null;
  link_url?: string | null;
  image_url?: string | null;
  image_mobile_url?: string | null;
  headline?: string | null;
  subtitle?: string | null;
  cta_label?: string | null;
  cta_href?: string | null;
  cta_enabled?: boolean;
  theme?: 'dark' | 'light' | string;
  cta_variant?: 'solar_yellow' | 'primary_blue' | 'outline' | 'custom' | string;
  hero_background_color?: string | null;
  hero_text_color?: string | null;
  cta_background_color?: string | null;
  cta_text_color?: string | null;
  overlay_variant?: 'none' | 'left_soft' | 'left_strong' | string;
  creative_mode?: 'photo_with_html' | 'image_only' | string;
  object_position_desktop_x?: number;
  object_position_desktop_y?: number;
  object_position_mobile_x?: number;
  object_position_mobile_y?: number;
  whole_banner_clickable?: boolean;
  creative_version?: number;
  banner_type?: string;
  position?: string;
  width?: number | null;
  height?: number | null;
  category_ids?: number[];
  sponsored?: boolean;
  active?: boolean;
  start_date?: string | null;
  end_date?: string | null;
}

export interface BannerPlacement {
  key: string;
  status: 'active' | 'planned';
  dimensions: [number, number];
  commercial: string;
}
