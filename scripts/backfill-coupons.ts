// Script to create coupons for previously confirmed orders >= 5000 yen
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function backfillCoupons() {
  console.log('🔍 Searching for confirmed orders >= ¥5,000...');

  // Получаем все подтверждённые заказы
  const confirmedOrders = await prisma.order.findMany({
    where: { confirmed: true },
    include: { items: true }
  });

  console.log(`Found ${confirmedOrders.length} confirmed orders`);

  let couponsCreated = 0;

  for (const order of confirmedOrders) {
    // Считаем сумму товаров (без комиссии)
    const itemsTotal = order.items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    console.log(`Order ${order.id}: items total = ¥${itemsTotal}`);

    if (itemsTotal >= 5000) {
      // Проверяем, нет ли уже купона для этого заказа (по времени создания)
      const existingCoupons = await prisma.coupon.findMany({
        where: {
          userId: order.userId,
          createdAt: {
            gte: new Date(order.createdAt.getTime() - 60000), // За минуту до заказа
            lte: new Date(order.createdAt.getTime() + 3600000) // Час после заказа
          }
        }
      });

      if (existingCoupons.length > 0) {
        console.log(`  ⏭️  Coupon already exists for this order, skipping`);
        continue;
      }

      // Генерируем уникальный код
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      const timestamp = Date.now().toString(36).toUpperCase();
      const code = `REWARD800-${timestamp}${random}`;

      // Создаем купон
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 6);

      const coupon = await prisma.coupon.create({
        data: {
          userId: order.userId,
          code,
          discountAmount: 800,
          minPurchase: 0,
          description: 'Reward coupon for orders over ¥5,000',
          status: 'active',
          expiresAt,
          createdAt: order.createdAt // Дата создания = дата заказа
        }
      });

      // Создаем уведомление
      await prisma.notification.create({
        data: {
          userId: order.userId,
          type: 'coupon_reward',
          title: 'New Coupon Available!',
          message: `Congratulations! You've earned a ¥800 discount coupon for your order over ¥5,000. Use code ${coupon.code} on your next purchase.`,
          read: false
        }
      });

      console.log(`  ✅ Created coupon ${coupon.code} for user ${order.userId}`);
      couponsCreated++;
    } else {
      console.log(`  ⏭️  Items total < ¥5,000, skipping`);
    }
  }

  console.log(`\n✨ Done! Created ${couponsCreated} coupons`);
}

backfillCoupons()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
