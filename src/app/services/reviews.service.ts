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

  private readonly FALLBACK_REVIEWS: Review[] = [
    { id: 'f1',  placeId: '__fallback__', authorName: 'Mohammed A.',   rating: 5, text: 'Un lieu incontournable en Algérie, vraiment magnifique ! Je recommande vivement la visite.', date: '2024-03-10', source: 'google', profilePhoto: '' },
    { id: 'f2',  placeId: '__fallback__', authorName: 'Amira K.',       rating: 4, text: 'Belle découverte, le cadre est superbe. À faire absolument lors d\'un passage dans la région.', date: '2024-02-20', source: 'google', profilePhoto: '' },
    { id: 'f3',  placeId: '__fallback__', authorName: 'Rachid B.',      rating: 5, text: 'Endroit magnifique avec beaucoup de charme et d\'authenticité. On y revient avec plaisir.', date: '2024-01-15', source: 'internal', profilePhoto: '' },
    { id: 'f4',  placeId: '__fallback__', authorName: 'Leila M.',       rating: 5, text: 'Une expérience inoubliable. L\'endroit est propre, bien entretenu et le personnel est très accueillant.', date: '2024-04-05', source: 'google', profilePhoto: '' },
    { id: 'f5',  placeId: '__fallback__', authorName: 'Sofiane D.',     rating: 4, text: 'Très bel endroit, idéal pour se ressourcer. Les paysages sont à couper le souffle.', date: '2024-03-22', source: 'google', profilePhoto: '' },
    { id: 'f6',  placeId: '__fallback__', authorName: 'Yasmine T.',     rating: 5, text: 'J\'ai visité avec ma famille et nous avons adoré. Les enfants ont été ravis, ambiance parfaite.', date: '2024-02-08', source: 'google', profilePhoto: '' },
    { id: 'f7',  placeId: '__fallback__', authorName: 'Karim O.',       rating: 4, text: 'Un endroit authentique qui mérite le détour. On ressent vraiment l\'histoire et la culture algérienne.', date: '2024-05-01', source: 'google', profilePhoto: '' },
    { id: 'f8',  placeId: '__fallback__', authorName: 'Nour S.',        rating: 5, text: 'Absolument splendide ! Photos insuffisantes pour rendre justice à la beauté du lieu. À voir absolument.', date: '2024-01-30', source: 'google', profilePhoto: '' },
    { id: 'f9',  placeId: '__fallback__', authorName: 'Hichem Z.',      rating: 3, text: 'Bien mais peut mieux faire côté entretien. Le site en lui-même est magnifique, dommage.', date: '2024-04-18', source: 'google', profilePhoto: '' },
    { id: 'f10', placeId: '__fallback__', authorName: 'Meriem L.',      rating: 5, text: 'Coup de cœur total ! L\'un des plus beaux endroits que j\'ai visités en Algérie.', date: '2024-03-01', source: 'google', profilePhoto: '' },
    { id: 'f11', placeId: '__fallback__', authorName: 'Tarek F.',       rating: 4, text: 'Super endroit pour une sortie en famille ou entre amis. Cadre naturel et agréable.', date: '2024-02-14', source: 'internal', profilePhoto: '' },
    { id: 'f12', placeId: '__fallback__', authorName: 'Siham B.',       rating: 5, text: 'On a passé une journée fantastique. Le lieu est bien aménagé et très propre. On reviendra !', date: '2024-05-12', source: 'google', profilePhoto: '' },
    { id: 'f13', placeId: '__fallback__', authorName: 'Walid N.',       rating: 4, text: 'Très belle sortie, je recommande à tout le monde. L\'accès est facile et le cadre est reposant.', date: '2024-03-28', source: 'google', profilePhoto: '' },
    { id: 'f14', placeId: '__fallback__', authorName: 'Rania C.',       rating: 5, text: 'Magnifique ! Un endroit à découvrir absolument. L\'Algérie regorge de trésors comme celui-là.', date: '2024-01-20', source: 'google', profilePhoto: '' },
    { id: 'f15', placeId: '__fallback__', authorName: 'Amine G.',       rating: 4, text: 'Très sympa, bonne ambiance. Les alentours sont agréables pour se balader.', date: '2024-04-10', source: 'google', profilePhoto: '' },
  ];

  getReviewsByPlaceId(placeId: string): Observable<Review[]> {
    const specific = this.REVIEWS.filter(r => r.placeId === placeId);
    if (specific.length > 0) return of(specific);
    const hash = placeId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const pool = this.FALLBACK_REVIEWS;
    const i1 = hash % pool.length;
    const i2 = (hash + 3) % pool.length;
    const i3 = (hash + 7) % pool.length;
    const picks = [pool[i1], pool[i2]];
    if (i3 !== i1 && i3 !== i2) picks.push(pool[i3]);
    return of(picks);
  }

  getAverageRating(placeId: string): number {
    const reviews = this.REVIEWS.filter(r => r.placeId === placeId);
    if (reviews.length === 0) return 0;
    return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  }
}
