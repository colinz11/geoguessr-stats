import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Format numbers with commas
export function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num);
}

// Format score with styling
export function formatScore(score: number): string {
  return formatNumber(score);
}

// Get score color based on value
export function getScoreColor(score: number): string {
  if (score >= 4500) return 'text-green-600';
  if (score >= 3000) return 'text-yellow-600';
  if (score >= 1500) return 'text-orange-600';
  return 'text-red-600';
}

// Get accuracy color based on percentage
export function getAccuracyColor(accuracy: number): string {
  if (accuracy >= 80) return 'text-green-600';
  if (accuracy >= 60) return 'text-yellow-600';
  if (accuracy >= 40) return 'text-orange-600';
  return 'text-red-600';
}

// Format distance
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  if (km < 100) return `${km.toFixed(1)}km`;
  return `${Math.round(km)}km`;
}

// Format percentage
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

// Format date
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString();
}

// Format time
export function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

// Get country flag emoji (basic implementation)
export function getCountryFlag(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌍';
  try {
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  } catch {
    return '🌍';
  }
}

// Get map marker color based on score using a green to red gradient
// Score ranges from 0-5000 with higher scores indicating closer guesses
export function getMarkerColor(score: number): string {
  const clamped = Math.max(0, Math.min(5000, score));
  const ratio = clamped / 5000; // 0 => worst, 1 => best
  const hue = ratio * 120; // 0 = red, 120 = green
  return `hsl(${hue}, 100%, 40%)`;
}

// Debounce function for search inputs
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Generate random user ID for demo purposes
export function generateDemoUserId(): string {
  return ''; // Return empty string to show all data for demo
}
