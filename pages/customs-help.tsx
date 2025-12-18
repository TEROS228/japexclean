import { useEffect, useState } from 'react';
import Footer from '../components/Footer';

export default function CustomsHelp() {
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
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">📋 What if my parcel got stopped at customs?</h1>
        <p className="mb-6 sm:mb-8 text-sm sm:text-base text-gray-600">
          Don't worry — customs holds are normal and usually temporary. Here's what you need to know.
        </p>

        <div className="space-y-6 sm:space-y-8">
          {/* Section 1 */}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">1. Why this can happen</h2>
            <p className="mb-3">
              Sometimes international parcels are held by customs in the destination country for inspection. This is a standard procedure and doesn't always mean there's a problem with your shipment.
            </p>
            <p className="font-semibold mb-2 text-sm sm:text-base">Common reasons:</p>
            <ul className="list-disc ml-6 sm:ml-8 space-y-1 text-sm sm:text-base">
              <li>The customs office is verifying the item's value or description.</li>
              <li>The parcel needs additional import documents.</li>
              <li>There are local taxes or duties to be paid before delivery.</li>
            </ul>
          </div>

          {/* Section 2 */}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">2. How long it usually takes</h2>
            <p className="mb-3 text-sm sm:text-base">
              In most cases, customs inspection takes <strong>1–5 business days</strong>. During this time, the tracking status may show: "Held at Customs", "Awaiting Clearance", or "Customs Inspection".
            </p>
            <p className="mb-3 text-sm sm:text-base">
              If there are no issues, the parcel continues automatically to your address.
            </p>
          </div>

          {/* Section 3 */}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">3. What you should do</h2>
            <p className="mb-3 text-sm sm:text-base">
              If your tracking shows that the parcel has been at customs for more than 5 days, you can:
            </p>
            <ol className="list-decimal ml-6 sm:ml-8 space-y-2 text-sm sm:text-base">
              <li>Contact your local customs office and provide the tracking number.</li>
              <li>
                If they request additional documents (invoice, payment proof, etc.), you can:
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>
                    Access your invoice in your Japrix account: <strong>Profile → Packages → Find your order → Download Invoice</strong>
                  </li>
                  <li>You can download or print it and send to customs.</li>
                </ul>
              </li>
              <li>Contact us via Messages in your profile, and we'll provide any additional shipping proof or support.</li>
            </ol>
          </div>

          {/* Section 4 */}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">4. Important notes</h2>
            <ul className="list-disc ml-6 sm:ml-8 space-y-1 text-sm sm:text-base">
              <li>Japrix is not responsible for customs fees or import taxes in your country.</li>
              <li>Some countries may contact the receiver directly by email or phone.</li>
              <li>Always make sure your phone number and address are correct when placing an order.</li>
            </ul>
          </div>

          {/* Section 5 - Table */}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">5. Example tracking messages</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-300">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Tracking Status</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Meaning</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">"Held at Customs"</td>
                    <td className="border border-gray-300 px-4 py-2">Customs is checking your parcel</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">"Awaiting Payment"</td>
                    <td className="border border-gray-300 px-4 py-2">You must pay import tax or duty</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">"Released by Customs"</td>
                    <td className="border border-gray-300 px-4 py-2">Parcel cleared and continues to delivery</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 6 */}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">6. Need help?</h2>
            <p className="mb-3 text-sm sm:text-base">
              Open <strong>Messages</strong> in your profile and send us your <strong>Order ID</strong> and <strong>Tracking Number</strong>. Our support team will contact the shipping provider and update you within 24 hours.
            </p>
          </div>

          {/* Tip Box */}
          <div className="mt-6 p-4 border-l-4 border-blue-500 bg-blue-50">
            <p className="text-sm sm:text-base">
              <strong>💡 Tip:</strong> Keep your tracking number handy and check it regularly. Most customs delays resolve themselves within a few days without any action needed from you.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
