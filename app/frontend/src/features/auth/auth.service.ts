import api from '@/lib/api';
import type { AuthResponse, LoginCredentials, SignupCredentials, User } from './auth.types';

export const authService = {
  async signup(credentials: SignupCredentials): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/signup', credentials);
    return data;
  },

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', credentials);
    return data;
  },

  async getMe(): Promise<User> {
    const { data } = await api.get<{ user: User }>('/auth/me');
    return data.user;
  },
};
