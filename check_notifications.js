const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkNotifications() {
  try {
    // Получаем все уведомления типа consolidation_request
    const notifications = await prisma.notification.findMany({
      where: {
        type: 'consolidation_request'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10,
      include: {
        user: {
          select: {
            email: true,
            isAdmin: true
          }
        }
      }
    });

    console.log(`\n📊 Found ${notifications.length} consolidation notifications:\n`);

    notifications.forEach((notif, index) => {
      console.log(`${index + 1}. ID: ${notif.id}`);
      console.log(`   User: ${notif.user.email} (Admin: ${notif.user.isAdmin})`);
      console.log(`   Title: ${notif.title}`);
      console.log(`   Message: ${notif.message}`);
      console.log(`   Read: ${notif.read}`);
      console.log(`   Created: ${notif.createdAt}`);
      console.log('');
    });

    // Проверяем все уведомления для CEO
    const ceoUser = await prisma.user.findFirst({
      where: { email: 'CEO@gmail.com' }
    });

    if (ceoUser) {
      const ceoNotifications = await prisma.notification.findMany({
        where: {
          userId: ceoUser.id
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      });

      console.log(`\n📧 CEO has ${ceoNotifications.length} total notifications (showing last 10):\n`);

      ceoNotifications.forEach((notif, index) => {
        console.log(`${index + 1}. Type: ${notif.type}, Title: ${notif.title}, Read: ${notif.read}, Created: ${notif.createdAt}`);
      });
    } else {
      console.log('\n❌ CEO user not found!');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkNotifications();
