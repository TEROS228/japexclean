import { useEffect, useState } from 'react';
import Footer from '../components/Footer';

export default function WhatDoIPayFor() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <main className="flex-1 max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8 lg:py-12">
        <h1 className="text-3xl font-bold mb-3 sm:mb-4">🧾 What Do I Pay For?</h1>
        <p className="mb-6 sm:mb-8">
          At Japrix, we believe in complete transparency — no hidden fees or unexpected charges. Here's a full breakdown of what you pay for when using our service.
        </p>

        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">💴 1. Service Fee — ¥1000 per item</h2>
            <p className="mb-2">A single flat commission that covers everything needed to handle your order in Japan:</p>
            <ul className="list-disc ml-8 space-y-1">
              <li>Ordering and communication with the seller (Rakuten or Yahoo).</li>
              <li>Secure storage at our Japan warehouse.</li>
              <li>Package Consolidation — Combine multiple items into one box for FREE.</li>
              <li>Basic quality check before shipping.</li>
              <li>Customer support in English.</li>
            </ul>
            <p className="mt-2">💡 You pay this fee only per item, no matter what quantity.</p>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-2">🛍️ 2. Item Price</h2>
            <p>The original price of the item as listed on Rakuten or Yahoo! Japan. You can order from both marketplaces at the same time.</p>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-2">💳 3. Payment Fee (Stripe)</h2>
            <p>When you top up your Japrix balance using Stripe, a 3.6% payment processing fee is charged automatically. This fee goes directly to Stripe, not Japrix.</p>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-2">📦 4. Optional Warehouse Services</h2>
            <p className="mb-3 sm:mb-4">Once your items arrive at our warehouse in Japan, you can choose optional services to manage and prepare your shipment.</p>
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left">Service</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Description</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Cost</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">Inside Package Photo</td>
                  <td className="border border-gray-300 px-4 py-2">Receive up to 3 photos of your items before shipping.</td>
                  <td className="border border-gray-300 px-4 py-2">¥500</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">Reinforcement Service</td>
                  <td className="border border-gray-300 px-4 py-2">Strengthen the outer box for safer international delivery.</td>
                  <td className="border border-gray-300 px-4 py-2">¥1,000</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">Cancel Purchase</td>
                  <td className="border border-gray-300 px-4 py-2">Request order cancellation from seller (Rakuten/Yahoo only, if seller approves).</td>
                  <td className="border border-gray-300 px-4 py-2">¥900</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">Disposal Service</td>
                  <td className="border border-gray-300 px-4 py-2">Dispose and recycle unwanted items safely.</td>
                  <td className="border border-gray-300 px-4 py-2">¥300 per kg</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-2">✈️ 5. International Shipping Fee (EMS)</h2>
            <p className="mb-2">All packages are shipped via Japan Post EMS — fast, reliable, and fully trackable. Shipping cost depends on your destination country and package weight.</p>
            <p className="mb-2">Each shipment includes:</p>
            <ul className="list-disc ml-8 space-y-1">
              <li>Tracking number.</li>
              <li>Insurance up to ¥20,000 (additional insurance available for high-value items).</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-2">🌎 6. Customs Duties and Taxes (The Client's Responsibility)</h2>
            <p className="mb-2">
              Please note that the fees listed above <strong>DO NOT include any duties, taxes, or customs fees</strong> charged by your destination country.
            </p>
            <p className="mb-2">
              These charges are mandatory and are determined by your country's customs authority upon arrival of the package.
            </p>
            <ul className="list-disc ml-8 space-y-1">
              <li><strong>Payment:</strong> The courier (e.g., EMS) will contact you directly to collect these fees before delivery.</li>
              <li>
                <strong>Liability:</strong> The Client is fully responsible for paying all applicable import duties, tariffs, VAT, and local handling charges.
                Failure to pay these fees may result in the package being returned, delayed, or destroyed by customs.
              </li>
            </ul>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
