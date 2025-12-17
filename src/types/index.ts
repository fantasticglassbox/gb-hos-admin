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
  categories: MenuCategory[];
}

export interface Device {
  ID: number;
  hotel_id: number;
  name: string;
  room_number: string;
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
