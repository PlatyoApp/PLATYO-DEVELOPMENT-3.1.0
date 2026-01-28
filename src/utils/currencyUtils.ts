export const getCurrencySymbol = (currency: string): string => {
  const symbols: { [key: string]: string } = {
    USD: '$',
    EUR: '€',
    MXN: '$',
    COP: '$',
    ARS: '$',
    CLP: '$',
    PEN: 'S/',
    BRL: 'R$',
    CAD: 'C$',
    GBP: '£',
  };
  
  return symbols[currency] || '$';
};

export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  const symbol = getCurrencySymbol(currency);

  // Currencies that don't use decimal places
  const noDecimalCurrencies = ['COP', 'CLP', 'ARS'];

  // Format based on currency
  if (noDecimalCurrencies.includes(currency)) {
    // No decimals, use thousand separators
    const formattedAmount = Math.round(amount).toLocaleString('es-CO');
    return `${symbol}${formattedAmount}`;
  }

  // Currencies with decimals (USD, EUR, MXN, PEN, etc.)
  const formattedAmount = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  // EUR typically goes after the amount in some countries, but we'll keep it before for consistency
  return `${symbol}${formattedAmount}`;
};

const getCurrencyName = (currency: string): string => {
  const names: { [key: string]: string } = {
    USD: 'Dólar Estadounidense',
    EUR: 'Euro',
    MXN: 'Peso Mexicano',
    COP: 'Peso Colombiano',
    ARS: 'Peso Argentino',
    CLP: 'Peso Chileno',
    PEN: 'Sol Peruano',
    BRL: 'Real Brasileño',
    CAD: 'Dólar Canadiense',
    GBP: 'Libra Esterlina',
  };
  
  return names[currency] || 'Dólar Estadounidense';
};