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
  name: string;
  room_number: string;
  status: string;
  fcm_token?: string;
  uuid?: string;
}
