// CONFIGURAÇÃO · Edite estes valores para usar seus canais reais.
const CTA_URL = '#contato';
const EMAIL = ''; // Exemplo: 'contato@seudominio.com.br'
const PHONE = ''; // Exemplo: '+5581999999999'
const INSTAGRAM = ''; // Exemplo: 'https://www.instagram.com/seuperfil/'
const PHOTO_SRC = ''; // Exemplo: 'assets/vinicius-ribeiro.webp'. Vazio mantém SUA FOTO.
const PHOTO_ALT = 'Retrato de Vinicius Ribeiro, consultor de marca e vendas.';

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
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function setFaq(button, expanded) {
  const panel = document.getElementById(button.getAttribute('aria-controls'));
  const wasOpen = button.getAttribute('aria-expanded') === 'true';
  button.setAttribute('aria-expanded', String(expanded));
  clearTimeout(panel.faqTimer);
  // Sem animação (movimento reduzido) ou sem mudança de estado: só mostra ou esconde.
  if (reduceMotion || wasOpen === expanded) {
    panel.hidden = !expanded;
    panel.style.height = '';
    return;
  }
  // Abre e fecha com a altura deslizando.
  if (expanded) {
    panel.hidden = false;
    const full = panel.scrollHeight;
    panel.style.height = '0px';
    panel.offsetHeight; // força o navegador a registrar a altura inicial
    panel.style.height = `${full}px`;
    panel.faqTimer = setTimeout(() => { panel.style.height = ''; }, 360);
  } else {
    panel.style.height = `${panel.scrollHeight}px`;
    panel.offsetHeight;
    panel.style.height = '0px';
    panel.faqTimer = setTimeout(() => { panel.hidden = true; panel.style.height = ''; }, 360);
  }
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

// ANIMAÇÕES AO ROLAR · Só transform e opacity. Sem JavaScript, ou com "reduzir movimento" no sistema,
// a página aparece inteira e parada (a classe "anim" nem chega a ser ligada).
if (document.documentElement.classList.contains('anim')) {
  // [seletor, atraso inicial em ms, passo entre irmãos em ms]
  const revealGroups = [
    ['.hero-eyebrow', 0, 0], ['.hero h1', 120, 0], ['.hero-description', 380, 0], ['.hero .button', 520, 0], ['.hero-visual', 260, 0],
    ['.before-after .eyebrow', 0, 0], ['.before-after h2', 80, 0], ['.comparison-card', 120, 140], ['.comparison-manifesto', 80, 0],
    ['.symptoms .eyebrow', 0, 0], ['.symptom-card', 100, 130],
    ['.cause-grid > div:first-child', 0, 0], ['.cause-card', 120, 140],
    ['.pillars .eyebrow', 0, 0], ['.pillars h2', 80, 0], ['.pillar-card', 120, 130],
    ['.method .eyebrow', 0, 0], ['.method h2', 80, 0], ['.method-steps li', 120, 160], ['.result-ribbon', 100, 0],
    ['.about-copy', 0, 0], ['.portrait-about', 120, 0], ['.proof-card', 160, 130],
    ['.audience-copy', 0, 0], ['.audience-details', 140, 0],
    ['.faq .eyebrow', 0, 0], ['.faq h2', 80, 0], ['.faq-item', 100, 70],
    ['.final-cta h2', 0, 0], ['.final-cta .button', 160, 0], ['.final-cta p', 260, 0],
    ['.footer-main', 0, 0], ['.footer-bottom', 100, 0],
  ];
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const element = entry.target;
      revealObserver.unobserve(element);
      element.classList.add('is-in');
      // Depois da entrada, a transição volta a ser rápida (hover), sem o atraso da escadinha.
      setTimeout(() => element.classList.add('rv-done'), 1500);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  revealGroups.forEach(([selector, start, step]) => {
    document.querySelectorAll(selector).forEach((element, index) => {
      element.classList.add('rv');
      if (/^(H1|H2)$/.test(element.tagName)) element.classList.add('rv-title');
      // A escadinha só faz sentido quando os cards estão lado a lado (no celular eles entram um a um).
      element.style.setProperty('--d', `${start + (window.innerWidth >= 768 ? index * step : 0)}ms`);
      revealObserver.observe(element);
    });
  });

  // Barra de progresso, cabeçalho, paralaxe do retrato e o "antes e depois" que acende conforme a rolagem.
  const progressBar = document.createElement('div');
  progressBar.className = 'scroll-progress';
  progressBar.setAttribute('aria-hidden', 'true');
  document.body.prepend(progressBar);
  const header = document.querySelector('.site-header');
  const heroPortrait = document.querySelector('.portrait-hero');
  const heroStamp = document.querySelector('.hero-stamp');
  const beforeAfter = document.querySelector('.before-after');
  const comparison = document.querySelector('.comparison-grid');
  const clamp01 = (value) => Math.min(1, Math.max(0, value));
  let frame = 0;
  function onScroll() {
    frame = 0;
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.transform = `scaleX(${max > 0 ? clamp01(y / max).toFixed(4) : 0})`;
    header.classList.toggle('is-scrolled', y > 8);
    if (y < window.innerHeight * 1.2) {
      heroPortrait?.style.setProperty('--par', `${Math.min(y * 0.07, 36).toFixed(1)}px`);
      heroStamp?.style.setProperty('--rot', `${Math.min(y * 0.035, 14).toFixed(2)}deg`);
    }
    if (comparison) {
      const top = comparison.getBoundingClientRect().top;
      beforeAfter.style.setProperty('--ba', clamp01((window.innerHeight * 0.95 - top) / (window.innerHeight * 0.7)).toFixed(3));
    }
  }
  window.addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(onScroll); }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  // Rede de segurança: numa rolagem muito rápida, o que ficou para trás da tela sem aparecer é revelado na hora.
  let settleTimer;
  window.addEventListener('scroll', () => {
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => {
      document.querySelectorAll('.rv:not(.is-in)').forEach((element) => {
        if (element.getBoundingClientRect().bottom < 0) {
          revealObserver.unobserve(element);
          element.classList.add('is-in', 'rv-done');
        }
      });
    }, 200);
  }, { passive: true });
}
