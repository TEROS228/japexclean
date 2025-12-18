import Footer from '../components/Footer';

export default function TermsOfService() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8 lg:py-12 flex-1">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">Japrix User Agreement / Terms of Service</h1>
        <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">
          <strong>Effective Date:</strong> October 8, 2025<br />
          <strong>Website:</strong> <a href="https://japrix.jp" className="text-blue-600 hover:underline">https://japrix.jp</a><br />
          <strong>Address:</strong> Shinjuku, Tokyo, Japan<br />
          <strong>Email:</strong> <a href="mailto:support@japrix.jp" className="text-blue-600 hover:underline">support@japrix.jp</a>
        </p>

        <div className="prose prose-sm sm:prose-base lg:prose-lg max-w-none space-y-6 sm:space-y-8">
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">1. Acceptance of Terms and Amendments</h2>
            <p className="text-gray-700">
              By registering or using Japrix services, you agree to comply with this User Agreement and Terms of Service ("TOS"), as updated by Japrix from time to time. Japrix reserves the right to update this TOS. Japrix will notify the Client of material changes by posting a notice on the website and/or sending a notification via email seven (7) calendar days before the changes take effect. You are responsible for reviewing the most current TOS. Continued use of the Services after the changes become effective constitutes your acceptance of the new TOS.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">2. Definitions</h2>
            <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700">
              <li><strong>Japrix:</strong> Online proxy shopping service operated by Japrix Co., Ltd., Japan.</li>
              <li><strong>Client:</strong> Any individual or legal entity who registers on Japrix.</li>
              <li><strong>Services:</strong> Shopping, auction bidding, balance management, payment, in-warehouse services, and delivery services provided by Japrix.</li>
              <li><strong>Personal Data:</strong> Information that identifies you, including name, email, phone number, physical address, and IP address.</li>
              <li><strong>Agreements:</strong> This TOS, Privacy Policy, and any other rules posted on Japrix.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">3. Services Provided</h2>
            <p className="text-gray-700 mb-3">Japrix provides Clients with:</p>
            <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700">
              <li><strong>Shopping Service</strong> — purchasing items on Yahoo, Rakuten, and other marketplaces on behalf of the Client.</li>
              <li><strong>Auction Bidding Service</strong> — bidding on items via auction platforms.</li>
              <li><strong>Balance Service</strong> — prepayment and management of funds for orders.</li>
              <li><strong>In-Warehouse Services</strong> — a range of optional services available upon item arrival at the Japrix warehouse (see Section 5 for associated fees).</li>
              <li><strong>Delivery Service</strong> — dispatch of items via third-party carriers (including Japan Post EMS and FedEx) with optional insurance.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">4. Japrix Obligations</h2>
            <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700">
              <li>Purchases and dispatch occur only after the Client has completed payment.</li>
              <li>Japrix facilitates shipping via third-party carriers (including EMS) and informs the Client that standard insurance coverage of up to 20,000 JPY is provided directly by Japan Post.</li>
              <li>Japrix does not guarantee the condition, quality, or legality of items sold by third-party marketplaces.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">5. Fees and Payment</h2>
            <p className="text-gray-700 mb-3">
              Fees for purchase, storage, shipping, and optional services are described on the Japrix website. The following optional In-Warehouse Services are available to the Client upon item arrival, and the Client agrees to pay the respective fees:
            </p>

            <div className="overflow-x-auto my-4">
              <table className="min-w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Service</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Description</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Fee</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Inside Package Photo</td>
                    <td className="border border-gray-300 px-4 py-2">Request for photos of the item inside the original seller's package.</td>
                    <td className="border border-gray-300 px-4 py-2">500 JPY</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Package Reinforcement</td>
                    <td className="border border-gray-300 px-4 py-2">Adding extra packaging material for protection.</td>
                    <td className="border border-gray-300 px-4 py-2">1,000 JPY</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Package Consolidation</td>
                    <td className="border border-gray-300 px-4 py-2">Combining multiple purchased items into one shipment.</td>
                    <td className="border border-gray-300 px-4 py-2">FREE</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Cancel Purchase</td>
                    <td className="border border-gray-300 px-4 py-2">Request to cancel the order (if the original seller allows).</td>
                    <td className="border border-gray-300 px-4 py-2">900 JPY</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Disposal Service</td>
                    <td className="border border-gray-300 px-4 py-2">Disposal and recycling of the Client's package and contents.</td>
                    <td className="border border-gray-300 px-4 py-2">300 JPY per kg (based on weight)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700 mt-4">
              <li><strong>All funds added to the Client balance are Non-Refundable.</strong> All funds added to the Client balance are not subject to refund under any circumstances, including, but not limited to, account closure or change of mind by the Client, unless a dispute has been successfully concluded, in which case the cost of the item may be refunded to a bank account (see Section 11).</li>
              <li>Storage up to 60 days is free; after that, storage is 30 JPY per day per item. Items stored over 90 days without client action may be forfeited, and the funds spent on purchasing these items will not be refunded.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">6. Order Cancellation & Refunds</h2>
            <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700">
              <li>Clients may submit "Cancel Shipping & Return" requests only if the original seller allows.</li>
              <li>Refunds are processed only after seller approval and item return.</li>
              <li>Japrix does not refund balance prepayments, service fees, or shipping/insurance fees, except in cases of approved compensation claims as described in Section 11.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">7. Prohibited Items</h2>
            <p className="text-gray-700 mb-3">Clients may not purchase or bid on:</p>
            <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700">
              <li>Illegal items under Japanese law or destination law.</li>
              <li>Adult products without legal approval, pornography.</li>
              <li>Dangerous, flammable, explosive, toxic, or living organisms.</li>
              <li>Counterfeit or IP-infringing items.</li>
              <li>Oversized or restricted export products.</li>
              <li>Alcohol, alcohol-containing perfumes, and any other goods prohibited for export from Japan or import into the destination country.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">8. Prohibited Behavior</h2>
            <p className="text-gray-700 mb-3">Clients must not:</p>
            <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700">
              <li>Violate Japrix rules or applicable laws.</li>
              <li>Attempt fraud, including data manipulation, or otherwise misuse the service.</li>
              <li>Harm Japrix reputation, systems, or other clients.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">9. Registration</h2>
            <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700">
              <li>Individuals register personally; legal entities register via authorized representatives.</li>
              <li>Japrix may reject or suspend registrations at its discretion.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">10. Account Termination</h2>
            <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700">
              <li>Clients may terminate their accounts by submitting a formal request via a dedicated form on the website or by sending a written notice to the email address support@japrix.jp. Japrix commits to reviewing and processing the account closure request within seven (7) business days.</li>
              <li>Japrix may suspend or cancel accounts for false information, violations of this TOS, security reasons, or suspicion of fraud. Japrix is not liable for any disadvantage or loss resulting from such termination or suspension.</li>
              <li>In the event of account termination due to fraud or violation of this TOS, any remaining Client Balance may be forfeited by Japrix.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">11. Disclaimer and Limitation of Liability</h2>
            <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700">
              <li>Japrix provides services "as is".</li>
              <li>Japrix is not responsible for seller errors, item quality, delays, damages during shipping, or lost/stolen items beyond the scope of insurance coverage provided by the carrier.</li>
              <li>Japrix is not liable for damages caused by Client's violations of the TOS.</li>
            </ul>

            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mt-4 mb-2">Compensation for Lost or Damaged Items:</h3>
            <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700">
              <li>In the event of item loss or damage during international transit, the Client must initiate a formal claim (dispute) with Japrix immediately upon discovery.</li>
              <li>Japrix will process the claim based on the insurance coverage provided by the carrier (Japan Post, FedEx, etc.).</li>
              <li>Following the successful approval of the claim by the carrier and the receipt of the corresponding insurance payment by Japrix, the Client will be compensated for the value of the item(s) up to the insured amount.</li>
              <li>The compensation amount will be credited, at the Client's choice, either to the Client's Japrix Account Balance or transferred directly to the Client's verified bank account or payment method. The Client acknowledges that bank transfer may incur processing fees deducted from the final amount, and that the return of funds to the Japrix Balance is typically faster.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">12. Changes to Services and TOS</h2>
            <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700">
              <li>Japrix may modify or suspend services at any time, without prior notice, for maintenance, emergencies, or technical reasons.</li>
              <li>Japrix may update the TOS at any time in accordance with Section 1.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">13. Jurisdiction</h2>
            <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700">
              <li>This TOS is governed by Japanese law.</li>
              <li>Any disputes are subject to the exclusive jurisdiction of courts in Tokyo, Japan.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">14. Children</h2>
            <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700">
              <li>Japrix does not collect data from users under 18.</li>
              <li>If you are under 18, do not register or use Japrix services.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">15. Contact</h2>
            <p className="text-gray-700">
              📧 <a href="mailto:support@japrix.jp" className="text-blue-600 hover:underline">support@japrix.jp</a>
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
