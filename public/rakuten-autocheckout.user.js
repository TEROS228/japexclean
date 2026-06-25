// ==UserScript==
// @name         Rakuten Auto Checkout (Japrix Admin)
// @namespace    https://japrix.online
// @version      2.2
// @description  Selects variants then clicks 購入手続きへ on Rakuten item pages
// @author       Japrix
// @match        https://item.rakuten.co.jp/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  if (!location.search.includes('_japrix_auto=1')) return;

  let targetOptions = {};
  try {
    const params = new URLSearchParams(location.search);
    const optsRaw = params.get('_japrix_opts');
    if (optsRaw) targetOptions = JSON.parse(optsRaw);
  } catch (e) {}

  const optionValues = Object.values(targetOptions);
  const hasOptions = optionValues.length > 0;

  function selectVariants() {
    let selectedCount = 0;
    for (const value of optionValues) {
      // Find button whose text exactly matches or starts with the value
      const buttons = document.querySelectorAll('button');
      for (const btn of buttons) {
        const text = btn.textContent?.trim() || '';
        // Match exact or "23 cm\n3,500円" style
        if (text === value || text.startsWith(value)) {
          // Skip already selected (has blue border / selected class)
          const style = window.getComputedStyle(btn);
          const isSelected = btn.classList.toString().includes('select') ||
            style.borderColor.includes('rgb(0, 100') ||
            style.outline !== 'none';
          btn.click();
          selectedCount++;
          break;
        }
      }
    }
    return selectedCount;
  }

  function clickCheckout() {
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
      if (btn.textContent?.includes('購入手続きへ')) {
        btn.click();
        return true;
      }
    }
    return false;
  }

  let attempts = 0;
  let variantsDone = !hasOptions;

  const interval = setInterval(() => {
    attempts++;

    if (!variantsDone) {
      const selected = selectVariants();
      // Give time for UI to update after each click before proceeding
      if (selected >= optionValues.length) {
        variantsDone = true;
      }
      return; // wait next tick before clicking checkout
    }

    if (clickCheckout()) {
      clearInterval(interval);
      return;
    }

    if (attempts >= 60) clearInterval(interval);
  }, 500);
})();
