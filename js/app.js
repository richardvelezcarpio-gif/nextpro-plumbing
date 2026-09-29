(() => {
  'use strict';
  const language = document.documentElement.lang;
  const routes = JSON.parse(document.getElementById('language-routes').textContent);
  const requested = new URLSearchParams(location.search).get('lang');
  let saved;
  try { saved = localStorage.getItem('nextpro-language'); } catch (_) { /* Private browsing can disable storage. */ }
  const preferred = ['en', 'es'].includes(requested) ? requested : language === 'es' ? 'es' : saved || 'en';
  if (preferred !== language && routes[preferred]) {
    location.replace(routes[preferred] + '?lang=' + preferred + location.hash);
    return;
  }
  try { localStorage.setItem('nextpro-language', language); } catch (_) { /* Navigation still carries the language. */ }
  document.querySelectorAll('[data-language]').forEach(link => {
    link.href += location.hash;
    link.addEventListener('click', () => {
      try { localStorage.setItem('nextpro-language', link.dataset.language); } catch (_) {}
      const form = document.querySelector('#estimate-form, #maintenance-form');
      if (form) {
        const fields = Object.fromEntries(new FormData(form));
        if (form.elements.service) fields.serviceIndex = form.elements.service.selectedIndex;
        try { sessionStorage.setItem('nextpro-' + form.id, JSON.stringify(fields)); } catch (_) {}
      }
    });
  });
  // Keep the floating shortcut from covering footer text and legal links.
  const floatingContact = document.querySelector('.floating-wa');
  const footer = document.querySelector('.footer');
  if (floatingContact && footer && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      floatingContact.classList.toggle('is-footer-visible', entry.isIntersecting);
    }).observe(footer);
  }
  const button = document.querySelector('.hamburger');
  const menu = document.getElementById('primary-nav');
  const setMenu = open => {
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? button.dataset.close : button.dataset.open);
    menu.classList.toggle('open', open);
    document.body.classList.toggle('menu-open', open);
  };
  button.addEventListener('click', () => setMenu(button.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') { setMenu(false); button.focus(); }
  });
  document.addEventListener('click', event => { if (!event.target.closest('.nav')) setMenu(false); });
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
  matchMedia('(min-width:1201px)').addEventListener('change', event => { if (event.matches) setMenu(false); });
  const form = document.querySelector('#estimate-form, #maintenance-form');
  if (!form) return;
  const isMaintenance = form.id === 'maintenance-form';
  try {
    const draft = JSON.parse(sessionStorage.getItem('nextpro-' + form.id) || 'null');
    if (draft) {
      Object.entries(draft).forEach(([key, value]) => {
        if (key !== 'serviceIndex' && form.elements[key]) form.elements[key].value = value;
      });
      if (form.elements.service) form.elements.service.selectedIndex = draft.serviceIndex || 0;
      sessionStorage.removeItem('nextpro-' + form.id);
    }
  } catch (_) {}
  const validation = language === 'es' ? 'Complete este campo.' : 'Please complete this field.';
  const invalidPhone = language === 'es' ? 'Ingrese un teléfono válido (7 a 25 caracteres).' : 'Enter a valid phone number (7–25 characters).';
  form.querySelectorAll('input, select, textarea').forEach(field => {
    const validate = () => {
      field.setCustomValidity('');
      if (field.required && !field.value.trim()) field.setCustomValidity(validation);
      else if (field.name === 'phone' && (!/^[+0-9() .-]{7,25}$/.test(field.value) || field.value.replace(/\D/g, '').length < 7)) field.setCustomValidity(invalidPhone);
      else if (field.type === 'email' && field.validity.typeMismatch) field.setCustomValidity(language === 'es' ? 'Ingrese un correo electrónico válido.' : 'Enter a valid email address.');
      else if (field.type === 'number' && !field.validity.valid) field.setCustomValidity(language === 'es' ? 'Ingrese un número entero entre 1 y 100000, o deje este campo vacío.' : 'Enter a whole number from 1 to 100000, or leave this field empty.');
    };
    field.addEventListener('input', validate);
    field.addEventListener('change', validate);
    field.addEventListener('invalid', validate);
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const intro = isMaintenance
      ? (language === 'es' ? 'Hola NextPro Plumbing & Maintenance. Quisiera solicitar una evaluación y un plan de mantenimiento para mi edificio.' : 'Hello NextPro Plumbing & Maintenance. I would like to request a building maintenance assessment and plan.')
      : (language === 'es' ? 'Hola NextPro Plumbing & Maintenance. Quisiera solicitar una cotización.' : 'Hello NextPro Plumbing & Maintenance. I would like to request an estimate.');
    const rows = [...form.querySelectorAll('input, select, textarea')].filter(field => field.value.trim()).map(field => {
      const label = field.labels[0].textContent.replace(/\s*\*$/, '').trim();
      const value = field.tagName === 'SELECT' ? field.selectedOptions[0].textContent : field.value.trim();
      return label + ': ' + value;
    });
    const message = intro + '\n\n' + rows.join('\n');
    const url = 'https://wa.me/12393337935?text=' + encodeURIComponent(message);
    const status = form.querySelector('.form-status');
    status.textContent = language === 'es' ? 'Mensaje preparado. Revíselo y envíelo en WhatsApp. ' : 'Message prepared. Review and send it in WhatsApp. ';
    const fallback = document.createElement('a');
    fallback.href = url; fallback.target = '_blank'; fallback.rel = 'noopener noreferrer'; fallback.className = 'text-link';
    fallback.textContent = language === 'es' ? 'Abrir WhatsApp' : 'Open WhatsApp';
    status.append(fallback);
    window.open(url, '_blank', 'noopener,noreferrer');
  });
})();
