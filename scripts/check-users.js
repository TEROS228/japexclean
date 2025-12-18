const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('👥 Checking all users in the system...\n');

    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: {
            orders: true,
            transactions: true,
            packages: true,
            notifications: true,
            messages: true,
            addresses: true,
            favourites: true,
            compensationRequests: true,
            damagedItemRequests: true
          }
        }
      }
    });

    console.log(`Total users: ${users.length}\n`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Admin: ${user.isAdmin}`);
      console.log(`   Balance: ¥${user.balance}`);
      console.log(`   Orders: ${user._count.orders}`);
      console.log(`   Packages: ${user._count.packages}`);
      console.log(`   Transactions: ${user._count.transactions}`);
      console.log(`   Notifications: ${user._count.notifications}`);
      console.log(`   Messages: ${user._count.messages}`);
      console.log(`   Addresses: ${user._count.addresses}`);
      console.log(`   Favourites: ${user._count.favourites}`);
      console.log(`   Compensation Requests: ${user._count.compensationRequests}`);
      console.log(`   Damaged Item Requests: ${user._count.damagedItemRequests}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
