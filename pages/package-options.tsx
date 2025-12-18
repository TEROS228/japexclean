import Footer from '../components/Footer';

export default function PackageOptions() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8 lg:py-12 flex-1">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">📦 Package Options (After Arrival to Our Japan warehouse)</h1>
        <p className="text-gray-600 mb-6 sm:mb-8">
          Once your order arrives at our Japan warehouse, you can choose from several services before international shipping:
        </p>

        <div className="prose prose-sm sm:prose-base lg:prose-lg max-w-none space-y-6 sm:space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3 sm:mb-4">📦 Package Consolidation</h2>
            <p className="text-gray-700 mb-2">
              Combine multiple packages into one box. Save on international shipping by merging your items.
            </p>
            <p className="text-gray-700 mb-2">
              <strong>Cost:</strong> Free for combining, you only pay the actual shipping fee.
            </p>
            <p className="text-blue-600 font-semibold">
              💡 Recommended if you ordered from multiple sellers (e.g. Rakuten + Yahoo).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3 sm:mb-4">🖼️ Inside Package Photo</h2>
            <p className="text-gray-700 mb-2">
              Get photos of your items before shipping. We&apos;ll take up to 3 detailed photos of the products inside your package.
            </p>
            <p className="text-gray-700 mb-2">
              <strong>Cost:</strong> ¥500 per package
            </p>
            <p className="text-blue-600 font-semibold">
              📸 Useful for checking condition, color, or item accuracy before shipment.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3 sm:mb-4">❌ Cancel Purchase (if seller approves)</h2>
            <p className="text-gray-700 mb-2">
              Available for Yahoo / Rakuten orders only. You can request a purchase cancellation from the seller.
            </p>
            <p className="text-gray-700 mb-2">
              <strong>Cost:</strong> ¥900 (only if seller approves)
            </p>
            <p className="text-yellow-600 font-semibold">
              ⚠️ Approval depends entirely on the seller&apos;s policy. If they refuse, the order cannot be canceled.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3 sm:mb-4">♻️ Disposal Service</h2>
            <p className="text-gray-700 mb-2">
              We can dispose and recycle your unwanted items.
            </p>
            <p className="text-gray-700 mb-2">
              <strong>Cost:</strong> ¥600 (2 kg × ¥300 / kg)
            </p>
            <p className="text-blue-600 font-semibold">
              🗑️ Good option for defective or unwanted products that you don&apos;t want to ship internationally.
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
