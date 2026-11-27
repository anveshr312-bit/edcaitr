export type MealType = 'breakfast' | 'lunch' | 'high_tea' | 'dinner';

export interface FoodMealConfig {
  enabled: boolean;
  quantity: number;
  title?: string;
  timeSlot?: string;
}

export interface EventFoodConfig {
  enabled: boolean;
  meals: Record<MealType, FoodMealConfig>;
}

export interface FoodCoupon {
  id: string;
  event_id: string;
  registration_id: string;
  user_id: string;
  coupon_code: string;
  meal_type: MealType;
  meal_title: string;
  time_slot?: string;
  qr_token: string;
  status: 'active' | 'redeemed';
  redeemed_at: string | null;
  redeemed_by?: string | null;
  participant_name?: string;
  event_title?: string;
}

export const MEAL_THEMES: Record<
  MealType,
  {
    title: string;
    icon: string;
    brandColor: string;
    accentColor: string;
    darkBg: string;
    lightText: string;
    badgeBg: string;
    badgeBorder: string;
    border: string;
  }
> = {
  breakfast: {
    title: 'Breakfast Pass',
    icon: '🍳',
    brandColor: '#F59E0B', // Amber
    accentColor: '#D97706',
    darkBg: '#1c1917', // Warm Dark Stone
    lightText: '#FEF3C7',
    badgeBg: 'rgba(245, 158, 11, 0.15)',
    badgeBorder: 'rgba(245, 158, 11, 0.35)',
    border: '#78350f',
  },
  lunch: {
    title: 'Lunch Pass',
    icon: '🍱',
    brandColor: '#10B981', // Emerald
    accentColor: '#059669',
    darkBg: '#042f2e', // Deep Forest
    lightText: '#D1FAE5',
    badgeBg: 'rgba(16, 185, 129, 0.15)',
    badgeBorder: 'rgba(16, 185, 129, 0.35)',
    border: '#064e3b',
  },
  high_tea: {
    title: 'High Tea Pass',
    icon: '☕',
    brandColor: '#F43F5E', // Rose / Coral
    accentColor: '#E11D48',
    darkBg: '#271015', // Warm Twilight Rose
    lightText: '#FFE4E6',
    badgeBg: 'rgba(244, 63, 94, 0.15)',
    badgeBorder: 'rgba(244, 63, 94, 0.35)',
    border: '#881337',
  },
  dinner: {
    title: 'Dinner Pass',
    icon: '🍽️',
    brandColor: '#6366F1', // Royal Indigo
    accentColor: '#4F46E5',
    darkBg: '#171434', // Midnight Indigo
    lightText: '#E0E7FF',
    badgeBg: 'rgba(99, 102, 241, 0.15)',
    badgeBorder: 'rgba(99, 102, 241, 0.35)',
    border: '#312e81',
  },
};

export const DEFAULT_FOOD_CONFIG: EventFoodConfig = {
  enabled: false,
  meals: {
    breakfast: { enabled: false, quantity: 1, title: 'Morning Breakfast' },
    lunch: { enabled: false, quantity: 1, title: 'Executive Lunch' },
    high_tea: { enabled: false, quantity: 1, title: 'High Tea & Refreshment' },
    dinner: { enabled: false, quantity: 1, title: 'Evening Gala Dinner' },
  },
};

/**
 * Extracts the EventFoodConfig from the event record (stored in published_social_links or metadata)
 */
export function parseEventFoodConfig(event: any): EventFoodConfig {
  if (!event) return DEFAULT_FOOD_CONFIG;
  const rawLinks = event.published_social_links;
  if (!Array.isArray(rawLinks)) return DEFAULT_FOOD_CONFIG;

  const item = rawLinks.find(
    (x: any) => x && typeof x === 'object' && x.__type === 'event_food_config'
  );

  if (!item || !item.config) return DEFAULT_FOOD_CONFIG;
  return {
    enabled: Boolean(item.config.enabled),
    meals: {
      breakfast: { ...DEFAULT_FOOD_CONFIG.meals.breakfast, ...(item.config.meals?.breakfast || {}) },
      lunch: { ...DEFAULT_FOOD_CONFIG.meals.lunch, ...(item.config.meals?.lunch || {}) },
      high_tea: { ...DEFAULT_FOOD_CONFIG.meals.high_tea, ...(item.config.meals?.high_tea || {}) },
      dinner: { ...DEFAULT_FOOD_CONFIG.meals.dinner, ...(item.config.meals?.dinner || {}) },
    },
  };
}

/**
 * Merges the EventFoodConfig into published_social_links array cleanly
 */
export function encodeEventFoodConfig(config: EventFoodConfig, existingLinks: any): any[] {
  const links = Array.isArray(existingLinks) ? [...existingLinks] : [];
  const filtered = links.filter(
    (x: any) => !(x && typeof x === 'object' && x.__type === 'event_food_config')
  );
  filtered.push({
    __type: 'event_food_config',
    config,
    updated_at: new Date().toISOString(),
  });
  return filtered;
}

/**
 * Generates deterministic coupons for a registration based on event meal config.
 */
export function generateCouponsForRegistration(params: {
  eventId: string;
  eventTitle: string;
  registrationId: string;
  userId: string;
  participantName: string;
  config: EventFoodConfig;
  redemptions?: Record<string, { redeemed_at: string; redeemed_by?: string }>;
}): FoodCoupon[] {
  const { eventId, eventTitle, registrationId, userId, participantName, config, redemptions = {} } = params;
  if (!config.enabled) return [];

  const coupons: FoodCoupon[] = [];
  const order: MealType[] = ['breakfast', 'lunch', 'high_tea', 'dinner'];

  for (const mealType of order) {
    const meal = config.meals[mealType];
    if (!meal?.enabled) continue;

    const count = Math.max(1, Math.min(10, Math.floor(meal.quantity || 1)));
    for (let i = 1; i <= count; i++) {
      const shortReg = registrationId.replace(/-/g, '').slice(0, 8).toUpperCase();
      const seq = count > 1 ? `#${i}` : '';
      const couponCode = `FOOD-${shortReg}-${mealType.toUpperCase().slice(0, 4)}${seq ? `-${i}` : ''}`;
      const qrToken = `EDC-COUPON:${eventId}:${registrationId}:${mealType}:${i}`;

      const redemption = redemptions[qrToken];
      const isRedeemed = Boolean(redemption);

      coupons.push({
        id: `${registrationId}-${mealType}-${i}`,
        event_id: eventId,
        registration_id: registrationId,
        user_id: userId,
        coupon_code: couponCode,
        meal_type: mealType,
        meal_title: `${meal.title || MEAL_THEMES[mealType].title} ${seq}`.trim(),
        time_slot: meal.timeSlot,
        qr_token: qrToken,
        status: isRedeemed ? 'redeemed' : 'active',
        redeemed_at: redemption?.redeemed_at || null,
        redeemed_by: redemption?.redeemed_by || null,
        participant_name: participantName,
        event_title: eventTitle,
      });
    }
  }

  return coupons;
}
