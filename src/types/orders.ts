export interface DishData {
  id: string;
  name: string;
  description: string;
  price: number;
  prep_time_minutes: number;
  cook_time_minutes: number;
  course: string;
  dietary_restrictions: string;
  spiciness_level: number;
}

export interface UserData {
  id: string;
  name: string;
  phone: string;
  legacyPoints: number;
}

export interface OrderItemData {
  dish_id: string;
  quantity: number;
  dish_details?: DishData;
}

export interface OrderData {
  id: string;
  user_id: string;
  restaurant_id: string;
  table_id: string;
  status: "pending" | "preparing" | "completed" | "paid";
  total_amount: number;
  special_notes: string;
  created_at: string;
  order_items: OrderItemData[];
  user_details?: UserData;
  priorityScore?: number;
}
