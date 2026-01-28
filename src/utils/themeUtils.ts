export const getThemeColors = (theme: any) => {
  if (!theme) {
    return {
      background: '#ffffff',
      cardBackground: '#f9fafb',
      text: '#1f2937',
      primaryText: '#111827',
      secondaryText: '#6b7280',
      primary: '#2563eb',
    };
  }

  return {
    background: theme.menu_background_color || '#ffffff',
    cardBackground: theme.card_background_color || '#f9fafb',
    text: theme.text_color || theme.primary_text_color || '#1f2937',
    primaryText: theme.primary_text_color || '#111827',
    secondaryText: theme.secondary_text_color || '#6b7280',
    primary: theme.primary_color || '#2563eb',
  };
};

const applyThemeToDocument = (theme: any) => {
  if (!theme) return;

  const colors = getThemeColors(theme);
  const root = document.documentElement;

  // Aplicar variables CSS globales
  root.style.setProperty('--theme-bg', colors.background);
  root.style.setProperty('--theme-text', colors.text);
  root.style.setProperty('--theme-primary', colors.primary);
  
  // Aplicar al body también
  document.body.style.backgroundColor = colors.background;
  document.body.style.color = colors.text;
};