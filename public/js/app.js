// Comportamientos sin JavaScript inline para mantener una CSP estricta.
document.addEventListener('change', (event) => {
  const element = event.target.closest('[data-autosubmit]');
  if (element && element.form) {
    element.form.submit();
  }
});

document.addEventListener('submit', (event) => {
  const form = event.target;
  const message = form.dataset ? form.dataset.confirm : null;

  if (message && !window.confirm(message)) {
    event.preventDefault();
  }
});
