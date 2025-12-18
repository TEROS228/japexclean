import Footer from '../components/Footer';

export default function LegalTaxDisclaimer() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8 lg:py-12 flex-1">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">Japrix Shipping and Insurance Policy</h1>
        <p className="text-gray-600 mb-2">
          <strong>Effective Date:</strong> October 8, 2025
        </p>
        <p className="text-gray-600 mb-6 sm:mb-8">
          <strong>Applies to:</strong> all packages shipped from the Japrix warehouse (Japan).
        </p>

        <div className="prose prose-sm sm:prose-base lg:prose-lg max-w-none space-y-6 sm:space-y-8">

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3 sm:mb-4">1. Carrier and Service Availability</h2>
            <p className="text-gray-700 mb-2">Japrix uses reliable third-party international carriers. The main carriers are:</p>
            <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700">
              <li><strong>Japan Post EMS (Express Mail Service):</strong> our standard, fast, and fully trackable service.</li>
              <li><strong>FedEx:</strong> available for certain destinations, oversized items, or upon specific Client request.</li>
            </ul>
            <p className="text-gray-700 mt-2">Service availability, delivery speed, and cost depend on the Client's destination country, as well as the dimensions and weight of the final package.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3 sm:mb-4">2. Declaration and Customs Value</h2>
            <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700">
              <li><strong>Mandatory Declaration:</strong> Japrix is legally required to declare the accurate contents and value of all shipments to Japanese Customs.</li>
              <li><strong>Valuation:</strong> The declared value for customs purposes will always be the actual purchase price paid by Japrix on behalf of the Client.</li>
              <li><strong>No Undervaluation:</strong> Japrix strictly prohibits and will refuse any requests to declare a lower value than the actual purchase price. Any such request will result in shipment cancellation and possible account suspension.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3 sm:mb-4">3. Risk of Loss and Damage Transfer</h2>
            <p className="text-gray-700 font-semibold mb-2">
              THE CLIENT ACKNOWLEDGES AND AGREES THAT THE RISK OF LOSS OR DAMAGE TO THE PACKAGE TRANSFERS ENTIRELY TO THE CLIENT AT THE MOMENT JAPRIX DELIVERS THE PACKAGE TO THE SELECTED INTERNATIONAL CARRIER (JAPAN POST EMS OR FEDEX) IN JAPAN.
            </p>
            <p className="text-gray-700">
              Japrix acts solely as an intermediary (proxy buyer) and is not the shipper. Japrix has no control over the package once it is in the carrier's possession.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3 sm:mb-4">4. Insurance and Compensation</h2>
            <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700">
              <li><strong>Standard EMS Coverage:</strong> All packages shipped via Japan Post EMS include standard insurance coverage up to a maximum of 20,000 JPY (or its equivalent in SDR). This coverage is provided and managed directly by Japan Post.</li>
              <li><strong>Compensation Limit:</strong> In the event of loss or damage, Japrix's liability is strictly limited to the compensation amount received from the carrier. Japrix shall not be liable for any loss or damage exceeding the insured value of the shipment.</li>
              <li><strong>No Compensation for Prohibited Items:</strong> Japrix provides no compensation, regardless of insurance status, for items that are damaged, confiscated, or delayed due to the Client ordering items explicitly listed as Prohibited in the Japrix Terms of Service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3 sm:mb-4">5. Claims Procedure (REQUIRED ACTION BY CLIENT)</h2>
            <p className="text-gray-700 mb-2">The Client is responsible for initiating and managing the insurance claim process.</p>
            <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700">
              <li><strong>Damage Claims:</strong> If a package arrives visibly damaged, the Client MUST immediately inform the delivery agent and their local post office/carrier. The Client must provide photos of the damaged package, the contents, and all packaging materials to their local carrier.</li>
              <li><strong>Lost Packages:</strong> If a package is significantly delayed or officially declared lost, the Client MUST file a report with their local post office or the delivering branch of the carrier (e.g., EMS) in the destination country.</li>
              <li><strong>Japrix Assistance:</strong> Japrix will provide all necessary documentation (proof of purchase, invoices, shipping labels) to the Client upon request to support the Client's claim with the local carrier. Japrix will not file the claim directly; the claim must be filed by the recipient (Client) in the destination country.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3 sm:mb-4">6. Customs, Duties, and Taxes</h2>
            <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700">
              <li><strong>Client Responsibility:</strong> The Client is solely responsible for the payment of all applicable import duties, tariffs, VAT, GST, and any local handling fees imposed by the destination country's customs authority.</li>
              <li><strong>Non-Payment of Fees:</strong> If the Client refuses to pay required customs fees, resulting in the package being held, returned, or destroyed:
                <ul className="list-disc pl-6 mt-1">
                  <li>NO REFUND will be issued by Japrix for the item price, service fees, or original shipping costs.</li>
                  <li>The Client will be charged any fees incurred by Japrix for the return or disposal of the package.</li>
                </ul>
              </li>
              <li><strong>Delays:</strong> Japrix is not liable for any delivery delays caused by customs processing in the destination country.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3 sm:mb-4">7. Delivery Address</h2>
            <p className="text-gray-700">
              The Client must ensure the delivery address is accurate and complete. Japrix is not responsible for packages that are lost, delivered incorrectly, or returned due to an incomplete or inaccurate address provided by the Client.
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
