import api from './axiosInstance';

export interface FeaturedRoom {
  id: string;
  roomNumber: string;
  roomType: string;
  pricePerNight: number;
  capacity: number;
  area: number;
  status: string;
  primaryImageUrl: string | null;
  propertyId: string;
  propertyName: string;
  floorId?: string;
  floorNumber?: number | null;
  averageRating?: number | null;
  totalReviews?: number | null;
}

export interface FeaturedProperty {
  id: string;
  name: string;
  address: string;
  roomCount: number;
  availableRoomCount: number;
  coverImageUrl?: string | null;
}

export interface PlatformStats {
  totalProperties: number;
  totalRooms: number;
  totalAvailableRooms: number;
  averageRating: number;
  totalReviews: number;
}

export interface Promotion {
  id: string;
  subtitle: string;
  title: string;
  description?: string;
  ctaText: string;
  ctaUrl: string;
  imageUrl?: string;
  colorTheme: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface SearchSuggestion {
  type: 'location' | 'property';
  label: string;
}



export async function fetchFeaturedProperties(limit = 6): Promise<FeaturedProperty[]> {
  const res = await api.get(`/api/v1/properties/featured?limit=${limit}`);
  return res.data.data ?? [];
}

export async function fetchFeaturedRooms(limit = 8): Promise<FeaturedRoom[]> {
  const res = await api.get(`/api/v1/rooms/featured?limit=${limit}`);
  return res.data.data ?? [];
}

export async function fetchPlatformStats(): Promise<PlatformStats> {
  const res = await api.get('/api/public/stats');
  return res.data.data;
}

export async function fetchSearchSuggestions(q = ''): Promise<SearchSuggestion[]> {
  const res = await api.get('/api/public/search-suggestions', { params: { q } });
  return res.data.data;
}

export async function fetchPromotions(): Promise<Promotion[]> {
  const res = await api.get('/api/v1/promotions/active');
  return res.data.data ?? [];
}

export interface AboutStat {
  value: string;
  label: string;
}

export interface AboutValue {
  num: string;
  title: string;
  desc: string;
}

export interface AboutContent {
  id: string;
  heroBrand: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImageUrl?: string;
  ctaPrimaryText: string;
  ctaPrimaryUrl: string;
  ctaSecondaryText?: string;
  storyEyebrow: string;
  storyTitle: string;
  storyBody1: string;
  storyBody2: string;
  storyImage1Url?: string;
  storyImage2Url?: string;
  storyImage3Url?: string;
  storyCtaText?: string;
  storyCtaUrl?: string;
  valuesEyebrow: string;
  valuesTitle: string;
  contactEyebrow: string;
  contactTitle: string;
  contactIntro: string;
  address: string;
  email: string;
  phone: string;
  workingHours: string;
  stats: AboutStat[];
  values: AboutValue[];
  updatedAt: string;
}

export async function fetchAboutContent(): Promise<AboutContent> {
  const res = await api.get('/api/public/about');
  return res.data.data;
}
