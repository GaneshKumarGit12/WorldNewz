window.addEventListener('load', () => {
  const loadThirdParty = () => {
    // 2. Hotjar Tracking Code
    (function(h,o,t,j,a,r){
        h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
        h._hjSettings={hjid:5401292,hjsv:6};
        a=o.getElementsByTagName('head')[0];
        r=o.createElement('script');r.async=1;
        r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
        a.appendChild(r);
    })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');


  };

  // Load third-party scripts strictly during browser idle to maximize FID/INP score
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => setTimeout(loadThirdParty, 2000));
  } else {
    setTimeout(loadThirdParty, 4000);
  }
});
