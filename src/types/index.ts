export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: 'restaurant_owner' | 'superadmin';
  restaurant_id?: string;
  created_at: string;
  updated_at: string;
  require_password_change?: boolean;
}

export interface Customer {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  delivery_instructions?: string;
}

export interface ProductVariation {
  id: string;
  name: string;
  price: number;
  compare_at_price?: number;
}

export interface ProductIngredient {
  id: string;
  name: string;
  optional: boolean;
  extra_cost?: number;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  restaurant_id: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  restaurant_id: string;
  category_id?: string;
  name: string;
  description: string;
  price?: number;
  images: string[];
  variations: ProductVariation[];
  ingredients?: ProductIngredient[];
  dietary_restrictions?: string[];
  spice_level?: number;
  preparation_time?: string;
  status: 'active' | 'inactive' | 'out_of_stock';
  sku?: string;
  is_available: boolean;
  is_featured: boolean;
  display_order?: number;
  compare_at_price?: number;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  restaurant_id: string;
  order_number: string;
  customer: Customer;
  items: OrderItem[];
  order_type: 'pickup' | 'delivery' | 'dine-in';
  delivery_address?: string;
  table_number?: string;
  delivery_cost?: number;
  subtotal: number;
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  estimated_time?: string;
  special_instructions?: string;
  whatsapp_sent?: boolean;
  created_at: string;
  updated_at: string;
}

interface OrderItem {
  id: string;
  product_id: string;
  product: Product;
  variation: ProductVariation;
  quantity: number;
  unit_price: number;
  total_price: number;
  selected_ingredients?: ProductIngredient[];
  special_notes?: string;
}

export interface CartItem {
  product: Product;
  variation: ProductVariation;
  quantity: number;
  selected_ingredients: ProductIngredient[];
  special_notes?: string;
}

interface UISettings {
  layout_type: 'list' | 'grid' | 'editorial';
  show_search_bar: boolean;
  info_message: string;
}

interface Theme {
  primary_color: string;
  secondary_color: string;
  menu_background_color: string;
  card_background_color: string;
  primary_text_color: string;
  secondary_text_color: string;
  accent_color: string;
  text_color: string;
  primary_font: string;
  secondary_font: string;
  font_sizes: {
    title: string;
    subtitle: string;
    normal: string;
    small: string;
  };
  font_weights: {
    light: number;
    regular: number;
    medium: number;
    bold: number;
  };
  button_style: 'rounded' | 'square';
}

interface SocialMedia {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  whatsapp?: string;
  website?: string;
}

interface BusinessHours {
  [key: string]: {
    open: string;
    close: string;
    is_open: boolean;
  };
}

interface DeliveryPricingTier {
  id: string;
  name: string;
  min_order_amount: number;
  max_order_amount: number;
  cost: number;
}

interface DeliverySettings {
  enabled: boolean;
  zones: string[];
  min_order_amount: number;
  delivery_cost: number;
  pricing_tiers?: DeliveryPricingTier[];
}

interface TableOrdersSettings {
  enabled: boolean;
  table_numbers: number;
  qr_codes: boolean;
  auto_assign: boolean;
}

interface NotificationSettings {
  email: string;
  sound_enabled: boolean;
  whatsapp?: string;
}

interface PromoSettings {
  enabled: boolean;
  banner_image: string;
  vertical_promo_image?: string;
  promo_text: string;
  cta_text: string;
  cta_link?: string;
  featured_product_ids?: string[];
}

interface BillingSettings {
  nombreComercial: string;
  razonSocial?: string;
  nit: string;
  direccion: string;
  departamento: string;
  ciudad: string;
  telefono: string;
  correo?: string;
  regimenTributario: 'simple' | 'comun' | 'no_responsable_iva';
  responsableIVA: boolean;
  aplicaIPC: boolean;
  porcentajeIPC: number;
  tieneResolucionDIAN: boolean;
  numeroResolucionDIAN?: string;
  fechaResolucion?: string;
  rangoNumeracionDesde?: number;
  rangoNumeracionHasta?: number;
  aplicaPropina: boolean;
  mostrarLogoEnTicket: boolean;
  logoTicket?: string;
  mensajeFinalTicket?: string;
}

interface RestaurantSettings {
  ui_settings: UISettings;
  theme: Theme;
  social_media: SocialMedia;
  business_hours: BusinessHours;
  delivery: DeliverySettings;
  table_orders: TableOrdersSettings;
  notifications: NotificationSettings;
  promo?: PromoSettings;
  billing?: BillingSettings;
  currency?: string;
  language?: string;
  timezone?: string;
  preparation_time?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone?: string;
  address?: string;
  description?: string;
  logo?: string;
  logo_url?: string;
  owner_name?: string;
  owner_id: string;
  user_id?: string;
  subscription_id?: string;
  domain?: string;
  is_active?: boolean;
  elevenlabs_agent_id?: string;
  settings: RestaurantSettings;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  price: number;
  billing_period: 'monthly' | 'annual';
  max_products: number;
  max_categories: number;
  features: {
    analytics: boolean;
    custom_domain: boolean;
    priority_support: boolean;
    advanced_customization: boolean;
    popular?: boolean;
  };
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  restaurant_id: string;
  plan_name: string;
  plan_type?: 'free' | 'basic' | 'pro' | 'business';
  duration: 'monthly' | 'annual';
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  start_date: string;
  end_date: string;
  auto_renew: boolean;
  monthly_price?: number;
  max_products?: number;
  max_orders?: number;
  features?: any;
  created_at: string;
  updated_at?: string;
}

export interface SupportTicket {
  id: string;
  restaurantId: string;
  restaurantName: string;
  subject: string;
  category: string;
  priority: string;
  message: string;
  contactEmail: string;
  contactPhone: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
  response?: string;
  responseDate?: string;
  adminNotes?: string;
}
interface PlanFeatures {
  max_products: number;
  max_categories: number;
  analytics: boolean;
  custom_domain: boolean;
  priority_support: boolean;
  advanced_customization: boolean;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  billing_period: 'monthly' | 'yearly';
  features: PlanFeatures;
  popular?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  restaurantName: string;
  ownerName: string;
  phone: string;
  address: string;
}

export interface AuthContextType {
  user: User | null;
  restaurant: Restaurant | null;
  isAuthenticated: boolean;
  loading: boolean;
  requirePasswordChange?: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  changePassword?: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  refreshRestaurantData: () => Promise<void>;
}
