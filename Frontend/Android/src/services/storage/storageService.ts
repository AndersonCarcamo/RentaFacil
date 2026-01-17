import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/constants';
import { User } from '@/types';

export const storageService = {
  // User data
  async saveUser(user: User): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
  },

  async getUser(): Promise<User | null> {
    const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
    return userData ? JSON.parse(userData) : null;
  },

  async removeUser(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
  },

  // Tokens
  async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.ACCESS_TOKEN, accessToken],
      [STORAGE_KEYS.REFRESH_TOKEN, refreshToken],
    ]);
  },

  async getAccessToken(): Promise<string | null> {
    return await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  async getRefreshToken(): Promise<string | null> {
    return await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  async removeTokens(): Promise<void> {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.ACCESS_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
    ]);
  },

  // Search history
  async saveSearchHistory(query: string): Promise<void> {
    const history = await this.getSearchHistory();
    const newHistory = [query, ...history.filter(q => q !== query)].slice(0, 10);
    await AsyncStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(newHistory));
  },

  async getSearchHistory(): Promise<string[]> {
    const history = await AsyncStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY);
    return history ? JSON.parse(history) : [];
  },

  async clearSearchHistory(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.SEARCH_HISTORY);
  },

  // Favorites
  async saveFavorite(propertyId: string): Promise<void> {
    const favorites = await this.getFavorites();
    if (!favorites.includes(propertyId)) {
      favorites.push(propertyId);
      await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
    }
  },

  async removeFavorite(propertyId: string): Promise<void> {
    const favorites = await this.getFavorites();
    const newFavorites = favorites.filter(id => id !== propertyId);
    await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(newFavorites));
  },

  async getFavorites(): Promise<string[]> {
    const favorites = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITES);
    return favorites ? JSON.parse(favorites) : [];
  },

  async isFavorite(propertyId: string): Promise<boolean> {
    const favorites = await this.getFavorites();
    return favorites.includes(propertyId);
  },

  // Clear all data
  async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.ACCESS_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
      STORAGE_KEYS.USER_DATA,
      STORAGE_KEYS.PENDING_AVATAR,
      STORAGE_KEYS.SEARCH_HISTORY,
      STORAGE_KEYS.FAVORITES,
    ]);
  },
};
