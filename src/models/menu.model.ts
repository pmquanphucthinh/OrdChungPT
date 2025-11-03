export interface MenuResponse {
  error: number;
  data: MenuData;
  message: string;
}

export interface MenuData {
  pos_parent: PosParent;
  pos: Pos;
  items: MenuItem[];
  item_types: ItemType[];
}

export interface PosParent {
  name: string;
  Logo_Image: string;
  image: string;
}

export interface Pos {
  Pos_Name: string;
  Pos_Address: string;
  Phone_Number: string;
  Image_Path: string;
}

export interface ItemType {
  id: number;
  name: string;
  active: number;
  sort: number;
  store_id: number;
  text_id: string;
}

export interface MenuItem {
  id: number;
  name: string;
  ta_price: number;
  ots_price: number;
  image_url: string;
  description: string;
  status: string;
  type_id: string;
  customizations?: Customization[];
}

export interface Customization {
  min_permitted: number;
  max_permitted: number;
  name: string;
  options: CustomizationOption[];
}

export interface CustomizationOption {
  id: string;
  name: string;
  ta_price: number;
  ots_price: number;
  status: string;
}

export interface CartItem {
    id: number;
    name: string;
    basePrice: number;
    finalPrice: number;
    quantity: number;
    image_url: string;
    options: { group: string, option: string, price: number }[];
}
