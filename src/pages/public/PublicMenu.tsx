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
  Facebook,
  Instagram,
  Globe,
  AlignLeft,
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import { Category, Product, Restaurant } from '../../types';
import { supabase } from '../../lib/supabase';
import { useCart } from '../../contexts/CartContext';
import { ProductDetail } from '../../components/public/ProductDetail';
import { CartSidebar } from '../../components/public/CartSidebar';
import { CheckoutModal } from '../../components/public/CheckoutModal';
import { CartPreview } from '../../components/public/CartPreview';
import { AnimatedCarousel } from '../../components/public/AnimatedCarousel';
import Pathtop from '../../components/public/Pathformtop.tsx';
import Pathbottom from '../../components/public/Pathformbottom.tsx';
import Pathleft from '../../components/public/Pathformleft.tsx';
import { FloatingFooter } from '../../components/public/FloatingFooter.tsx';
import { VoiceAssistantWidget } from '../../components/public/VoiceAssistantWidget';
import { useLanguage } from '../../contexts/LanguageContext';
import ProductCard from '../../components/public/ProductCard';
import ProductCardSkeleton from '../../components/public/ProductCardSkeleton';

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

  // LISTADO LIGERO
  const [products, setProducts] = useState<ProductListItem[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // DETALLE LAZY
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

  // Infinite scroll
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

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 50);

      if (currentScrollY < lastScrollY || currentScrollY < 100) setShowHeader(true);
      else if (currentScrollY > lastScrollY && currentScrollY > 100) setShowHeader(false);

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Cache para categoría por producto (solo si hace falta)
  const [productCategoryCache, setProductCategoryCache] = useState<Record<string, string | null>>({});

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

      query = isUUID
        ? query.or(`slug.eq.${slug},id.eq.${slug},domain.eq.${slug}`)
        : query.or(`slug.eq.${slug},domain.eq.${slug}`);

      const { data: restaurantData, error: restaurantError } = await query.maybeSingle();

      if (restaurantError) throw restaurantError;

      if (!restaurantData) {
        setError(`Restaurante no encontrado: ${slug}`);
        setLoading(false);
        setShowInitialSkeletons(false);
        return;
      }

      // Mostrar header rápido
      setRestaurant(restaurantData);
      setLoadingPhase('restaurant');
      setLoading(false);

      // Categorías (ligero)
      const categoriesPromise = supabase
        .from('categories')
        .select('id, name, icon, restaurant_id, is_active, display_order')
        .eq('restaurant_id', restaurantData.id)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      // Productos listado (LIGERO, SIN variations/ingredients)
      const productsPromise = supabase
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
          display_order,
          product_categories ( category_id )
        `
        )
        .eq('restaurant_id', restaurantData.id)
        .in('status', ['active', 'out_of_stock'])
        .order('display_order', { ascending: true })
        .range(0, PRODUCTS_PER_PAGE - 1);

      const [categoriesResult, productsResult] = await Promise.all([categoriesPromise, productsPromise]);

      if (categoriesResult.error) throw categoriesResult.error;
      if (productsResult.error) throw productsResult.error;

      setCategories(categoriesResult.data || []);
      setLoadingPhase('categories');

      const initialProducts = (productsResult.data || []).map((p: any) => {
        const category_id = p.product_categories?.[0]?.category_id ?? null;
        return {
          id: p.id,
          restaurant_id: p.restaurant_id,
          name: p.name,
          description: p.description ?? null,
          price: Number(p.price) || 0,
          images: p.images || [],
          status: p.status,
          is_available: !!p.is_available,
          is_featured: !!p.is_featured,
          display_order: p.display_order || 0,
          category_id,
        } satisfies ProductListItem;
      });

      // Guardar cache simple de categorías por producto (opcional)
      const map: Record<string, string | null> = {};
      initialProducts.forEach((p) => (map[p.id] = p.category_id ?? null));
      setProductCategoryCache(map);

      setProducts(initialProducts);
      setShowInitialSkeletons(false);
      setProductOffset(PRODUCTS_PER_PAGE);
      setHasMoreProducts(initialProducts.length === PRODUCTS_PER_PAGE);
      setLoadingPhase('complete');

      // Promo modal
      const hasPromo = restaurantData.settings?.promo?.enabled && restaurantData.settings?.promo?.vertical_promo_image;
      if (hasPromo) setShowPromoModal(true);
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

      // LISTADO LIGERO (sin variations/ingredients)
      const { data: moreProductsData, error } = await supabase
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
          display_order,
          product_categories ( category_id )
        `
        )
        .eq('restaurant_id', restaurant.id)
        .in('status', ['active', 'out_of_stock'])
        .order('display_order', { ascending: true })
        .range(productOffset, productOffset + PRODUCTS_PER_PAGE - 1);

      if (error) throw error;

      const transformed = (moreProductsData || []).map((p: any) => {
        const category_id = p.product_categories?.[0]?.category_id ?? null;
        return {
          id: p.id,
          restaurant_id: p.restaurant_id,
          name: p.name,
          description: p.description ?? null,
          price: Number(p.price) || 0,
          images: p.images || [],
          status: p.status,
          is_available: !!p.is_available,
          is_featured: !!p.is_featured,
          display_order: p.display_order || 0,
          category_id,
        } satisfies ProductListItem;
      });

      // actualizar cache local
      if (transformed.length) {
        setProductCategoryCache((prev) => {
          const next = { ...prev };
          transformed.forEach((p) => {
            if (!(p.id in next)) next[p.id] = p.category_id ?? null;
          });
          return next;
        });
      }

      setProducts((prev) => [...prev, ...transformed]);
      setProductOffset((prev) => prev + PRODUCTS_PER_PAGE);
      setHasMoreProducts(transformed.length === PRODUCTS_PER_PAGE);
    } catch (err) {
      console.error('[PublicMenu] Error loading more products:', err);
    } finally {
      setLoadingMoreProducts(false);
    }
  };

  // Click producto -> detalle lazy
  const openProductDetail = useCallback(
    async (productLite: ProductListItem) => {
      if (!restaurant) return;

      setLoadingSelectedProduct(true);

      try {
        // Traer detalle real SOLO cuando se abre
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
          category_id: data.product_categories?.[0]?.category_id ?? null,
        };

        setSelectedProduct(fullProduct as any);
      } catch (err) {
        console.error('[PublicMenu] Error loading product detail:', err);
        // fallback: abre con el producto ligero (sin variaciones)
        setSelectedProduct(productLite as any);
      } finally {
        setLoadingSelectedProduct(false);
      }
    },
    [restaurant]
  );

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
      return products.filter((p) => p.is_featured).slice(0, 5) as any[];
    }
    const featuredIds = restaurant.settings.promo.featured_product_ids;
    const validFeatured = products.filter((p) => featuredIds.includes(p.id));
    return (validFeatured.length ? validFeatured : products.filter((p) => p.is_featured)).slice(0, 5) as any[];
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
  const hasPromo =
    restaurant.settings.promo?.enabled &&
    restaurant.settings.promo?.vertical_promo_image;

  const internalDivStyle = scrolled
    ? {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        transition: 'background-color 300ms, backdrop-filter 300ms',
      }
    : {
        backgroundColor: 'transparent',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        transition: 'background-color 300ms, backdrop-filter 300ms',
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
      {/* Shapes */}
      {theme?.pathform && (
        <Pathleft
          color={secondaryColor}
          className="
            absolute opacity-90 w-[160px] h-[400px]
            translate-y-[30%] -translate-x-[10%]
            md:-top-20 md:w-[320px] md:h-[800px] md:-translate-y-[15%] md:-translate-x-[10%]
          "
        />
      )}

      {theme?.pathform && (
        <Pathbottom
          color={secondaryColor}
          className="
            absolute top-0 right-0 opacity-90 w-[150px] h-[150px]
            -translate-y-[25%] translate-x-[0%]
            md:top-0 md:right-0 md:w-[300px] md:h-[300px] -translate-y-[25%]
          "
        />
      )}

      {theme?.pathform && (
        <Pathtop
          color={secondaryColor}
          className="
            absolute -bottom-20 right-0 opacity-90 w-[150px] h-[150px]
            -translate-y-[54%] rotate-90
            md:-bottom-20 md:w-[300px] md:h-[300px] md:-translate-y-[27%] md:rotate-90
          "
        />
      )}

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
                <style>{`
                  .custom-placeholder::placeholder {
                    color: ${primaryTextColor} !important;
                    opacity: 0.7;
                  }
                `}</style>
              </div>
            </div>

            {/* ✅ Logo (AHORA TAMBIÉN EN MÓVIL) */}
            <div className="flex-shrink-0 text-center">
              {restaurant.logo_url ? (
                <img
                  src={restaurant.logo_url}
                  alt={restaurant.name}
                  loading="lazy"
                  className="h-10 md:h-16 mx-auto block"
                  style={{ maxWidth: '120px', objectFit: 'contain' }}
                />
              ) : (
                <div
                  className="text-2xl md:text-3xl font-bold"
                  style={{ color: primaryColor, fontFamily: theme.secondary_font || 'Poppins' }}
                >
                  {restaurant.name.substring(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            {/* Action Buttons */}
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

      {/* Featured + carousel (igual) */}
      {!searchTerm && !showInitialSkeletons && featuredProducts.length > 0 && (
        <div className="text-left px-[15px] md:px-[210px] md:-mt-[9px] md:-mb-[30px] scale-[0.85]">
          <h3 className="text-xl" style={{ color: primaryTextColor, fontFamily: theme.secondary_font || 'Poppins' }}>
            {t('featured_products_title')}
          </h3>
          <h2 className="text-5xl font-bold" style={{ color: primaryTextColor, fontFamily: theme.primary_font || 'Poppins' }}>
            {t('presenting_featured_products1')}
          </h2>
          <div className="flex items-left justify-left gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="w-5 h-5 fill-current" style={{ color: primaryColor }} />
            ))}
          </div>
        </div>
      )}

      {!searchTerm && !showInitialSkeletons && featuredProducts.length > 0 && (
        <AnimatedCarousel
          products={featuredProducts as any}
          primaryColor={primaryColor}
          textColor={textColor}
          cardBackgroundColor={cardBackgroundColor}
          fontFamily={theme.secondary_font || 'Poppins'}
          onProductClick={(p: any) => openProductDetail(p)}
        />
      )}

      {/* PRODUCTS LIST */}
      <main
        className="max-w-6xl mx-auto pb-[74px] md:-mt-[20px] md:pb-[125px] py-1 relative z-10"
        id="products-section"
      >
        {/* CATEGORIES + VIEW */}
        <div className="flex flex-col justify-center items-center w-full max-w-7xl mx-auto py-4 relative z-20 md:flex-row md:justify-between">
          <div className="w-full md:w-[85%] mx-auto">
            <div className="flex gap-2 py-[2px] overflow-x-auto justify-start px-4 categories-scroll">
              <button
                onClick={() => setSelectedCategory('all')}
                className="px-6 py-2 whitespace-nowrap transition-all font-medium text-sm flex-shrink-0"
                style={{
                  backgroundColor: selectedCategory === 'all' ? primaryColor : 'transparent',
                  color: selectedCategory === 'all' ? secondaryTextColor : primaryColor,
                  border: `1px solid ${primaryColor}`,
                  borderRadius: theme.button_style === 'rounded' ? '0.5rem' : '0.25rem',
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
                    backgroundColor: selectedCategory === category.id ? primaryColor : 'transparent',
                    color: selectedCategory === category.id ? secondaryTextColor : primaryColor,
                    border: `1px solid ${primaryColor}`,
                    borderRadius: theme.button_style === 'rounded' ? '0.5rem' : '0.25rem',
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
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'shadow-md' : 'opacity-80'}`}
              style={{
                backgroundColor: viewMode === 'list' ? cardBackgroundColor : 'rgba(255,255,255,0.4)',
                borderRadius: theme.button_style === 'rounded' ? '0.5rem' : '0.25rem',
              }}
            >
              <List className="w-5 h-5" style={{ color: viewMode === 'list' ? primaryColor : textColor }} />
            </button>

            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'shadow-md' : 'opacity-80'}`}
              style={{
                backgroundColor: viewMode === 'grid' ? cardBackgroundColor : 'rgba(255,255,255,0.4)',
                borderRadius: theme.button_style === 'rounded' ? '0.5rem' : '0.25rem',
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
                    onClick={() => openProductDetail(product)}
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4" onClick={() => setShowPromoModal(false)}>
          <div className="relative max-w-2xl max-h-[90vh] bg-white rounded-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowPromoModal(false)} className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 z-10">
              <X className="w-6 h-6 text-gray-600" />
            </button>
            <img src={restaurant.settings.promo.vertical_promo_image} alt="Promoción" loading="lazy" className="w-full h-auto object-contain" />
          </div>
        </div>
      )}

      {/* PRODUCT DETAIL MODAL (ya abre con dato completo) */}
      {selectedProduct && (
        <ProductDetail
          product={selectedProduct}
          restaurant={restaurant}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      <CartSidebar
        isOpen={showCart}
        onClose={() => setShowCart(false)}
        onCheckout={() => {
          setShowCart(false);
          setShowCheckout(true);
        }}
        restaurant={restaurant}
      />

      <CheckoutModal isOpen={showCheckout} onClose={() => setShowCheckout(false)} restaurant={restaurant} />

      <CartPreview item={lastAddedItem} restaurant={restaurant} onViewCart={() => setShowCart(true)} onClose={clearLastAddedItem} />

      {/* HOURS MODAL (sin cambios) */}
      {showHoursModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4" onClick={() => setShowHoursModal(false)}>
          <div className="relative max-w-md w-full rounded-lg overflow-hidden p-6" onClick={(e) => e.stopPropagation()} style={{ backgroundColor: cardBackgroundColor }}>
            <button onClick={() => setShowHoursModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" style={{ color: primaryTextColor, stroke: primaryTextColor }} />
            </button>
            <h3 className="text-xl font-bold mb-4" style={{ color: textColor, fontFamily: theme.primary_font || 'Poppins' }}>
              Horas de Apertura
            </h3>
            <div className="space-y-3">
              {restaurant.settings.business_hours &&
                Object.entries(restaurant.settings.business_hours).map(([day, hours]: [string, any]) => {
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
                    <div key={day} className="flex justify-between items-center py-2 border-b" style={{ borderColor: textColor }}>
                      <h5 className="font-medium" style={{ color: textColor, fontFamily: theme.secondary_font || 'Inter' }}>
                        {dayNames[day]}
                      </h5>
                      <h5 className="font-medium" style={{ color: textColor, fontFamily: theme.secondary_font || 'Inter' }}>
                        {hours.is_open ? `${hours.open} - ${hours.close}` : 'Cerrado'}
                      </h5>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

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
