const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupOldReplacements() {
  console.log('🔍 Finding old replacement orders...');
  
  // Find all orders with REPLACEMENT in items and confirmed: true but orderNumber > 300000
  const suspiciousOrders = await prisma.order.findMany({
    where: {
      orderNumber: {
        gte: 300000
      }
    },
    include: {
      items: true
    }
  });

  console.log(`Found ${suspiciousOrders.length} orders with orderNumber >= 300000`);

  for (const order of suspiciousOrders) {
    const hasReplacementItem = order.items.some(item => 
      item.title && item.title.includes('[REPLACEMENT]')
    );

    if (hasReplacementItem) {
      console.log(`\n📦 Order #${order.orderNumber} (ID: ${order.id})`);
      console.log(`   Confirmed: ${order.confirmed}`);
      console.log(`   Items: ${order.items.map(i => i.title).join(', ')}`);
      
      // Delete this order and its items
      console.log(`   ❌ Deleting order #${order.orderNumber}...`);
      
      await prisma.orderItem.deleteMany({
        where: { orderId: order.id }
      });
      
      await prisma.order.delete({
        where: { id: order.id }
      });
      
      console.log(`   ✅ Deleted`);
    }
  }

  console.log('\n✅ Cleanup complete!');
}

cleanupOldReplacements()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
