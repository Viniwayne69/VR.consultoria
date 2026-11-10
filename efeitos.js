'use strict';

/**
 * Efeitos de som dos botões. Não usam arquivos: cada som é sintetizado na hora pelo navegador (Web Audio), num estilo rock melódico
 * e suave que ainda tem eletricidade: cordas de guitarra beliscadas (modelo físico de corda), com uma leve saturação de amplificador
 * de válvula, notas de solo com vibrato e bend, arpejos na escala pentatônica menor de lá, baixo quente, eco e reverberação.
 * Usado pelo site e pelo diagnóstico: window.vrEfeitos.tocar('pop').
 * Nomes: iniciar (botão grande: sopro e sub-grave que sobem e uma pancada seca com metal que ressoa), pop (resposta escolhida), ok (avançar), voltar, tecla (botões
 * do site e áreas do radar), whatsapp (conversar), carregando (arpejo que acelera e solo que sobe durante o cálculo do resultado)
 * e estouro (quando o resultado aparece).
 */
(function () {
  // Com false nenhum efeito toca
  const ATIVO = true;
  const ehIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  let ctx = null;

  function contexto() {
    if (!ATIVO) return null;
    const Contexto = window.AudioContext || window.webkitAudioContext;
    if (!Contexto) return null;
    // iPhone: o som do Web Audio some com a chave de silencioso, a menos que o tipo "playback" do audioSession (iOS 16.4 ou mais novo)
    // esteja ligado. Sem ele não usamos Web Audio, para o áudio das vozes também não correr risco de sumir.
    if (ehIOS && !navigator.audioSession) return null;
    if (!ctx) {
      try {
        if (ehIOS) navigator.audioSession.type = 'playback';
        ctx = new Contexto();
      } catch { return null; }
    }
    if (ctx.state !== 'running') ctx.resume().catch(() => {});
    return ctx;
  }

  // O Safari só libera o som depois de um toque da pessoa: o primeiro toque na página já cria e destrava o contexto
  function destravar() {
    const eventos = ['touchend', 'pointerup', 'click', 'keydown'];
    const liberar = () => {
      const c = contexto();
      if (!c) return;
      try {
        const silencio = c.createBufferSource();
        silencio.buffer = c.createBuffer(1, 1, 22050);
        silencio.connect(c.destination);
        silencio.start(0);
      } catch { /* sem som: segue */ }
      if (c.state === 'running') eventos.forEach((e) => window.removeEventListener(e, liberar, true));
    };
    eventos.forEach((e) => window.addEventListener(e, liberar, { capture: true, passive: true }));
    document.addEventListener('visibilitychange', () => { if (!document.hidden && ctx && ctx.state !== 'running') ctx.resume().catch(() => {}); });
  }
  destravar();

  // Resposta de uma sala: ruído que decai e vai perdendo os agudos com o tempo (gerada na hora, sem arquivo)
  function respostaDaSala(c) {
    const n = Math.floor(c.sampleRate * 1.8);
    const ir = c.createBuffer(2, n, c.sampleRate);
    for (let canal = 0; canal < 2; canal++) {
      const d = ir.getChannelData(canal);
      let y = 0;
      for (let i = 0; i < n; i++) {
        const t = i / n;
        const x = (Math.random() * 2 - 1) * Math.pow(1 - t, 3);
        y += (0.6 - 0.45 * t) * (x - y);
        d[i] = i < c.sampleRate * 0.01 ? 0 : y;
      }
    }
    return ir;
  }

  // Curva de saturação de válvula: arredonda os picos da onda, o que dá o calor e o brilho elétrico da guitarra
  function curvaQuente(forca) {
    const n = 2048;
    const curva = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * 2 - 1;
      curva[i] = Math.tanh(x * forca) * 0.9;
    }
    return curva;
  }

  /**
   * Mesa de som: tudo passa por um compressor (evita estouro quando vários sons se somam) e uma parte pode ir para a sala
   * (reverberação) e para o eco (repetição curta que vai sumindo, como um pedal de delay).
   */
  const mesas = new WeakMap();
  function mesa(c) {
    let m = mesas.get(c);
    if (m) return m;
    const seco = c.createGain();
    seco.gain.value = 0.9;
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.knee.value = 14;
    comp.ratio.value = 4;
    comp.attack.value = 0.004;
    comp.release.value = 0.18;
    seco.connect(comp).connect(c.destination);
    const sala = c.createConvolver();
    sala.buffer = respostaDaSala(c);
    const retornoSala = c.createGain();
    retornoSala.gain.value = 0.9;
    sala.connect(retornoSala).connect(seco);
    const eco = c.createGain();
    const atraso = c.createDelay(1);
    atraso.delayTime.value = 0.23;
    const realimenta = c.createGain();
    realimenta.gain.value = 0.38;
    const escuro = c.createBiquadFilter();
    escuro.type = 'lowpass';
    escuro.frequency.value = 2600;
    eco.connect(atraso);
    atraso.connect(escuro);
    escuro.connect(realimenta);
    realimenta.connect(atraso);
    const retornoEco = c.createGain();
    retornoEco.gain.value = 0.75;
    escuro.connect(retornoEco).connect(seco);
    m = { seco, sala, eco, curvas: {}, cordas: {} };
    mesas.set(c, m);
    return m;
  }

  // Liga uma saída à mesa; reverb e eco são as quantidades (0 a 1) que também vão para a sala e para o eco
  function saida(c, no, reverb, eco) {
    const m = mesa(c);
    no.connect(m.seco);
    if (reverb) {
      const g = c.createGain();
      g.gain.value = reverb;
      no.connect(g).connect(m.sala);
    }
    if (eco) {
      const g = c.createGain();
      g.gain.value = eco;
      no.connect(g).connect(m.eco);
    }
  }

  // Saturação pronta para uso: cada força de curva é criada uma vez por contexto
  function saturar(c, forca) {
    const m = mesa(c);
    if (!m.curvas[forca]) m.curvas[forca] = curvaQuente(forca);
    const formato = c.createWaveShaper();
    formato.curve = m.curvas[forca];
    formato.oversample = '4x';
    return formato;
  }

  /**
   * Corda beliscada (modelo de Karplus-Strong): um estouro curto de ruído circula num anel do tamanho de um ciclo da nota, e a média
   * entre vizinhos tira os agudos a cada volta, como uma corda de verdade que vai perdendo o brilho. A onda é calculada uma vez por
   * nota e guardada.
   */
  function bufferDaCorda(c, freq, amortece) {
    const m = mesa(c);
    const chave = Math.round(freq * 10) + '|' + amortece;
    if (m.cordas[chave]) return m.cordas[chave];
    const n = Math.floor(c.sampleRate * 2.2);
    const buf = c.createBuffer(1, n, c.sampleRate);
    const d = buf.getChannelData(0);
    const p = Math.max(2, Math.round(c.sampleRate / freq));
    let anterior = 0;
    for (let i = 0; i < p; i++) {
      const x = Math.random() * 2 - 1;
      d[i] = 0.5 * (x + anterior);
      anterior = x;
    }
    for (let i = p; i < n; i++) d[i] = amortece * 0.5 * (d[i - p] + d[i - p + 1]);
    m.cordas[chave] = buf;
    return buf;
  }

  /**
   * Guitarra beliscada: a corda passa por uma saturação leve de amplificador (que "limpa" sozinha conforme a nota morre, como
   * numa guitarra de verdade) e pela caixa, que corta os graves e os agudos. amortece menor = nota abafada e curta.
   */
  function corda(c, { freq, em = 0, dur = 0.8, ganho: ganhoBruto, forca = 2.2, amortece = 0.996, reverb = 0, eco = 0 }) {
    const ganho = ganhoBruto * 0.5; // a saturação já deixa a corda forte: o ganho vale a metade
    const ini = c.currentTime + em;
    const fim = ini + dur;
    const fonte = c.createBufferSource();
    fonte.buffer = bufferDaCorda(c, freq, amortece);
    const entrada = c.createGain();
    entrada.gain.value = 1.6;
    const grave = c.createBiquadFilter();
    grave.type = 'highpass';
    grave.frequency.value = 110;
    const caixa = c.createBiquadFilter();
    caixa.type = 'lowpass';
    caixa.frequency.value = 4200;
    caixa.Q.value = 0.8;
    const amp = c.createGain();
    amp.gain.setValueAtTime(ganho, ini);
    amp.gain.setValueAtTime(ganho, ini + dur * 0.5);
    amp.gain.exponentialRampToValueAtTime(0.0001, fim);
    fonte.connect(entrada).connect(saturar(c, forca)).connect(grave).connect(caixa).connect(amp);
    saida(c, amp, reverb, eco);
    fonte.start(ini);
    fonte.stop(fim + 0.02);
  }

  // Várias cordas seguidas, como uma palhetada que passa por elas (passo é o intervalo entre as notas)
  function acorde(c, { notas, em = 0, passo = 0.03, ...resto }) {
    notas.forEach((freq, i) => corda(c, { freq, em: em + i * passo, ...resto }));
  }

  /**
   * Nota de solo, longa e cantada: serra e triângulo filtrados, saturação suave, vibrato que vai aumentando e um bend (a nota
   * nasce abaixo e sobe até a altura certa). "de" é a frequência de partida; "para" faz a nota continuar subindo até o fim.
   */
  function solo(c, { freq, de, para, em = 0, dur, ganho, deslize = 0.09, vibrato = 0.012, ataque = 0.03, reverb = 0.4, eco = 0.3 }) {
    const ini = c.currentTime + em;
    const fim = ini + dur;
    const serra = c.createOscillator();
    const triangulo = c.createOscillator();
    const lfo = c.createOscillator();
    const profundidade = c.createGain();
    const mistura = c.createGain();
    const filtro = c.createBiquadFilter();
    const amp = c.createGain();
    serra.type = 'sawtooth';
    triangulo.type = 'triangle';
    [serra, triangulo].forEach((osc) => {
      osc.frequency.setValueAtTime(de || freq, ini);
      if (de) osc.frequency.exponentialRampToValueAtTime(freq, ini + deslize);
      if (para) osc.frequency.exponentialRampToValueAtTime(para, fim);
    });
    lfo.frequency.value = 5.5;
    profundidade.gain.setValueAtTime(0, ini);
    profundidade.gain.linearRampToValueAtTime(freq * vibrato, ini + dur * 0.45);
    lfo.connect(profundidade);
    profundidade.connect(serra.frequency);
    profundidade.connect(triangulo.frequency);
    mistura.gain.value = 0.5;
    filtro.type = 'lowpass';
    filtro.Q.value = 1.2;
    filtro.frequency.setValueAtTime(1800, ini);
    filtro.frequency.exponentialRampToValueAtTime(3600, ini + Math.min(ataque * 4, dur));
    amp.gain.setValueAtTime(0.0001, ini);
    amp.gain.exponentialRampToValueAtTime(ganho, ini + Math.min(ataque, dur * 0.9));
    if (ataque < dur * 0.4) amp.gain.exponentialRampToValueAtTime(ganho * 0.7, ini + dur * 0.5);
    amp.gain.exponentialRampToValueAtTime(0.0001, fim);
    serra.connect(mistura);
    triangulo.connect(mistura);
    mistura.connect(filtro).connect(saturar(c, 2.6)).connect(amp);
    saida(c, amp, reverb, eco);
    [serra, triangulo, lfo].forEach((osc) => { osc.start(ini); osc.stop(fim + 0.02); });
  }

  // Oscilador simples com filtro e queda exponencial (baixo, bumbo, zumbido)
  function sint(c, { freq, para, em = 0, dur, ganho, tipo = 'sine', corte = 2000, ataque = 0.004, reverb = 0 }) {
    const ini = c.currentTime + em;
    const fim = ini + dur;
    const osc = c.createOscillator();
    const filtro = c.createBiquadFilter();
    const amp = c.createGain();
    osc.type = tipo;
    osc.frequency.setValueAtTime(freq, ini);
    if (para) osc.frequency.exponentialRampToValueAtTime(para, fim);
    filtro.type = 'lowpass';
    filtro.frequency.value = corte;
    amp.gain.setValueAtTime(0.0001, ini);
    amp.gain.exponentialRampToValueAtTime(ganho, ini + Math.min(ataque, dur * 0.9));
    amp.gain.exponentialRampToValueAtTime(0.0001, fim);
    osc.connect(filtro).connect(amp);
    saida(c, amp, reverb);
    osc.start(ini);
    osc.stop(fim + 0.02);
  }

  // Ruído filtrado: estalo ou sopro. Com ataque, o sopro cresce antes de decair
  function ruido(c, { em = 0, dur, ganho, freq, freqFim, tipo = 'bandpass', q = 1, ataque = 0, reverb = 0 }) {
    const ini = c.currentTime + em;
    const fim = ini + dur;
    const n = Math.max(1, Math.floor(c.sampleRate * dur));
    const buf = c.createBuffer(1, n, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const fonte = c.createBufferSource();
    fonte.buffer = buf;
    const filtro = c.createBiquadFilter();
    filtro.type = tipo;
    filtro.Q.value = q;
    filtro.frequency.setValueAtTime(freq, ini);
    if (freqFim) filtro.frequency.exponentialRampToValueAtTime(freqFim, fim);
    const amp = c.createGain();
    if (ataque) {
      amp.gain.setValueAtTime(0.0001, ini);
      amp.gain.exponentialRampToValueAtTime(ganho, ini + ataque);
    } else {
      amp.gain.setValueAtTime(ganho, ini);
    }
    amp.gain.exponentialRampToValueAtTime(0.0001, fim);
    fonte.connect(filtro).connect(amp);
    saida(c, amp, reverb);
    fonte.start(ini);
  }

  /**
   * Metal escuro (síntese FM): uma senoide modulada por outra em proporção quebrada (razao), o que dá o timbre de sino de
   * ferro ou de painel batido. O indice (brilho) decai rápido, então o som nasce áspero e termina limpo.
   */
  function metal(c, { freq, razao = 2.76, indice = 1.5, em = 0, dur, ganho, reverb = 0 }) {
    const ini = c.currentTime + em;
    const fim = ini + dur;
    const portadora = c.createOscillator();
    const moduladora = c.createOscillator();
    const forca = c.createGain();
    const amp = c.createGain();
    portadora.frequency.value = freq;
    moduladora.frequency.value = freq * razao;
    forca.gain.setValueAtTime(freq * indice, ini);
    forca.gain.exponentialRampToValueAtTime(Math.max(1, freq * indice * 0.04), ini + dur * 0.5);
    amp.gain.setValueAtTime(0.0001, ini);
    amp.gain.exponentialRampToValueAtTime(ganho, ini + 0.003);
    amp.gain.exponentialRampToValueAtTime(0.0001, fim);
    moduladora.connect(forca).connect(portadora.frequency);
    portadora.connect(amp);
    saida(c, amp, reverb);
    portadora.start(ini); moduladora.start(ini);
    portadora.stop(fim + 0.02); moduladora.stop(fim + 0.02);
  }

  // Baixo quente e bumbo macio: dão o peso por baixo das guitarras sem endurecer o som
  const baixo = (c, { em = 0, freq = 55, dur = 0.8, ganho = 0.25 }) => {
    sint(c, { freq, em, dur, ganho, tipo: 'sine', corte: 500, ataque: 0.012 });
    sint(c, { freq: freq * 2, em, dur: dur * 0.7, ganho: ganho * 0.35, tipo: 'triangle', corte: 700, ataque: 0.012 });
  };
  const bumbo = (c, { em = 0, ganho = 0.3, dur = 0.3 }) => sint(c, { freq: 130, para: 45, em, dur, ganho, corte: 700 });

  // Estalo elétrico de amplificador sendo ligado: faíscas curtas e um zumbido de rede (60 Hz) que some rápido
  function ligar(c, { em = 0, ganho = 0.1 }) {
    for (let i = 0; i < 5; i++) ruido(c, { em: em + Math.random() * 0.09, dur: 0.01, ganho, freq: 3500 + Math.random() * 2500, tipo: 'highpass' });
    sint(c, { freq: 60, em, dur: 0.14, ganho: ganho * 0.6, tipo: 'sawtooth', corte: 500, ataque: 0.01 });
  }

  // Escala pentatônica menor de lá: as notas que nunca soam erradas no rock
  const A2 = 110, E3 = 164.81, A3 = 220, C4 = 261.63, E4 = 329.63, G4 = 392, A4 = 440, C5 = 523.25, D5 = 587.33, E5 = 659.25, G5 = 783.99, A5 = 880;
  const PENTA = [A3, C4, E4, G4, A4, C5, E5, G5, A5, 1046.5];

  // Tensão que cresce: arpejo de guitarra que acelera e sobe a escala, solo que vai subindo com vibrato e baixo que cresce embaixo
  function subida(c, dur) {
    sint(c, { freq: 55, para: 82.41, dur, ganho: 0.1, tipo: 'sine', corte: 400, ataque: dur - 0.1 });
    ruido(c, { dur, ganho: 0.035, freq: 400, freqFim: 4500, q: 0.8, ataque: dur - 0.1 });
    solo(c, { freq: A4, para: A5, dur, ganho: 0.07, ataque: dur - 0.15, vibrato: 0.016, reverb: 0.3, eco: 0.35 });
    let t = 0;
    let intervalo = 0.24;
    let k = 0;
    while (t < dur - 0.15) {
      const nota = PENTA[Math.min(PENTA.length - 1, Math.floor((k / 22) * PENTA.length))];
      corda(c, { freq: nota, em: t, dur: 0.3, ganho: 0.05 + 0.07 * (t / dur), amortece: 0.99, reverb: 0.2, eco: 0.3 });
      t += intervalo;
      intervalo = Math.max(0.06, intervalo * 0.93);
      k++;
    }
  }

  const SONS = {
    // cálculo do resultado: o arpejo acelera e o solo sobe até a hora de estourar (dura quase os 3 segundos da tela)
    carregando(c) { subida(c, 2.9); },
    // resultado na tela: acorde de lá aberto palhetado de baixo para cima, baixo grave, deslize de guitarra e uma nota de solo cantada
    estouro(c) {
      bumbo(c, { ganho: 0.28, dur: 0.4 });
      baixo(c, { freq: 55, dur: 1.6, ganho: 0.24 });
      acorde(c, { notas: [A2, E3, A3, C4, E4, A4], passo: 0.032, dur: 2, ganho: 0.1, forca: 2.6, reverb: 0.5, eco: 0.3 });
      solo(c, { freq: A3, de: 110, deslize: 0.25, dur: 0.5, ganho: 0.07, reverb: 0.3, eco: 0.2 });
      solo(c, { freq: E5, de: D5, em: 0.12, dur: 1.8, ganho: 0.1, vibrato: 0.014, reverb: 0.6, eco: 0.4 });
      ruido(c, { dur: 1.5, ganho: 0.04, freq: 6000, tipo: 'highpass', ataque: 0.12, reverb: 0.5 });
    },
    // botão grande: ligar a máquina. Sopro e sub-grave que sobem e, no pico, uma pancada seca com metal que ressoa
    iniciar(c) {
      sint(c, { freq: 45, para: 70, dur: 0.55, ganho: 0.17, tipo: 'sine', corte: 400, ataque: 0.42 });
      ruido(c, { dur: 0.5, ganho: 0.07, freq: 180, freqFim: 2800, q: 0.9, ataque: 0.4 });
      sint(c, { freq: 100, para: 38, em: 0.45, dur: 0.45, ganho: 0.22, tipo: 'sine', corte: 700 });
      ruido(c, { em: 0.45, dur: 0.03, ganho: 0.14, freq: 2600, q: 2 });
      metal(c, { freq: 165, razao: 2.76, indice: 2.2, em: 0.45, dur: 1.5, ganho: 0.07, reverb: 0.6 });
    },
    // resposta escolhida: uma nota de guitarra limpa e brilhante
    pop(c) {
      corda(c, { freq: E4, dur: 0.6, ganho: 0.22, forca: 2, reverb: 0.3, eco: 0.2 });
      ruido(c, { dur: 0.012, ganho: 0.04, freq: 4000, tipo: 'highpass' });
    },
    // avançar (botão OK): duas notas subindo, tom e quinta
    ok(c) {
      corda(c, { freq: A3, dur: 0.5, ganho: 0.2, reverb: 0.25, eco: 0.25 });
      corda(c, { freq: E4, em: 0.08, dur: 0.7, ganho: 0.22, reverb: 0.35, eco: 0.3 });
    },
    // voltar: as duas notas descendo
    voltar(c) {
      corda(c, { freq: E4, dur: 0.4, ganho: 0.17, reverb: 0.2, eco: 0.2 });
      corda(c, { freq: A3, em: 0.08, dur: 0.55, ganho: 0.18, reverb: 0.3, eco: 0.25 });
    },
    // tecla seca de painel: uma nota curta abafada, como a palma da mão na corda (botões do site e áreas do radar)
    tecla(c) {
      corda(c, { freq: A3, dur: 0.18, ganho: 0.3, amortece: 0.97, forca: 2.4 });
      ruido(c, { dur: 0.012, ganho: 0.06, freq: 3500, tipo: 'highpass' });
    },
    // conversar no WhatsApp: arpejo subindo e uma nota de solo cantada com vibrato
    whatsapp(c) {
      acorde(c, { notas: [E4, A4, C5], passo: 0.075, dur: 0.6, ganho: 0.18, forca: 2.2, reverb: 0.4, eco: 0.35 });
      solo(c, { freq: E5, de: D5, em: 0.2, dur: 0.8, ganho: 0.1, reverb: 0.5, eco: 0.4 });
      baixo(c, { freq: 55, dur: 0.5, ganho: 0.12 });
    },
  };

  window.vrEfeitos = {
    tocar(nome) {
      try {
        const c = contexto();
        if (c && SONS[nome]) SONS[nome](c);
      } catch { /* o navegador recusou: segue sem som */ }
    },
  };
})();
