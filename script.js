// CONFIGURAÇÃO · Edite estes valores para usar seus canais reais.
const CTA_URL = '#contato';
const EMAIL = ''; // Exemplo: 'contato@seudominio.com.br'
const PHONE = ''; // Exemplo: '+5581999999999'
const INSTAGRAM = ''; // Exemplo: 'https://www.instagram.com/seuperfil/'
const PHOTO_SRC = ''; // Exemplo: 'assets/vinicius-ribeiro.webp'. Vazio mantém SUA FOTO.
const PHOTO_ALT = 'Retrato de Vinicius Ribeiro, consultor e palestrante de marca e vendas.';

'use strict';

document.querySelectorAll('[data-cta]').forEach((link) => {
  link.setAttribute('href', CTA_URL);
});

const contactDestinations = {
  email: EMAIL ? `mailto:${EMAIL}` : CTA_URL,
  phone: PHONE ? `tel:${PHONE.replace(/[^+\d]/g, '')}` : CTA_URL,
  instagram: INSTAGRAM || CTA_URL,
};
document.querySelectorAll('[data-contact]').forEach((link) => {
  link.setAttribute('href', contactDestinations[link.dataset.contact]);
});

// Um único template para os dois retratos.
const portraitTemplate = document.getElementById('portrait-template');
document.querySelectorAll('[data-portrait]').forEach((container) => {
  const content = portraitTemplate.content.cloneNode(true);
  if (PHOTO_SRC) {
    const image = content.querySelector('img');
    container.classList.add('has-photo');
    image.src = PHOTO_SRC;
    image.alt = PHOTO_ALT;
    content.querySelector('figcaption').remove();
  }
  container.appendChild(content);
});

// Menu mobile: Enter/Espaço nativos, Escape, fechamento ao navegar e foco contido.
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.getElementById('navegacao');
const mobileViewport = window.matchMedia('(max-width: 767px)');
function closeMenu(returnFocus = false) {
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Abrir menu de navegação');
  navigation.classList.remove('is-open');
  document.body.classList.remove('menu-open');
  if (returnFocus) menuButton.focus();
}
menuButton.addEventListener('click', () => {
  const opening = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(opening));
  menuButton.setAttribute('aria-label', opening ? 'Fechar menu de navegação' : 'Abrir menu de navegação');
  navigation.classList.toggle('is-open', opening);
  document.body.classList.toggle('menu-open', opening);
});
navigation.addEventListener('click', (event) => {
  const link = event.target.closest('a');
  if (!link || !mobileViewport.matches) return;
  closeMenu();
  const href = link.getAttribute('href');
  if (href?.startsWith('#')) {
    const target = document.getElementById(href.slice(1));
    if (target) {
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
  }
});
document.addEventListener('keydown', (event) => {
  if (menuButton.getAttribute('aria-expanded') !== 'true') return;
  if (event.key === 'Escape') {
    closeMenu(true);
    return;
  }
  if (event.key !== 'Tab' || !mobileViewport.matches) return;
  const focusables = [menuButton, ...navigation.querySelectorAll('a')];
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});
mobileViewport.addEventListener('change', () => closeMenu());

// FAQ: um painel por vez. As setas e Home/End também navegam entre perguntas.
const faqButtons = [...document.querySelectorAll('.faq-item button')];
function setFaq(button, expanded) {
  button.setAttribute('aria-expanded', String(expanded));
  document.getElementById(button.getAttribute('aria-controls')).hidden = !expanded;
}
faqButtons.forEach((button, index) => {
  button.addEventListener('click', () => {
    const opening = button.getAttribute('aria-expanded') === 'false';
    faqButtons.forEach((other) => setFaq(other, false));
    setFaq(button, opening);
    updateAngles();
  });
  button.addEventListener('keydown', (event) => {
    let next;
    if (event.key === 'ArrowDown') next = (index + 1) % faqButtons.length;
    if (event.key === 'ArrowUp') next = (index - 1 + faqButtons.length) % faqButtons.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = faqButtons.length - 1;
    if (next !== undefined) {
      event.preventDefault();
      faqButtons[next].focus();
    }
  });
});

// Os recortes usam sempre 10° a partir da vertical, qualquer que seja a altura.
const angledElements = [...document.querySelectorAll('.portrait, .cause, .result-ribbon')];
function updateAngles() {
  angledElements.forEach((element) => {
    element.style.setProperty('--clip-offset', `${(element.offsetHeight * Math.tan(10 * Math.PI / 180)).toFixed(2)}px`);
  });
}
if ('ResizeObserver' in window) {
  const resizeObserver = new ResizeObserver(updateAngles);
  angledElements.forEach((element) => resizeObserver.observe(element));
} else {
  window.addEventListener('resize', updateAngles);
}
updateAngles();
if (document.fonts) document.fonts.ready.then(updateAngles);
