
export const formatMoneyPl = (number?: number) => {
  if (number === undefined || number === null) return '-';
  return new Intl.NumberFormat('pl-PL', { 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(number);
};