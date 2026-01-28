import React, { useState, useEffect } from 'react';
import { MapPin, Globe, Facebook, Instagram, Clock, X } from 'lucide-react';

interface FloatingFooterProps {
  restaurant: any;
  primaryColor: string;
  cardBackgroundColor: string;
  theme: {
    primary_font?: string;
    secondary_font?: string;
    button_style?: 'rounded' | 'square';
  };
}

export const FloatingFooter: React.FC<FloatingFooterProps> = ({
  restaurant,
  primaryColor,
  textColor,
  secondaryTextColor,
  cardBackgroundColor,
  theme,
}) => {
  const [showFooter, setShowFooter] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showHoursModal, setShowHoursModal] = useState(false);

  // Detecta si es vista móvil
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Función para saber si está abierto
  const isOpenNow = () => {
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

    if (!hours?.is_open) return false;
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [openH, openM] = hours.open.split(':').map(Number);
    const [closeH, closeM] = hours.close.split(':').map(Number);
    const openTime = openH * 60 + openM;
    const closeTime = closeH * 60 + closeM;
    return currentTime >= openTime && currentTime <= closeTime;
  };

  const isOpen = isOpenNow();

  const textColor1 = isOpen ? '#1d4b40' : '#491c1c'; 
  const primaryTextColor = isOpen ? '#1d4b40' : '#491c1c'; // mismo color para el ícono

  return (
    <>
      {/* 🌍 BOTONES FLOTANTES (solo móvil) */}
      {isMobile && (
        <div
          className={`fixed left-5 flex gap-2 z-40 transition-all duration-300 ease-in-out`}
          style={{
            bottom: showFooter ? '100px' : '16px', // ambos se levantan juntos
          }}
        >
          
          {/* 📍 Botón del PIN */}
          <button
            onClick={() => setShowFooter((prev) => !prev)}
            className="transition-all duration-300 ease-in-out shadow-lg  bg-white p-3"
            style={{
              backgroundColor: cardBackgroundColor,
              borderRadius:
                theme.button_style === 'rounded' ? '0.5rem' : '0.25rem',
            }}
          >
            <MapPin
              className="w-5 h-5"
              style={{
                color: primaryColor,
                stroke: primaryColor,
              }}
            />
          </button>
          {/* 🕒 Botón del reloj con texto */}
          <button
            onClick={() => setShowHoursModal(true)}
            className="shadow-lg flex items-center gap-2 px-3 py-3 hover:shadow-xl transition-all duration-300 ease-in-out"
            style={{
              backgroundColor: isOpen ? '#AFFEBF' : '#fcaeae',
              borderRadius:
                theme.button_style === 'rounded' ? '0.5rem' : '0.25rem',
            }}
          >
            <Clock
              className="w-4 h-4"
              style={{
                color: textColor1,
              }}
            />
            <h5
              className="text-sm font-semibold"
              style={{
                color: textColor1,
                fontFamily: theme.primary_font || 'Poppins',
                textTransform: 'uppercase',
              }}
            >
              {isOpen ? 'Abierto' : 'Cerrado'}
            </h5>
          </button>
        </div>
      )}

      {/* 🧩 FOOTER PRINCIPAL */}
      <div
        className={`fixed left-0 right-0 mx-4 rounded-t-xl shadow-lg z-40 transition-all duration-300 ease-in-out
          ${showFooter ? 'bottom-0 opacity-100' : '-bottom-48 opacity-0'}
          md:translate-y-0 md:opacity-100`}
        style={{
          backgroundColor: primaryColor,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-col md:flex-row items-center justify-center md:justify-between gap-4 text-center">
            {/* 📍 Dirección */}
            <div className="flex items-center gap-2 text-sm">
              <MapPin
                className="w-4 h-4"
                style={{
                  color: secondaryTextColor,
                  stroke: secondaryTextColor,
                }}
              />
              <h5
                className="font-medium"
                style={{
                  fontFamily: theme.secondary_font || 'Inter',
                  color: secondaryTextColor,
                }}
              >
                {restaurant.address}
              </h5>
            </div>

            {/* 🌐 Redes sociales */}
            <div className="flex items-center gap-2">
              {restaurant.settings.social_media?.website && (
                <a
                  href={restaurant.settings.social_media.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:opacity-90 transition-colors rounded-lg"
                  style={{
                    backgroundColor: cardBackgroundColor,
                    borderRadius:
                      theme.button_style === 'rounded' ? '0.5rem' : '0.25rem',
                  }}
                >
                  <Globe
                    className="w-5 h-5"
                    style={{ color: primaryColor, stroke: primaryColor }}
                  />
                </a>
              )}
              {restaurant.settings.social_media?.tiktok && (
                <a
                  href={restaurant.settings.social_media.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:opacity-90 transition-colors rounded-lg"
                  style={{
                    color: primaryColor,
                    backgroundColor: cardBackgroundColor,
                    borderRadius:
                      theme.button_style === 'rounded' ? '0.5rem' : '0.25rem',
                  }}
                >
                  <svg
                    className="w-5 h-5"
                    fill={primaryColor}
                    viewBox="0 0 24 24"
                  >
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0011.14-4.02v-6.95a8.16 8.16 0 004.65 1.46v-3.4a4.84 4.84 0 01-1.2-.5z" />
                  </svg>
                </a>
              )}
              {restaurant.settings.social_media?.twitter && (
                <a
                  href={restaurant.settings.social_media.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:opacity-90 transition-colors rounded-lg"
                  style={{
                    backgroundColor: cardBackgroundColor,
                    borderRadius:
                      theme.button_style === 'rounded' ? '0.5rem' : '0.25rem',
                  }}
                >
                  <svg
                    className="w-5 h-5 "
                    fill={primaryColor}
                    viewBox="0 0 24 24"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  {/*<Twitter className="w-5 h-5" style={{ color: primaryColor, stroke: primaryColor }} />*/}
                </a>
              )}
              {restaurant.settings.social_media?.facebook && (
                <a
                  href={restaurant.settings.social_media.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:opacity-90 transition-colors rounded-lg"
                  style={{
                    backgroundColor: cardBackgroundColor,
                    borderRadius:
                      theme.button_style === 'rounded' ? '0.5rem' : '0.25rem',
                  }}
                >
                  <Facebook
                    className="w-5 h-5"
                    style={{ color: primaryColor, stroke: primaryColor }}
                  />
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
                    borderRadius:
                      theme.button_style === 'rounded' ? '0.5rem' : '0.25rem',
                  }}
                >
                  <Instagram
                    className="w-5 h-5"
                    style={{ color: primaryColor, stroke: primaryColor }}
                  />
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
                    borderRadius:
                      theme.button_style === 'rounded' ? '0.5rem' : '0.25rem',
                  }}
                >
                  <svg
                    className="w-5 h-5"
                    fill={primaryColor}
                    viewBox="0 0 24 24"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                  {/*<Phone className="w-5 h-5" style={{ color: primaryColor, stroke: primaryColor }} />*/}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 🕓 MODAL DE HORARIOS */}
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
                style={{ color: primaryColor, stroke: primaryColor }}
              />
            </button>
            <h3
              className="text-xl font-bold mb-4"
              style={{
                color: textColor,
                fontFamily: theme.secondary_font || 'Poppins',
              }}
            >
              Horarios de Atención
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
                        className="flex justify-between items-center py-2 border-b border-gray-100"
                        style={{ borderColor: textColor, }}
                      >
                        <h5
                          className="font-medium"
                          style={{
                            color: textColor,
                            fontFamily: theme.primary_font || 'Inter',
                          }}
                        >
                          {dayNames[day]}
                        </h5>
                        <h5
                          className="font-medium"
                          style={{
                            color:textColor,
                            fontFamily: theme.primary_font || 'Inter',
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
    </>
  );
};
