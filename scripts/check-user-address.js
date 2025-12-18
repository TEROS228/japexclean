const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUserAddress() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'CEO@gmail.com' },
      include: {
        addresses: true
      }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log(`\n👤 User: ${user.email}`);
    console.log(`💰 Balance: ¥${user.balance.toLocaleString()}`);
    console.log(`\n📮 Addresses:`);

    if (user.addresses.length === 0) {
      console.log('  ❌ No addresses found');
    } else {
      user.addresses.forEach((addr, idx) => {
        console.log(`\n  Address ${idx + 1}:`);
        console.log(`    Country: ${addr.country}`);
        console.log(`    City: ${addr.city}`);
        console.log(`    State: ${addr.state || 'N/A'}`);
        console.log(`    Postal Code: ${addr.postalCode}`);
        console.log(`    Full: ${addr.address}`);

        const isUSA = addr.country.toLowerCase().includes('united states') ||
                      addr.country.toLowerCase().includes('usa') ||
                      addr.country.toLowerCase() === 'us';
        console.log(`    🇺🇸 Is USA: ${isUSA ? 'YES ✅' : 'NO ❌'}`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserAddress();
