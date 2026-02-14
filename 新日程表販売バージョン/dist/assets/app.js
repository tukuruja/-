(() => {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav a').forEach((link) => {
    const href = link.getAttribute('href');
    if (!href) return;
    const target = href.split('/').pop();
    if (target === path) {
      link.classList.add('active');
    }
  });

  const reference = document.getElementById('reference-text');
  if (reference) {
    fetch('reference.txt')
      .then((res) => res.text())
      .then((text) => {
        reference.textContent = text;
      })
      .catch(() => {
        reference.textContent = '参照テキストの読み込みに失敗しました。';
      });
  }
})();
