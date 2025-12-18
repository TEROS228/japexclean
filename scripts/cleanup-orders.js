const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupOrders() {
  try {
    console.log('🔍 Finding CEO user...');

    // Найти CEO
    const ceoUser = await prisma.user.findUnique({
      where: { email: 'CEO@gmail.com' }
    });

    if (!ceoUser) {
      console.error('❌ CEO user not found!');
      return;
    }

    console.log(`✅ Found CEO user: ${ceoUser.email} (ID: ${ceoUser.id})`);

    // Подсчитать количество заказов до удаления
    const totalOrders = await prisma.order.count();
    const ceoOrders = await prisma.order.count({
      where: { userId: ceoUser.id }
    });
    const ordersToDelete = totalOrders - ceoOrders;

    console.log(`\n📊 Statistics:`);
    console.log(`   Total orders: ${totalOrders}`);
    console.log(`   CEO orders: ${ceoOrders}`);
    console.log(`   Orders to delete: ${ordersToDelete}`);

    if (ordersToDelete === 0) {
      console.log('\n✅ No orders to delete!');
      return;
    }

    console.log('\n🗑️  Deleting orders (this will cascade to order items, packages, etc.)...');

    // Удалить все заказы кроме CEO
    const result = await prisma.order.deleteMany({
      where: {
        userId: {
          not: ceoUser.id
        }
      }
    });

    console.log(`✅ Deleted ${result.count} orders`);

    // Проверить оставшиеся заказы
    const remainingOrders = await prisma.order.count();
    console.log(`\n📊 Remaining orders: ${remainingOrders}`);

    // Дополнительно очистим другие данные пользователей (кроме CEO)
    console.log('\n🧹 Cleaning up other user data...');

    const deletedTransactions = await prisma.transaction.deleteMany({
      where: { userId: { not: ceoUser.id } }
    });
    console.log(`   Deleted ${deletedTransactions.count} transactions`);

    const deletedNotifications = await prisma.notification.deleteMany({
      where: { userId: { not: ceoUser.id } }
    });
    console.log(`   Deleted ${deletedNotifications.count} notifications`);

    const deletedMessages = await prisma.message.deleteMany({
      where: { userId: { not: ceoUser.id } }
    });
    console.log(`   Deleted ${deletedMessages.count} messages`);

    const deletedAddresses = await prisma.address.deleteMany({
      where: { userId: { not: ceoUser.id } }
    });
    console.log(`   Deleted ${deletedAddresses.count} addresses`);

    const deletedFavourites = await prisma.favourite.deleteMany({
      where: { userId: { not: ceoUser.id } }
    });
    console.log(`   Deleted ${deletedFavourites.count} favourites`);

    console.log('\n✅ Cleanup completed successfully!');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupOrders();
