import Footer from '../components/Footer';

export default function ProhibitedItems() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8 lg:py-12 flex-1">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">🚫 Prohibited & Restricted Items (EMS Japan Post)</h1>
        <p className="text-gray-600 mb-6 sm:mb-8">
          Before requesting international shipping, please make sure your package does not contain any prohibited or dangerous items. Japan Post and international aviation rules (IATA) strictly regulate what can and cannot be exported.
        </p>

        <div className="prose prose-sm sm:prose-base lg:prose-lg max-w-none space-y-6 sm:space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3 sm:mb-4">❌ Completely Prohibited Items (Cannot Be Sent by EMS)</h2>
            <p className="text-gray-700 mb-3 sm:mb-4">
              The following items are strictly prohibited and cannot be shipped under any circumstances:
            </p>

            <h3 className="text-xl font-bold text-gray-900 mt-4 mb-2">🔥 Flammable & Dangerous Goods</h3>
            <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700">
              <li>Perfume, cologne, body spray, air freshener</li>
              <li>Any aerosol or spray cans</li>
              <li>Lighter fluid, gasoline, kerosene</li>
              <li>Paint, thinner, glue with flammable chemicals</li>
            </ul>

            <h3 className="text-xl font-bold text-gray-900 mt-4 mb-2">💥 Explosive & Hazardous Materials</h3>
            <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700">
              <li>Fireworks, gunpowder, signal flares</li>
              <li>Explosives or materials that may ignite</li>
            </ul>

            <h3 className="text-xl font-bold text-gray-900 mt-4 mb-2">🔫 Weapons</h3>
            <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700">
              <li>Firearms, gun parts, replica guns</li>
              <li>Airsoft guns, BB guns, stun guns</li>
              <li>Ammunition, cartridges</li>
            </ul>

            <h3 className="text-xl font-bold text-gray-900 mt-4 mb-2">🚭 Vapes & Related Items</h3>
            <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700">
              <li>Electronic cigarettes</li>
              <li>Vape liquid (with or without nicotine)</li>
            </ul>

            <h3 className="text-xl font-bold text-gray-900 mt-4 mb-2">🧪 Chemicals & Toxic Substances</h3>
            <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700">
              <li>Acids, poisons, corrosive liquids</li>
              <li>Toxic or radioactive materials</li>
              <li>Lithium batteries shipped separately (loose/spare)</li>
            </ul>

            <h3 className="text-xl font-bold text-gray-900 mt-4 mb-2">💊 Drugs</h3>
            <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700">
              <li>Illegal drugs, narcotics</li>
              <li>Medicines requiring a prescription in Japan</li>
            </ul>

            <h3 className="text-xl font-bold text-gray-900 mt-4 mb-2">💵 Money & Valuables</h3>
            <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700">
              <li>Cash, coins, banknotes</li>
              <li>Gift cards, prepaid cards, checks, securities</li>
            </ul>

            <h3 className="text-xl font-bold text-gray-900 mt-4 mb-2">🐾 Biological Items</h3>
            <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700">
              <li>Live animals or insects</li>
              <li>Plants, seedlings, seeds, soil</li>
            </ul>

            <h3 className="text-xl font-bold text-gray-900 mt-4 mb-2">🍷 Alcohol</h3>
            <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700">
              <li>Alcoholic beverages of any kind (not accepted by Japan Post for EMS)</li>
            </ul>

            <p className="text-yellow-600 font-semibold mt-4">
              If your package contains any prohibited items, it will not be shipped.<br/>
              You may choose to return or dispose of the item (¥600 disposal fee).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3 sm:mb-4">⚠️ Restricted Items (Allowed with Conditions)</h2>
            <p className="text-gray-700 mb-3 sm:mb-4">
              These items may be shipped, but only if they meet Japan Post and airline safety regulations:
            </p>

            <h3 className="text-xl font-bold text-gray-900 mt-4 mb-2">🔋 Devices With Built-In Lithium Batteries</h3>
            <p className="text-gray-700 mb-2">Allowed only if all conditions are met:</p>
            <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700">
              <li>Battery is built-in or installed inside the device</li>
              <li>Device is turned off</li>
              <li>Battery capacity ≤ 100 Wh</li>
              <li>No spare or additional batteries in the same package</li>
            </ul>
            <p className="text-gray-700 mt-2 mb-2">Examples:</p>
            <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700">
              <li>✔ Smartphones</li>
              <li>✔ Laptops</li>
              <li>✔ Tablets</li>
              <li>✔ Cameras</li>
              <li>✔ Smartwatches</li>
              <li>✔ Game consoles (without extra battery packs)</li>
            </ul>

            <h3 className="text-xl font-bold text-gray-900 mt-4 mb-2">🍫 Food & Snacks</h3>
            <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700">
              <li>Factory-sealed, non-perishable food</li>
              <li>No liquids, sauces, or items requiring refrigeration</li>
            </ul>

            <h3 className="text-xl font-bold text-gray-900 mt-4 mb-2">💄 Cosmetics</h3>
            <p className="text-gray-700 mb-2">Allowed only if non-flammable and not spray-type:</p>
            <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700">
              <li>✔ Creams, lotions (water-based)</li>
              <li>❌ Perfume, sprays, alcohol-based cosmetics — prohibited</li>
            </ul>

            <h3 className="text-xl font-bold text-gray-900 mt-4 mb-2">👕 Clothing & Accessories</h3>
            <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700">
              <li>Clothing, shoes, bags, accessories — allowed</li>
            </ul>

            <h3 className="text-xl font-bold text-gray-900 mt-4 mb-2">📘 Books & Paper Goods</h3>
            <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700">
              <li>Books, magazines, documents — allowed</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3 sm:mb-4">📦 Japrix Shipping Policy</h2>
            <p className="text-gray-700 mb-3 sm:mb-4">
              Japrix strictly follows Japan Post and international aviation rules.
            </p>
            <p className="text-gray-700 mb-3 sm:mb-4">
              If an item is prohibited, we cannot ship it.<br/>
              You can choose one of the following options:
            </p>
            <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700">
              <li>♻️ Dispose of the item (¥600 fee)</li>
              <li>🔁 Return the item to the seller (if they accept returns)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3 sm:mb-4">📧 Item Check Before Ordering</h2>
            <p className="text-gray-700">
              If you want to confirm whether a specific item can be shipped:<br />
              Email: <a href="mailto:first5500@gmail.com" className="text-blue-600 hover:underline">first5500@gmail.com</a><br />
              <strong>Subject:</strong> Item check before order
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
