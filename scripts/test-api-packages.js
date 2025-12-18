const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');

async function testAPI() {
  try {
    // Создаем токен
    const token = jwt.sign(
      { email: 'CEO@gmail.com' },
      'A5omKGMJNk+K9NDy/nd7deAAa8y4UXGTuw6Ta+2yhwU='
    );

    // Запрашиваем пакеты
    const response = await fetch('http://localhost:3000/api/user/packages', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    console.log('\n📦 API Response:');
    console.log(`Status: ${response.status}`);
    console.log(`Package count: ${data.packages?.length || 0}`);

    if (data.packages) {
      data.packages.forEach(pkg => {
        console.log(`\n  Package ${pkg.id.slice(0, 8)}:`);
        console.log(`    Status: ${pkg.status}`);
        console.log(`    Weight: ${pkg.weight}kg`);
        console.log(`    Shipping Cost: ¥${pkg.shippingCost}`);
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAPI();
