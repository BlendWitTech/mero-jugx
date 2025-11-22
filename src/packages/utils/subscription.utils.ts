import { SubscriptionPeriod } from '../dto/upgrade-package.dto';

export interface SubscriptionCalculation {
  months: number;
  discountPercent: number;
  originalPrice: number;
  discountedPrice: number;
  expirationDate: Date;
}

/**
 * Calculate subscription discount and expiration based on period
 */
export function calculateSubscription(
  basePrice: number,
  period: SubscriptionPeriod,
  customMonths?: number,
): SubscriptionCalculation {
  let months: number;
  let discountPercent: number;

  switch (period) {
    case SubscriptionPeriod.THREE_MONTHS:
      months = 3;
      discountPercent = 0; // No discount for 3 months
      break;
    case SubscriptionPeriod.SIX_MONTHS:
      months = 6;
      discountPercent = 4; // 4% discount
      break;
    case SubscriptionPeriod.ONE_YEAR:
      months = 12;
      discountPercent = 7.5; // 7.5% discount
      break;
    case SubscriptionPeriod.CUSTOM:
      if (!customMonths || customMonths < 1) {
        throw new Error('Custom months must be at least 1');
      }
      months = customMonths;
      if (months > 12) {
        discountPercent = 10; // 10% discount for more than 1 year
      } else if (months === 12) {
        discountPercent = 7.5; // 7.5% discount for exactly 1 year
      } else if (months >= 6) {
        discountPercent = 4; // 4% discount for 6+ months
      } else {
        discountPercent = 0; // No discount for less than 6 months
      }
      break;
    default:
      months = 3;
      discountPercent = 0;
  }

  // Calculate total price (base price * months)
  const originalPrice = basePrice * months;

  // Apply discount
  const discountAmount = (originalPrice * discountPercent) / 100;
  const discountedPrice = originalPrice - discountAmount;

  // Calculate expiration date
  const expirationDate = new Date();
  expirationDate.setMonth(expirationDate.getMonth() + months);

  return {
    months,
    discountPercent,
    originalPrice: Math.round(originalPrice * 100) / 100,
    discountedPrice: Math.round(discountedPrice * 100) / 100,
    expirationDate,
  };
}

/**
 * Calculate prorated credit from remaining subscription time
 */
export interface ProratedCredit {
  remainingDays: number;
  remainingMonths: number;
  originalPackagePrice: number;
  creditAmount: number;
  creditPercentage: number;
}

export function calculateProratedCredit(
  currentPackagePrice: number,
  expirationDate: Date | null,
): ProratedCredit | null {
  if (!expirationDate) {
    return null; // No expiration = freemium or lifetime, no credit
  }

  const now = new Date();
  const expiry = new Date(expirationDate);

  if (expiry <= now) {
    return null; // Already expired, no credit
  }

  // Calculate remaining time
  const diffTime = expiry.getTime() - now.getTime();
  const remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const remainingMonths = remainingDays / 30; // Approximate months

  // Calculate credit based on remaining time
  // Credit = (remaining days / total days) * package price
  // For simplicity, we'll use monthly proration
  const monthlyPrice = currentPackagePrice;
  const creditAmount = remainingMonths * monthlyPrice;
  const creditPercentage = (remainingDays / 30) * 100; // Percentage of month remaining

  return {
    remainingDays,
    remainingMonths: Math.round(remainingMonths * 100) / 100,
    originalPackagePrice: currentPackagePrice,
    creditAmount: Math.round(creditAmount * 100) / 100,
    creditPercentage: Math.round(creditPercentage * 100) / 100,
  };
}

/**
 * Calculate upgrade price with prorated credit
 */
export interface UpgradePriceCalculation {
  newPackagePrice: number;
  creditAmount: number;
  finalPrice: number;
  proratedCredit: ProratedCredit | null;
}

export function calculateUpgradePrice(
  currentPackagePrice: number,
  newPackagePrice: number,
  currentExpirationDate: Date | null,
  newPeriod: SubscriptionPeriod,
  newCustomMonths?: number,
): UpgradePriceCalculation {
  // Calculate new package subscription price
  const newSubscription = calculateSubscription(newPackagePrice, newPeriod, newCustomMonths);

  // Calculate prorated credit from current package
  const proratedCredit = calculateProratedCredit(currentPackagePrice, currentExpirationDate);

  // Apply credit to new package price
  const creditAmount = proratedCredit?.creditAmount || 0;
  const finalPrice = Math.max(0, newSubscription.discountedPrice - creditAmount);

  return {
    newPackagePrice: newSubscription.discountedPrice,
    creditAmount,
    finalPrice: Math.round(finalPrice * 100) / 100,
    proratedCredit,
  };
}
