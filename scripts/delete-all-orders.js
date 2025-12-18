const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteAllOrders() {
  try {
    console.log('🗑️  Deleting ALL order data (keeping only CEO account)...\n');

    // Удаляем в правильном порядке (от зависимых к независимым)

    // Удаляем damaged item requests (зависит от packages)
    console.log('Deleting damaged item requests...');
    const deletedDamaged = await prisma.damagedItemRequest.deleteMany({});
    console.log(`✅ Deleted ${deletedDamaged.count} damaged item requests`);

    // Удаляем compensation requests (зависит от packages)
    console.log('Deleting compensation requests...');
    const deletedCompensation = await prisma.compensationRequest.deleteMany({});
    console.log(`✅ Deleted ${deletedCompensation.count} compensation requests`);

    // Удаляем packages (зависит от order items и addresses)
    console.log('Deleting packages...');
    const deletedPackages = await prisma.package.deleteMany({});
    console.log(`✅ Deleted ${deletedPackages.count} packages`);

    // Удаляем order items (зависит от orders)
    console.log('Deleting order items...');
    const deletedOrderItems = await prisma.orderItem.deleteMany({});
    console.log(`✅ Deleted ${deletedOrderItems.count} order items`);

    // Удаляем все заказы
    console.log('Deleting orders...');
    const deletedOrders = await prisma.order.deleteMany({});
    console.log(`✅ Deleted ${deletedOrders.count} orders`);

    // Удаляем транзакции
    console.log('Deleting transactions...');
    const deletedTransactions = await prisma.transaction.deleteMany({});
    console.log(`✅ Deleted ${deletedTransactions.count} transactions`);

    // Удаляем уведомления
    console.log('Deleting notifications...');
    const deletedNotifications = await prisma.notification.deleteMany({});
    console.log(`✅ Deleted ${deletedNotifications.count} notifications`);

    // Удаляем сообщения
    console.log('Deleting messages...');
    const deletedMessages = await prisma.message.deleteMany({});
    console.log(`✅ Deleted ${deletedMessages.count} messages`);

    // Удаляем адреса
    console.log('Deleting addresses...');
    const deletedAddresses = await prisma.address.deleteMany({});
    console.log(`✅ Deleted ${deletedAddresses.count} addresses`);

    // Удаляем избранное
    console.log('Deleting favourites...');
    const deletedFavourites = await prisma.favourite.deleteMany({});
    console.log(`✅ Deleted ${deletedFavourites.count} favourites`);

    // Сбрасываем баланс CEO на 0
    console.log('\nResetting CEO balance to 0...');
    const ceoUser = await prisma.user.findUnique({
      where: { email: 'CEO@gmail.com' }
    });

    if (ceoUser) {
      await prisma.user.update({
        where: { email: 'CEO@gmail.com' },
        data: { balance: 0 }
      });
      console.log(`✅ Reset CEO balance from ¥${ceoUser.balance} to ¥0`);
    }

    console.log('\n✅ All order data deleted successfully!');
    console.log('✅ CEO@gmail.com account preserved with balance = 0');

  } catch (error) {
    console.error('❌ Error during deletion:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllOrders();
