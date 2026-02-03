import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ShoppingCart,
  Search,
  Gift,
  Star,
  X,
  Grid3x3,
  List,
  Clock,
  MapPin,
  Phone,
  TikTok,
  Facebook,
  Instagram,
  Globe,
  AlignLeft,
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import { Category, Product, Restaurant, Subscription } from '../../types';
import { supabase } from '../../lib/supabase';
import { useCart } from '../../contexts/CartContext';
import { ProductDetail } from '../../components/public/ProductDetail';
import { CartSidebar } from '../../components/public/CartSidebar';
import { CheckoutModal } from '../../components/public/CheckoutModal';
import { CartPreview } from '../../components/public/CartPreview';
import { formatCurrency } from '../../utils/currencyUtils';
import { AnimatedCarousel } from '../../components/public/AnimatedCarousel'; /*DF:componenetes carousel*/
import Pathtop from '../../components/public/Pathformtop.tsx'; /*DF:componenetes pathform*/
import Pathbottom from '../../components/public/Pathformbottom.tsx'; /*DF:componenetes pathform*/
import Pathleft from '../../components/public/Pathformleft.tsx'; /*DF:componenetes pathform*/
import { FloatingFooter } from '../../components/public/FloatingFooter.tsx'; /*DF:componenetes pathform*/
import { VoiceAssistantWidget } from '../../components/public/VoiceAssistantWidget';
import { useLanguage } from '../../contexts/LanguageContext';
import ProductCard from '../../components/public/ProductCard';
import ProductCardSkeleton from '../../components/public/ProductCardSkeleton';

/**
 * ✅ Tipo para el LISTADO (ligero): NO incluye variations/ingredients/compare_at_price
 * Mantiene lo necesario para renderizar cards y filtros.
 */
type ProductListItem = Pick<
  Product,
  | 'id'
  | 'restaurant_id'
  | 'name'
  | 'description'
  | 'price'
  | 'images'
  | 'status'
  | 'is_available'
  | 'is_featured'
  | 'display_order'
> & {
  category_id: string | null;
};

export const PublicMenu: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { items: cartItems, lastAddedItem, clearLastAddedItem } = useCart();
  const { t } = useLanguage();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // ✅ NUEVO: flag para el fetch del detalle al abrir un producto
  const [loadingSelectedProduct, setLoadingSelectedProduct] = useState(false);

  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingPhase, setLoadingPhase] = useState<'initial' | 'restaurant' | 'categories' | 'products' | 'complete'>('initial');
  const [error, setError] = useState<string | null>(null);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [featuredSlideIndex, setFeaturedSlideIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'editorial'>(
    'list'
  );
  const [showHoursModal, setShowHoursModal] = useState(false);
  const [loadingMoreProducts, setLoadingMoreProducts] = useState(false);
  const [hasMoreProducts, setHasMoreProducts] = useState(true);
  const [productOffset, setProductOffset] = useState(0);
  const PRODUCTS_PER_PAGE = 15;
  const [showInitialSkeletons, setShowInitialSkeletons] = useState(true);
  // --- Scroll hide header ---
  // Estado para controlar si el header debe mostrarse (scroll up o hover)
  const [showHeader, setShowHeader] = useState(true);
  // Estado para controlar la posición de scroll (para el fondo)
  const [scrolled, setScrolled] = useState(false);
  // Estado para controlar el hover (ya lo tenías)
  const [isHovered, setIsHovered] = useState(false);
  // Estado para guardar la última posición de scroll para detectar la dirección
  const [lastScrollY, setLastScrollY] = useState(0);

  // --- Lógica del Scroll ---
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // 1. Detección de la Posición (para el cambio de fondo)
      // Se activa 'scrolled' si el scroll es mayor a 50px
      const isScrolled = currentScrollY > 50;
      setScrolled(isScrolled);

      // 2. Detección de la Dirección (para esconder/mostrar)
      // Se muestra si: scroll hacia arriba O cerca de la cima
      if (currentScrollY < lastScrollY || currentScrollY < 100) {
        setShowHeader(true);
      }
      // Se esconde si: scroll hacia abajo Y está lejos de la cima
      else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setShowHeader(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

  // Cache para product_categories para evitar consultas repetidas
  const [productCategoryCache, setProductCategoryCache] = useState<Record<string, string | null>>({});

  /**
   * ✅ NUEVO: Abrir producto con detalle LAZY
   * - Se consulta solo ese producto con campos pesados
   * - Luego se abre ProductDetail
   */
  const openProduct = useCallback(
    async (productLite: ProductListItem) => {
      if (!restaurant?.id) return;

      try {
        setLoadingSelectedProduct(true);

        const { data, error } = await supabase
          .from('products')
          .select(
            `
            id,
            restaurant_id,
            name,
            description,
            price,
            images,
            status,
            is_available,
            is_featured,
            variations,
            display_order,
            compare_at_price,
            ingredients,
            sku,
            product_categories ( category_id )
          `
          )
          .eq('restaurant_id', restaurant.id)
          .eq('id', productLite.id)
          .single();

        if (error) throw error;

        // Si el modal espera variations siempre, damos fallback aquí (solo en detalle)
        const fullProduct = {
          ...data,
          images: data.images || [],
          variations:
            data.variations && data.variations.length > 0
              ? data.variations
              : [{ id: '1', name: 'Default', price: Number(data.price) || 0 }],
          category_id: data.product_categories?.[0]?.category_id || null,
        };

        setSelectedProduct(fullProduct as any);
      } catch (err) {
        console.error('[PublicMenu] Error loading product detail:', err);
        // fallback: abrir con la info ligera (no bloquea UX)
        setSelectedProduct(productLite as any);
      } finally {
        setLoadingSelectedProduct(false);
      }
    },
    [restaurant?.id]
  );

  const loadMenuData = async () => {
    try {
      console.log('[PublicMenu] Starting to load menu data for slug:', slug);
      setLoading(true);
      setLoadingPhase('initial');
      setError(null);
      setShowInitialSkeletons(true);

      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug || '');
      console.log('[PublicMenu] Slug is UUID?', isUUID);

      let query = supabase
        .from('restaurants')
        .select('id, name, slug, domain, email, phone, address, logo_url, is_active, settings, elevenlabs_agent_id');

      if (isUUID) {
        query = query.or(`slug.eq.${slug},id.eq.${slug},domain.eq.${slug}`);
      } else {
        query = query.or(`slug.eq.${slug},domain.eq.${slug}`);
      }

      console.log('[PublicMenu] Fetching restaurant data...');
      const queryStart = Date.now();
      const { data: restaurantData, error: restaurantError } = await query.maybeSingle();
      console.log('[PublicMenu] Restaurant query took:', Date.now() - queryStart, 'ms');

      if (restaurantError) {
        console.error('[PublicMenu] Restaurant error:', restaurantError);
        throw restaurantError;
      }

      if (!restaurantData) {
        console.error('[PublicMenu] Restaurant not found for slug:', slug);
        setError(`Restaurante no encontrado: ${slug}`);
        setLoading(false);
        setShowInitialSkeletons(false);
        return;
      }

      console.log('[PublicMenu] Restaurant found:', restaurantData.name, 'ID:', restaurantData.id);

      // FASE 1: Mostrar restaurante y header inmediatamente
      setRestaurant(restaurantData);
      setLoadingPhase('restaurant');
      setLoading(false);

      console.log('[PublicMenu] Fetching all data in parallel...');
      const parallelStart = Date.now();

      // ✅ CAMBIO: LISTADO LIGERO (sin variations/compare_at_price/ingredients)
      const productsResult = await supabase
        .from('products')
        .select('id, restaurant_id, name, description, price, images, status, is_available, is_featured, display_order')
        .eq('restaurant_id', restaurantData.id)
        .in('status', ['active', 'out_of_stock'])
        .order('display_order', { ascending: true })
        .range(0, PRODUCTS_PER_PAGE - 1);

      if (productsResult.error) {
        console.error('[PublicMenu] Products error:', productsResult.error);
        throw productsResult.error;
      }

      const productIds = (productsResult.data || []).map((p: any) => p.id);

      // Luego cargar categorías y product_categories en paralelo
      const [categoriesResult, allProductCategoriesResult] = await Promise.all([
        supabase
          .from('categories')
          .select('id, name, icon, restaurant_id, is_active, display_order')
          .eq('restaurant_id', restaurantData.id)
          .eq('is_active', true)
          .order('display_order', { ascending: true }),

        // Solo cargar las relaciones de los productos de este restaurante
        productIds.length > 0
          ? supabase
              .from('product_categories')
              .select('product_id, category_id')
              .in('product_id', productIds)
          : Promise.resolve({ data: [], error: null })
      ]);

      console.log('[PublicMenu] All parallel queries took:', Date.now() - parallelStart, 'ms');

      if (categoriesResult.error) {
        console.error('[PublicMenu] Categories error:', categoriesResult.error);
        throw categoriesResult.error;
      }
      if (productsResult.error) {
        console.error('[PublicMenu] Products error:', productsResult.error);
        throw productsResult.error;
      }

      console.log('[PublicMenu] Found', categoriesResult.data?.length || 0, 'categories');
      console.log('[PublicMenu] Found', productsResult.data?.length || 0, 'initial products');
      console.log('[PublicMenu] Found', allProductCategoriesResult.data?.length || 0, 'total product-category relationships');

      // Mostrar categorías inmediatamente
      setCategories(categoriesResult.data || []);
      setLoadingPhase('categories');

      const { data: initialProductsData } = productsResult;

      // Crear mapa de categorías de productos y guardarlo en caché
      const productCategoryMap: Record<string, string | null> = {};
      if (allProductCategoriesResult.data) {
        allProductCategoriesResult.data.forEach((pc: any) => {
          if (!productCategoryMap[pc.product_id]) {
            productCategoryMap[pc.product_id] = pc.category_id;
          }
        });
      }

      // Guardar el mapa en el caché
      setProductCategoryCache(productCategoryMap);

      // ✅ CAMBIO: ya NO fabricamos variations aquí (solo en detalle)
      const transformedInitialProducts: ProductListItem[] = (initialProductsData || []).map((p: any) => ({
        ...p,
        images: p.images || [],
        category_id: productCategoryMap[p.id] || null
      }));

      console.log('[PublicMenu] Setting', transformedInitialProducts.length, 'products to state');
      // FASE 3: Mostrar productos y ocultar skeletons
      setProducts(transformedInitialProducts);
      setShowInitialSkeletons(false);
      setProductOffset(PRODUCTS_PER_PAGE);
      setHasMoreProducts(transformedInitialProducts.length === PRODUCTS_PER_PAGE);
      setLoadingPhase('complete');
      console.log('[PublicMenu] Initial menu loading complete!');

      // Clean up invalid featured product IDs
      if (restaurantData.settings?.promo?.featured_product_ids?.length) {
        const validProductIds = transformedInitialProducts.map((p: any) => p.id);
        const configuredIds = restaurantData.settings.promo.featured_product_ids;
        const invalidIds = configuredIds.filter((id: string) => !validProductIds.includes(id));

        if (invalidIds.length > 0) {
          console.log('[PublicMenu] Found', invalidIds.length, 'invalid featured product IDs, cleaning up...');
          const validFeaturedIds = configuredIds.filter((id: string) => validProductIds.includes(id));

          await supabase
            .from('restaurants')
            .update({
              settings: {
                ...restaurantData.settings,
                promo: {
                  ...restaurantData.settings.promo,
                  featured_product_ids: validFeaturedIds
                }
              }
            })
            .eq('id', restaurantData.id);

          console.log('[PublicMenu] Cleaned up invalid product IDs');
        }
      }
    } catch (err) {
      console.error('[PublicMenu] Error loading menu:', err);
      setError('Error al cargar el menú');
      setLoading(false);
      setShowInitialSkeletons(false);
    }
  };

  const loadMoreProducts = async () => {
    if (!restaurant || loadingMoreProducts || !hasMoreProducts) return;

    try {
      setLoadingMoreProducts(true);
      console.log('[PublicMenu] Loading more products from offset:', productOffset);

      // ✅ CAMBIO: LISTADO LIGERO (sin variations/compare_at_price/ingredients)
      const { data: moreProductsData, error: moreProductsError } = await supabase
        .from('products')
        .select('id, restaurant_id, name, description, price, images, status, is_available, is_featured, display_order')
        .eq('restaurant_id', restaurant.id)
        .in('status', ['active', 'out_of_stock'])
        .order('display_order', { ascending: true })
        .range(productOffset, productOffset + PRODUCTS_PER_PAGE - 1);

      if (moreProductsError) throw moreProductsError;

      const productIds = (moreProductsData || []).map((p: any) => p.id);

      // Usar caché o cargar nuevas relaciones
      let productCategoryMap = { ...productCategoryCache };
      const uncachedIds = productIds.filter((id) => !(id in productCategoryMap));

      if (uncachedIds.length > 0) {
        const { data: productCategoriesData } = await supabase
          .from('product_categories')
          .select('product_id, category_id')
          .in('product_id', uncachedIds);

        if (productCategoriesData) {
          productCategoriesData.forEach((pc: any) => {
            if (!productCategoryMap[pc.product_id]) {
              productCategoryMap[pc.product_id] = pc.category_id;
            }
          });
          setProductCategoryCache(productCategoryMap);
        }
      }

      // ✅ CAMBIO: ya NO fabricamos variations aquí (solo en detalle)
      const transformedProducts: ProductListItem[] = (moreProductsData || []).map((p: any) => ({
        ...p,
        images: p.images || [],
        category_id: productCategoryMap[p.id] || null
      }));

      setProducts((prev) => [...prev, ...transformedProducts]);
      setProductOffset((prev) => prev + PRODUCTS_PER_PAGE);
      setHasMoreProducts(transformedProducts.length === PRODUCTS_PER_PAGE);
      console.log('[PublicMenu] Loaded', transformedProducts.length, 'more products');
    } catch (err) {
      console.error('[PublicMenu] Error loading more products:', err);
    } finally {
      setLoadingMoreProducts(false);
    }
  };

  useEffect(() => {
    if (slug) {
      loadMenuData();
    } else {
      setError('No se proporcionó un identificador de restaurante');
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (restaurant && !loading) {
      const hasPromo = restaurant.settings.promo?.enabled && restaurant.settings.promo?.vertical_promo_image;
      if (hasPromo) {
        setShowPromoModal(true);
      }
    }
  }, [restaurant, loading]);

  const filteredProducts = useMemo(() => {
    return products.filter((product: any) => {
      const matchesCategory =
        selectedCategory === 'all' || product.category_id === selectedCategory;

      if (!matchesCategory) return false;

      if (searchTerm === '') return true;

      const searchLower = searchTerm.toLowerCase();
      return (
        product.name.toLowerCase().includes(searchLower) ||
        (product.description &&
          product.description.toLowerCase().includes(searchLower))
      );
    });
  }, [products, selectedCategory, searchTerm]);

  const featuredProducts = useMemo(() => {
    console.log('[PublicMenu] Calculating featured products. Total products:', products.length);
    console.log('[PublicMenu] Products with is_featured:', products.filter((p) => (p as any).is_featured).length);
    console.log('[PublicMenu] Featured IDs from settings:', restaurant?.settings.promo?.featured_product_ids);

    if (!restaurant?.settings.promo?.featured_product_ids?.length) {
      const featured = products.filter((p) => (p as any).is_featured).slice(0, 5);
      console.log('[PublicMenu] Using is_featured flag, found:', featured.length, 'products');
      return featured;
    }

    const featuredIds = restaurant.settings.promo.featured_product_ids;
    const validFeatured = products.filter((p) => featuredIds.includes((p as any).id));
    console.log('[PublicMenu] Using featured IDs from settings, found:', validFeatured.length, 'valid products');

    if (validFeatured.length === 0) {
      const featured = products.filter((p) => (p as any).is_featured).slice(0, 5);
      console.log('[PublicMenu] No valid IDs, falling back to is_featured flag, found:', featured.length);
      return featured;
    }

    return validFeatured.slice(0, 5);
  }, [products, restaurant?.settings.promo?.featured_product_ids]);

  const cartItemsCount = cartItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const nextSlide = useCallback(() => {
    setFeaturedSlideIndex(
      (prev) => (prev + 1) % Math.max(1, featuredProducts.length)
    );
  }, [featuredProducts.length]);

  const prevSlide = useCallback(() => {
    setFeaturedSlideIndex(
      (prev) =>
        (prev - 1 + featuredProducts.length) %
        Math.max(1, featuredProducts.length)
    );
  }, [featuredProducts.length]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMoreProducts && !loadingMoreProducts) {
          loadMoreProducts();
        }
      },
      { threshold: 0.1 }
    );

    const sentinel = document.getElementById('load-more-sentinel');
    if (sentinel) {
      observer.observe(sentinel);
    }

    return () => {
      if (sentinel) {
        observer.unobserve(sentinel);
      }
    };
  }, [hasMoreProducts, loadingMoreProducts, productOffset]);

  if (loading && !restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">{t('charging_public_menu')}</p>
        </div>
      </div>
    );
  }

  if (error || (!restaurant && !loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🍽️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            a
          </h2>
          <p className="text-gray-600 mb-4">
            {error || 'El menú que buscas no está disponible.'}
          </p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return null;
  }

  const theme = restaurant.settings.theme;
  const primaryColor = theme.primary_color || '#FFC700';
  const secondaryColor = theme.secondary_color || '#f3f4f6';
  const menuBackgroundColor = theme.menu_background_color || '#ffffff';
  const cardBackgroundColor = theme.card_background_color || '#f9fafb';
  const primaryTextColor = theme.primary_text_color || '#111827';
  const secondaryTextColor = theme.secondary_text_color || '#6b7280';
  const textColor = theme.primary_text_color || '#111827';
  const hasPromo =
    restaurant.settings.promo?.enabled &&
    restaurant.settings.promo?.vertical_promo_image;

  const internalDivStyle = scrolled ? {
    // 1. Fondo semi-transparente
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    // 2. Aplicación del Glassmorphism (blur al fondo de lo que hay detrás)
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)', // Para compatibilidad
    transition: 'background-color 300ms, backdrop-filter 300ms'
  } : {
    // Transparente cuando está en la parte superior
    backgroundColor: 'transparent',
    backdropFilter: 'none',
    WebkitBackdropFilter: 'none',
    transition: 'background-color 300ms, backdrop-filter 300ms'
  };

  return (
    <div
      className="min-h-screen relative p-1 gap-1 overflow-x-hidden"
      style={
        {
          backgroundColor: menuBackgroundColor,
          '--primary-color': primaryColor,
          '--secondary-color': secondaryColor,
          '--menu-bg-color': menuBackgroundColor,
          '--card-bg-color': cardBackgroundColor,
          '--primary-text-color': primaryTextColor,
          '--secondary-text-color': secondaryTextColor,
          '--text-color': textColor,
          '--primary-font': theme.primary_font || 'Inter',
          '--secondary-font': theme.secondary_font || 'Poppins',
        } as React.CSSProperties
      }
    >
      <style>{`
        p, span { color: ${primaryTextColor} !important; }

        /* Custom scrollbar for categories on desktop */
        @media (min-width: 768px) {
          .categories-scroll {
            scrollbar-width: thin;
            scrollbar-color: ${primaryColor} transparent;
          }

          .categories-scroll::-webkit-scrollbar {
            height: 8px;
          }

          .categories-scroll::-webkit-scrollbar-track {
            background: transparent;
            border-radius: 4px;
          }

          .categories-scroll::-webkit-scrollbar-thumb {
            background-color: ${primaryColor};
            border-radius: 4px;
            opacity: 0.6;
          }

          .categories-scroll::-webkit-scrollbar-thumb:hover {
            background-color: ${primaryColor};
            opacity: 1;
          }
        }

        /* Hide scrollbar on mobile */
        @media (max-width: 767px) {
          .categories-scroll {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }

          .categories-scroll::-webkit-scrollbar {
            display: none;
          }
        }
      `}</style>
      {theme?.pathform &&  (
      <Pathleft
        color={secondaryColor}
        className="
          absolute
          opacity-90
          w-[160px]
          h-[400px]
          translate-y-[30%]
          -translate-x-[10%]
          /*VERSION DESKTOP*/
          md:-top-20
          md:w-[320px]
          md:h-[800px]
          md:-translate-y-[15%]
          md:-translate-x-[10%]
        "
      />
      )}
      {theme?.pathform &&  (
      <Pathbottom
        color={secondaryColor}
        className="
          /* Versión móvil */
          absolute
          top-0
          right-0
          opacity-90
          w-[150px]
          h-[150px]
          -translate-y-[25%]
          translate-x-[0%]

          /* Versión escritorio */
          md:absolute
          md:top-0
          md:right-0
          md:opacity-90
          md:w-[300px]
          md:h-[300px]
          -translate-y-[25%]
          translate-x-[0%]
        "
      />
      )}
     {theme?.pathform &&  (
      <Pathtop
        color={secondaryColor}
        className="
          /* Versión móvil */
          md:absolute
          md:-bottom-20
          md:right-0
          md:opacity-90
          md:w-[300px]
          md:h-[300px]
          md:-translate-y-[27%]
          md:translate-x-[0%]
          md:rotate-90

          /* Versión escritorio */
          absolute
          -bottom-20
          right-0
          opacity-90
          w-[150px]
          h-[150px]
          -translate-y-[54%]
          translate-x-[0%]
          rotate-90
        "
      />
      )}
      {' '}
      {/* HEADER */}
      <header
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`sticky top-0 z-50 transition-transform duration-300 pb-5 ${
          showHeader || isHovered ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="w-full mx-auto px-4 py-2 rounded-lg" style={internalDivStyle}>
          <div className="flex items-center justify-between gap-2 md:gap-4">
            {/* Search Bar */}
            <div className="flex-1 max-w-[150px] md:max-w-xs shadow-lg rounded-lg">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
                  style={{ color: primaryTextColor, stroke: primaryTextColor }}
                />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    if (e.target.value) {
                      setTimeout(() => {
                        document.getElementById('products-section');
                      }, 100);
                    }
                  }}
                  className="w-full pl-10 pr-4 py-3 rounded-lg focus:ring-2 focus:outline-none transition-colors placeholder-opacity-70 custom-placeholder"
                  style={{
                    backgroundColor: cardBackgroundColor,
                    borderColor: cardBackgroundColor,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderRadius:
                      theme.button_style === 'rounded' ? '0.5rem' : '0.25rem',
                    color: primaryTextColor,
                    caretColor: primaryTextColor,
                    fontFamily: theme.secondary_font || 'Poppins',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = primaryTextColor)}
                  onBlur={(e) => (e.target.style.borderColor = cardBackgroundColor)}
                />

                <style>{`
                  .custom-placeholder::placeholder {
                    color: ${primaryTextColor} !important;
                    opacity: 0.7;
                  }
                `}</style>
              </div>
            </div>

            {/* ✅ Logo (FIX móvil): ya no está hidden md:block */}
            <div className="flex-shrink-0 text-center">
              {restaurant.logo_url ? (
                <img
                  src={restaurant.logo_url}
                  alt={restaurant.name}
                  loading="lazy"
                  className="h-10 md:h-16 mx-auto"
                  style={{ maxWidth: '140px', objectFit: 'contain' }}
                />
              ) : (
                <div
                  className="text-3xl font-bold"
                  style={{
                    color: primaryColor,
                    fontFamily: theme.secondary_font || 'Poppins',
                  }}
                >
                  {restaurant.name.substring(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1 md:gap-2 flex-1 justify-end max-w-[150px] md:max-w-xs">
              {/* DF:OPEN/CLOSED STATUS BUTTON */}
              <button
                onClick={() => setShowHoursModal(true)}
                className="hidden  md:flex  md:h-[45px] items-center gap-2 p-3 rounded-lg transition-all hover:opacity-90 shadow-lg"
                style={{
                  fontFamily: theme.primary_font || 'Poppins',
                  backgroundColor: (() => {
                    const now = new Date();
                    const dayNames = [
                      'sunday',
                      'monday',
                      'tuesday',
                      'wednesday',
                      'thursday',
                      'friday',
                      'saturday',
                    ];
                    const currentDay = dayNames[now.getDay()];
                    const hours = restaurant.settings.business_hours?.[currentDay];
                    if (!hours?.is_open) return '#fcaeae';
                    const currentTime = now.getHours() * 60 + now.getMinutes();
                    const [openH, openM] = hours.open.split(':').map(Number);
                    const [closeH, closeM] = hours.close.split(':').map(Number);
                    const openTime = openH * 60 + openM;
                    const closeTime = closeH * 60 + closeM;
                    return currentTime >= openTime && currentTime <= closeTime
                      ? '#AFFEBF'
                      : '#fcaeae';
                  })(),
                }}
              >
                {(() => {
                  const now = new Date();
                  const dayNames = [
                    'sunday',
                    'monday',
                    'tuesday',
                    'wednesday',
                    'thursday',
                    'friday',
                    'saturday',
                  ];
                  const currentDay = dayNames[now.getDay()];
                  const hours = restaurant.settings.business_hours?.[currentDay];
                  const isOpen = (() => {
                    if (!hours?.is_open) return false;
                    const currentTime = now.getHours() * 60 + now.getMinutes();
                    const [openH, openM] = hours.open.split(':').map(Number);
                    const [closeH, closeM] = hours.close.split(':').map(Number);
                    const openTime = openH * 60 + openM;
                    const closeTime = closeH * 60 + closeM;
                    return currentTime >= openTime && currentTime <= closeTime;
                  })();

                  const textColor = isOpen ? '#1d4b40' : '#491c1c';
                  const iconColor = isOpen ? '#1d4b40' : '#491c1c';

                  return (
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5" style={{ color: iconColor }} />
                      <div className="text-right">
                        <h5
                          className="font-bold text-sm"
                          style={{
                            color: textColor,
                            fontFamily: theme.primary_font || 'Poppins',
                            textTransform: 'uppercase',
                          }}
                        >
                          {isOpen ? 'Abierto' : 'Cerrado'}
                        </h5>
                      </div>
                    </div>
                  );
                })()}
              </button>
              {hasPromo && (
                <button
                  onClick={() => setShowPromoModal(true)}
                  className="p-3 rounded-lg border transition-colors relative hover:opacity-90 shadow-lg"
                  style={{
                    backgroundColor: cardBackgroundColor,
                    borderColor: cardBackgroundColor,
                    borderRadius:
                      theme.button_style === 'rounded' ? '0.5rem' : '0.25rem',
                  }}
                >
                  <Gift className="w-5 h-5" style={{ color: primaryColor }} />
                  <span
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      width: '17px',
                      height: '17px',
                      backgroundColor: primaryColor,
                      borderRadius: '50%',
                    }}
                  />
                </button>
              )}
              <button
                onClick={() => setShowCart(true)}
                className="p-3 rounded-lg border hover:opacity-90 transition-colors relative shadow-lg"
                style={{
                  backgroundColor: cardBackgroundColor,
                  borderColor: cardBackgroundColor,
                  borderRadius:
                    theme.button_style === 'rounded' ? '0.5rem' : '0.25rem',
                }}
              >
                <ShoppingCart className="w-5 h-5" style={{ color: primaryColor, stroke: primaryColor }} />
                {cartItemsCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {cartItemsCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {(() => {
        const shouldShow = !searchTerm && !showInitialSkeletons && featuredProducts.length > 0;
        console.log('[PublicMenu] Featured section check:', {
          searchTerm,
          showInitialSkeletons,
          featuredProductsLength: featuredProducts.length,
          shouldShow
        });
        return shouldShow;
      })() && (
        <div className="text-left px-[15px]  md:px-[210px] md:-mt-[9px] md:-mb-[30px] scale-[0.85]">
          <h3 className="text-xl" style={{ color: primaryTextColor, fontFamily: theme.secondary_font || 'Poppins' }}>
            {t('featured_products_title')}
          </h3>
          <h2 className="text-5xl font-bold " style={{ color: primaryTextColor, fontFamily: theme.primary_font || 'Poppins' }}>
            {t('presenting_featured_products1')}
          </h2>
          <div className="flex items-left justify-left gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="w-5 h-5 fill-current" style={{ color: primaryColor }} />
            ))}
          </div>
        </div>
      )}

      {/* ANIMATED CAROUSEL */}
      {(() => {
        const shouldShow = !searchTerm && !showInitialSkeletons && featuredProducts.length > 0;
        console.log('[PublicMenu] Carousel section check:', {
          searchTerm,
          showInitialSkeletons,
          featuredProductsLength: featuredProducts.length,
          shouldShow
        });
        return shouldShow;
      })() && (
        <AnimatedCarousel
          products={featuredProducts as any}
          primaryColor={primaryColor}
          textColor={textColor}
          cardBackgroundColor={cardBackgroundColor}
          fontFamily={theme.secondary_font || 'Poppins'}
          // ✅ CAMBIO: detalle lazy
          onProductClick={(p: any) => openProduct(p)}
        />
      )}

      {/* PRODUCTS LIST */}
      <main
        className="max-w-6xl mx-auto pb-[74px] md:-mt-[20px] md:pb-[125px] py-1  relative z-10 "
        id="products-section"
      >
        <div className="flex flex-col justify-center items-center w-full max-w-7xl mx-auto py-4 relative z-20 md:items-center md:flex-row  md:justify-between ">
          <div className="w-full md:w-[85%] mx-auto">
            <div className="flex gap-2 py-[2px] overflow-x-auto justify-start px-4 categories-scroll">
              <button
                onClick={() => setSelectedCategory('all')}
                className="px-6 py-2 whitespace-nowrap transition-all font-medium text-sm flex-shrink-0"
                style={{
                  backgroundColor:
                    selectedCategory === 'all' ? primaryColor : 'transparent',
                  color:
                    selectedCategory === 'all' ? secondaryTextColor : primaryColor,
                  border: `1px solid ${primaryColor}`,
                  borderRadius:
                    theme.button_style === 'rounded' ? '0.5rem' : '0.25rem',
                  fontFamily: theme.primary_font || 'Inter',
                }}
              >
                VER TODOS
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className="px-6 py-2 whitespace-nowrap transition-all font-medium text-sm flex-shrink-0 flex items-center gap-2"
                  style={{
                    backgroundColor:
                      selectedCategory === category.id
                        ? primaryColor
                        : 'transparent',
                    color:
                      selectedCategory === category.id
                        ? secondaryTextColor
                        : primaryColor,
                    border: `1px solid ${primaryColor}`,
                    borderRadius:
                      theme.button_style === 'rounded' ? '0.5rem' : '0.25rem',
                    fontFamily: theme.primary_font || 'Inter',
                  }}
                >
                  {category.icon && <span className="text-lg">{category.icon}</span>}
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 w-full md:w-auto mt-4 md:mt-0 px-4">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'list' ? 'shadow-md' : 'opacity-80'
              }`}
              style={{
                backgroundColor: viewMode === 'list' ? cardBackgroundColor : 'rgba(255,255,255,0.4)',
                borderRadius: theme.button_style === 'rounded' ? '0.5rem' : '0.25rem',
                transition: 'background-color 0.3s ease, color 0.3s ease',
              }}
            >
              <List className="w-5 h-5" style={{ color: viewMode === 'list' ? primaryColor : textColor }} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'grid' ? 'shadow-md' : 'opacity-80'
              }`}
              style={{
                backgroundColor: viewMode === 'grid' ? cardBackgroundColor : 'rgba(255,255,255,0.4)',
                borderRadius: theme.button_style === 'rounded' ? '0.5rem' : '0.25rem',
                transition: 'background-color 0.3s ease, color 0.3s ease',
              }}
            >
              <Grid3x3 className="w-5 h-5" style={{ color: viewMode === 'grid' ? primaryColor : textColor }} />
            </button>
            <button
              onClick={() => setViewMode('editorial')}
              className={`p-2 rounded-lg transition-all flex items-center gap-2 ${
                viewMode === 'editorial' ? 'shadow-md' : 'opacity-80'
              }`}
              style={{
                backgroundColor: viewMode === 'editorial' ? cardBackgroundColor : 'rgba(255,255,255,0.4)',
                borderRadius: theme.button_style === 'rounded' ? '0.5rem' : '0.25rem',
                transition: 'background-color 0.3s ease, color 0.3s ease',
              }}
            >
              <AlignLeft className="w-5 h-5" style={{ color: viewMode === 'editorial' ? primaryColor : textColor }} />
            </button>
          </div>
        </div>

        {filteredProducts.length === 0 && loadingPhase === 'complete' && !showInitialSkeletons ? (
          <div className="text-center py-12">
            <p className="text-gray-600" style={{ fontFamily: theme.primary_font || 'Inter' }}>
              No se encuentra ningun producto indicado
            </p>
          </div>
        ) : (
          <div
            className={
              viewMode === 'list'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-4'
                : viewMode === 'grid'
                ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-4'
                : 'space-y-2'
            }
          >
            {showInitialSkeletons ? (
              <>
                {Array.from({ length: PRODUCTS_PER_PAGE }).map((_, index) => (
                  <ProductCardSkeleton key={`initial-skeleton-${index}`} viewMode={viewMode} />
                ))}
              </>
            ) : (
              <>
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product as any}
                    restaurant={restaurant}
                    viewMode={viewMode}
                    // ✅ CAMBIO: detalle lazy
                    onClick={() => openProduct(product)}
                  />
                ))}
              </>
            )}

            {loadingMoreProducts && (
              <>
                {Array.from({ length: 6 }).map((_, index) => (
                  <ProductCardSkeleton key={`skeleton-${index}`} viewMode={viewMode} />
                ))}
              </>
            )}
          </div>
        )}

        {hasMoreProducts && !loadingMoreProducts && (
          <div id="load-more-sentinel" className="h-20 flex items-center justify-center">
            <div className="text-gray-400 text-sm">Cargando más productos...</div>
          </div>
        )}
      </main>

      {/* PROMOTIONAL MODAL */}
      {showPromoModal && hasPromo && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4"
          onClick={() => setShowPromoModal(false)}
        >
          <div
            className="relative max-w-2xl max-h-[90vh] bg-white rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{
              borderRadius:
                theme.button_style === 'rounded' ? '1rem' : '0.5rem',
            }}
          >
            <button
              onClick={() => setShowPromoModal(false)}
              className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 z-10"
              style={{
                borderRadius:
                  theme.button_style === 'rounded' ? '9999px' : '0.5rem',
              }}
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
            <img
              src={restaurant.settings.promo.vertical_promo_image}
              alt="Promoción"
              loading="lazy"
              className="w-full h-auto object-contain"
            />
          </div>
        </div>
      )}

      {/* PRODUCT DETAIL MODAL */}
      {selectedProduct && (
        <ProductDetail
          product={selectedProduct}
          restaurant={restaurant}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {/* CART SIDEBAR */}
      <CartSidebar
        isOpen={showCart}
        onClose={() => setShowCart(false)}
        onCheckout={() => {
          setShowCart(false);
          setShowCheckout(true);
        }}
        restaurant={restaurant}
      />

      {/* CHECKOUT MODAL */}
      <CheckoutModal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        restaurant={restaurant}
      />

      {/* CART PREVIEW */}
      <CartPreview
        item={lastAddedItem}
        restaurant={restaurant}
        onViewCart={() => setShowCart(true)}
        onClose={clearLastAddedItem}
      />

      {/* HOURS MODAL */}
      {showHoursModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4"
          onClick={() => setShowHoursModal(false)}
        >
          <div
            className="relative max-w-md w-full rounded-lg overflow-hidden p-6"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: cardBackgroundColor,
              borderRadius:
                theme.button_style === 'rounded' ? '1rem' : '0.5rem',
            }}
          >
            <button
              onClick={() => setShowHoursModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X
                className="w-5 h-5"
                style={{ color: primaryTextColor, stroke: primaryTextColor }}
              />
            </button>
            <h3
              className="text-xl font-bold mb-4"
              style={{
                color: textColor,
                fontFamily: theme.primary_font || 'Poppins',
              }}
            >
              Horas de Apertura
            </h3>
            <div className="space-y-3">
              {restaurant.settings.business_hours &&
                Object.entries(restaurant.settings.business_hours).map(
                  ([day, hours]: [string, any]) => {
                    const dayNames: Record<string, string> = {
                      monday: 'Lunes',
                      tuesday: 'Martes',
                      wednesday: 'Miércoles',
                      thursday: 'Jueves',
                      friday: 'Viernes',
                      saturday: 'Sábado',
                      sunday: 'Domingo',
                    };
                    return (
                      <div
                        key={day}
                        className="flex justify-between items-center py-2 border-b "
                        style={{ borderColor: textColor }}
                      >
                        <h5
                          className="font-medium"
                          style={{
                            color: textColor,
                            fontFamily: theme.secondary_font || 'Inter',
                          }}
                        >
                          {dayNames[day]}
                        </h5>
                        <h5
                          className="font-medium"
                          style={{
                            fontFamily: theme.secondary_font || 'Inter',
                            color:textColor
                          }}
                        >
                          {hours.is_open
                            ? `${hours.open} - ${hours.close}`
                            : 'Cerrado'}
                        </h5>
                      </div>
                    );
                  }
                )}
            </div>
          </div>
        </div>
      )}

      {/* FLOATING FOOTER BAR */}
      <div
        className="hidden md:block fixed bottom-2 rounded-b-xl rounded-tr-xl  left-[24px] right-[24px]  md:left-4 md:right-4 md:rounded-b-xl md:rounded-t-xl  md:left-4 md:right-4 py-1 shadow-lg z-40 "
        style={{ backgroundColor: primaryColor }}
      >
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex flex-col md:flex-row items-center justify-center md:justify-between gap-4 text-center">
            {/* OPEN/CLOSED STATUS BUTTON */}
            <button
              onClick={() => setShowHoursModal(true)}
              className="fixed md:hidden left-[24px]  bottom-[82px] transform -translate-y-1/2 shadow-lg px-3 py-3 hover:shadow-xl z-10 rounded-t-xl"
              style={{
                backgroundColor: (() => {
                  const now = new Date();
                  const dayNames = [
                    'sunday',
                    'monday',
                    'tuesday',
                    'wednesday',
                    'thursday',
                    'friday',
                    'saturday',
                  ];
                  const currentDay = dayNames[now.getDay()];
                  const hours = restaurant.settings.business_hours?.[currentDay];
                  if (!hours?.is_open) return '#fcaeae';
                  const currentTime = now.getHours() * 60 + now.getMinutes();
                  const [openH, openM] = hours.open.split(':').map(Number);
                  const [closeH, closeM] = hours.close.split(':').map(Number);
                  const openTime = openH * 60 + openM;
                  const closeTime = closeH * 60 + closeM;
                  return currentTime >= openTime && currentTime <= closeTime ? '#AFFEBF' : '#fcaeae';
                })(),
              }}
            >
              {(() => {
                const now = new Date();
                const dayNames = [
                  'sunday',
                  'monday',
                  'tuesday',
                  'wednesday',
                  'thursday',
                  'friday',
                  'saturday',
                ];
                const currentDay = dayNames[now.getDay()];
                const hours = restaurant.settings.business_hours?.[currentDay];
                const isOpen = (() => {
                  if (!hours?.is_open) return false;
                  const currentTime = now.getHours() * 60 + now.getMinutes();
                  const [openH, openM] = hours.open.split(':').map(Number);
                  const [closeH, closeM] = hours.close.split(':').map(Number);
                  const openTime = openH * 60 + openM;
                  const closeTime = closeH * 60 + closeM;
                  return currentTime >= openTime && currentTime <= closeTime;
                })();

                const textColor = isOpen ? '#1d4b40' : '#491c1c';
                const iconColor = isOpen ? '#1d4b40' : '#491c1c';

                return (
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5" style={{ color: iconColor }} />
                    <div className="text-right">
                      <h5
                        className="font-bold text-sm"
                        style={{
                          color: textColor,
                          fontFamily: theme.secondary_font || 'Poppins',
                        }}
                      >
                        {isOpen ? 'Abierto' : 'Cerrado'}
                      </h5>
                    </div>
                  </div>
                );
              })()}
            </button>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4" style={{ color: secondaryTextColor, stroke: secondaryTextColor }} />
              <h5
                className="font-medium"
                style={{
                  fontFamily: theme.secondary_font || 'Inter',
                  color: secondaryTextColor
                }}
              >
                {restaurant.address}
              </h5>
            </div>

            <div className="flex items-center gap-2">
              {restaurant.settings.social_media?.website && (
                <a
                  href={restaurant.settings.social_media.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:opacity-90 transition-colors rounded-lg"
                  style={{
                    backgroundColor: cardBackgroundColor,
                    borderRadius: theme.button_style === 'rounded' ? '0.5rem' : '0.25rem',
                  }}
                >
                  <Globe className="w-5 h-5" style={{ color: primaryColor, stroke: primaryColor }} />
                </a>
              )}

              {/* ... resto de tus redes sociales igual ... */}

              {restaurant.settings.social_media?.facebook && (
                <a
                  href={restaurant.settings.social_media.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:opacity-90 transition-colors rounded-lg"
                  style={{
                    backgroundColor: cardBackgroundColor,
                    borderRadius: theme.button_style === 'rounded' ? '0.5rem' : '0.25rem',
                  }}
                >
                  <Facebook className="w-5 h-5" style={{ color: primaryColor, stroke: primaryColor }} />
                </a>
              )}

              {restaurant.settings.social_media?.instagram && (
                <a
                  href={restaurant.settings.social_media.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:opacity-90 transition-colors rounded-lg"
                  style={{
                    backgroundColor: cardBackgroundColor,
                    borderRadius: theme.button_style === 'rounded' ? '0.5rem' : '0.25rem',
                  }}
                >
                  <Instagram className="w-5 h-5" style={{ color: primaryColor, stroke: primaryColor }} />
                </a>
              )}

              {restaurant.settings.social_media?.whatsapp && (
                <a
                  href={
                    restaurant.settings.social_media.whatsapp
                      ? `https://wa.me/${restaurant.settings.social_media.whatsapp}`
                      : '#'
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:opacity-90 transition-colors rounded-lg"
                  style={{
                    backgroundColor: cardBackgroundColor,
                    borderRadius: theme.button_style === 'rounded' ? '0.5rem' : '0.25rem',
                  }}
                >
                  <svg className="w-5 h-5" fill={primaryColor} viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ✅ SOLO MÓVIL */}
      <div className="block md:hidden">
        <FloatingFooter
          textColor={primaryTextColor}
          restaurant={restaurant}
          primaryColor={primaryColor}
          secondaryTextColor={secondaryTextColor}
          cardBackgroundColor={cardBackgroundColor}
          theme={theme}
        />
      </div>

      {/* VOICE ASSISTANT WIDGET */}
      {restaurant.elevenlabs_agent_id && (
        <>
          <div className="block md:hidden">
            <VoiceAssistantWidget
              agentId={restaurant.elevenlabs_agent_id}
              restaurantLogoUrl={restaurant.logo_url}
              restaurantName={restaurant.name}
              primaryColor={primaryColor}
              secondaryTextColor={secondaryTextColor}
              isMobile={true}
            />
          </div>
          <div className="hidden md:block">
            <VoiceAssistantWidget
              agentId={restaurant.elevenlabs_agent_id}
              restaurantLogoUrl={restaurant.logo_url}
              restaurantName={restaurant.name}
              primaryColor={primaryColor}
              secondaryTextColor={secondaryTextColor}
              isMobile={false}
            />
          </div>
        </>
      )}
    </div>
  );
};
