import Footer from '../components/Footer';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8 lg:py-12 flex-1">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">Japrix Privacy & Cookies Policy</h1>
        <p className="text-gray-600 mb-6 sm:mb-8">
          <strong>Effective Date:</strong> October 8, 2025<br />
          <strong>Website:</strong> <a href="https://japrix.jp" className="text-blue-600 hover:underline">https://japrix.jp</a><br />
          <strong>Location:</strong> Shinjuku, Tokyo, Japan<br />
          <strong>Email:</strong> <a href="mailto:support@japrix.jp" className="text-blue-600 hover:underline">support@japrix.jp</a>
        </p>

        <div className="prose prose-sm sm:prose-base lg:prose-lg max-w-none space-y-6 sm:space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3 sm:mb-4">1. Introduction</h2>
            <p className="text-gray-700">
              Japrix ("we", "our", or "us") operates the website <a href="https://japrix.jp" className="text-blue-600 hover:underline">https://japrix.jp</a> and related services ("Services"). This Privacy & Cookies Policy explains how we collect, use, and protect your personal information. By using our Services, you agree to this Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3 sm:mb-4">2. Definitions</h2>
            <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700">
              <li><strong>Personal Data:</strong> Information identifying an individual.</li>
              <li><strong>Usage Data:</strong> Automatically collected technical data.</li>
              <li><strong>Cookies:</strong> Files stored on your device.</li>
              <li><strong>Data Controller:</strong> Japrix.</li>
              <li><strong>Data Processors / Service Providers:</strong> Third-party companies assisting in secure processing.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3 sm:mb-4">3. Information We Collect</h2>
            <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700">
              <li>Full name, email, phone number, address</li>
              <li>Account information: login, order history, balance</li>
              <li>Payment data via Stripe/PayPal (we do not store full card details)</li>
              <li>Usage data: IP, browser, visited pages</li>
              <li>Cookies & tracking for analytics and performance</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3 sm:mb-4">4. Purpose of Data Processing</h2>
            <p className="text-gray-700 mb-3">We use your data to:</p>
            <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700">
              <li>Process and deliver orders</li>
              <li>Manage accounts and verify identity</li>
              <li>Handle payments and refunds</li>
              <li>Provide customer support and service updates</li>
              <li>Improve performance and security</li>
              <li>Comply with Japanese and international laws</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3 sm:mb-4">5. GDPR Compliance (for EEA Users)</h2>
            <p className="text-gray-700 mb-3">If you are in the EEA, you have the right to:</p>
            <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700">
              <li>Access, correct, or delete your personal data</li>
              <li>Restrict or object to processing</li>
              <li>Withdraw consent</li>
              <li>Receive a portable copy of your data</li>
              <li>File a complaint with a data authority</li>
            </ul>
            <p className="text-gray-700 mt-3">
              Requests: <a href="mailto:support@japrix.jp" className="text-blue-600 hover:underline">support@japrix.jp</a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3 sm:mb-4">6. Users Under 18</h2>
            <p className="text-gray-700">
              Japrix does not knowingly collect data from minors under 18. Do not register if you are under 18.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3 sm:mb-4">7. Data Retention</h2>
            <p className="text-gray-700">
              We retain data only as long as necessary for legal obligations, service needs, and dispute resolution.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3 sm:mb-4">8. Data Security</h2>
            <p className="text-gray-700">
              Data is protected with SSL encryption, secure infrastructure, and restricted access.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3 sm:mb-4">9. Third-Party Services</h2>
            <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700">
              <li><strong>Payments:</strong> Stripe, PayPal</li>
              <li><strong>Shipping:</strong> Japan Post EMS, FedEx</li>
              <li><strong>Analytics:</strong> Google Analytics, optional remarketing tools</li>
            </ul>
            <p className="text-gray-700 mt-3">Each provider follows its own privacy policy.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3 sm:mb-4">10. Cookies</h2>
            <p className="text-gray-700">
              Used to maintain sessions, remember preferences, and analyze traffic. Disabling cookies may affect site functionality.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3 sm:mb-4">11. Contact Information</h2>
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
