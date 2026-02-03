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
import { AnimatedCarousel } from '../../components/public/AnimatedCarousel';
import Pathtop from '../../components/public/Pathformtop.tsx';
import Pathbottom from '../../components/public/Pathformbottom.tsx';
import Pathleft from '../../components/public/Pathformleft.tsx';
import { FloatingFooter } from '../../components/public/FloatingFooter.tsx';
import { VoiceAssistantWidget } from '../../components/public/VoiceAssistantWidget';
import { useLanguage } from '../../contexts/LanguageContext';
import ProductCard from '../../components/public/ProductCard';
import ProductCardSkeleton from '../../components/public/ProductCardSkeleton';

// Tipo “listado ligero” (para no traer payload pesado)
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
  category_id?: string | null;
};

export const PublicMenu: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { items: cartItems, lastAddedItem, clearLastAddedItem } = useCart();
  const { t } = useLanguage();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  // 👇 ahora products es “ligero”
  const [products, setProducts] = useState<ProductListItem[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // 👇 selectedProduct será “full” (detalle)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loadingSelectedProduct, setLoadingSelectedProduct] = useState(false);

  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingPhase, setLoadingPhase] = useState<'initial' | 'restaurant' | 'categories' | 'products' | 'complete'>('initial');
  const [error, setError] = useState<string | null>(null);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [featuredSlideIndex, setFeaturedSlideIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'editorial'>('list');
  const [showHoursModal, setShowHoursModal] = useState(false);

  const [loadingMoreProducts, setLoadingMoreProducts] = useState(false);
  const [hasMoreProducts, setHasMoreProducts] = useState(true);
  const [productOffset, setProductOffset] = useState(0);
  const PRODUCTS_PER_PAGE = 15;
  const [showInitialSkeletons, setShowInitialSkeletons] = useState(true);

  // --- Scroll hide header ---
  const [showHeader, setShowHeader] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  // --- Lógica del Scroll ---
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      const isScrolled = currentScrollY > 50;
      setScrolled(isScrolled);

      if (currentScrollY < lastScrollY || currentScrollY < 100) setShowHeader(true);
      else if (currentScrollY > lastScrollY && currentScrollY > 100) setShowHeader(false);

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Cache para product_categories (si ya lo usabas)
  const [productCategoryCache, setProductCategoryCache] = useState<Record<string, string | null>>({});

  // ✅ CLICK: traer detalle solo del producto clicado
  const openProduct = useCallback(
    async (productLite: ProductListItem) => {
      if (!restaurant?.id) return;

      setLoadingSelectedProduct(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select(
            `
            *,
            product_categories ( category_id )
          `
          )
          .eq('restaurant_id', restaurant.id)
          .eq('id', productLite.id)
          .single();

        if (error) throw error;

        const fullProduct = {
          ...data,
          images: data.images || [],
          category_id: data.product_categories?.[0]?.category_id || null
        };

        setSelectedProduct(fullProduct as any);
      } catch (err) {
        console.error('[PublicMenu] Error loading product detail:', err);
        // fallback: abre con lite (por si acaso)
        setSelectedProduct(productLite as any);
      } finally {
        setLoadingSelectedProduct(false);
      }
    },
    [restaurant?.id]
  );

  const loadMenuData = async () => {
    try {
      setLoading(true);
      setLoadingPhase('initial');
      setError(null);
      setShowInitialSkeletons(true);

      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug || '');

      let query = supabase
        .from('restaurants')
        .select('id, name, slug, domain, email, phone, address, logo_url, is_active, settings, elevenlabs_agent_id');

      if (isUUID) query = query.or(`slug.eq.${slug},id.eq.${slug},domain.eq.${slug}`);
      else query = query.or(`slug.eq.${slug},domain.eq.${slug}`);

      const { data: restaurantData, error: restaurantError } = await query.maybeSingle();
      if (restaurantError) throw restaurantError;

      if (!restaurantData) {
        setError(`Restaurante no encontrado: ${slug}`);
        setLoading(false);
        setShowInitialSkeletons(false);
        return;
      }

      // FASE 1: Mostrar restaurante y header inmediatamente
      setRestaurant(restaurantData);
      setLoadingPhase('restaurant');
      setLoading(false);

      // ✅ LISTADO LIGERO: sin variations/ingredients/compare_at_price
      const productsResult = await supabase
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
          display_order
          `
        )
        .eq('restaurant_id', restaurantData.id)
        .in('status', ['active', 'out_of_stock'])
        .order('display_order', { ascending: true })
        .range(0, PRODUCTS_PER_PAGE - 1);

      if (productsResult.error) throw productsResult.error;

      const productIds = (productsResult.data || []).map((p: any) => p.id);

      const [categoriesResult, allProductCategoriesResult] = await Promise.all([
        supabase
          .from('categories')
          .select('id, name, icon, restaurant_id, is_active, display_order')
          .eq('restaurant_id', restaurantData.id)
          .eq('is_active', true)
          .order('display_order', { ascending: true }),

        productIds.length > 0
          ? supabase.from('product_categories').select('product_id, category_id').in('product_id', productIds)
          : Promise.resolve({ data: [], error: null })
      ]);

      if (categoriesResult.error) throw categoriesResult.error;
      if (allProductCategoriesResult.error) throw allProductCategoriesResult.error;

      setCategories(categoriesResult.data || []);
      setLoadingPhase('categories');

      const productCategoryMap: Record<string, string | null> = {};
      (allProductCategoriesResult.data || []).forEach((pc: any) => {
        if (!productCategoryMap[pc.product_id]) productCategoryMap[pc.product_id] = pc.category_id;
      });
      setProductCategoryCache(productCategoryMap);

      // ✅ ya NO fabricamos variations aquí
      const transformedInitialProducts: ProductListItem[] = (productsResult.data || []).map((p: any) => ({
        ...p,
        images: p.images || [],
        category_id: productCategoryMap[p.id] || null,
      }));

      setProducts(transformedInitialProducts);
      setShowInitialSkeletons(false);
      setProductOffset(PRODUCTS_PER_PAGE);
      setHasMoreProducts(transformedInitialProducts.length === PRODUCTS_PER_PAGE);
      setLoadingPhase('complete');

      // Cleanup featured ids (igual que antes, pero usando ids cargados)
      if (restaurantData.settings?.promo?.featured_product_ids?.length) {
        const validProductIds = transformedInitialProducts.map((p: any) => p.id);
        const configuredIds = restaurantData.settings.promo.featured_product_ids;
        const invalidIds = configuredIds.filter((id: string) => !validProductIds.includes(id));

        if (invalidIds.length > 0) {
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

      // ✅ LISTADO LIGERO (sin variations/ingredients/compare_at_price)
      const { data: moreProductsData, error: moreProductsError } = await supabase
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
          display_order
          `
        )
        .eq('restaurant_id', restaurant.id)
        .in('status', ['active', 'out_of_stock'])
        .order('display_order', { ascending: true })
        .range(productOffset, productOffset + PRODUCTS_PER_PAGE - 1);

      if (moreProductsError) throw moreProductsError;

      const productIds = (moreProductsData || []).map((p: any) => p.id);

      let productCategoryMap = { ...productCategoryCache };
      const uncachedIds = productIds.filter((id) => !(id in productCategoryMap));

      if (uncachedIds.length > 0) {
        const { data: productCategoriesData } = await supabase
          .from('product_categories')
          .select('product_id, category_id')
          .in('product_id', uncachedIds);

        if (productCategoriesData) {
          productCategoriesData.forEach((pc: any) => {
            if (!productCategoryMap[pc.product_id]) productCategoryMap[pc.product_id] = pc.category_id;
          });
          setProductCategoryCache(productCategoryMap);
        }
      }

      const transformedProducts: ProductListItem[] = (moreProductsData || []).map((p: any) => ({
        ...p,
        images: p.images || [],
        category_id: productCategoryMap[p.id] || null
      }));

      setProducts((prev) => [...prev, ...transformedProducts]);
      setProductOffset((prev) => prev + PRODUCTS_PER_PAGE);
      setHasMoreProducts(transformedProducts.length === PRODUCTS_PER_PAGE);
    } catch (err) {
      console.error('[PublicMenu] Error loading more products:', err);
    } finally {
      setLoadingMoreProducts(false);
    }
  };

  useEffect(() => {
    if (slug) loadMenuData();
    else {
      setError('No se proporcionó un identificador de restaurante');
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = selectedCategory === 'all' || product.category_id === selectedCategory;
      if (!matchesCategory) return false;

      if (searchTerm === '') return true;
      const searchLower = searchTerm.toLowerCase();

      return (
        product.name.toLowerCase().includes(searchLower) ||
        (product.description && product.description.toLowerCase().includes(searchLower))
      );
    });
  }, [products, selectedCategory, searchTerm]);

  const featuredProducts = useMemo(() => {
    if (!restaurant?.settings.promo?.featured_product_ids?.length) {
      return products.filter((p) => p.is_featured).slice(0, 5);
    }
    const featuredIds = restaurant.settings.promo.featured_product_ids;
    const validFeatured = products.filter((p) => featuredIds.includes(p.id));
    if (validFeatured.length === 0) return products.filter((p) => p.is_featured).slice(0, 5);
    return validFeatured.slice(0, 5);
  }, [products, restaurant?.settings.promo?.featured_product_ids]);

  const cartItemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMoreProducts && !loadingMoreProducts) loadMoreProducts();
      },
      { threshold: 0.1 }
    );

    const sentinel = document.getElementById('load-more-sentinel');
    if (sentinel) observer.observe(sentinel);

    return () => {
      if (sentinel) observer.unobserve(sentinel);
    };
  }, [hasMoreProducts, loadingMoreProducts, productOffset]); // eslint-disable-line

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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">a</h2>
          <p className="text-gray-600 mb-4">{error || 'El menú que buscas no está disponible.'}</p>
        </div>
      </div>
    );
  }

  if (!restaurant) return null;

  const theme = restaurant.settings.theme;
  const primaryColor = theme.primary_color || '#FFC700';
  const secondaryColor = theme.secondary_color || '#f3f4f6';
  const menuBackgroundColor = theme.menu_background_color || '#ffffff';
  const cardBackgroundColor = theme.card_background_color || '#f9fafb';
  const primaryTextColor = theme.primary_text_color || '#111827';
  const secondaryTextColor = theme.secondary_text_color || '#6b7280';
  const textColor = theme.primary_text_color || '#111827';
  const hasPromo = restaurant.settings.promo?.enabled && restaurant.settings.promo?.vertical_promo_image;

  const internalDivStyle = scrolled
    ? {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        transition: 'background-color 300ms, backdrop-filter 300ms'
      }
    : {
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
      {/* ... (tu <style> y shapes quedan igual) ... */}

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
            {/* Search Bar (igual) */}
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
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg focus:ring-2 focus:outline-none transition-colors placeholder-opacity-70 custom-placeholder"
                  style={{
                    backgroundColor: cardBackgroundColor,
                    borderColor: cardBackgroundColor,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderRadius: theme.button_style === 'rounded' ? '0.5rem' : '0.25rem',
                    color: primaryTextColor,
                    caretColor: primaryTextColor,
                    fontFamily: theme.secondary_font || 'Poppins',
                  }}
                />
              </div>
            </div>

            {/* ✅ Logo (FIX móvil): QUITAR hidden md:block */}
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
                  className="text-2xl md:text-3xl font-bold"
                  style={{
                    color: primaryColor,
                    fontFamily: theme.secondary_font || 'Poppins',
                  }}
                >
                  {restaurant.name.substring(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            {/* Action buttons (igual) */}
            <div className="flex items-center gap-1 md:gap-2 flex-1 justify-end max-w-[150px] md:max-w-xs">
              {hasPromo && (
                <button
                  onClick={() => setShowPromoModal(true)}
                  className="p-3 rounded-lg border transition-colors relative hover:opacity-90 shadow-lg"
                  style={{
                    backgroundColor: cardBackgroundColor,
                    borderColor: cardBackgroundColor,
                    borderRadius: theme.button_style === 'rounded' ? '0.5rem' : '0.25rem',
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
                  borderRadius: theme.button_style === 'rounded' ? '0.5rem' : '0.25rem',
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

      {/* Carousel: solo cambio el click para abrir detalle lazy */}
      {!searchTerm && !showInitialSkeletons && featuredProducts.length > 0 && (
        <AnimatedCarousel
          products={featuredProducts as any}
          primaryColor={primaryColor}
          textColor={textColor}
          cardBackgroundColor={cardBackgroundColor}
          fontFamily={theme.secondary_font || 'Poppins'}
          onProductClick={(p: any) => openProduct(p)}
        />
      )}

      {/* PRODUCTS LIST (solo cambia onClick) */}
      <main className="max-w-6xl mx-auto pb-[74px] md:-mt-[20px] md:pb-[125px] py-1 relative z-10" id="products-section">
        {/* ... tus tabs y selector vista igual ... */}

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

        {hasMoreProducts && !loadingMoreProducts && (
          <div id="load-more-sentinel" className="h-20 flex items-center justify-center">
            <div className="text-gray-400 text-sm">Cargando más productos...</div>
          </div>
        )}
      </main>

      {/* PRODUCT DETAIL MODAL */}
      {selectedProduct && (
        <ProductDetail
          product={selectedProduct}
          restaurant={restaurant}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {/* (el resto de tu código: promo, cart, checkout, footer, widgets… queda igual) */}
    </div>
  );
};
