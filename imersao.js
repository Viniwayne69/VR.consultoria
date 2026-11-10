'use strict';

/**
 * IMERSÃO 3D do site (hero). O retrato fica em camadas de profundidade (moldura vinho atrás, foto no meio, carimbo na frente) e
 * se inclina na direção do mouse; no celular ele balança sozinho e tomba um pouco ao rolar. O carimbo vira uma moeda com
 * espessura, que gira de verdade com a rolagem. Só liga com a classe "anim" (sem "reduzir movimento" no sistema).
 */
(function () {
  if (!document.documentElement.classList.contains('anim')) return;
  const visual = document.querySelector('.hero-visual');
  const hero = document.querySelector('.hero');
  if (!visual || !hero) return;

  const limitar = (valor, min, max) => Math.min(max, Math.max(min, valor));
  const comMouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Carimbo vira moeda: frente e verso com o carimbo e, entre eles, discos empilhados que formam a borda
  let moeda = null;
  const carimbo = visual.querySelector('img.hero-stamp');
  if (carimbo) {
    moeda = document.createElement('div');
    moeda.className = 'stamp hero-stamp moeda';
    moeda.setAttribute('role', 'img');
    moeda.setAttribute('aria-label', carimbo.alt);
    const giro = document.createElement('span');
    giro.className = 'moeda-giro';
    for (let k = -5; k <= 5; k++) {
      const disco = document.createElement('span');
      disco.className = 'moeda-borda';
      disco.style.setProperty('--k', k);
      giro.appendChild(disco);
    }
    const frente = document.createElement('span');
    frente.className = 'moeda-face';
    const verso = document.createElement('span');
    verso.className = 'moeda-face moeda-verso';
    carimbo.replaceWith(moeda);
    carimbo.className = '';
    carimbo.alt = '';
    verso.appendChild(carimbo.cloneNode(true));
    frente.appendChild(carimbo);
    giro.append(frente, verso);
    moeda.appendChild(giro);
  }

  // O alvo vem do mouse (computador) ou de um balanço lento (celular); o valor aplicado persegue o alvo para o movimento ficar macio
  let alvoX = 0;
  let alvoY = 0;
  let x = 0;
  let y = 0;
  let naTela = true;
  let quadro = 0;
  const inicio = performance.now();

  if (comMouse) {
    window.addEventListener('pointermove', (evento) => {
      const caixa = visual.getBoundingClientRect();
      alvoX = limitar((evento.clientX - (caixa.left + caixa.width / 2)) / (window.innerWidth / 2), -1, 1);
      alvoY = limitar((evento.clientY - (caixa.top + caixa.height / 2)) / (window.innerHeight / 2), -1, 1);
    }, { passive: true });
  }

  function passo(agora) {
    quadro = 0;
    if (!naTela || document.hidden) return;
    quadro = requestAnimationFrame(passo);
    // Com o diagnóstico aberto por cima o site está escondido: não gasta nada
    if (document.documentElement.classList.contains('dx-aberto')) return;
    const tempo = (agora - inicio) / 1000;
    const rolagem = window.scrollY;
    const tombo = limitar(rolagem / (window.innerHeight * 0.7), 0, 1);
    const paraX = comMouse ? alvoX + Math.sin(tempo * 0.5) * 0.06 : Math.sin(tempo * 0.55) * 0.32;
    const paraY = (comMouse ? alvoY * 0.8 : Math.sin(tempo * 0.4) * 0.12) - tombo * 0.7;
    x += (paraX - x) * 0.08;
    y += (paraY - y) * 0.08;
    visual.style.setProperty('--hx', x.toFixed(3));
    visual.style.setProperty('--hy', y.toFixed(3));
    if (moeda) {
      moeda.style.setProperty('--giro', (rolagem * 0.5 + Math.sin(tempo * 0.7) * 16 + x * 20).toFixed(1));
      moeda.style.setProperty('--rot', `${Math.min(rolagem * 0.06, 24).toFixed(2)}deg`);
    }
  }
  const ligar = () => { if (!quadro && naTela && !document.hidden) quadro = requestAnimationFrame(passo); };

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entrada]) => { naTela = entrada.isIntersecting; ligar(); }).observe(hero);
  }
  document.addEventListener('visibilitychange', ligar);
  ligar();
})();
