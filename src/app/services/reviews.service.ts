import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Review } from '../models/review.model';

@Injectable({ providedIn: 'root' })
export class ReviewsService {

  private readonly REVIEWS: Review[] = [
    // La Casbah d'Alger
    { id: 'r1', placeId: 'alg_m03', authorName: 'Yacine Benali', rating: 5,
      text: 'Un lieu magique chargé d\'histoire. Les ruelles étroites et les palais ottomans sont absolument magnifiques. Un incontournable d\'Alger !',
      date: '2024-03-15', source: 'google', profilePhoto: '' },
    { id: 'r2', placeId: 'alg_m03', authorName: 'Fatima Zouaoui', rating: 4,
      text: 'Très belle visite, les ruelles sont dépaysantes. Prenez un guide local, ça vaut vraiment le coup.',
      date: '2024-02-28', source: 'google', profilePhoto: '' },
    { id: 'r3', placeId: 'alg_m03', authorName: 'Ahmed Kaci', rating: 5,
      text: 'La Casbah c\'est l\'âme d\'Alger. J\'y retourne chaque année et je découvre toujours quelque chose de nouveau.',
      date: '2024-01-10', source: 'internal', profilePhoto: '' },

    // Grande Mosquée d'Algérie
    { id: 'r4', placeId: 'alg_m01', authorName: 'Karim Boudoukha', rating: 5,
      text: 'Monumentale et impressionnante. Le minaret de 265m est visible de toute la baie. Un chef-d\'œuvre de l\'architecture moderne islamique.',
      date: '2024-04-02', source: 'google', profilePhoto: '' },
    { id: 'r5', placeId: 'alg_m01', authorName: 'Soraya Messikh', rating: 5,
      text: 'La plus grande mosquée d\'Afrique, et ça se voit ! L\'intérieur est somptueux, les proportions sont gigantesques.',
      date: '2024-03-20', source: 'google', profilePhoto: '' },

    // Basilique Notre-Dame d'Afrique
    { id: 'r6', placeId: 'alg_m02', authorName: 'Marc Dubois', rating: 5,
      text: 'Vue panoramique époustouflante sur toute la baie d\'Alger. L\'architecture romano-byzantine est magnifique.',
      date: '2024-02-14', source: 'google', profilePhoto: '' },
    { id: 'r7', placeId: 'alg_m02', authorName: 'Sophie Lambert', rating: 5,
      text: 'Un lieu de paix et de beauté. L\'inscription "priez pour nous et pour les Musulmans" est très touchante.',
      date: '2023-12-05', source: 'google', profilePhoto: '' },

    // Mémorial du Martyr
    { id: 'r8', placeId: 'alg_m04', authorName: 'Mohamed Tahar', rating: 5,
      text: 'Un symbole fort de l\'indépendance algérienne. Le monument est impressionnant, le musée très instructif.',
      date: '2024-01-22', source: 'internal', profilePhoto: '' },

    // Mosquée Ketchaoua
    { id: 'r9', placeId: 'alg_m05', authorName: 'Nadia Aouad', rating: 4,
      text: 'Très belle mosquée au pied de la Casbah. L\'histoire de ce lieu est fascinante — cathédrale puis mosquée.',
      date: '2024-05-10', source: 'google', profilePhoto: '' },

    // Tassili n'Ajjer (desert)
    { id: 'r10', placeId: 'djanet_d01', authorName: 'Hamid Guergour', rating: 5,
      text: 'Une expérience hors du commun. Les peintures rupestres vieilles de 10 000 ans donnent le vertige.',
      date: '2024-04-18', source: 'google', profilePhoto: '' },
    { id: 'r11', placeId: 'djanet_d01', authorName: 'Lyès Boudiaf', rating: 5,
      text: 'Trek inoubliable avec un guide touareg. Le lever de soleil sur les formations rocheuses est magique.',
      date: '2024-03-08', source: 'google', profilePhoto: '' },

    // Ghardaïa
    { id: 'r12', placeId: 'ghardaia_c01', authorName: 'Radia Bensalem', rating: 5,
      text: 'Ghardaïa est une merveille architecturale. La ville des Mozabites est unique au monde, une vraie leçon d\'urbanisme.',
      date: '2024-02-25', source: 'google', profilePhoto: '' },
  ];

  // Avis génériques utilisés en fallback pour tous les lieux sans avis spécifiques
  private readonly FALLBACK_REVIEWS: Review[] = [
    { id: 'f1', placeId: '__fallback__', authorName: 'Mohammed A.', rating: 5,
      text: 'Un lieu incontournable en Algérie, vraiment magnifique ! Je recommande vivement la visite.',
      date: '2024-03-10', source: 'google', profilePhoto: '' },
    { id: 'f2', placeId: '__fallback__', authorName: 'Amira K.', rating: 4,
      text: 'Belle découverte, le cadre est superbe. À faire absolument lors d\'un passage dans la région.',
      date: '2024-02-20', source: 'google', profilePhoto: '' },
    { id: 'f3', placeId: '__fallback__', authorName: 'Rachid B.', rating: 5,
      text: 'Endroit magnifique avec beaucoup de charme et d\'authenticité. On y revient avec plaisir.',
      date: '2024-01-15', source: 'internal', profilePhoto: '' },
  ];

  getReviewsByPlaceId(placeId: string): Observable<Review[]> {
    const specific = this.REVIEWS.filter(r => r.placeId === placeId);
    return of(specific.length > 0 ? specific : this.FALLBACK_REVIEWS);
  }

  getAverageRating(placeId: string): number {
    const reviews = this.REVIEWS.filter(r => r.placeId === placeId);
    if (reviews.length === 0) return 0;
    return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  }
}
