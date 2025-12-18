"use client";

import { useState, useEffect } from "react";

type TrackingService = 'japanpost' | 'fedex';

function JapanPostTracker() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [service, setService] = useState<TrackingService>(() => {
    // Загружаем последний выбор из localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tracking_service') as TrackingService;
      if (saved === 'japanpost' || saved === 'fedex') {
        return saved;
      }
    }
    return 'japanpost';
  });

  useEffect(() => {
    console.log('📮 JapanPostTracker mounted');
    return () => console.log('📮 JapanPostTracker unmounted');
  }, []);

  // Сохраняем выбор сервиса в localStorage
  useEffect(() => {
    localStorage.setItem('tracking_service', service);
  }, [service]);

  useEffect(() => {
    // Очищаем поле при смене сервиса
    setTrackingNumber("");
  }, [service]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingNumber.trim()) {
      if (service === 'japanpost') {
        // Открываем форму Japan Post в новом окне
        const form = document.createElement('form');
        form.method = 'GET';
        form.action = 'https://trackings.post.japanpost.jp/service/singleSearch.do';
        form.target = '_blank';

        const searchKind = document.createElement('input');
        searchKind.type = 'hidden';
        searchKind.name = 'searchKind';
        searchKind.value = 'S004';
        form.appendChild(searchKind);

        const locale = document.createElement('input');
        locale.type = 'hidden';
        locale.name = 'locale';
        locale.value = 'en';
        form.appendChild(locale);

        const reqCodeNo1 = document.createElement('input');
        reqCodeNo1.type = 'hidden';
        reqCodeNo1.name = 'reqCodeNo1';
        reqCodeNo1.value = trackingNumber;
        form.appendChild(reqCodeNo1);

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
      } else {
        // Открываем FedEx tracking
        window.open(`https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`, '_blank');
      }
    }
  };

  return (
    <div className={`rounded-2xl p-6 border-2 shadow-lg transition-all ${
      service === 'japanpost'
        ? 'bg-gradient-to-br from-red-50 to-orange-50 border-red-200'
        : 'bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200'
    }`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md ${
          service === 'japanpost'
            ? 'bg-gradient-to-br from-red-500 to-red-600'
            : 'bg-gradient-to-br from-purple-500 to-purple-600'
        }`}>
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            {service === 'japanpost' ? '📮 Japan Post Tracking' : '📦 FedEx Tracking'}
          </h3>
          <p className="text-sm text-gray-600">
            {service === 'japanpost' ? 'Track your EMS/ECMS package' : 'Track your FedEx package'}
          </p>
        </div>
      </div>

      {/* Service Selection Buttons */}
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setService('japanpost')}
          className={`flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
            service === 'japanpost'
              ? 'bg-red-600 text-white shadow-md'
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Japan Post
        </button>
        <button
          type="button"
          onClick={() => setService('fedex')}
          className={`flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
            service === 'fedex'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          FedEx
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {service === 'japanpost' ? '13-digit Tracking Number' : 'Tracking Number'}
          </label>
          <div className="relative">
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(service === 'japanpost' ? e.target.value.toUpperCase() : e.target.value)}
              placeholder={service === 'japanpost' ? 'e.g., EJ123456789JP' : 'e.g., 123456789012'}
              maxLength={service === 'japanpost' ? 13 : undefined}
              className={`w-full px-4 py-3 pl-12 border-2 border-gray-300 rounded-xl transition-all font-mono text-lg tracking-wider ${
                service === 'japanpost'
                  ? 'focus:border-red-500 focus:ring-4 focus:ring-red-500/20'
                  : 'focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20'
              }`}
              required
            />
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Enter the tracking number from your package receipt
          </p>
        </div>

        <button
          type="submit"
          className={`group w-full px-6 py-3.5 text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center gap-2 ${
            service === 'japanpost'
              ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
              : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800'
          }`}
        >
          <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Track Package on {service === 'japanpost' ? 'Japan Post' : 'FedEx'}
          <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </button>
      </form>

      <div className={`mt-4 p-3 bg-white/60 rounded-lg border ${
        service === 'japanpost' ? 'border-red-200' : 'border-purple-200'
      }`}>
        <p className="text-xs text-gray-600 flex items-start gap-2">
          <svg className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
            service === 'japanpost' ? 'text-red-600' : 'text-purple-600'
          }`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>
            This will open {service === 'japanpost' ? 'Japan Post' : 'FedEx'} official tracking website in a new window. Make sure your tracking number is correct.
          </span>
        </p>
      </div>
    </div>
  );
}

export default JapanPostTracker;
