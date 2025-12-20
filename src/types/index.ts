export interface ModifierOption {
  ID: number;
  name: string;
  price_delta: number;
}

export interface MenuModifier {
  ID: number;
  name: string;
  multi_select: boolean;
  options: ModifierOption[];
}

export interface MenuItem {
  ID: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  modifiers: MenuModifier[];
  categoryId?: number; // Helper for filtering
  categoryName?: string; // Helper for filtering
}

export interface MenuCategory {
  ID: number;
  name: string;
  items: MenuItem[];
}

export interface Service {
  ID: number;
  name: string;
  type: string;
  image_url?: string;
  categories: MenuCategory[];
}

export interface Device {
  ID: number;
  hotel_id: number;
  room_id: number;
  room?: Room;
  name: string;
  status: string;
  fcm_token?: string;
  uuid?: string;
}

export interface Facility {
  ID: number;
  name: string;
  image_url: string; // Deprecated, kept for backward compatibility
  image_urls?: string[]; // Array of image URLs
  opening_time?: string; // e.g. "06:00"
  closing_time?: string; // e.g. "22:00"
  description?: string;
}

export interface Room {
  ID: number;
  hotel_id: number;
  number: string;
  type: string;
  price: number;
  floor_no: number;
  status: string; // available, occupied, maintenance
}

export interface HotelSetting {
  ID: number;
  hotel_id: number;
  app_background_image: string;
  localization?: string; // JSON string for localization (ID, EN, ZH)
  default_lang?: string; // Default language: "ID", "EN", or "ZH"
  default_layout?: string; // "list" or "grid"
  no_item_section?: number; // Number of items per section for grid layout
  display_size?: string; // "normal", "large", "extra_large" - Controls UI scaling for accessibility
}
