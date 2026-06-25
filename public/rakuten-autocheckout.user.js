// ==UserScript==
// @name         Rakuten Auto Checkout (Japrix Admin)
// @namespace    https://japrix.online
// @version      1.0
// @description  Automatically clicks 購入手続きへ on Rakuten item pages when opened from Japrix admin
// @author       Japrix
// @match        https://item.rakuten.co.jp/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  // Only auto-click if URL has our flag
  if (!location.search.includes('_japrix_auto=1')) return;

  function clickCheckout() {
    // Try the checkout button by aria-label
    const btn = document.querySelector('button[aria-label="購入手続きへ"]');
    if (btn) {
      btn.click();
      return true;
    }

    // Fallback: find by text content
    const buttons = document.querySelectorAll('button');
    for (const b of buttons) {
      if (b.textContent && b.textContent.includes('購入手続きへ')) {
        b.click();
        return true;
      }
    }

    return false;
  }

  // Try immediately, then retry a few times as page loads
  let attempts = 0;
  const interval = setInterval(() => {
    attempts++;
    if (clickCheckout() || attempts >= 20) {
      clearInterval(interval);
    }
  }, 500);
})();
