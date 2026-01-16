import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Генерирует уникальный код купона
 */
function generateCouponCode(prefix: string = 'REWARD'): string {
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();
  return `${prefix}-${timestamp}${random}`;
}

/**
 * Создает купон на скидку 800 иен для заказов от 5000 иен
 */
export async function createRewardCoupon(userId: string): Promise<any> {
  const code = generateCouponCode('REWARD800');

  // Купон действителен 6 месяцев
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 6);

  const coupon = await prisma.coupon.create({
    data: {
      userId,
      code,
      discountAmount: 800,
      minPurchase: 0, // Минимальная сумма для использования купона
      description: 'Reward coupon for orders over ¥5,000',
      status: 'active',
      expiresAt
    }
  });

  return coupon;
}

/**
 * Проверяет и применяет купон к заказу
 */
export async function validateAndApplyCoupon(
  couponCode: string,
  userId: string,
  orderTotal: number
): Promise<{ valid: boolean; discount: number; message: string; coupon?: any }> {
  const coupon = await prisma.coupon.findFirst({
    where: {
      code: couponCode,
      userId
    }
  });

  if (!coupon) {
    return {
      valid: false,
      discount: 0,
      message: 'Coupon not found'
    };
  }

  // Проверка статуса
  if (coupon.status !== 'active') {
    return {
      valid: false,
      discount: 0,
      message: coupon.status === 'used' ? 'Coupon already used' : 'Coupon expired'
    };
  }

  // Проверка срока действия
  if (coupon.expiresAt < new Date()) {
    await prisma.coupon.update({
      where: { id: coupon.id },
      data: { status: 'expired' }
    });
    return {
      valid: false,
      discount: 0,
      message: 'Coupon expired'
    };
  }

  // Проверка минимальной суммы заказа
  if (orderTotal < coupon.minPurchase) {
    return {
      valid: false,
      discount: 0,
      message: `Minimum purchase amount is ¥${coupon.minPurchase.toLocaleString()}`
    };
  }

  // Купон валиден
  return {
    valid: true,
    discount: coupon.discountAmount,
    message: 'Coupon applied successfully',
    coupon
  };
}

/**
 * Помечает купон как использованный
 */
export async function markCouponAsUsed(couponCode: string): Promise<void> {
  await prisma.coupon.updateMany({
    where: { code: couponCode },
    data: {
      status: 'used',
      usedAt: new Date()
    }
  });
}
