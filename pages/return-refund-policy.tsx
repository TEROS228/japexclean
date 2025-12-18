import Footer from '../components/Footer';

export default function ReturnRefundPolicy() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8 lg:py-12 flex-1">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">Japrix Return & Refund Policy</h1>
        <p className="text-gray-600 mb-6 sm:mb-8">
          <strong>Effective Date:</strong> October 8, 2025
        </p>

        <div className="prose prose-sm sm:prose-base lg:prose-lg max-w-none space-y-6 sm:space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3 sm:mb-4">1. Overview</h2>
            <p className="text-gray-700">
              Japrix allows international purchases from Japanese marketplaces (Rakuten, Yahoo Shopping). This Policy explains how customers can request cancellations, returns, and refunds.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3 sm:mb-4">2. Cancellation & Return</h2>
            <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700">
              <li>After the item arrives at the Japrix warehouse in Shinjuku, Tokyo, customers may click: "Cancel Shipping & Return (if seller allows)".</li>
              <li>Japrix will forward the request to the original seller.</li>
              <li>If the seller accepts the return, the item will be returned, and the refund will be issued to the customer's Japrix balance.</li>
              <li>If the seller does not accept returns, cancellation or refund is not possible.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3 sm:mb-4">3. EMS Shipping & Insurance</h2>
            <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700">
              <li>All shipments use Japan Post EMS, which includes free insurance up to 20,000 JPY.</li>
              <li>Insurance covers loss or damage during transit, excluding cases of incorrect addresses or customer refusal to accept the delivery.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3 sm:mb-4">4. Refund Process</h2>
            <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700">
              <li>Refunds are processed once Japrix confirms that the item has been returned and accepted by the seller.</li>
              <li>Refunds are issued minus any non-refundable service, shipping, or insurance fees.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3 sm:mb-4">5. Non-Returnable Items</h2>
            <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700">
              <li>Items marked as non-returnable on the marketplace.</li>
              <li>Auction items (Yahoo Auctions, Mercari).</li>
              <li>Items that have already been shipped to the customer.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3 sm:mb-4">6. Non-Refundable Account Balance</h2>
            <p className="text-gray-700 font-semibold">
              Any funds added to the customer's Japrix account balance cannot be refunded under any circumstances.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3 sm:mb-4">7. Damaged or Lost Items</h2>
            <p className="text-gray-700">
              If an item is damaged or lost during EMS shipping from the Japrix warehouse, it must be reported within 7 days of delivery. Japrix will assist in filing a claim with Japan Post.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3 sm:mb-4">8. Contact Information</h2>
            <p className="text-gray-700">
              For all return or refund inquiries:<br />
              📧 <a href="mailto:support@japrix.jp" className="text-blue-600 hover:underline">support@japrix.jp</a>
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
