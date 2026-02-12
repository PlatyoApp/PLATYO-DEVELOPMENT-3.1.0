import React, { useRef, useEffect, useState } from 'react';
import { Product } from '../../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AnimatedCarouselProps {
  products: Product[];
  primaryColor: string;
  textColor: string;
  cardBackgroundColor?: string;
  fontFamily?: string;
  onProductClick?: (product: Product) => void;
}

const getContainerWidth = () =>
  typeof window !== 'undefined' ? window.innerWidth : 0;

export const AnimatedCarousel: React.FC<AnimatedCarouselProps> = ({
  products,
  primaryColor,
  secundaryColor,
  textColor,
  cardBackgroundColor = '#ffffff',
  fontFamily = 'Poppins',
  onProductClick,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(
    getContainerWidth()
  );
  const [scrollX, setScrollX] = useState(0);

  // **Efecto para manejar el redimensionamiento de la ventana.**
  useEffect(() => {
    const handleResize = () => setContainerWidth(getContainerWidth());
    // Establecer el ancho inicial
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (products.length === 0) {
    console.log('[AnimatedCarousel] No products to display');
    return null;
  }

  console.log('[AnimatedCarousel] Rendering carousel with', products.length, 'products');

  // **1. Lógica de dimensiones mejorada:**
  const isMobile = containerWidth < 768;

  // Define el ancho de la tarjeta basado en el tamaño de la pantalla.
  // - Móvil: 80% del ancho del contenedor.
  // - Tablet/Desktop: Fijo a 350px.
  const CARD_WIDTH = isMobile ? containerWidth * 0.6 : 340;

  // Define la altura para mantener una proporción consistente.
  const CARD_HEIGHT = isMobile ? CARD_WIDTH * 1.2 : 400; // Proporción ligeramente más alta en móvil

  // **2. Cálculo de SPACING para centrar la tarjeta:**
  // El espaciado asegura que la tarjeta activa (centrada) aparezca completamente visible.
  // En móvil, se reduce el espaciado para un mejor uso del espacio horizontal.
  const HORIZONTAL_MARGIN = isMobile ? 0.2 : 3; // Margen horizontal entre tarjetas
  const SPACING = (containerWidth - CARD_WIDTH) / 2;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollX(e.currentTarget.scrollLeft);
  };

  const scrollBy = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      // Avanzar por el ancho de la tarjeta más su margen para ir de una a la siguiente
      const scrollAmount = CARD_WIDTH + HORIZONTAL_MARGIN * 2;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    // Se aumenta la altura para dar espacio a la sombra y la animación de escala.
    <div
      className="relative w-full overflow-hidden"
      style={{ height: `${CARD_HEIGHT + 25}px` }}
    >
      {/* Botones de navegación (solo desktop y tablet) */}
      {!isMobile && (
        <>
          <button
            onClick={() => scrollBy('left')}
            className="absolute left-40 top-1/2 -translate-y-1/2 z-40 bg-white shadow-xl hover:bg-gray-100 rounded-lg p-2 transition-colors"
            aria-label="Previous product"
            style={{ 
              color: primaryColor,
              backgroundColor: cardBackgroundColor,
            }}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scrollBy('right')}
            className="absolute right-40 top-1/2 -translate-y-1/2 z-40 bg-white shadow-xl hover:bg-gray-100 rounded-lg p-2 transition-colors"
            aria-label="Next product"
            style={{ 
              backgroundColor: cardBackgroundColor,
              color: primaryColor 
            }}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Contenedor Scroll */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex overflow-x-scroll scrollbar-hide snap-x snap-mandatory justify-start items-center "
        style={{
          scrollSnapType: 'x mandatory',
          // Padding horizontal para centrar el primer/último elemento
          paddingLeft: `${SPACING}px`,
          paddingRight: `${SPACING}px`,
        }}
      >
        {products.map((product, index) => {
          // Lógica para el efecto de escala (Scale-and-Fade)
          const center = scrollX + containerWidth / 2;
          // Calcular la posición central de la tarjeta, incluyendo el padding del scroll-container.
          const cardCenter =
            SPACING +
            index * (CARD_WIDTH + HORIZONTAL_MARGIN * 2) +
            CARD_WIDTH / 2;
          const distance = Math.abs(center - cardCenter);
          const maxDistance = CARD_WIDTH * 1; // Distancia máxima para que el efecto sea visible

          const scale = Math.max(0.7, 1 - distance / maxDistance);
          const opacity = Math.max(0.9, 1 - distance / (maxDistance * 1));

          return (
            <div
              key={product.id}
              className="flex-shrink-0 snap-center transition-all duration-500 ease-out"
              style={{
                width: `${CARD_WIDTH}px`,
                // Aplicar el margen horizontal entre las tarjetas
                margin: `0px ${HORIZONTAL_MARGIN}px 35px`,
                transform: `scale(${scale})`,
                opacity,
              }}
            >
              <div
                className="rounded-xl shadow-lg flex flex-col items-center cursor-pointer transition-all duration-300 ease-in-out"
                style={{
                  height: `${CARD_HEIGHT}px`,
                  backgroundColor: cardBackgroundColor,

                  // Ligero desplazamiento hacia arriba cuando está activa
                  transform: `translateY(${scale < 1 ? '15px' : '0'})`,
                }}
                onClick={() => onProductClick && onProductClick(product)}
              >
                {/* Imagen del producto */}
                <img
                  src={product.images[0] || ''}
                  alt={product.name}
                  loading="lazy"
                  className="w-full rounded-t-xl object-cover"
                  // Altura de la imagen dinámica
                  style={{
                    height: `${CARD_HEIGHT}px`, // 70% de la altura de la tarjeta
                  }}
                />
                {/* Contenido del producto */}
                <h3
                  className="font-bold text-lg md:text-xl p-4 text-center truncate w-full"
                  style={{
                    color: textColor,
                    fontFamily,
                    textTransform: "uppercase",
                  }}
                >
                  {product.name.split(' ').map((word, i) => (
                    <span key={i}>
                      {i === 0 ? (
                        <span
                          style={{
                            cssText: `color: ${primaryColor} !important`,
                            
                          }}
                        >
                          {word}
                        </span>
                      ) : (
                        <span>{' ' + word}</span>
                      )}
                    </span>
                  ))}
                </h3>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        /* Ocultar la barra de desplazamiento en todos los navegadores */
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};
