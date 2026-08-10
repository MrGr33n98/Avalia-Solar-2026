export interface Banner {
  id: number;
  delivery_id?: string | null;
  title: string;
  description?: string | null;
  link?: string | null;
  link_url?: string | null;
  image_url?: string | null;
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
