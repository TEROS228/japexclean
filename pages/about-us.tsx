import { useEffect, useState } from 'react';
import Footer from '../components/Footer';

export default function AboutUs() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight">
              Connecting You to Japan
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl max-w-3xl mx-auto opacity-95 leading-relaxed">
              More than just a shopping service — we're your trusted bridge to Japanese quality, innovation, and culture
            </p>
          </div>
        </div>
      </div>

      <main className="flex-1">
        {/* Mission Statement */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">Our Story</h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Founded by two brothers with a shared vision, Japrix was born from a passion for Japanese culture and a commitment to make its finest products accessible to everyone, everywhere.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-white py-12 sm:py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 hover:shadow-lg transition-shadow">
                <div className="text-4xl sm:text-5xl font-bold text-blue-600 mb-2">🇯🇵</div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Tokyo</div>
                <div className="text-sm sm:text-base text-gray-600">Based in Japan</div>
              </div>
              <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 border border-green-200 hover:shadow-lg transition-shadow">
                <div className="text-4xl sm:text-5xl font-bold text-green-600 mb-2">📦</div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Fast</div>
                <div className="text-sm sm:text-base text-gray-600">Reliable Shipping</div>
              </div>
              <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 hover:shadow-lg transition-shadow">
                <div className="text-4xl sm:text-5xl font-bold text-purple-600 mb-2">💎</div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Quality</div>
                <div className="text-sm sm:text-base text-gray-600">Premium Products</div>
              </div>
              <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-pink-50 to-pink-100 border border-pink-200 hover:shadow-lg transition-shadow">
                <div className="text-4xl sm:text-5xl font-bold text-pink-600 mb-2">🤝</div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Trust</div>
                <div className="text-sm sm:text-base text-gray-600">Customer First</div>
              </div>
            </div>
          </div>
        </div>

        {/* Founders Section */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Meet the Team</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Two brothers, complementary skills, one shared vision
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {/* Leon Card */}
            <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-8 text-white">
                <div className="text-6xl mb-4"></div>
                <h3 className="text-2xl sm:text-3xl font-bold mb-2">Leon Trofimenko</h3>
                <p className="text-blue-100 font-medium">Co-founder, CEO & Chief Programmer</p>
              </div>
              <div className="p-6 sm:p-8">
                <div className="mb-4">
                  <span className="inline-block bg-blue-100 text-blue-700 text-sm font-semibold px-3 py-1 rounded-full">
                    Age 17
                  </span>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  The technological and strategic powerhouse behind Japrix. Leon sets the company's direction as CEO and ensures our platform is fast, user-friendly, and innovative through his programming expertise.
                </p>
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <span className="mr-2">🎯</span>
                    <span>Strategy & Vision</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <span className="mr-2">⚡</span>
                    <span>Platform Development</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="mr-2">🚀</span>
                    <span>Innovation & Growth</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Erik Card */}
            <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-8 text-white">
                <div className="text-6xl mb-4"></div>
                <h3 className="text-2xl sm:text-3xl font-bold mb-2">Erik Ohtake</h3>
                <p className="text-green-100 font-medium">Co-founder, Director & Shipping Manager</p>
              </div>
              <div className="p-6 sm:p-8">
                <div className="mb-4">
                  <span className="inline-block bg-green-100 text-green-700 text-sm font-semibold px-3 py-1 rounded-full">
                    Age 20
                  </span>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  Brings ambitious vision and organizational excellence to Japrix. As Director and Shipping Manager, Erik ensures every product is carefully handled, securely packaged, and promptly delivered worldwide.
                </p>
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <span className="mr-2">📋</span>
                    <span>Operations Management</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <span className="mr-2">🌏</span>
                    <span>Global Logistics</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="mr-2">✨</span>
                    <span>Quality Assurance</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="bg-gradient-to-br from-gray-50 to-blue-50 py-12 sm:py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Our Values</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Mission-Driven</h3>
                <p className="text-gray-600">
                  Combining Japanese quality with modern technology to create an exceptional shopping experience
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow">
                <div className="text-4xl mb-4">💎</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Quality First</h3>
                <p className="text-gray-600">
                  Every product carefully selected, every package meticulously prepared for safe delivery
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow">
                <div className="text-4xl mb-4">🤝</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Customer Trust</h3>
                <p className="text-gray-600">
                  Building lasting relationships through transparency, reliability, and exceptional service
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow">
                <div className="text-4xl mb-4">🚀</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Innovation</h3>
                <p className="text-gray-600">
                  Constantly improving our platform and services to better serve you
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow">
                <div className="text-4xl mb-4">🌏</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Global Reach</h3>
                <p className="text-gray-600">
                  Connecting customers worldwide to the best of Japanese products and culture
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow">
                <div className="text-4xl mb-4">⚡</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Efficiency</h3>
                <p className="text-gray-600">
                  Streamlined processes ensuring fast, reliable delivery from Japan to your door
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl shadow-2xl overflow-hidden">
            <div className="px-6 sm:px-12 py-12 sm:py-16 text-center text-white">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Thank You for Choosing Japrix
              </h2>
              <p className="text-lg sm:text-xl mb-8 opacity-95 max-w-2xl mx-auto">
                We look forward to bringing Japan closer to you
              </p>
              <div className="text-lg font-medium">
                — Leon & Erik
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
