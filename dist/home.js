// Only the five original chemistry fragments are legacy routes. Other fragments
// (including the skip link and homepage sections) belong to the collection.
function openLegacyChemistry() {
  if (['#table', '#workbench', '#everyday', '#trails', '#collection'].includes(location.hash)) {
    location.replace(new URL(`./chemistry/${location.search}${location.hash}`, location.href));
  }
}
openLegacyChemistry();
window.addEventListener('hashchange', openLegacyChemistry);
