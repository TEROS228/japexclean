const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updatePackageStatus() {
  try {
    console.log('Updating package statuses from pending to ready...');

    const result = await prisma.package.updateMany({
      where: {
        status: 'pending'
      },
      data: {
        status: 'ready'
      }
    });

    console.log(`✅ Updated ${result.count} packages to 'ready' status`);

    // Показываем обновленные посылки
    const packages = await prisma.package.findMany({
      where: {
        status: 'ready'
      },
      include: {
        orderItem: true,
        user: {
          select: {
            email: true
          }
        }
      }
    });

    console.log('\n📦 Ready packages:');
    packages.forEach(pkg => {
      console.log(`  - ${pkg.id}: ${pkg.orderItem.title} (User: ${pkg.user.email}, Weight: ${pkg.weight}kg, Status: ${pkg.status})`);
    });

  } catch (error) {
    console.error('Error updating packages:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updatePackageStatus();
