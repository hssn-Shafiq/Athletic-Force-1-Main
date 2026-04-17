
export interface Product {
  id: string;
  title: string;
  category: string;
  price: number;
  originalPrice: number;
  discount: string;
  rating: number;
  image: string;
  isNew?: boolean;
}
