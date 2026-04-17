'use strict';

async function loadOffers() {
  try {
    const url = MWW_CONFIG.API_BASE_URL + MWW_CONFIG.ENDPOINTS.OFFERS;
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error('Błąd API: ' + res.status);
    }

    const offers = await res.json();

    const container = document.querySelector('.offers-container');
    if (!container) {
      console.error('Brak .offers-container w HTML');
      return;
    }

    container.innerHTML = '';

    offers.forEach(offer => {
      container.innerHTML += `
        <div class="offer-card">
          <img src="${offer.img}" alt="">
          <h3>${offer.title}</h3>
          <p>${offer.city || ''} ${offer.district || ''}</p>
          <p class="price">${offer.price} PLN</p>
        </div>
      `;
    });

  } catch (err) {
    console.error('Błąd pobierania ofert:', err);
  }
}

loadOffers();
