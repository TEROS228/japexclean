import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 sm:gap-8">
          {/* Company Info */}
          <div className="col-span-2 sm:col-span-3 md:col-span-1">
            <h3 className="text-white font-bold text-base sm:text-lg mb-3 sm:mb-4">Japrix</h3>
            <p className="text-xs sm:text-sm mb-2 sm:mb-3">Your trusted Japanese shopping proxy service</p>
            <p className="text-xs sm:text-sm">
              📍 Shinjuku, Tokyo, Japan<br />
              📧 support@japrix.jp
            </p>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold text-sm sm:text-base mb-3 sm:mb-4">Legal</h4>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
              <li>
                <Link href="/privacy-policy" className="hover:text-white transition-colors">
                  Privacy & Cookies Policy
                </Link>
              </li>
              <li>
                <Link href="/return-refund-policy" className="hover:text-white transition-colors">
                  Return & Refund Policy
                </Link>
              </li>
              <li>
                <Link href="/terms-of-service" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/shipping-insurance-policy" className="hover:text-white transition-colors">
                  Shipping and Insurance Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-white font-semibold text-sm sm:text-base mb-3 sm:mb-4">Services</h4>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
              <li>Shopping Service</li>
              <li>Auction Bidding</li>
              <li>EMS Shipping</li>
              <li>Package Storage</li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-semibold text-sm sm:text-base mb-3 sm:mb-4">Support</h4>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
              <li>
                <Link href="/about-us" className="hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <a href="mailto:support@japrix.jp" className="hover:text-white transition-colors">
                  Contact Us
                </a>
              </li>
              <li>FAQ</li>
              <li>How It Works</li>
            </ul>
          </div>

          {/* Info */}
          <div className="col-span-2 sm:col-span-1">
            <h4 className="text-white font-semibold text-sm sm:text-base mb-3 sm:mb-4">Info</h4>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
              <li>
                <Link href="/why-trust-japrix" className="hover:text-white transition-colors">
                  🤝 Why Trust Japrix?
                </Link>
              </li>
              <li>
                <Link href="/what-do-i-pay-for" className="hover:text-white transition-colors">
                  🧾 What Do I Pay For?
                </Link>
              </li>
              <li>
                <Link href="/shipping-calculator" className="hover:text-white transition-colors">
                  🧮 Shipping Calculator
                </Link>
              </li>
              <li>
                <Link href="/package-options" className="hover:text-white transition-colors">
                  📦 Package Options
                </Link>
              </li>
              <li>
                <Link href="/how-to-order" className="hover:text-white transition-colors">
                  🛍️ How to Order
                </Link>
              </li>
              <li>
                <Link href="/prohibited-items" className="hover:text-white transition-colors">
                  🚫 Prohibited Items (EMS)
                </Link>
              </li>
              <li>
                <Link href="/prohibited-items-ecms" className="hover:text-white transition-colors">
                  🚫 Prohibited Items (FedEx)
                </Link>
              </li>
              <li>
                <Link href="/customs-help" className="hover:text-white transition-colors">
                  📋 Parcel Stopped at Customs?
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-6 sm:mt-8 pt-6 sm:pt-8 text-xs sm:text-sm text-center">
          <p>&copy; {new Date().getFullYear()} Japrix. All rights reserved.</p>
          <p className="mt-2 text-[10px] sm:text-xs">
            Japrix operates from Shinjuku, Tokyo, Japan. All disputes subject to Tokyo jurisdiction.
          </p>
        </div>
      </div>
    </footer>
  );
}
