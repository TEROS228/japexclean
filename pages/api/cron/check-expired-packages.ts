import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { calculateStorageInfo } from '../../../lib/storage-calculator';
import { sendTelegramNotification } from '../../../lib/telegram';

/**
 * Cron job для проверки и удаления просроченных посылок
 * Запускается каждый день
 *
 * Setup: добавить в crontab или использовать сервис типа cron-job.org
 * 0 0 * * * curl http://your-domain.com/api/cron/check-expired-packages?secret=YOUR_CRON_SECRET
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Проверяем секретный ключ для защиты endpoint
  const { secret } = req.query;
  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Получаем все посылки со статусом ready
    const packages = await prisma.package.findMany({
      where: {
        status: 'ready',
        disposed: false
      },
      include: {
        user: {
          select: { email: true, id: true }
        },
        orderItem: true
      }
    });

    let expiredCount = 0;
    let warningsSent = 0;

    for (const pkg of packages) {
      const storageInfo = calculateStorageInfo(pkg.arrivedAt, pkg.lastStoragePayment);

      // Если срок хранения истек (10 дней без оплаты)
      if (storageInfo.isExpired) {
        
        // Помечаем как утилизированный
        await prisma.package.update({
          where: { id: pkg.id },
          data: {
            disposed: true,
            status: 'ready' // Оставляем ready, но disposed: true
          }
        });

        // Уведомляем пользователя
        await prisma.notification.create({
          data: {
            userId: pkg.user.id,
            type: 'package_disposed',
            title: '⚠️ Package Disposed',
            message: `Your package "${pkg.orderItem.title}" has been disposed due to 10 days without storage payment. No refund available.`
          }
        });

        // Уведомляем админа в Telegram
        await sendTelegramNotification(`
📦 <b>PACKAGE DISPOSED</b>

👤 <b>User:</b> ${pkg.user.email}
📦 <b>Item:</b> ${pkg.orderItem.title}
⏰ <b>Reason:</b> 10 days without storage payment

<i>Package has been marked as disposed.</i>
        `.trim());

        expiredCount++;
      }
      // Если есть неоплаченные дни
      else if (storageInfo.status === 'paid' && storageInfo.unpaidDays > 0) {
        // Отправляем предупреждение каждые 2 дня
        const daysSinceLastCheck = Math.floor(
          (new Date().getTime() - pkg.lastStorageFeeCheck.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceLastCheck >= 2) {
          
          await prisma.notification.create({
            data: {
              userId: pkg.user.id,
              type: 'storage_warning',
              title: '⚠️ Storage Fees Due',
              message: `Your package "${pkg.orderItem.title}" has unpaid storage fees: ¥${storageInfo.currentFee} for ${storageInfo.unpaidDays} days. ${storageInfo.daysUntilDisposal} days remaining before disposal!`
            }
          });

          // Обновляем время последней проверки
          await prisma.package.update({
            where: { id: pkg.id },
            data: {
              lastStorageFeeCheck: new Date()
            }
          });

          warningsSent++;
        }
      }
      // Если осталось 5 дней бесплатного хранения
      else if (storageInfo.status === 'free' && storageInfo.freeDaysRemaining <= 5 && storageInfo.freeDaysRemaining > 0) {
        const daysSinceLastCheck = Math.floor(
          (new Date().getTime() - pkg.lastStorageFeeCheck.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceLastCheck >= 1) {
          
          await prisma.notification.create({
            data: {
              userId: pkg.user.id,
              type: 'storage_expiring',
              title: '📦 Free Storage Ending Soon',
              message: `Your package "${pkg.orderItem.title}" has ${storageInfo.freeDaysRemaining} days of free storage remaining. After that, ¥30/day will be charged. Pay within 10 days to avoid disposal.`
            }
          });

          await prisma.package.update({
            where: { id: pkg.id },
            data: {
              lastStorageFeeCheck: new Date()
            }
          });

          warningsSent++;
        }
      }
    }

    
    return res.status(200).json({
      success: true,
      checked: packages.length,
      expired: expiredCount,
      warnings: warningsSent
    });

  } catch (error) {
    console.error('[Cron] Error checking expired packages:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
