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

// ANIMAÇÕES AO ROLAR · Só transform, translate e opacity. Sem JavaScript, ou com "reduzir movimento" no sistema,
// a página aparece inteira e parada (a classe "anim" nem chega a ser ligada).
if (document.documentElement.classList.contains('anim')) {
  const wide = () => window.innerWidth >= 768;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  // [seletor, atraso inicial em ms, passo entre irmãos em ms, 'lr' = no desktop entra de lados opostos]
  const revealGroups = [
    ['.hero-eyebrow', 0, 0], ['.hero h1', 120, 0], ['.hero-description', 520, 0], ['.hero .button', 680, 0], ['.hero-visual', 300, 0],
    ['.before-after .eyebrow', 0, 0], ['.before-after h2', 60, 0], ['.comparison-card', 120, 160, 'lr'], ['.comparison-manifesto', 80, 0],
    ['.symptoms .eyebrow', 0, 0], ['.symptom-card', 100, 150, 'lr'],
    ['.cause .eyebrow', 0, 0], ['.cause h2', 60, 0], ['.cause-card', 160, 160, 'lr'],
    ['.pillars .eyebrow', 0, 0], ['.pillars h2', 60, 0], ['.pillar-card', 140, 150, 'lr'],
    ['.method .eyebrow', 0, 0], ['.method h2', 60, 0], ['.method-steps li', 140, 180, 'lr'], ['.result-ribbon', 120, 0],
    ['.about-copy .eyebrow', 0, 0], ['.manifesto', 60, 0], ['.about-copy > p:last-child', 360, 0], ['.portrait-about', 160, 0], ['.proof-card', 200, 140],
    ['.audience-copy .eyebrow', 0, 0], ['.audience h2', 60, 0], ['.audience-copy > p:not(.eyebrow)', 300, 0], ['.audience-copy .button', 420, 0], ['.audience-details', 200, 0],
    ['.faq .eyebrow', 0, 0], ['.faq h2', 60, 0], ['.faq-item', 120, 80],
    ['.final-cta h2', 0, 0], ['.final-cta .button', 420, 0], ['.final-cta p', 560, 0],
    ['.footer-main', 0, 0], ['.footer-bottom', 100, 0],
  ];

  // Título que sobe palavra por palavra, por trás de uma máscara. O texto lido pelo leitor de tela não muda.
  function splitTitle(element) {
    element.setAttribute('aria-label', element.textContent.replace(/\s+/g, ' ').trim());
    const fragment = document.createDocumentFragment();
    let index = 0;
    element.childNodes.forEach((node) => {
      if (node.nodeType !== 3) { fragment.appendChild(node.cloneNode(true)); return; }
      node.textContent.split(/\s+/).filter(Boolean).forEach((word) => {
        const mask = document.createElement('span');
        const inner = document.createElement('span');
        mask.className = 'w';
        mask.setAttribute('aria-hidden', 'true');
        inner.textContent = word;
        inner.style.setProperty('--i', index++);
        mask.appendChild(inner);
        fragment.appendChild(mask);
        fragment.appendChild(document.createTextNode(' '));
      });
    });
    element.textContent = '';
    element.appendChild(fragment);
  }

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const element = entry.target;
      revealObserver.unobserve(element);
      element.classList.add('is-in');
      // Depois da entrada, a transição volta a ser rápida (hover), sem o atraso da escadinha.
      setTimeout(() => element.classList.add('rv-done'), 2200);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

  revealGroups.forEach(([selector, start, step, sides]) => {
    const elements = [...document.querySelectorAll(selector)];
    elements.forEach((element, index) => {
      element.classList.add('rv');
      if (/^H[12]$/.test(element.tagName) && !element.classList.contains('eyebrow')) {
        element.classList.add('rv-title');
        splitTitle(element);
      }
      if (sides && wide() && elements.length > 1) {
        if (index === 0) element.classList.add('rv-l');
        else if (index === elements.length - 1) element.classList.add('rv-r');
      }
      // A escadinha só faz sentido quando os cartões estão lado a lado (no celular eles entram um a um).
      element.style.setProperty('--d', `${start + (wide() ? index * step : 0)}ms`);
      revealObserver.observe(element);
    });
  });

  // Barra de progresso, cabeçalho, paralaxe e o "antes e depois" que acende conforme a rolagem.
  const progressBar = document.createElement('div');
  progressBar.className = 'scroll-progress';
  progressBar.setAttribute('aria-hidden', 'true');
  document.body.prepend(progressBar);
  const header = document.querySelector('.site-header');
  const heroPortrait = document.querySelector('.portrait-hero');
  const heroStamp = document.querySelector('.hero-stamp');
  const beforeAfter = document.querySelector('.before-after');
  const comparison = document.querySelector('.comparison-grid');
  // [seletor, velocidade, deslocamento máximo em px]: cada item desliza em relação ao resto da página.
  const parallaxItems = [];
  [['.symptom-card .giant-number', 0.16, 34], ['.comparison-image > img', 0.06, 9], ['.portrait-about', 0.06, 30], ['.pillar-card .number', 0.08, 14]]
    .forEach(([selector, speed, max]) => document.querySelectorAll(selector).forEach((element) => parallaxItems.push({ element, box: element.parentElement, speed, max })));
  let frame = 0;
  function onScroll() {
    frame = 0;
    const y = window.scrollY;
    const viewport = window.innerHeight;
    const max = document.documentElement.scrollHeight - viewport;
    progressBar.style.transform = `scaleX(${max > 0 ? clamp(y / max, 0, 1).toFixed(4) : 0})`;
    header.classList.toggle('is-scrolled', y > 8);
    if (y < viewport * 1.2) {
      heroPortrait?.style.setProperty('--par', `${Math.min(y * 0.12, 56).toFixed(1)}px`);
      heroStamp?.style.setProperty('--rot', `${Math.min(y * 0.06, 24).toFixed(2)}deg`);
    }
    if (comparison) {
      const top = comparison.getBoundingClientRect().top;
      beforeAfter.style.setProperty('--ba', clamp((viewport * 0.95 - top) / (viewport * 0.7), 0, 1).toFixed(3));
    }
    parallaxItems.forEach(({ element, box, speed, max: limit }) => {
      const rect = box.getBoundingClientRect();
      if (rect.bottom < -200 || rect.top > viewport + 200) return;
      const offset = rect.top + rect.height / 2 - viewport / 2;
      element.style.translate = `0 ${clamp(-offset * speed, -limit, limit).toFixed(1)}px`;
    });
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

  // Só com mouse: luz laranja que segue o cursor no hero, cartões que inclinam e botões que puxam o cursor.
  if (finePointer) {
    const hero = document.querySelector('.hero');
    hero.addEventListener('pointermove', (event) => {
      const rect = hero.getBoundingClientRect();
      hero.style.setProperty('--mx', `${event.clientX - rect.left}px`);
      hero.style.setProperty('--my', `${event.clientY - rect.top}px`);
    });
    document.querySelectorAll('.pillar-card, .cause-card, .symptom-card, .method-steps li, .proof-card').forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--ry', `${((event.clientX - rect.left) / rect.width - 0.5) * 9}deg`);
        card.style.setProperty('--rx', `${-((event.clientY - rect.top) / rect.height - 0.5) * 9}deg`);
      });
      card.addEventListener('pointerleave', () => {
        card.style.removeProperty('--rx');
        card.style.removeProperty('--ry');
      });
    });
    document.querySelectorAll('.button').forEach((button) => {
      button.addEventListener('pointermove', (event) => {
        const rect = button.getBoundingClientRect();
        button.style.setProperty('--bx', `${clamp((event.clientX - rect.left - rect.width / 2) * 0.18, -8, 8).toFixed(1)}px`);
        button.style.setProperty('--by', `${clamp((event.clientY - rect.top - rect.height / 2) * 0.28, -6, 6).toFixed(1)}px`);
      });
      button.addEventListener('pointerleave', () => {
        button.style.removeProperty('--bx');
        button.style.removeProperty('--by');
      });
    });
  }
}
