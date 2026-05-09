export interface Place {
  id: string;
  name: string;
  nameAr: string;
  nameFr: string;
  nameEn: string;
  nameEs?: string;
  nameDe?: string;
  category: Category;
  wilaya: string;
  wilayaCode?: number;
  description: string;
  descriptionAr: string;
  descriptionEn?: string;
  descriptionEs?: string;
  descriptionDe?: string;
  images: string[];
  videoUrl?: string;
  address: string;
  latitude: number;
  longitude: number;
  googleRating: number;
  googleReviewCount: number;
  googlePlaceId: string;
  popularity: number;
  isFeatured: boolean;
  audioGuideUrl?: string;
  openingHours?: string;
  craftType?: CraftType;
}

export type Category =
  | 'monuments'
  | 'culture'
  | 'plages'
  | 'montagnes'
  | 'desert'
  | 'restaurants'
  | 'salons'
  | 'artisanat';

export type CraftType =
  | 'bijouterie'
  | 'poterie'
  | 'tissage'
  | 'broderie'
  | 'maroquinerie'
  | 'boiserie'
  | 'dinanderie'
  | 'vannerie'
  | 'vetements'
  | 'zellige'
  | 'parfumerie'
  | 'produits'
  | 'divers';
