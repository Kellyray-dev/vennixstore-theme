(function() {
  var btn = document.getElementById('vennixBackToTop');
  if (!btn) return;

  window.addEventListener('scroll', function() {
    btn.classList.toggle('is-visible', window.scrollY > 600);
  }, { passive: true });

  btn.addEventListener('click', function() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      btn.classList.toggle('is-visible', window.scrollY > 600);
    });
  } else {
    btn.classList.toggle('is-visible', window.scrollY > 600);
  }
})();
