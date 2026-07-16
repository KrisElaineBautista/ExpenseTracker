import { Utensils, Car, ShoppingBag, Banknote, Heart, Coffee, Home, Briefcase } from 'lucide-react-native';

export const CATEGORIES = {
  Food: { icon: Utensils, color: '#ff6a00' },
  Transport: { icon: Car, color: '#00c3ff' },
  Shopping: { icon: ShoppingBag, color: '#8400ff' },
  Health: { icon: Heart, color: '#ff0000' },
  Coffee: { icon: Coffee, color: '#a14300' },
  Rent: { icon: Home, color: '#0004ff' },
  Salary: { icon: Banknote, color: '#00ff5e' },
  Freelance: { icon: Briefcase, color: '#fffb00' },
};

export type CategoryType = keyof typeof CATEGORIES;