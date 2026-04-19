
export interface Product {
  id: string;
  slug?: string;
  title: string;
  category: string;
  price: number;
  originalPrice: number;
  discount: string;
  rating: number;
  image: string;
  isNew?: boolean;
}

export interface CartItem extends Product {
  quantity: number;
  size?: string;
}