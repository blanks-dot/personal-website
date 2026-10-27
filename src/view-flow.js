(() => {
  const veil = document.createElement('div');
  veil.className = 'paper-veil'; veil.setAttribute('aria-hidden', 'true'); document.body.append(veil);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  try { if (sessionStorage.getItem('notebook-flow')) { sessionStorage.removeItem('notebook-flow'); if (!reduced) document.body.classList.add('view-entering'); } } catch {}
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target || link.hasAttribute('download')) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || !['/', '/explore', '/explore.html'].includes(url.pathname) || url.pathname === location.pathname) return;
    try { sessionStorage.setItem('notebook-flow', '1'); } catch {}
    if (reduced || CSS.supports('view-transition-name', 'none')) return;
    event.preventDefault(); document.body.classList.add('view-leaving'); setTimeout(() => location.assign(url.href), 250);
  });
  addEventListener('pageshow', () => document.body.classList.remove('view-leaving'));
})();
