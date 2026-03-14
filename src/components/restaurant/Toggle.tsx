import React from 'react';

// Definimos qué "piezas" necesita este componente para funcionar
interface ToggleProps {
  label?: string; // El signo ? significa que es opcional
  enabled: boolean;
  onChange: (value: boolean) => void;
}

export const Toggle: React.FC<ToggleProps> = ({ label, enabled, onChange }) => {
  return (
    <label className="flex items-center cursor-pointer gap-3">
      {label && (
        <span className="text-sm font-medium text-gray-700">
          {label}
        </span>
      )}

      <div className="relative">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={enabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        {/* El diseño del interruptor */}
        <div className="w-11 h-6 bg-gray-600 rounded-full peer 
          peer-focus:ring-2 peer-focus:ring-green-300 
          peer-checked:after:translate-x-full peer-checked:after:border-white 
          after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
          after:bg-white after:border-gray-300 after:border after:rounded-full 
          after:h-5 after:w-5 after:transition-all 
          peer-checked:bg-green-600">
        </div>
      </div>
    </label>
  );
};