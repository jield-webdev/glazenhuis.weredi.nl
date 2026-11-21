// Run before the body paints so a saved preference never flashes the other theme.
export const themeScript = `(function(){
 var saved;
 try { saved = localStorage.getItem('weredi-theme'); } catch (_) {}
 document.documentElement.dataset.theme = saved === 'light' || saved === 'dark'
  ? saved : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
})();`;
