import Head from "next/head";
import ShippingCalculator from "@/components/ShippingCalculator";
import Footer from "@/components/Footer";
import { Ship, Info, Plane, Package, AlertCircle } from "lucide-react";

export default function ShippingCalculatorPage() {
  return (
    <>
      <Head>
        <title>International Shipping Calculator - Japrix</title>
        <meta name="description" content="Calculate EMS and FedEx shipping costs from Japan to worldwide destinations" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl mb-3 sm:mb-4">
              <Ship className="text-white" size={32} />
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              International Shipping Calculator
            </h1>
            <p className="text-lg text-gray-600">
              Calculate EMS and FedEx shipping costs from Japan
            </p>
          </div>

          {/* Info Card */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 mb-6 sm:mb-8">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <Info className="text-blue-600" size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-blue-900 mb-3">About Our Shipping Services</h3>

                <div className="mb-3 sm:mb-4">
                  <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <Package size={16} className="text-blue-700" />
                    Japan Post EMS
                  </h4>
                  <ul className="text-sm text-blue-800 space-y-1 ml-6">
                    <li>• Fast and reliable international shipping</li>
                    <li>• Delivery time: 2-5 days to most countries</li>
                    <li>• Full tracking and up to 2 million yen insurance</li>
                    <li>• Weight limit: Up to 25kg per package</li>
                    <li className="flex items-center gap-1">
                      <AlertCircle size={12} className="text-amber-600" />
                      Currently suspended to USA
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                    <Plane size={16} className="text-green-700" />
                    FedEx International Priority
                  </h4>
                  <ul className="text-sm text-green-800 space-y-1 ml-6">
                    <li>• Premium express courier service</li>
                    <li>• Available worldwide including USA</li>
                    <li>• Delivery time: 2-4 business days</li>
                    <li>• Full tracking and customs clearance included</li>
                    <li>• Weight limit: Up to 68kg per package</li>
                    <li>• Volumetric weight calculation: Length × Width × Height ÷ 5000</li>
                  </ul>
                </div>

                <div className="flex items-start gap-2 text-xs text-blue-700 mt-3 bg-blue-100 px-3 py-2 rounded-lg">
                  <Info size={14} className="flex-shrink-0 mt-0.5" />
                  <p className="font-semibold">
                    Tip: Enter weight in grams for accuracy (e.g., 500g, 1200g, 2500g)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Calculator */}
          <ShippingCalculator />

          {/* Additional Info */}
          <div className="mt-8 bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-3 sm:mb-4">Destination Information</h3>

            {/* EMS Zones */}
            <div className="mb-6">
              <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <Package size={18} className="text-blue-700" />
                Japan Post EMS Zones
              </h4>
              <div className="space-y-3 text-sm ml-6">
                <div>
                  <h5 className="font-semibold text-gray-900 mb-1">Zone 1</h5>
                  <p className="text-gray-600">China, South Korea, Taiwan</p>
                </div>
                <div>
                  <h5 className="font-semibold text-gray-900 mb-1">Zone 2</h5>
                  <p className="text-gray-600">Asia (excluding Zone 1) - Hong Kong, Macau, Singapore, Thailand, Philippines, Vietnam, Malaysia, India, etc.</p>
                </div>
                <div>
                  <h5 className="font-semibold text-gray-900 mb-1">Zone 3</h5>
                  <p className="text-gray-600">Oceania, Canada, Mexico, Middle East, Europe - Australia, New Zealand, Canada, Mexico, UK, Germany, France, Italy, Spain, etc.</p>
                </div>
                <div>
                  <h5 className="font-semibold text-gray-900 mb-1">Zone 5</h5>
                  <p className="text-gray-600">Central/South America (excluding Mexico), Africa - Brazil, Argentina, South Africa, etc.</p>
                </div>
              </div>
            </div>

            {/* FedEx Destinations */}
            <div className="mb-6">
              <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                <Plane size={18} className="text-green-700" />
                FedEx International Priority Destinations
              </h4>
              <div className="text-sm ml-6 space-y-1">
                <p className="text-gray-600">• Available to 220+ countries and territories worldwide</p>
                <p className="text-gray-600">• Including United States, Canada, Europe, Asia, Australia, and more</p>
                <p className="text-gray-600">• Recommended for USA destinations where EMS is suspended</p>
              </div>
            </div>

            {/* USA Info */}
            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <Info className="text-amber-700 flex-shrink-0 mt-0.5" size={18} />
                <div>
                  <h4 className="font-bold text-amber-900 mb-2">Shipping to USA</h4>
                  <p className="text-sm text-amber-800">
                    Japan Post EMS to USA is currently suspended. Please use <strong>FedEx International Priority</strong> for USA destinations.
                    FedEx offers reliable express shipping with full tracking and customs clearance.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Important Notes */}
          <div className="mt-6 bg-amber-50 border-2 border-amber-200 rounded-2xl p-6">
            <div className="flex items-start gap-3 mb-3">
              <AlertCircle className="text-amber-700 flex-shrink-0" size={20} />
              <h3 className="font-bold text-amber-900">Important Notes</h3>
            </div>
            <ul className="text-sm text-amber-800 space-y-2 ml-8">
              <li>• Rates are subject to change. Please verify current pricing with the carrier.</li>
              <li>• <strong>EMS</strong> volumetric weight: Length × Width × Height ÷ 6000</li>
              <li>• <strong>FedEx</strong> volumetric weight: Length × Width × Height ÷ 5000</li>
              <li>• You will be charged for whichever is greater: actual weight or volumetric weight</li>
              <li>• Additional fees may apply for certain destinations or special services</li>
              <li>• Some items may be prohibited or restricted for international shipping</li>
              <li>• FedEx includes customs clearance but additional duties/taxes may apply</li>
            </ul>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
