import type { Photo } from '../types/photo';

export const featuredPhotos: Photo[] = [
  {
    id: '1',
    title: 'Mountain Sunrise',
    description: 'A breathtaking sunrise captured in the Swiss Alps',
    imageUrl: '/photos/mountain-sunrise.jpg',
    category: 'landscapes',
    tags: ['mountains', 'sunrise', 'nature'],
    metadata: {
      iso: 100,
      shutterSpeed: '1/125',
      aperture: 'f/8',
      location: 'Swiss Alps',
      camera: 'Sony A7R IV',
      lens: '16-35mm f/2.8'
    },
    featured: true,
    dateCreated: '2023-12-01'
  },
  {
    id: '2',
    title: 'Urban Life',
    description: 'Street photography capturing the essence of city life',
    imageUrl: '/photos/urban-life.jpg',
    category: 'street',
    tags: ['city', 'people', 'urban'],
    metadata: {
      iso: 400,
      shutterSpeed: '1/250',
      aperture: 'f/4',
      location: 'New York City',
      camera: 'Sony A7R IV',
      lens: '24-70mm f/2.8'
    },
    featured: true,
    dateCreated: '2023-12-02'
  },
  {
    id: '3',
    title: 'Portrait in Nature',
    description: 'Environmental portrait photography in natural settings',
    imageUrl: '/photos/nature-portrait.jpg',
    category: 'portraits',
    tags: ['portrait', 'nature', 'people'],
    metadata: {
      iso: 200,
      shutterSpeed: '1/200',
      aperture: 'f/2.8',
      location: 'Central Park',
      camera: 'Sony A7R IV',
      lens: '85mm f/1.4'
    },
    featured: true,
    dateCreated: '2023-12-03'
  },
  {
    id: '4',
    title: 'Autumn Colors',
    description: 'Vibrant fall colors in a peaceful forest setting',
    imageUrl: '/photos/autumn-colors.jpg',
    category: 'landscapes',
    tags: ['autumn', 'forest', 'nature'],
    metadata: {
      iso: 100,
      shutterSpeed: '1/60',
      aperture: 'f/11',
      location: 'Vermont',
      camera: 'Sony A7R IV',
      lens: '70-200mm f/2.8'
    },
    featured: true,
    dateCreated: '2023-12-04'
  },
  {
    id: '5',
    title: 'City Lights',
    description: 'Night photography showcasing urban architecture',
    imageUrl: '/photos/city-lights.jpg',
    category: 'architecture',
    tags: ['night', 'city', 'architecture'],
    metadata: {
      iso: 800,
      shutterSpeed: '15s',
      aperture: 'f/16',
      location: 'Chicago',
      camera: 'Sony A7R IV',
      lens: '16-35mm f/2.8'
    },
    featured: true,
    dateCreated: '2023-12-05'
  }
];