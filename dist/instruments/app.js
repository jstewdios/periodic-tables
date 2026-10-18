import { instruments } from './catalog.js';

const previews = {
  chemistry: '<span>1<big>H</big></span><span>6<big>C</big></span><span>8<big>O</big></span>',
  hushpod: '<svg viewBox="0 0 360 140" focusable="false"><defs><linearGradient id="pod-glow"><stop stop-color="#d7be96"/><stop offset=".5" stop-color="#97beae"/><stop offset="1" stop-color="#bdabca"/></linearGradient></defs><path d="M35 70 C35 15 100 15 115 55 C127 86 128 86 140 55 C155 15 205 15 220 55 C232 86 233 86 245 55 C260 15 325 15 325 70 C325 125 260 125 245 85 C233 54 232 54 220 85 C205 125 155 125 140 85 C128 54 127 54 115 85 C100 125 35 125 35 70Z"/><path class="pod-wave" d="M48 70 Q80 30 110 70 T170 70 T230 70 T290 70 Q304 88 312 70"/></svg>',
};

const collection = document.getElementById('instruments');
for (const instrument of instruments) {
  const card = document.createElement('article');
  card.className = `instrument-card ${instrument.id}`;
  // Catalog content is authored here, never user-supplied markup.
  card.innerHTML = `<div class="instrument-preview" aria-hidden="true">${previews[instrument.id] ?? ''}</div>
    <div class="instrument-copy"><div class="card-meta"><span class="eyebrow">${instrument.category}</span><span class="instrument-status">${instrument.status}</span></div>
    <h2>${instrument.name}</h2><p class="invitation">${instrument.invitation}</p><p>${instrument.description}</p>
    <a class="primary-button" href="${instrument.href}">${instrument.action} <span aria-hidden="true">↗</span></a>
    <details class="instrument-notes"><summary>About this instrument</summary><p>${instrument.notes}</p><p>${instrument.credit}</p><a href="${instrument.source}" target="_blank" rel="noopener noreferrer">Source &amp; attribution ↗</a></details></div>`;
  collection.append(card);
}
