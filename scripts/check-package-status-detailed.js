const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPackageStatus() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'CEO@gmail.com' }
    });

    console.log('\n📦 Checking all packages in database...\n');

    const allPackages = await prisma.package.findMany({
      where: {
        userId: user.id
      },
      include: {
        orderItem: true
      }
    });

    allPackages.forEach(pkg => {
      console.log(`Package: ${pkg.id}`);
      console.log(`  Status: ${pkg.status}`);
      console.log(`  Weight: ${pkg.weight}kg`);
      console.log(`  Shipping Cost: ¥${pkg.shippingCost}`);
      console.log(`  Title: ${pkg.orderItem.title.slice(0, 50)}...`);
      console.log('');
    });

    console.log(`\nTotal packages: ${allPackages.length}`);
    console.log(`Pending: ${allPackages.filter(p => p.status === 'pending').length}`);
    console.log(`Ready: ${allPackages.filter(p => p.status === 'ready').length}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPackageStatus();
