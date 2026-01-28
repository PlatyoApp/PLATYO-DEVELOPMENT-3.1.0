import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { healthCheck } from '../../lib/supabase';

export function SupabaseHealthMonitor() {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  const checkHealth = async () => {
    setIsChecking(true);
    try {
      const healthy = await healthCheck();
      setIsHealthy(healthy);
      setShowBanner(!healthy);
    } catch (error) {
      setIsHealthy(false);
      setShowBanner(true);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkHealth();

    const interval = setInterval(checkHealth, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isHealthy === false) {
      const retryInterval = setInterval(() => {
        checkHealth();
      }, 10000);

      return () => clearInterval(retryInterval);
    }
  }, [isHealthy]);

  if (!showBanner) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999]">
      <div
        className={`w-full px-4 py-3 text-center text-white ${
          isHealthy === false
            ? 'bg-red-600'
            : isHealthy === true
            ? 'bg-green-600'
            : 'bg-yellow-600'
        }`}
      >
        <div className="flex items-center justify-center gap-3 max-w-7xl mx-auto">
          {isHealthy === false && (
            <>
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">
                Problemas de conexión con la base de datos. Reintentando...
              </p>
              <button
                onClick={checkHealth}
                disabled={isChecking}
                className="ml-2 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
                Reintentar ahora
              </button>
            </>
          )}

          {isHealthy === true && (
            <>
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">
                Conexión restaurada correctamente
              </p>
              <button
                onClick={() => setShowBanner(false)}
                className="ml-2 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
              >
                Cerrar
              </button>
            </>
          )}

          {isHealthy === null && (
            <>
              <RefreshCw className="w-5 h-5 flex-shrink-0 animate-spin" />
              <p className="text-sm font-medium">
                Verificando conexión con la base de datos...
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
