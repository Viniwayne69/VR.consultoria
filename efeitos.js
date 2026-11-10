'use strict';

/**
 * Efeitos de som dos botões. Não usam arquivos: cada som é sintetizado na hora pelo navegador (Web Audio). Todos seguem a mesma
 * família do som do botão grande de iniciar: sub-grave e sopro que sobem, uma pancada seca grave com um estalo e metal escuro
 * (síntese FM) que ressoa numa sala de reverberação. Os botões comuns usam só a pancada e o metal, em versão curta; o cálculo do
 * resultado usa o sopro e o sub-grave crescendo, com pancadas que aceleram.
 * Usado pelo site e pelo diagnóstico: window.vrEfeitos.tocar('pop').
 * Nomes: iniciar (botão grande, ligar a máquina), pop (resposta escolhida), ok (avançar), voltar, tecla (botões do site e áreas
 * do radar), whatsapp (conversar), carregando (tensão que cresce durante o cálculo do resultado) e estouro (quando o resultado aparece).
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

  // Resposta de uma sala escura: ruído que decai e vai perdendo os agudos com o tempo (gerada na hora, sem arquivo)
  function respostaDaSala(c) {
    const n = Math.floor(c.sampleRate * 1.9);
    const ir = c.createBuffer(2, n, c.sampleRate);
    for (let canal = 0; canal < 2; canal++) {
      const d = ir.getChannelData(canal);
      let y = 0;
      for (let i = 0; i < n; i++) {
        const t = i / n;
        const x = (Math.random() * 2 - 1) * Math.pow(1 - t, 3.2);
        y += (0.55 - 0.45 * t) * (x - y);
        d[i] = i < c.sampleRate * 0.012 ? 0 : y;
      }
    }
    return ir;
  }

  // Mesa de som: tudo passa por um compressor (evita estouro quando vários sons se somam) e uma parte pode ir para a sala
  const mesas = new WeakMap();
  function mesa(c) {
    let m = mesas.get(c);
    if (m) return m;
    const seco = c.createGain();
    seco.gain.value = 0.9;
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.knee.value = 14;
    comp.ratio.value = 5;
    comp.attack.value = 0.003;
    comp.release.value = 0.16;
    seco.connect(comp).connect(c.destination);
    const sala = c.createConvolver();
    sala.buffer = respostaDaSala(c);
    const retorno = c.createGain();
    retorno.gain.value = 0.9;
    sala.connect(retorno).connect(seco);
    m = { seco, sala };
    mesas.set(c, m);
    return m;
  }

  // Liga uma saída à mesa; reverb é a quantidade (0 a 1) que também vai para a sala
  function saida(c, no, reverb) {
    const m = mesa(c);
    no.connect(m.seco);
    if (reverb) {
      const g = c.createGain();
      g.gain.value = reverb;
      no.connect(g).connect(m.sala);
    }
  }

  // Oscilador com filtro passa-baixa e queda exponencial. Com ataque longo vira uma onda que cresce (sub-grave que sobe)
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

  // Ruído filtrado: estalo ou sopro de ar. Com ataque, o sopro cresce até o máximo antes de decair
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

  // Pancada seca e grave (seno que cai de frequência) e o estalo curto que a acompanha: a base de todos os sons
  const golpe = (c, { em = 0, ganho = 0.2, freq = 100, para = 38, dur = 0.3 }) => sint(c, { freq, para, em, dur, ganho, tipo: 'sine', corte: 700 });
  const estalo = (c, { em = 0, ganho = 0.1 }) => ruido(c, { em, dur: 0.03, ganho, freq: 2600, q: 2 });

  // Tensão que cresce: sub-grave e sopro sobem até o fim, e pancadas com metal batem cada vez mais rápido e mais fortes
  function subida(c, dur) {
    sint(c, { freq: 40, para: 90, dur, ganho: 0.08, tipo: 'sine', corte: 400, ataque: dur - 0.1 });
    ruido(c, { dur, ganho: 0.04, freq: 180, freqFim: 4500, q: 0.9, ataque: dur - 0.1 });
    let t = 0.15;
    let intervalo = 0.55;
    let k = 0;
    while (t < dur - 0.1) {
      const forca = t / dur;
      golpe(c, { em: t, ganho: 0.06 + 0.07 * forca, freq: 100, para: 42, dur: 0.16 });
      estalo(c, { em: t, ganho: 0.025 + 0.035 * forca });
      if (k % 2 === 0) metal(c, { freq: 110 * (1 + forca), indice: 1.2, em: t, dur: 0.3, ganho: 0.015 + 0.02 * forca, reverb: 0.3 });
      t += intervalo;
      intervalo = Math.max(0.11, intervalo * 0.84);
      k++;
    }
  }

  const SONS = {
    // cálculo do resultado: a tensão cresce até a hora de estourar (dura quase os 3 segundos da tela)
    carregando(c) { subida(c, 2.9); },
    // resultado na tela: a pancada grande. Queda de sub-grave, ar que se solta e metal grave que ressoa por bastante tempo
    estouro(c) {
      golpe(c, { ganho: 0.36, freq: 100, para: 27, dur: 1.3 });
      ruido(c, { dur: 0.9, ganho: 0.26, freq: 3500, freqFim: 180, q: 0.7, reverb: 0.3 });
      ruido(c, { dur: 0.04, ganho: 0.12, freq: 4000, tipo: 'highpass' });
      metal(c, { freq: 110, razao: 2.76, indice: 2.5, dur: 2.2, ganho: 0.12, reverb: 0.7 });
      metal(c, { freq: 220, razao: 1.41, indice: 1.5, em: 0.02, dur: 1.6, ganho: 0.07, reverb: 0.6 });
      metal(c, { freq: 165, razao: 2.76, indice: 2, em: 0.06, dur: 1.8, ganho: 0.06, reverb: 0.6 });
    },
    // botão grande: ligar a máquina. Sopro e sub-grave que sobem e, no pico, uma pancada seca com metal que ressoa
    iniciar(c) {
      sint(c, { freq: 45, para: 70, dur: 0.55, ganho: 0.17, tipo: 'sine', corte: 400, ataque: 0.42 });
      ruido(c, { dur: 0.5, ganho: 0.07, freq: 180, freqFim: 2800, q: 0.9, ataque: 0.4 });
      golpe(c, { em: 0.45, ganho: 0.22, dur: 0.45 });
      ruido(c, { em: 0.45, dur: 0.03, ganho: 0.14, freq: 2600, q: 2 });
      metal(c, { freq: 165, razao: 2.76, indice: 2.2, em: 0.45, dur: 1.5, ganho: 0.07, reverb: 0.6 });
    },
    // resposta escolhida: uma pancada com um toque de metal
    pop(c) {
      golpe(c, { ganho: 0.36, dur: 0.25 });
      estalo(c, { ganho: 0.16 });
      metal(c, { freq: 220, indice: 1.5, dur: 0.5, ganho: 0.09, reverb: 0.4 });
    },
    // avançar (botão OK): duas batidas de metal, a segunda uma quinta acima
    ok(c) {
      golpe(c, { ganho: 0.32, dur: 0.2 });
      estalo(c, { ganho: 0.12 });
      metal(c, { freq: 220, indice: 1.2, dur: 0.35, ganho: 0.09, reverb: 0.35 });
      metal(c, { freq: 330, indice: 1.2, em: 0.09, dur: 0.6, ganho: 0.09, reverb: 0.45 });
    },
    // voltar: as duas batidas descendo
    voltar(c) {
      metal(c, { freq: 330, indice: 1.2, dur: 0.3, ganho: 0.05, reverb: 0.3 });
      golpe(c, { em: 0.09, ganho: 0.12, dur: 0.2 });
      metal(c, { freq: 220, indice: 1.2, em: 0.09, dur: 0.5, ganho: 0.055, reverb: 0.4 });
    },
    // tecla seca de painel: estalo, pancada curta e um toque de metal (botões do site e áreas do radar)
    tecla(c) {
      estalo(c, { ganho: 0.35 });
      golpe(c, { ganho: 0.3, dur: 0.12 });
      metal(c, { freq: 330, indice: 1, dur: 0.22, ganho: 0.05, reverb: 0.25 });
    },
    // conversar no WhatsApp: um pequeno sopro que sobe e, no pico, a pancada com dois toques de metal
    whatsapp(c) {
      sint(c, { freq: 45, para: 70, dur: 0.22, ganho: 0.1, tipo: 'sine', corte: 400, ataque: 0.16 });
      ruido(c, { dur: 0.2, ganho: 0.04, freq: 180, freqFim: 2800, q: 0.9, ataque: 0.15 });
      golpe(c, { em: 0.18, ganho: 0.2, dur: 0.3 });
      estalo(c, { em: 0.18, ganho: 0.1 });
      metal(c, { freq: 247, indice: 1.5, em: 0.18, dur: 0.6, ganho: 0.06, reverb: 0.5 });
      metal(c, { freq: 370, indice: 1.5, em: 0.28, dur: 0.9, ganho: 0.06, reverb: 0.6 });
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
