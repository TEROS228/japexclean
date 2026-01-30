import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../../../../lib/jwt';
import { prisma } from '../../../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers.authorization?.replace('Bearer ', '');
  const { id } = req.query;
  const { shippingCost, weight } = req.body;

  if (!token) {
    return res.status(401).json({ error: 'Token required' });
  }

  const user = verifyToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email }
    });

    if (!dbUser || !dbUser.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Получаем главную посылку
    const mainPackage = await prisma.package.findUnique({
      where: { id: id as string },
      include: {
        user: true,
        orderItem: true
      }
    });

    if (!mainPackage) {
      return res.status(404).json({ error: 'Package not found' });
    }

    // Получаем ID посылок для консолидации
    let consolidateWithIds: string[] = [];
    if (mainPackage.consolidateWith) {
      try {
        consolidateWithIds = JSON.parse(mainPackage.consolidateWith);
      } catch (e) {
        console.error('Error parsing consolidateWith:', e);
      }
    }

    if (!Array.isArray(consolidateWithIds) || consolidateWithIds.length === 0) {
      return res.status(400).json({
        error: 'No packages to consolidate',
        debug: {
          consolidateWith: mainPackage.consolidateWith,
          parsed: consolidateWithIds
        }
      });
    }

    // Получаем все пакеты для консолидации
    const packagesToConsolidate = await prisma.package.findMany({
      where: {
        id: { in: consolidateWithIds }
      },
      include: {
        orderItem: true
      }
    });

    
    // Используем вес из запроса, если указан, иначе суммируем вес всех пакетов
    const calculatedWeight = (mainPackage.weight || 0) +
      packagesToConsolidate.reduce((sum, pkg) => sum + (pkg.weight || 0), 0);

    const finalWeight = weight !== undefined && weight !== null
      ? weight
      : calculatedWeight;

    // Вычисляем суммарную стоимость domestic shipping со всех пакетов
    const totalDomesticShippingCost = (mainPackage.domesticShippingCost || 0) +
      packagesToConsolidate.reduce((sum, pkg) => sum + (pkg.domesticShippingCost || 0), 0);

    // Используем стоимость доставки из запроса, если указана, иначе суммируем все пакеты
    const finalShippingCost = shippingCost !== undefined && shippingCost !== null
      ? shippingCost
      : (mainPackage.shippingCost || 0) + packagesToConsolidate.reduce((sum, pkg) => sum + (pkg.shippingCost || 0), 0);

    // Используем предсгенерированный ID если есть, иначе создаем новый
    const consolidatedPackageId = mainPackage.futureConsolidatedId || undefined;
    
    // Создаем dummy OrderItem для консолидированного пакета
    // Собираем названия всех товаров
    const allItems = [mainPackage.orderItem, ...packagesToConsolidate.map(p => p.orderItem)];
    const consolidatedTitle = `Consolidated Package (${allItems.length} items)`;
    const totalPrice = allItems.reduce((sum, item) => sum + item.price, 0);

    const dummyOrderItem = await prisma.orderItem.create({
      data: {
        orderId: mainPackage.orderItem.orderId,
        itemCode: 'CONSOLIDATED',
        title: consolidatedTitle,
        price: totalPrice,
        quantity: allItems.length,
        image: mainPackage.orderItem.image,
        marketplace: 'consolidated'
      }
    });

    // Собираем все фотографии из пакетов которые были консолидированы
    const allPackages = [mainPackage, ...packagesToConsolidate];
    const allPhotos: string[] = [];

    for (const pkg of allPackages) {
      if (pkg.photos) {
        try {
          const pkgPhotos = JSON.parse(pkg.photos);
          if (Array.isArray(pkgPhotos)) {
            allPhotos.push(...pkgPhotos);
          }
        } catch (e) {
          console.error('Error parsing photos from package:', pkg.id, e);
        }
      }
    }

    // Проверяем был ли хотя бы один пакет с оплаченной фото-услугой и статусом completed
    const hasCompletedPhotos = allPackages.some(pkg =>
      pkg.photoServicePaid && pkg.photoServiceStatus === 'completed'
    );

        
    // Находим максимальную дополнительную страховку среди всех пакетов
    const maxAdditionalInsurance = Math.max(
      mainPackage.additionalInsurance || 0,
      ...packagesToConsolidate.map(pkg => pkg.additionalInsurance || 0)
    );
    
    // Проверяем оплачен ли domestic shipping на всех пакетах
    const allDomesticShippingPaid = allPackages.every(pkg =>
      pkg.domesticShippingCost === 0 || pkg.domesticShippingPaid
    );
    
    // Создаем НОВЫЙ консолидированный пакет вместо обновления существующего
    const newConsolidatedPackage = await prisma.package.create({
      data: {
        id: consolidatedPackageId, // Используем предсгенерированный ID
        userId: mainPackage.userId,
        orderItemId: dummyOrderItem.id, // Привязываем к dummy orderItem
        trackingNumber: mainPackage.trackingNumber,
        weight: finalWeight > 0 ? finalWeight : null,
        status: 'ready',
        shippingCost: finalShippingCost,
        domesticShippingCost: totalDomesticShippingCost,
        domesticShippingPaid: allDomesticShippingPaid,
        notes: 'Consolidated package',
        shippingMethod: mainPackage.shippingMethod,
        shippingAddressId: mainPackage.shippingAddressId,
        consolidation: false,  // Сам пакет больше не в процессе консолидации
        consolidated: true,    // Но помечен как результат консолидации
        consolidateWith: null,
        futureConsolidatedId: null,
        photoService: hasCompletedPhotos,
        photoServicePaid: hasCompletedPhotos,
        photoServiceStatus: hasCompletedPhotos ? 'completed' : 'pending',
        photos: allPhotos.length > 0 ? JSON.stringify(allPhotos) : null,
        reinforcement: false,
        reinforcementPaid: false,
        cancelReturn: false,
        cancelPurchase: false,
        disposalRequested: false,
        disposed: false,
        shippingRequested: false,
        additionalInsurance: maxAdditionalInsurance,
        additionalInsurancePaid: maxAdditionalInsurance > 0,
      },
      include: {
        orderItem: true,
        user: true
      }
    });

    // Помечаем ВСЕ старые пакеты (включая главный) как объединенные в новый
    const allOldPackageIds = [mainPackage.id, ...consolidateWithIds];

    await prisma.package.updateMany({
      where: {
        id: { in: allOldPackageIds }
      },
      data: {
        consolidatedInto: newConsolidatedPackage.id,
        status: 'consolidated' // Меняем статус, чтобы скрыть их
      }
    });

    // Создаем уведомление для пользователя
    await prisma.notification.create({
      data: {
        userId: mainPackage.userId,
        type: 'package_consolidated',
        title: '📦 Your packages have been consolidated!',
        message: `Your ${consolidateWithIds.length + 1} packages have been consolidated into one. New package ID: ${newConsolidatedPackage.id.slice(0, 8)}. You can now request shipping.`
      }
    });

    res.status(200).json({
      success: true,
      message: 'Packages consolidated successfully',
      totalShippingCost: finalShippingCost,
      newPackageId: newConsolidatedPackage.id
    });

  } catch (error) {
    console.error('Error completing consolidation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
