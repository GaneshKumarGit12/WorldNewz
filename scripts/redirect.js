if (window.location.hostname.includes('world-newz.vercel.app')) {
  const protocol = window.location.protocol;
  const path = window.location.pathname;
  const search = window.location.search;
  const hash = window.location.hash;
  window.location.replace('https://worldnewzs.in' + path + search + hash);
}
