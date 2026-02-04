import { User, Restaurant, Subscription, Category, Product, Order } from '../types';

// Available plans - Updated system
export const availablePlans = [
  {
    id: 'free',
    name: 'FREE',
    monthlyPrice: 0,
    annualPrice: 0,
    currency: 'COP',
    popular: false,
    features: {
      max_products: 5,
      max_categories: 5,
      analytics: false,
      custom_domain: false,
      priority_support: false,
      advanced_customization: false,
      ai_assistant: false,
    },
  },
  {
    id: 'basic',
    name: 'Basic',
    monthlyPrice: 49900,
    annualPrice: 509000,
    currency: 'COP',
    popular: false,
    features: {
      max_products: 25,
      max_categories: 15,
      analytics: true,
      custom_domain: false,
      priority_support: false,
      advanced_customization: true,
      ai_assistant: false,
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 99900,
    annualPrice: 1019000,
    currency: 'COP',
    popular: true,
    features: {
      max_products: 50,
      max_categories: 25,
      analytics: true,
      custom_domain: true,
      priority_support: true,
      advanced_customization: true,
      ai_assistant: false,
    },
  },
  {
    id: 'business',
    name: 'Business',
    monthlyPrice: 199900,
    annualPrice: 2039000,
    currency: 'COP',
    popular: false,
    features: {
      max_products: 100,
      max_categories: 50,
      analytics: true,
      custom_domain: true,
      priority_support: true,
      advanced_customization: true,
      ai_assistant: true,
    },
  },
];

const mockUsers: User[] = [];

const mockRestaurants: Restaurant[] = [];

const mockSubscriptions: Subscription[] = [];

const mockCategories: Category[] = [];

const mockProducts: Product[] = [];

const mockOrders: Order[] = [];

// Utility functions for localStorage
export const loadFromStorage = <T>(key: string, defaultValue?: T): T => {
  try {
    const item = localStorage.getItem(key);
    if (item && item !== 'undefined' && item !== 'null') {
      const parsed = JSON.parse(item);
      console.log(`Loaded from storage [${key}]:`, parsed);
      return parsed;
    }
    console.log(`Using default value for [${key}]:`, defaultValue);
    return defaultValue as T;
  } catch {
    console.error(`Error loading from storage [${key}], using default:`, defaultValue);
    return defaultValue as T;
  }
};

export const saveToStorage = <T>(key: string, data: T): void => {
  try {
    console.log(`Saving to storage [${key}]:`, data);
    localStorage.setItem(key, JSON.stringify(data));
    
    // Verify the save
    const saved = localStorage.getItem(key);
    console.log(`Verified save [${key}]:`, saved ? JSON.parse(saved) : null);
  } catch (error) {
    console.error(`Error saving to localStorage [${key}]:`, error);
  }
};

// Initialize data in localStorage if not present
export const initializeData = (): void => {
  const hasInitialized = localStorage.getItem('data_initialized');

  if (!hasInitialized) {
    console.log('First time initialization - loading mock data');
    saveToStorage('users', mockUsers);
    saveToStorage('restaurants', mockRestaurants);
    saveToStorage('subscriptions', mockSubscriptions);
    saveToStorage('categories', mockCategories);
    saveToStorage('products', mockProducts);
    saveToStorage('orders', mockOrders);
    saveToStorage('supportTickets', []);
    localStorage.setItem('data_initialized', 'true');

    console.log('Data initialized:', {
      users: mockUsers,
      restaurants: mockRestaurants
    });
  } else {
    console.log('Data already initialized, skipping...');
  }
};

// Reset all data to initial mock data
export const resetAllData = (): void => {
  console.log('Resetting all data to initial state...');
  saveToStorage('users', mockUsers);
  saveToStorage('restaurants', mockRestaurants);
  saveToStorage('subscriptions', mockSubscriptions);
  saveToStorage('categories', mockCategories);
  saveToStorage('products', mockProducts);
  saveToStorage('orders', mockOrders);
  saveToStorage('supportTickets', []);
  localStorage.setItem('data_initialized', 'true');
  console.log('Data reset complete!');
  window.location.reload();
};