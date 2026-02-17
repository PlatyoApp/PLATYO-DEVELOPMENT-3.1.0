import { Lock, CreditCard, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';

interface SubscriptionBlockerProps {
  planName?: string;
  onUpgrade?: () => void;
}

export function SubscriptionBlocker({ planName = 'Free', onUpgrade }: SubscriptionBlockerProps) {
  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      window.location.href = '/dashboard/subscription';
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-2xl border-2 border-red-200 overflow-hidden">
          <div className="bg-gradient-to-r from-red-500 to-orange-500 p-8 text-white text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-white/20 rounded-full">
                <Lock className="w-16 h-16" />
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-2">
              Suscripción Inactiva
            </h2>
            <p className="text-lg text-red-50">
              Tu plan {planName} ha expirado
            </p>
          </div>

          <div className="p-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-red-900 mb-2">
                    Acceso Restringido
                  </h3>
                  <p className="text-sm text-red-800 mb-3">
                    Para continuar usando todas las funcionalidades de tu restaurante, necesitas renovar tu suscripción.
                  </p>
                  <ul className="space-y-2 text-sm text-red-800">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div>
                      No puedes ver ni gestionar productos
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div>
                      No puedes ver ni gestionar categorías
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div>
                      No puedes gestionar pedidos
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div>
                      No puedes ver clientes ni estadísticas
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Button
                onClick={handleUpgrade}
                icon={CreditCard}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 text-lg font-semibold shadow-lg"
              >
                Ver Planes y Renovar
              </Button>

              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">
                  ¿Necesitas ayuda?
                </p>
                <button
                  onClick={() => {
                    const message = encodeURIComponent(
                      `Hola, mi suscripción ha expirado y necesito ayuda para renovarla. Plan: ${planName}`
                    );
                    window.open(`https://wa.me/?text=${message}`, '_blank');
                  }}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm underline"
                >
                  Contacta con soporte
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
