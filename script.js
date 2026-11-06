// CONFIGURAÇÃO · Edite estes valores para usar seus canais reais.
const CTA_URL = '#contato';
const EMAIL = ''; // Exemplo: 'contato@seudominio.com.br'
const PHONE = ''; // Exemplo: '+5581999999999'
const INSTAGRAM = ''; // Exemplo: 'https://www.instagram.com/seuperfil/'
const PHOTO_SRC = 'assets/vinicius-ribeiro.webp'; // Exemplo: 'assets/vinicius-ribeiro.webp'. Vazio mantém SUA FOTO.
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

// Aba do navegador: quem sai ouve a tese do site, e quem volta é recebido.
const pageTitle = document.title;
let titleTimer;
document.addEventListener('visibilitychange', () => {
  clearTimeout(titleTimer);
  if (document.hidden) {
    document.title = 'O cliente que sai sem comprar também não volta';
  } else {
    document.title = 'Que bom que você voltou';
    titleTimer = setTimeout(() => { document.title = pageTitle; }, 2500);
  }
});

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

// ANTES E DEPOIS ARRASTÁVEL · A linha (e o botão) separa a foto "antes" da "depois". Com mouse dá para arrastar em
// qualquer ponto; no toque só o botão responde (o resto deixa a página rolar). As setas do teclado também movem.
// Funciona com ou sem a classe "anim".
const compare = document.querySelector('.ba');
if (compare) {
  const compareSection = compare.closest('.before-after');
  let position = 50;
  let dragging = false;
  let touched = false;
  const sweepTimers = [];

  function setPosition(value) {
    position = clamp(value, 0, 100);
    const rounded = Math.round(position);
    compare.style.setProperty('--pos', `${position.toFixed(2)}%`);
    // Linha à direita = mais ANTES (a seção esfria); à esquerda = mais DEPOIS (a seção acende).
    const lean = (position - 50) / 50;
    compareSection.style.setProperty('--cool', Math.max(lean, 0).toFixed(3));
    compareSection.style.setProperty('--glow', Math.max(-lean, 0).toFixed(3));
    compare.setAttribute('aria-valuenow', String(rounded));
    compare.setAttribute('aria-valuetext', rounded < 50 ? 'Mostrando mais o depois: cliente escolhendo você.'
      : rounded > 50 ? 'Mostrando mais o antes: cliente comparando preço.' : 'Metade antes, metade depois.');
  }
  function moveTo(clientX) {
    const rect = compare.getBoundingClientRect();
    if (rect.width) setPosition((clientX - rect.left) / rect.width * 100);
  }
  // Qualquer toque do visitante cancela a varredura de convite.
  function takeOver() {
    touched = true;
    sweepTimers.forEach(clearTimeout);
    compare.classList.remove('is-sweeping');
  }
  function release() {
    dragging = false;
    compare.classList.remove('is-dragging');
  }

  compare.addEventListener('pointerdown', (event) => {
    const onHandle = event.target.closest('.ba-handle');
    if (event.pointerType === 'mouse' ? event.button !== 0 : !onHandle) return;
    takeOver();
    dragging = true;
    compare.classList.add('is-dragging');
    compare.setPointerCapture(event.pointerId);
    moveTo(event.clientX);
  });
  compare.addEventListener('pointermove', (event) => { if (dragging) moveTo(event.clientX); });
  compare.addEventListener('pointerup', release);
  compare.addEventListener('pointercancel', release);

  compare.addEventListener('keydown', (event) => {
    const targets = { ArrowLeft: position - 5, ArrowRight: position + 5, Home: 0, End: 100 };
    if (!(event.key in targets)) return;
    event.preventDefault();
    takeOver();
    setPosition(targets[event.key]);
  });

  // Ao entrar na tela, a linha varre de ponta a ponta duas vezes e volta ao meio (se o visitante ainda não mexeu).
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const sweepObserver = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      sweepObserver.disconnect();
      if (touched) return;
      compare.classList.add('is-sweeping');
      [[0, 0], [900, 100], [1800, 0], [2700, 100], [3600, 50]].forEach(([delay, value]) => {
        sweepTimers.push(setTimeout(() => setPosition(value), delay));
      });
      sweepTimers.push(setTimeout(() => compare.classList.remove('is-sweeping'), 4500));
    }, { threshold: 0.6 });
    sweepObserver.observe(compare);
  }
}

// ANIMAÇÕES AO ROLAR · Só transform, translate e opacity. Sem JavaScript, ou com "reduzir movimento" no sistema,
// a página aparece inteira e parada (a classe "anim" nem chega a ser ligada).
if (document.documentElement.classList.contains('anim')) {
  const wide = () => window.innerWidth >= 768;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // [seletor, atraso inicial em ms, passo entre irmãos em ms, 'lr' = no desktop entra de lados opostos]
  const revealGroups = [
    ['.hero-eyebrow', 0, 0], ['.hero h1', 120, 0], ['.hero-description', 520, 0], ['.hero .button', 680, 0], ['.hero-visual', 300, 0],
    ['.before-after .eyebrow', 0, 0], ['.before-after h2', 60, 0], ['.ba', 120, 0], ['.ba-captions', 300, 0], ['.comparison-manifesto', 80, 0],
    ['.symptoms h2', 0, 0], ['.symptom-card', 100, 150, 'lr'],
    ['.cause h2', 60, 0], ['.cause-card', 160, 160, 'lr'],
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
    const labelSource = element.cloneNode(true);
    labelSource.querySelectorAll('[aria-hidden="true"]').forEach((hidden) => hidden.remove());
    element.setAttribute('aria-label', labelSource.textContent.replace(/\s+/g, ' ').trim());
    const fragment = document.createDocumentFragment();
    let index = 0;
    // Palavras soltas e também as que estão dentro de destaques (<span>) sobem uma a uma.
    (function split(parent, target) {
      parent.childNodes.forEach((node) => {
        if (node.nodeType === 1) {
          // data-keep: bloco com animação própria (ex.: BARATO. → O DOBRO.), não é dividido em palavras.
          if (node.hasAttribute('data-keep')) { target.appendChild(node.cloneNode(true)); return; }
          const copy = node.cloneNode(false);
          split(node, copy);
          target.appendChild(copy);
          return;
        }
        node.textContent.split(/\s+/).filter(Boolean).forEach((word) => {
          const mask = document.createElement('span');
          const inner = document.createElement('span');
          mask.className = 'w';
          mask.setAttribute('aria-hidden', 'true');
          inner.textContent = word;
          inner.style.setProperty('--i', index++);
          mask.appendChild(inner);
          target.appendChild(mask);
          target.appendChild(document.createTextNode(' '));
        });
      });
    })(element, fragment);
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

  // Barra de progresso, cabeçalho e paralaxe.
  const progressBar = document.createElement('div');
  progressBar.className = 'scroll-progress';
  progressBar.setAttribute('aria-hidden', 'true');
  document.body.prepend(progressBar);
  const header = document.querySelector('.site-header');
  const heroPortrait = document.querySelector('.portrait-hero');
  const heroStamp = document.querySelector('.hero-stamp');
  // [seletor, velocidade, deslocamento máximo em px]: cada item desliza em relação ao resto da página.
  const parallaxItems = [];
  [['.symptom-card .symptom-image', 0.06, 9], ['.portrait-about', 0.06, 30], ['.pillar-card .number', 0.08, 14]]
    .forEach(([selector, speed, max]) => document.querySelectorAll(selector).forEach((element) => parallaxItems.push({ element, box: element.parentElement, speed, max })));
  const symptoms = document.querySelector('.symptoms');
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
    // Sintomas: da chegada até a causa tomar a tela, a seção fica "parada" (paralaxe e inclinação congeladas).
    const symptomsBox = symptoms.getBoundingClientRect();
    const frozen = symptomsBox.top < viewport * 0.7 && symptomsBox.bottom > viewport * 0.35;
    symptoms.classList.toggle('is-frozen', frozen);
    parallaxItems.forEach(({ element, box, speed, max: limit }) => {
      if (frozen && element.closest('.symptoms')) return;
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

  // Só com mouse: cartões que inclinam e botões que puxam o cursor.
  if (finePointer) {
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
