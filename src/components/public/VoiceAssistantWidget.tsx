import React from 'react';
import { Phone, PhoneOff } from 'lucide-react';
import { useElevenLabsConversation } from '../../hooks/useElevenLabsConversation';
import { useToast } from '../../hooks/useToast';

interface VoiceAssistantWidgetProps {
  agentId: string;
  restaurantLogoUrl?: string;
  restaurantName: string;
  primaryColor: string;
  secondaryTextColor: string;
  isMobile?: boolean;
}

export const VoiceAssistantWidget: React.FC<VoiceAssistantWidgetProps> = ({
  agentId,
  primaryColor,
  secondaryTextColor,
  isMobile = false,
}) => {
  const { showToast } = useToast();
  const { status, isActive, toggleConversation } = useElevenLabsConversation({
    agentId,
    onError: (error) => {
      showToast(error.message, 'error');
    },
  });

  const isLoading = status === 'connecting';
  const isSpeaking = status === 'speaking';
  const isListening = status === 'listening';

  return (
    <div
      className={`fixed z-[10] ${
        isMobile ? 'right-4 bottom-4' : 'right-8 bottom-20'
      }`}
    >
      <div
        className="transition-all duration-300"
        style={{
          filter: isActive ? 'drop-shadow(0 10px 20px rgba(0, 0, 0, 0.3))' : 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))',
        }}
      >
        {/* Botón de Llamada */}
        <button
          onClick={toggleConversation}
          disabled={isLoading}
          className="relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: '#000000',
            transform: isActive ? 'scale(1.05)' : 'scale(1)',
          }}
          aria-label={isActive ? 'Finalizar llamada' : 'Iniciar llamada'}
        >
          {/* Animación de ring expansivo cuando está inactivo */}
          {!isActive && !isLoading && (
            <>
              <span
                className="absolute inset-0 rounded-full animate-ping"
                style={{
                  backgroundColor: primaryColor,
                  opacity: 0.6,
                  animationDuration: '2s',
                }}
              />
              <span
                className="absolute inset-0 rounded-full animate-pulse"
                style={{
                  backgroundColor: primaryColor,
                  opacity: 0.4,
                  animationDuration: '2s',
                }}
              />
            </>
          )}

          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : isActive ? (
            <PhoneOff className="w-6 h-6 text-white" />
          ) : (
            <Phone className="w-6 h-6 text-white" />
          )}

          {/* Animación de pulso cuando está escuchando */}
          {isListening && (
            <span
              className="absolute inset-0 rounded-full animate-ping"
              style={{
                backgroundColor: primaryColor,
                opacity: 0.3,
              }}
            />
          )}

          {/* Animación de ondas cuando está hablando */}
          {isSpeaking && (
            <>
              <span
                className="absolute inset-0 rounded-full animate-pulse"
                style={{
                  backgroundColor: primaryColor,
                  opacity: 0.4,
                  animationDuration: '1s',
                }}
              />
              <span
                className="absolute inset-0 rounded-full animate-pulse"
                style={{
                  backgroundColor: primaryColor,
                  opacity: 0.3,
                  animationDuration: '1.5s',
                  animationDelay: '0.5s',
                }}
              />
            </>
          )}
        </button>
      </div>

      {/* Indicador de estado (opcional) */}
      {isActive && (
        <div
          className="absolute -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium"
          style={{
            backgroundColor: primaryColor,
            color: secondaryTextColor,
          }}
        >
          {isLoading && 'Conectando...'}
          {isListening && 'Escuchando...'}
          {isSpeaking && 'Hablando...'}
          {status === 'connected' && !isListening && !isSpeaking && 'Conectado'}
        </div>
      )}
    </div>
  );
};
