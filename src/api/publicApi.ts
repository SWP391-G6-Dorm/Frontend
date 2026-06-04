import api from './axiosInstance';
import type { Room } from '../components/ui/RoomCard';

export interface PlatformStats {
  totalAvailableRooms: number;
  totalProperties: number;
  totalTenants: number;
  satisfactionPercent: number;
}

export async function fetchFeaturedRooms(limit = 6): Promise<Room[]> {
  const res = await api.get(`/api/public/rooms/featured?limit=${limit}`);
  return res.data.data;
}

export async function fetchPlatformStats(): Promise<PlatformStats> {
  const res = await api.get('/api/public/stats');
  return res.data.data;
}
