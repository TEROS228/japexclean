import { useEffect, useState } from 'react';
import Footer from '../components/Footer';

export default function ProhibitedItemsECMS() {
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
        <h1 className="text-3xl font-bold mb-3 sm:mb-4">🚫 Prohibited & Restricted Items (FedEx)</h1>
        <p className="mb-6 sm:mb-8">
          When shipping with FedEx, Japrix follows all international aviation safety rules and FedEx global restrictions. To ensure smooth and safe delivery, please check this list before requesting shipment.
        </p>

        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">❌ Completely Prohibited Items</h2>
            <p className="mb-2">The following items cannot be shipped under any circumstances via FedEx:</p>
            <ul className="list-disc ml-8 space-y-1">
              <li>Explosives, ammunition, fireworks, and gunpowder</li>
              <li>Flammable liquids and solids (paints, aerosols, fuel, matches, lighters, etc.)</li>
              <li>Compressed gases (oxygen, propane, CO2 cartridges, fire extinguishers, etc.)</li>
              <li>Oxidizing substances and organic peroxides</li>
              <li>Toxic, infectious, or radioactive materials</li>
              <li>Corrosive substances (acids, alkalis, wet batteries, mercury)</li>
              <li>Weapons, firearms, firearm parts, ammunition, or realistic replicas</li>
              <li>Illegal drugs, narcotics, marijuana, or controlled substances</li>
              <li>Live animals (except FedEx Live Animal Desk approved shipments)</li>
              <li>Human remains, organs, or body parts</li>
              <li>Pornographic, obscene, or offensive materials</li>
              <li>Counterfeit goods or trademark-infringing items</li>
              <li>Cash, currency, negotiable instruments, precious stones, and precious metals</li>
              <li>Hazardous waste and medical waste</li>
              <li>Ivory and products made from endangered species</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-2">⚠️ Restricted / Conditional Items</h2>
            <p className="mb-2">Some goods may be shipped only under certain conditions or require special handling:</p>
            <ul className="list-disc ml-8 space-y-1">
              <li><strong>Lithium batteries:</strong> Must comply with IATA/ICAO regulations. Batteries installed in equipment are generally allowed; spare batteries have strict quantity and packaging requirements</li>
              <li><strong>Alcohol:</strong> Prohibited for personal shipments in most countries; commercial shipments require proper licensing and labeling</li>
              <li><strong>Tobacco products:</strong> Subject to destination country restrictions and tax requirements</li>
              <li><strong>Perfumes and cosmetics:</strong> Limited quantities allowed; must be properly packaged and labeled if containing alcohol or flammable substances</li>
              <li><strong>Perishable food:</strong> Generally not recommended; only non-perishable, factory-sealed items in proper packaging</li>
              <li><strong>Dry ice:</strong> Allowed with proper declaration and packaging (max 2.5kg per package for express)</li>
              <li><strong>Biological substances:</strong> Require special handling and documentation; UN3373 classification needed</li>
              <li><strong>Electronics:</strong> Allowed if securely packed; items with lithium batteries must comply with dangerous goods regulations</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-2">🧾 Important Notes</h2>
            <ul className="list-disc ml-8 space-y-1">
              <li>FedEx reserves the right to inspect, refuse, return, or dispose of packages containing prohibited or undeclared items.</li>
              <li>Shipping charges are non-refundable if prohibited items are discovered during inspection or customs clearance.</li>
              <li>Destination countries may impose additional import restrictions beyond FedEx's policies. Always check local customs regulations.</li>
              <li>Misdeclared or undeclared dangerous goods may result in criminal charges, fines up to $250,000 USD, and imprisonment.</li>
              <li>Japrix and FedEx are not liable for seizure, confiscation, fines, or delays caused by prohibited or improperly declared contents.</li>
              <li>All international shipments must include accurate commercial invoices with proper commodity descriptions and values.</li>
            </ul>
          </div>

          <div className="mt-6 p-4 border-l-4 border-blue-500 bg-blue-50">
            <p>
              <strong>💡 Tip:</strong> If you're not sure whether your item can be shipped with FedEx, contact Japrix Support before purchase — we'll help you check it and suggest the safest shipping option.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
