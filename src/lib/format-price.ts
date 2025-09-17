export function formatPrice(price: string): string {
  const numericPrice = parseFloat(price);
  
  // Handle custom pricing (negative values)
  if (numericPrice <= 0) {
    return 'Custom';
  }
  
  // Format as Indonesian Rupiah
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numericPrice);
}

export function getMonthlyPrice(price: string): string {
  const numericPrice = parseFloat(price);
  
  if (isNaN(numericPrice) || numericPrice <= 0) {
    return 'Custom';
  }
  
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numericPrice);
}

export function getAnnualPrice(monthlyPrice: string): string {
  const numericPrice = parseFloat(monthlyPrice);
  
  if (isNaN(numericPrice) || numericPrice <= 0) {
    return 'Custom';
  }
  
  // Calculate annual with 15% discount
  const annualPrice = numericPrice * 12 * 0.85;
  
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(annualPrice);
}

export function getAnnualMonthlyDisplay(monthlyPrice: string): string {
  const numericPrice = parseFloat(monthlyPrice);
  
  if (isNaN(numericPrice) || numericPrice <= 0) {
    return 'Custom';
  }
  
  // Calculate annual with 15% discount, then divide by 12 for display
  const annualPrice = numericPrice * 12 * 0.85;
  const monthlyDisplay = annualPrice / 12;
  
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(monthlyDisplay);
}