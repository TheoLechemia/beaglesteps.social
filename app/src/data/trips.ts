import type { Trip } from '../types/trip';

export const trips: Trip[] = [
  {
    id: 'southeast-asia-2026',
    title: 'Southeast Asia — summer 2026',
    subtitle: 'Hanoï → Bangkok',
    description:
      'A northbound trip across Southeast Asia — Vietnam, Cambodia, Thailand — from June to August 2026.',
    author: {
      handle: 'theo.eurosky.social',
      postedAgo: '3 weeks ago',
      avatar: { initials: 'TL', bg: '#E1F5EE', color: '#0F6E56' },
    },
    status: 'ongoing',
    stats: { distance: '4 200 km', duration: '54 days', likes: 24 },
    followers: {
      count: 24,
      avatars: [
        { initials: 'A', bg: '#E1F5EE', color: '#0F6E56' },
        { initials: 'B', bg: '#FAECE7', color: '#993C1D' },
        { initials: 'C', bg: '#EEEDFE', color: '#534AB7' },
      ],
    },
    mapPin: { top: '34%', left: '66%', color: '#1D9E75', label: 'Southeast Asia' },
    steps: [
      {
        id: 'paris-departure',
        title: 'Départ — Paris CDG',
        date: '15 juin 2026',
        location: 'Paris, France',
        stats: [
          { value: '16h', label: 'Vol' },
          { value: '1 escale', label: 'Via Dubai' },
          { value: 'Step 1', label: 'du voyage' },
        ],
        description:
          "Vol de nuit pour Hanoï via Dubai. 16h de trajet, un seul film regardé, trois tentatives de sommeil ratées.",
        photos: 2,
        routePoint: { x: 30, y: 170 },
        mapPosition: { top: '76%', left: '28%' },
      },
      {
        id: 'hanoi-arrival',
        title: 'Arrivée à Hanoï',
        date: '28 juin 2026',
        location: 'Hanoï, Vietnam',
        stats: [
          { value: '34°C', label: 'Température' },
          { value: 'phở', label: 'Premier repas' },
          { value: 'Step 2', label: 'du voyage' },
        ],
        description:
          "Premier contact avec la ville. Le quartier ancien est un labyrinthe de scooters. Traverser la rue demande une confiance aveugle.",
        photos: 5,
        routePoint: { x: 200, y: 80 },
        mapPosition: { top: '42%', left: '62%' },
      },
      {
        id: 'ha-long-bay',
        title: "Baie d'Ha Long",
        date: '25 juin 2026',
        location: 'Ha Long, Vietnam',
        stats: [
          { value: '2 nuits', label: 'Sur le bateau' },
          { value: '1 600', label: 'Îles et îlots' },
          { value: 'Step 3', label: 'du voyage' },
        ],
        description:
          "2 jours à naviguer entre les karsts. Le brouillard du matin donnait l'impression d'être dans un film de Miyazaki.",
        photos: 8,
        routePoint: { x: 310, y: 38 },
        mapPosition: { top: '22%', left: '72%' },
      },
      {
        id: 'hoi-an',
        title: 'Hội An',
        date: '20 juin 2026',
        location: 'Hội An, Vietnam',
        stats: [
          { value: 'UNESCO', label: 'Classée' },
          { value: 'cao lầu', label: 'Spécialité' },
          { value: 'Step 4', label: 'du voyage' },
        ],
        description:
          "La vieille ville est figée dans le temps. Les lanternes en papier illuminent les ruelles le soir.",
        photos: 12,
        routePoint: { x: 375, y: 18 },
        mapPosition: { top: '12%', left: '80%' },
      },
    ],
  },
  {
    id: 'patagonie-2026',
    title: 'Patagonie — avril 2026',
    subtitle: 'Puerto Natales → El Chaltén',
    description:
      'Trek W dans le Torres del Paine puis descente vers El Chaltén, entre glaciers et vent permanent.',
    author: {
      handle: 'marie.bsky.social',
      postedAgo: '2 months ago',
      avatar: { initials: 'ML', bg: '#FAECE7', color: '#993C1D' },
    },
    status: 'ended',
    stats: { distance: '210 km', duration: '18 days', likes: 51 },
    followers: {
      count: 51,
      avatars: [
        { initials: 'D', bg: '#E1F5EE', color: '#0F6E56' },
        { initials: 'E', bg: '#EEEDFE', color: '#534AB7' },
      ],
    },
    mapPin: { top: '72%', left: '18%', color: '#D85A30', label: 'Patagonie' },
    steps: [
      {
        id: 'puerto-natales',
        title: 'Puerto Natales',
        date: '2 avril 2026',
        location: 'Puerto Natales, Chili',
        stats: [
          { value: '8°C', label: 'Température' },
          { value: 'Ravito', label: 'Dernier magasin' },
          { value: 'Step 1', label: 'du voyage' },
        ],
        description:
          "Derniers achats avant le trek : gaz, gaufrettes et un poncho de pluie qui ne servira à rien.",
        photos: 3,
        routePoint: { x: 30, y: 170 },
        mapPosition: { top: '80%', left: '22%' },
      },
      {
        id: 'torres-w-trek',
        title: 'Trek W — Torres del Paine',
        date: '6 avril 2026',
        location: 'Torres del Paine, Chili',
        stats: [
          { value: '5 jours', label: 'Sur le trek' },
          { value: '90 km/h', label: 'Rafales' },
          { value: 'Step 2', label: 'du voyage' },
        ],
        description:
          'Le vent couche presque la tente chaque nuit. Les tours de granite valent chaque effort au lever du soleil.',
        photos: 9,
        routePoint: { x: 180, y: 90 },
        mapPosition: { top: '50%', left: '46%' },
      },
      {
        id: 'el-chalten',
        title: 'El Chaltén',
        date: '14 avril 2026',
        location: 'El Chaltén, Argentine',
        stats: [
          { value: 'Fitz Roy', label: 'Vue au sommet' },
          { value: '0°C', label: 'Au petit matin' },
          { value: 'Step 3', label: 'du voyage' },
        ],
        description:
          'Capitale argentine du trekking. Lever à 4h pour voir le Fitz Roy s’embraser au lever du soleil.',
        photos: 14,
        routePoint: { x: 375, y: 18 },
        mapPosition: { top: '18%', left: '78%' },
      },
    ],
  },
  {
    id: 'japon-2026',
    title: 'Japon — printemps des cerisiers',
    subtitle: 'Tokyo → Osaka',
    description:
      'Tokyo, Kyoto, Osaka pendant la pleine floraison des sakura, entre temples et konbini nocturnes.',
    author: {
      handle: 'sarah.bsky.social',
      postedAgo: '5 months ago',
      avatar: { initials: 'SB', bg: '#EEEDFE', color: '#534AB7' },
    },
    status: 'ended',
    stats: { distance: '550 km', duration: '21 days', likes: 112 },
    followers: {
      count: 112,
      avatars: [
        { initials: 'F', bg: '#FAECE7', color: '#993C1D' },
        { initials: 'G', bg: '#E1F5EE', color: '#0F6E56' },
        { initials: 'H', bg: '#EEEDFE', color: '#534AB7' },
      ],
    },
    mapPin: { top: '28%', left: '74%', color: '#7F77DD', label: 'Japon' },
    steps: [
      {
        id: 'tokyo',
        title: 'Tokyo',
        date: '28 mars 2026',
        location: 'Tokyo, Japon',
        stats: [
          { value: '15°C', label: 'Température' },
          { value: 'Shibuya', label: 'Premier quartier' },
          { value: 'Step 1', label: 'du voyage' },
        ],
        description:
          'Arrivée à Haneda puis plongée directe dans le croisement de Shibuya. Les distributeurs automatiques vendent absolument tout.',
        photos: 10,
        routePoint: { x: 30, y: 170 },
        mapPosition: { top: '78%', left: '26%' },
      },
      {
        id: 'kyoto',
        title: 'Kyoto',
        date: '3 avril 2026',
        location: 'Kyoto, Japon',
        stats: [
          { value: '1 600', label: 'Temples' },
          { value: 'Sakura', label: 'Pleine floraison' },
          { value: 'Step 2', label: 'du voyage' },
        ],
        description:
          "Fushimi Inari à l'aube pour éviter la foule. Les pétales de cerisiers tombent sur le chemin comme dans un cliché parfait.",
        photos: 18,
        routePoint: { x: 220, y: 70 },
        mapPosition: { top: '38%', left: '58%' },
      },
      {
        id: 'osaka',
        title: 'Osaka',
        date: '12 avril 2026',
        location: 'Osaka, Japon',
        stats: [
          { value: 'Takoyaki', label: 'Spécialité' },
          { value: 'Dotonbori', label: 'Quartier phare' },
          { value: 'Step 3', label: 'du voyage' },
        ],
        description:
          'La cuisine de rue prend le pas sur tout le reste. Le quartier de Dotonbori ne dort jamais vraiment.',
        photos: 15,
        routePoint: { x: 375, y: 18 },
        mapPosition: { top: '16%', left: '80%' },
      },
    ],
  },
];

export function getTripById(id: string): Trip | undefined {
  return trips.find((trip) => trip.id === id);
}
