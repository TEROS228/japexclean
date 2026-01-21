import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../../lib/jwt';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify admin token
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = verifyToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  try {
    // Check if user is admin
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email }
    });

    if (!dbUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!dbUser.isAdmin) {
      return res.status(403).json({ error: 'Access denied: Admin only' });
    }

    const { period = 'month' } = req.query;

    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'all':
        startDate = new Date(0); // Beginning of time
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
    }

    // Get total customers (registered users)
    const totalCustomers = await prisma.user.count();

    // Get visits in period
    const visitsInPeriod = await prisma.visit.count({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
    });

    // Get all-time visits
    const allTimeVisits = await prisma.visit.count();

    // Get orders in period
    const ordersInPeriod = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        total: true,
        createdAt: true,
        couponDiscount: true,
        balanceUsed: true,
        serviceFee: true,
        items: {
          select: {
            id: true,
            price: true,
            quantity: true,
            package: {
              select: {
                reinforcement: true,
                reinforcementPaid: true,
                photoService: true,
                photoServicePaid: true,
                consolidation: true,
              },
            },
          },
        },
      },
    });

    // Calculate total revenue (оборот = сумма всех заказов)
    const totalRevenue = ordersInPeriod.reduce((sum, order) => {
      return sum + order.total;
    }, 0);

    // Calculate Estimated Earnings (реальная прибыль)
    const estimatedEarnings = ordersInPeriod.reduce((sum, order) => {
      // 1. Считаем стоимость товаров
      const itemsTotal = order.items.reduce((itemSum, item) => {
        return itemSum + (item.price * item.quantity);
      }, 0);

      // 2. Service Fee (¥800 за товар)
      const commission = order.serviceFee || 0;

      // 3. НДС возврат (10% от стоимости товаров)
      const vatRefund = itemsTotal * 0.10;

      // 4. Скидки (только купоны, НЕ balanceUsed!)
      const totalDiscounts = (order.couponDiscount || 0);

      // 5. Услуги (reinforcement, photoService, consolidation)
      let servicesProfit = 0;
      order.items.forEach(item => {
        if (item.package) {
          // Package Reinforcement: чистая прибыль ¥650
          if (item.package.reinforcement && item.package.reinforcementPaid) {
            servicesProfit += 650;
          }

          // Inside Package Photo: чистая прибыль ¥500
          if (item.package.photoService && item.package.photoServicePaid) {
            servicesProfit += 500;
          }

          // Package Consolidation: -¥185 (вычитается из service fee)
          if (item.package.consolidation) {
            servicesProfit -= 185;
          }
        }
      });

      // 6. Прибыль = Service Fee + НДС - Скидки + Услуги
      const profit = commission + vatRefund - totalDiscounts + servicesProfit;

      return sum + profit;
    }, 0);

    // Get all-time statistics
    const allOrders = await prisma.order.findMany({
      select: {
        total: true,
        createdAt: true,
      },
    });

    const allTimeRevenue = allOrders.reduce((sum, order) => {
      return sum + order.total;
    }, 0);

    // Calculate growth compared to previous period
    const previousStartDate = new Date(startDate);
    const periodLength = now.getTime() - startDate.getTime();
    previousStartDate.setTime(startDate.getTime() - periodLength);

    const previousOrders = await prisma.order.count({
      where: {
        createdAt: {
          gte: previousStartDate,
          lt: startDate,
        },
      },
    });

    const currentOrders = ordersInPeriod.length;
    const orderGrowth = previousOrders > 0
      ? ((currentOrders - previousOrders) / previousOrders) * 100
      : 0;

    const previousRevenue = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: previousStartDate,
          lt: startDate,
        },
      },
      select: {
        total: true,
      },
    }).then(orders =>
      orders.reduce((sum, order) => sum + order.total, 0)
    );

    const revenueGrowth = previousRevenue > 0
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
      : 0;

    // Calculate previous visits for growth
    const previousVisits = await prisma.visit.count({
      where: {
        createdAt: {
          gte: previousStartDate,
          lt: startDate,
        },
      },
    });

    const visitsGrowth = previousVisits > 0
      ? ((visitsInPeriod - previousVisits) / previousVisits) * 100
      : 0;

    // Calculate conversion rate (orders / visits)
    const conversionRate = visitsInPeriod > 0
      ? (currentOrders / visitsInPeriod) * 100
      : 0;

    // Get unique buyers (users who made at least one order in period)
    const uniqueBuyers = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        userId: true,
      },
      distinct: ['userId'],
    });

    // Calculate Average Order Value (средний чек)
    const averageOrderValue = currentOrders > 0
      ? totalRevenue / currentOrders
      : 0;

    // Calculate Average Profit Per Order
    const averageProfitPerOrder = currentOrders > 0
      ? estimatedEarnings / currentOrders
      : 0;

    // Calculate Average Shipping Cost (FedEx + Japan Post/EMS)
    const packagesInPeriod = await prisma.package.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
        status: {
          in: ['shipped', 'delivered'], // Только отправленные посылки
        },
      },
      select: {
        shippingCost: true,
      },
    });

    const totalShippingCost = packagesInPeriod.reduce((sum, pkg) => {
      return sum + pkg.shippingCost;
    }, 0);

    const averageShippingCost = packagesInPeriod.length > 0
      ? totalShippingCost / packagesInPeriod.length
      : 0;

    // Calculate Repeat Purchase Rate
    // Получаем всех пользователей с заказами и считаем количество заказов на пользователя
    const ordersGroupedByUser = await prisma.order.groupBy({
      by: ['userId'],
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      _count: {
        id: true,
      },
    });

    // Считаем сколько пользователей сделали больше одного заказа
    const repeatCustomers = ordersGroupedByUser.filter(user => user._count.id > 1).length;
    const totalBuyers = ordersGroupedByUser.length;

    const repeatPurchaseRate = totalBuyers > 0
      ? (repeatCustomers / totalBuyers) * 100
      : 0;

    // Calculate Funnel Metrics: Visit → Registration → First Order
    // 1. New registrations in period
    const newRegistrations = await prisma.user.count({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
    });

    // 2. First orders in period (users whose first order was in this period)
    const allOrdersByUser = await prisma.order.findMany({
      select: {
        userId: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Группируем заказы по пользователю и находим первый заказ каждого
    const firstOrdersByUser = new Map<string, Date>();
    allOrdersByUser.forEach(order => {
      if (!firstOrdersByUser.has(order.userId)) {
        firstOrdersByUser.set(order.userId, order.createdAt);
      }
    });

    // Считаем сколько первых заказов было сделано в текущем периоде
    let firstOrdersInPeriod = 0;
    firstOrdersByUser.forEach((firstOrderDate) => {
      if (firstOrderDate >= startDate) {
        firstOrdersInPeriod++;
      }
    });

    // Calculate conversion rates
    const visitToRegistrationRate = visitsInPeriod > 0
      ? (newRegistrations / visitsInPeriod) * 100
      : 0;

    const registrationToFirstOrderRate = newRegistrations > 0
      ? (firstOrdersInPeriod / newRegistrations) * 100
      : 0;

    return res.status(200).json({
      period,
      statistics: {
        totalCustomers,
        ordersCount: currentOrders,
        totalRevenue: Math.round(totalRevenue),
        estimatedEarnings: Math.round(estimatedEarnings),
        allTimeOrders: allOrders.length,
        allTimeRevenue: Math.round(allTimeRevenue),
        visitsCount: visitsInPeriod,
        allTimeVisits,
        uniqueBuyers: uniqueBuyers.length,
        conversionRate: Math.round(conversionRate * 10) / 10,
        averageOrderValue: Math.round(averageOrderValue),
        averageProfitPerOrder: Math.round(averageProfitPerOrder),
        averageShippingCost: Math.round(averageShippingCost),
        repeatPurchaseRate: Math.round(repeatPurchaseRate * 10) / 10,
        funnel: {
          visitors: visitsInPeriod,
          newRegistrations,
          firstOrders: firstOrdersInPeriod,
          visitToRegistrationRate: Math.round(visitToRegistrationRate * 10) / 10,
          registrationToFirstOrderRate: Math.round(registrationToFirstOrderRate * 10) / 10,
        },
        growth: {
          orders: Math.round(orderGrowth * 10) / 10,
          revenue: Math.round(revenueGrowth * 10) / 10,
          visits: Math.round(visitsGrowth * 10) / 10,
        },
      },
    });
  } catch (error) {
    console.error('Statistics error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
