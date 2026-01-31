// Formatting utilities

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatTime = (date: string) => {
  return new Date(date).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const getColorClass = (color: 'red' | 'green' | 'violet') => {
  switch (color) {
    case 'red': return 'bg-game-red';
    case 'green': return 'bg-game-green';
    case 'violet': return 'bg-game-violet';
  }
};

export const getColorMultiplier = (color: 'red' | 'green' | 'violet') => {
  return color === 'violet' ? 4.5 : 2;
};
