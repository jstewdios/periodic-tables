// Authoring helper only: generated HTML is checked in and served as-is. Visitors
// need no JavaScript to browse the collections. There is no deployment build step.
import { readFileSync, writeFileSync } from 'node:fs';
import { instruments } from '../dist/instruments/catalog.js';
import { entries } from '../dist/journal/catalog.js';
import { elements } from '../dist/elements.js';
import { families } from '../dist/chemistry.js';

const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const external = 'target="_blank" rel="noopener noreferrer"';
const arrow = '<span aria-hidden="true">↗</span>';
const source = 'https://github.com/jstewdios/periodic-tables';
// Catalog links are relative to /instruments/; emitted links are relative to /.
function homepageHref(href) {
  const url = new URL(href, 'https://collection.invalid/instruments/');
  return url.pathname.slice(1) + url.search + url.hash;
}
const svg = content => `<svg viewBox="0 0 360 220" fill="none" focusable="false">${content}</svg>`;

const previews = {
  chemistry: svg(`<g transform="translate(28 30)">${elements.map(e => `<rect x="${(e.column - 1) * 17}" y="${(e.row - 1) * 16}" width="13" height="12" rx="2" fill="${families[e.category].color}" fill-opacity=".32"/>`).join('')}</g><g class="element-cards"><g transform="translate(74 108) rotate(-8)"><rect width="66" height="79" rx="7"/><text x="9" y="18" class="atomic">1</text><text x="13" y="58">H</text></g><g transform="translate(147 98)"><rect width="66" height="79" rx="7"/><text x="9" y="18" class="atomic">6</text><text x="13" y="58">C</text></g><g transform="translate(221 108) rotate(8)"><rect width="66" height="79" rx="7"/><text x="9" y="18" class="atomic">8</text><text x="13" y="58">O</text></g></g>`),
  hushpod: svg('<defs><linearGradient id="pod"><stop stop-color="#e3c8a2"/><stop offset=".5" stop-color="#a2d7bd"/><stop offset="1" stop-color="#c1b1dd"/></linearGradient></defs><g stroke="url(#pod)"><path fill="#b9c7b60b" d="M28 110C28 50 91 40 113 86C125 112 127 112 139 86C157 44 203 44 221 86C233 112 235 112 247 86C269 40 332 50 332 110C332 170 269 180 247 134C235 108 233 108 221 134C203 176 157 176 139 134C127 108 125 108 113 134C91 180 28 170 28 110Z"/><path opacity=".18" d="M39 110C39 60 89 54 105 91C124 135 129 135 147 92C160 61 201 61 213 92C231 135 236 135 255 91C271 54 321 60 321 110"/><path opacity=".6" d="M42 110Q68 63 98 110T158 110T218 110T278 110Q303 74 318 110"/></g><g fill="#d6dfcf"><circle cx="74" cy="110" r="3"/><circle cx="180" cy="110" r="3"/><circle cx="286" cy="110" r="3"/></g>'),
  'odd-sympathy': svg('<g stroke="#d0d9cd" opacity=".1"><circle cx="131" cy="114" r="90"/><circle cx="131" cy="114" r="69"/><circle cx="239" cy="109" r="66"/><circle cx="239" cy="109" r="86"/></g><path stroke="#d8bb76" stroke-dasharray="3 6" opacity=".4" d="M131 114L239 109"/><circle stroke="#dfc88e" stroke-width="1.5" cx="131" cy="114" r="48"/><circle stroke="#91c9bd" stroke-width="1.5" cx="239" cy="109" r="32"/><circle fill="#f6e6bd" cx="131" cy="66" r="5"/><circle fill="#bcdfd5" cx="266.7" cy="125" r="4"/><g stroke="#a2a99e" opacity=".6"><path d="M127 114h8m-4-4v8M235 109h8m-4-4v8"/></g>'),
};
const storyPreviews = {
  hushpod: svg('<g stroke="#526d68" opacity=".6"><circle cx="85" cy="93" r="41"/><circle cx="275" cy="93" r="41"/><path d="M126 93H234" stroke-dasharray="3 6"/></g><path stroke="#c9e8cf" stroke-width="2" d="M85 93h32m-8-6 8 6-8 6"/><path stroke="#c1b1dd" stroke-width="2" d="M275 93h-32m8-6-8 6 8 6"/><g fill="#a6bab3" text-anchor="middle"><text x="85" y="157" class="diagram-label">STILL MOVING</text><text x="275" y="157" class="diagram-label">STILL MOVING</text><text x="180" y="100" font-size="24">+</text></g><path stroke="#cde0cf" stroke-width="1.5" d="M145 184h70"/><text x="180" y="211" text-anchor="middle" fill="#b8d1c5" class="diagram-label">A QUIET SUM</text>'),
  ring: svg(`<g transform="translate(180 99)"><circle r="64" stroke="#7c6b55" stroke-dasharray="2 5" opacity=".5"/><path d="M-16-76A78 78 0 1 0 16-76" stroke="#d6bd8f" stroke-width="1.5"/>${Array.from({length:12}, (_, i) => {const a=(i*30-75)*Math.PI/180;return `<circle cx="${(64*Math.cos(a)).toFixed(2)}" cy="${(64*Math.sin(a)).toFixed(2)}" r="${i===0?4.5:3}" fill="${i===0?'#e5a38c':'#d9cbae'}"/>`;}).join('')}<path d="M-16-76h32" stroke="#e5a38c" stroke-dasharray="2 4"/><text y="7" text-anchor="middle" fill="#e1d4b7" font-size="20">23.46 ¢</text></g><text x="180" y="211" text-anchor="middle" fill="#c6b99f" class="diagram-label">12 FIFTHS ≠ 7 OCTAVES</text>`),
};

function header(base, journal) {
  return `<a class="skip-link" href="#main">Skip to ${journal ? 'the Journal' : 'the instruments'}</a>
  <header class="site-header">
    <a href="${base}" class="brand" aria-label="Periodic Tables home"><span class="brand-mark" aria-hidden="true"><small>78</small>Pt</span><span>periodic<span class="brand-light"> tables</span></span></a>
    <nav aria-label="Collection"><a href="${base}"${journal ? '' : ' aria-current="page"'}>Instruments</a><a href="${base}journal/"${journal ? ' aria-current="page"' : ''}>Journal</a></nav>
    <a class="header-source" href="${source}" ${external}>Source ${arrow}</a>
  </header>`;
}
function footer(base) {
  return `<footer class="site-footer"><span>Periodic Tables <span class="footer-dot" aria-hidden="true">·</span> Sound is always your choice.</span><div><a href="${base}LICENSE.txt">MIT license</a><a href="${source}/blob/main/CONTRIBUTING.md" ${external}>Contribute ${arrow}</a></div></footer>`;
}
function instrumentCard(item) {
  const entry=entries.find(e=>e.id===item.id);
  return `<article class="instrument-card ${item.id}">
    <a class="instrument-preview" href="${homepageHref(item.href)}" tabindex="-1" aria-hidden="true">${previews[item.id]}</a>
    <div class="instrument-copy"><p class="eyebrow">${escape(item.category)}</p><h2>${escape(item.name)}</h2><p class="instrument-description">${escape(item.description)}</p>
    <a class="play-link" href="${homepageHref(item.href)}">${escape(item.action)} ${arrow}</a>
    ${entry ? `<a class="related-note" href="journal/${entry.id}/">Field Note ${entry.number} <span>${entry.id==='hushpod'?'The sound that was still there':'Read &amp; play'} ${arrow}</span></a>` : (item.id==='chemistry'?'<p class="instrument-extra">Table · workbench · trails · collection</p>':`<a class="related-note" href="${source}/blob/main/docs/ODD_SYMPATHY.md" ${external}>From the collaborative study <span>Odd Sympathy’s study record ${arrow}</span></a>`)}
    <details class="instrument-notes"><summary>About &amp; source</summary><p class="status">${escape(item.status)}</p><p>${escape(item.notes)}</p><p>${escape(item.credit)}</p><a href="${item.source}" ${external}>Source &amp; attribution ${arrow}</a></details></div>
  </article>`;
}
function storyCard(entry, journal) {
  const base=journal?'':'journal/';
  return `<article class="story-card story-${entry.id}">
    <a href="${base}${entry.id}/" class="story-preview" tabindex="-1" aria-hidden="true">${storyPreviews[entry.id]}</a>
    <div class="story-copy"><p class="eyebrow">Field Note ${entry.number} <span>· ${escape(entry.topics)}</span></p>
    <h${journal?2:3}>${escape(entry.title)}</h${journal?2:3}>
    <p class="story-question">${escape(entry.question)}</p><p class="story-description">${escape(entry.description)}</p>
    <a class="read-link" href="${base}${entry.id}/">Read &amp; play <span class="sr-only">${escape(entry.title)}</span>${arrow}</a>
    ${journal?`<div class="story-connections"><a href="${entry.relatedHref}">${escape(entry.relation)} ${arrow}</a><a href="${entry.source}" ${external}>${escape(entry.study)} ${arrow}</a></div>`:''}</div>
  </article>`;
}
function document(journal) {
  const base=journal?'../':'./';
  const description=journal?'Playable research stories about cancellation, tuning, and the questions that changed the instruments.':'Explore 118 elements, catch a vibration with Hushpod, or draw clocks that find each other in Odd Sympathy. Play the instruments and investigate their discoveries in the Journal.';
  return `<!doctype html>
<!-- Generated by scripts/render-collections.mjs. Edit the catalogs, template, or collection.css. -->
<html lang="en"><head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="theme-color" content="#10141d"><meta name="description" content="${description}">
  <meta property="og:title" content="${journal?'Journal':'Instruments'} — Periodic Tables"><meta property="og:description" content="${description}">
  <title>${journal?'Journal':'Instruments'} — Periodic Tables</title>
  <link rel="icon" href="${base}icon.svg" type="image/svg+xml"><link rel="stylesheet" href="${base}styles.css"><link rel="stylesheet" href="${base}instruments/collection.css">
  ${journal?'':'<script src="./home.js"></script>'}
</head><body class="collection-page${journal?' journal-page':''}">
  ${header(base,journal)}
  <main id="main" tabindex="-1">
    <div class="collection-intro"><div><p class="eyebrow">${journal?'Playable research stories':'Playable scientific &amp; musical instruments'}</p><h1>${journal?'Journal':'Instruments'}</h1><p>${journal?'A question, an experiment, and the discovery that followed.':'Build a compound. Catch a vibration.<br>Let two clocks find each other.'}</p></div></div>
    ${journal?`<section class="journal-stories" aria-label="Field Notes">${entries.map(e=>storyCard(e,true)).join('\n')}</section><aside class="collection-context"><div><p class="eyebrow">The studies behind the stories</p><h2>A record you can follow.</h2><p>Original proposals, cross-reviews, revisions, and evidence live in the collaborative study archive. Each story keeps its own credits and scientific limits.</p></div><a class="read-link" href="https://github.com/jstewdios/collaborative-instruments" ${external}>Visit the study archive ${arrow}</a></aside>`:`<section id="instruments" class="instruments" aria-label="Playable instruments">${instruments.map(instrumentCard).join('\n')}</section><section class="home-journal" aria-labelledby="journal-title"><div class="section-title"><div><p class="eyebrow">Playable research stories</p><h2 id="journal-title">Journal</h2><p>Two investigations in sound and musical tension.</p></div><a class="read-link" href="journal/">All Field Notes ${arrow}</a></div><div class="home-stories">${entries.map(e=>storyCard(e,false)).join('\n')}</div></section>`}
  </main>
  ${footer(base)}
</body></html>
`;
}
const documents = new Map([['dist/index.html',document(false)],['dist/journal/index.html',document(true)]]);
for (const [path,html] of documents) {
  if(process.argv.includes('--check')) {
    if(readFileSync(new URL('../'+path,import.meta.url),'utf8')!==html)throw Error(`${path} is out of date; run npm run render:collections`);
  } else writeFileSync(new URL('../'+path,import.meta.url),html);
}
console.log(process.argv.includes('--check')?'Collection HTML is current.':'Rendered homepage and Journal.');
