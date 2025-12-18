import Footer from '../components/Footer';

export default function HowToOrder() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8 lg:py-12 flex-1">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">🛍️ How to Order</h1>
        <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">
          Ordering through Japrix is simple — we handle everything in Japan for you. Here&apos;s how it works step by step 👇
        </p>

        <div className="prose prose-sm sm:prose-base lg:prose-lg max-w-none space-y-6 sm:space-y-8">
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">1️⃣ Create an Account</h2>
            <p className="text-gray-700">
              Register your Japrix account to start shopping. After signing in, you&apos;ll get access to your personal dashboard — where you can view your balance, orders, and packages.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">2️⃣ Choose a Marketplace</h2>
            <p className="text-gray-700 mb-2">Select a Japanese store:</p>
            <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700">
              <li>🛒 Rakuten Japan</li>
              <li>🛍️ Yahoo Japan Shopping</li>
            </ul>
            <p className="text-gray-700 mt-2">
              You can order from both marketplaces at the same time — all in one cart.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">3️⃣ Add Products to Cart</h2>
            <p className="text-gray-700">
              Browse, find the products you want, and click &quot;Add to Cart.&quot; When ready, review your items before checkout.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">4️⃣ Top Up Your Balance</h2>
            <p className="text-gray-700 mb-2">
              Before placing an order, add funds to your Japrix balance using Stripe. Stripe accepts credit/debit cards and applies a 3.6% transaction fee.
            </p>
            <p className="text-blue-600 font-semibold text-sm sm:text-base">
              💡 Example: To have ¥10,000 available, you&apos;ll need to pay about ¥10,360 via Stripe.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">5️⃣ Place an Order</h2>
            <p className="text-gray-700 mb-2">
              Once your balance is enough, click &quot;Pay with balance.&quot; We&apos;ll purchase your items directly from the seller in Japan.
            </p>
            <p className="text-gray-700">
              🪙 Each order includes a fixed service fee of ¥800, regardless of product price or quantity.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">6️⃣ Arrival at the Japan Warehouse</h2>
            <p className="text-gray-700 mb-2">
              When your order arrives at our Japan warehouse, you&apos;ll see it in your account under &quot;Packages.&quot; From there, you can manage your package:
            </p>
            <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700">
              <li>📦 Package Consolidation — combine several parcels into one box</li>
              <li>🖼️ Inside Photo — get 3 photos of your items (¥500)</li>
              <li>❌ Cancel Purchase — request cancellation (if seller approves, ¥900)</li>
              <li>♻️ Disposal Service — recycle or discard items (¥600)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">7️⃣ Request International Shipping</h2>
            <p className="text-gray-700 mb-2">
              Once ready, choose EMS (Japan Post Express Mail Service) and confirm shipment. We&apos;ll prepare, pack, and send your parcel to your country.
            </p>
            <p className="text-gray-700">
              ✈️ EMS delivery usually takes 7–21 days, depending on your location. You&apos;ll receive a tracking number once the package is shipped.
            </p>
          </section>

          <section>
            <p className="text-green-600 font-bold text-lg">
              ✅ All done!
            </p>
            <p className="text-gray-700">
              You can track every step — from purchase to delivery — right inside your Japrix account. Our team in Japan handles everything safely and efficiently.
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
