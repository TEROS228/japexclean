const fs = require('fs');

const data = JSON.parse(fs.readFileSync('./data/yahoo-subcategories.json', 'utf-8'));

console.log('Ladies Fashion (2494):');
const ladies = data['2494'];
if (ladies.subcategories) {
  ladies.subcategories.forEach(sub => {
    console.log(`  - ${sub.jpName || sub.name} (${sub.id})`);
  });
}

console.log('\nMens Fashion (2495):');
const mens = data['2495'];
if (mens.subcategories) {
  mens.subcategories.forEach(sub => {
    console.log(`  - ${sub.jpName || sub.name} (${sub.id})`);
  });
}
