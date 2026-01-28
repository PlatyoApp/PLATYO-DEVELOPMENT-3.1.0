import { useState, useCallback, useRef } from 'react';
import { Conversation } from '@elevenlabs/client';

type ConversationStatus = 'idle' | 'connecting' | 'connected' | 'speaking' | 'listening' | 'disconnected';

interface UseElevenLabsConversationOptions {
  agentId: string;
  onError?: (error: Error) => void;
}

export const useElevenLabsConversation = ({ agentId, onError }: UseElevenLabsConversationOptions) => {
  const [status, setStatus] = useState<ConversationStatus>('idle');
  const [isActive, setIsActive] = useState(false);
  const conversationRef = useRef<Conversation | null>(null);

  const requestMicrophonePermission = async (): Promise<boolean> => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      onError?.(new Error('Se requiere permiso de micrófono para usar el asistente de voz'));
      return false;
    }
  };

  const startConversation = useCallback(async () => {
    if (isActive || !agentId) return;

    try {
      setStatus('connecting');

      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) {
        setStatus('idle');
        return;
      }

      const conversation = await Conversation.startSession({
        agentId,
        connectionType: 'webrtc',
        onConnect: () => {
          setStatus('connected');
          setIsActive(true);
        },
        onDisconnect: () => {
          setStatus('disconnected');
          setIsActive(false);
          conversationRef.current = null;
        },
        onModeChange: (mode) => {
          if (mode.mode === 'speaking') {
            setStatus('speaking');
          } else if (mode.mode === 'listening') {
            setStatus('listening');
          }
        },
        onError: (error) => {
          console.error('Conversation error:', error);
          onError?.(new Error('Error en la conversación de voz'));
          setStatus('idle');
          setIsActive(false);
        },
      });

      conversationRef.current = conversation;
    } catch (error) {
      console.error('Failed to start conversation:', error);
      onError?.(error instanceof Error ? error : new Error('No se pudo iniciar la conversación'));
      setStatus('idle');
      setIsActive(false);
    }
  }, [agentId, isActive, onError]);

  const endConversation = useCallback(async () => {
    if (!conversationRef.current || !isActive) return;

    try {
      await conversationRef.current.endSession();
      conversationRef.current = null;
      setStatus('idle');
      setIsActive(false);
    } catch (error) {
      console.error('Failed to end conversation:', error);
      onError?.(error instanceof Error ? error : new Error('Error al finalizar la conversación'));
    }
  }, [isActive, onError]);

  const toggleConversation = useCallback(async () => {
    if (isActive) {
      await endConversation();
    } else {
      await startConversation();
    }
  }, [isActive, startConversation, endConversation]);

  return {
    status,
    isActive,
    toggleConversation,
    startConversation,
    endConversation,
  };
};
