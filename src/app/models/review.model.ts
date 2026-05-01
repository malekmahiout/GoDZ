export interface Review {
  id: string;
  placeId: string;
  authorName: string;
  rating: number;
  text: string;
  date: string;
  source: 'google' | 'internal';
  profilePhoto?: string;
}
