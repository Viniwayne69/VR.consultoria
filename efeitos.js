'use strict';

/**
 * Efeitos de som dos botões. Não usam arquivos: cada som é sintetizado na hora pelo navegador (Web Audio), no mesmo estilo dos sons
 * do RetroBook (tons curtos e baixos, com um pouco de ruído). Usado pelo site e pelo diagnóstico: window.vrEfeitos.tocar('pop').
 * Nomes: iniciar (botão grande, descarga elétrica), pop (resposta escolhida), ok (avançar), voltar, tecla (botões do site e áreas
 * do radar), whatsapp (conversar), carregando (sobe durante o cálculo do resultado) e estouro (quando o resultado aparece).
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

  function tom(c, { freq, para, em = 0, dur, ganho, tipo = 'sine' }) {
    const ini = c.currentTime + em;
    const osc = c.createOscillator();
    const amp = c.createGain();
    osc.type = tipo;
    osc.frequency.setValueAtTime(freq, ini);
    if (para) osc.frequency.exponentialRampToValueAtTime(para, ini + dur);
    amp.gain.setValueAtTime(0.0001, ini);
    amp.gain.exponentialRampToValueAtTime(ganho, ini + 0.008);
    amp.gain.exponentialRampToValueAtTime(0.0001, ini + dur);
    osc.connect(amp).connect(c.destination);
    osc.start(ini);
    osc.stop(ini + dur + 0.02);
  }

  function ruido(c, { em = 0, dur, ganho, freq }) {
    const ini = c.currentTime + em;
    const n = Math.max(1, Math.floor(c.sampleRate * dur));
    const buf = c.createBuffer(1, n, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const fonte = c.createBufferSource();
    fonte.buffer = buf;
    const filtro = c.createBiquadFilter();
    filtro.type = 'bandpass';
    filtro.frequency.value = freq;
    const amp = c.createGain();
    amp.gain.setValueAtTime(ganho, ini);
    amp.gain.exponentialRampToValueAtTime(0.0001, ini + dur);
    fonte.connect(filtro).connect(amp).connect(c.destination);
    fonte.start(ini);
  }

  // Som que cresce: tom, ruído filtrado e uma serra grave sobem juntos em direção ao agudo e ao volume máximo
  function subida(c, dur) {
    const ini = c.currentTime;
    const fim = ini + dur;
    const tom1 = c.createOscillator();
    const g1 = c.createGain();
    tom1.type = 'sine';
    tom1.frequency.setValueAtTime(110, ini);
    tom1.frequency.exponentialRampToValueAtTime(1500, fim);
    g1.gain.setValueAtTime(0.0001, ini);
    g1.gain.exponentialRampToValueAtTime(0.11, fim - 0.05);
    g1.gain.exponentialRampToValueAtTime(0.0001, fim);
    tom1.connect(g1).connect(c.destination);
    tom1.start(ini); tom1.stop(fim + 0.02);

    const serra = c.createOscillator();
    const g2 = c.createGain();
    serra.type = 'sawtooth';
    serra.frequency.setValueAtTime(55, ini);
    serra.frequency.exponentialRampToValueAtTime(700, fim);
    g2.gain.setValueAtTime(0.0001, ini);
    g2.gain.exponentialRampToValueAtTime(0.04, fim - 0.05);
    g2.gain.exponentialRampToValueAtTime(0.0001, fim);
    serra.connect(g2).connect(c.destination);
    serra.start(ini); serra.stop(fim + 0.02);

    const n = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, n, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const fonte = c.createBufferSource();
    fonte.buffer = buf;
    const filtro = c.createBiquadFilter();
    filtro.type = 'bandpass';
    filtro.Q.value = 2.5;
    filtro.frequency.setValueAtTime(300, ini);
    filtro.frequency.exponentialRampToValueAtTime(6000, fim);
    const g3 = c.createGain();
    g3.gain.setValueAtTime(0.0001, ini);
    g3.gain.exponentialRampToValueAtTime(0.09, fim - 0.05);
    g3.gain.exponentialRampToValueAtTime(0.0001, fim);
    fonte.connect(filtro).connect(g3).connect(c.destination);
    fonte.start(ini);
  }

  const SONS = {
    // cálculo do resultado: o som vai crescendo até a hora de estourar (dura quase os 3 segundos da tela)
    carregando(c) { subida(c, 2.9); },
    // resultado na tela: estouro grave com explosão de ruído e faíscas que caem
    estouro(c) {
      tom(c, { freq: 140, para: 32, dur: 0.6, ganho: 0.3 });
      tom(c, { freq: 70, para: 28, dur: 0.5, ganho: 0.2 });
      ruido(c, { dur: 0.55, ganho: 0.2, freq: 1500 });
      ruido(c, { dur: 0.3, ganho: 0.1, freq: 5200 });
      [1760, 1320, 990, 1568, 2093].forEach((f, i) => tom(c, { freq: f, para: f * 0.6, em: 0.04 + i * 0.05, dur: 0.32, ganho: 0.04 }));
    },
    // botão grande: pancada grave de carimbo, descarga elétrica que sobe e um brilho no fim
    iniciar(c) {
      tom(c, { freq: 150, para: 60, dur: 0.16, ganho: 0.26 });
      ruido(c, { dur: 0.05, ganho: 0.09, freq: 2200 });
      tom(c, { freq: 220, para: 1700, em: 0.02, dur: 0.3, ganho: 0.05, tipo: 'sawtooth' });
      ruido(c, { em: 0.04, dur: 0.26, ganho: 0.05, freq: 4200 });
      tom(c, { freq: 880, para: 1760, em: 0.22, dur: 0.2, ganho: 0.05 });
    },
    // resposta escolhida
    pop(c) { tom(c, { freq: 520, para: 880, dur: 0.09, ganho: 0.1 }); },
    // avançar (botão OK)
    ok(c) {
      tom(c, { freq: 480, para: 820, dur: 0.1, ganho: 0.08 });
      ruido(c, { dur: 0.08, ganho: 0.03, freq: 3600 });
    },
    voltar(c) { tom(c, { freq: 620, para: 330, dur: 0.11, ganho: 0.09 }); },
    // tecla seca: botões do site e áreas do radar
    tecla(c) {
      ruido(c, { dur: 0.035, ganho: 0.1, freq: 2600 });
      tom(c, { freq: 1400, para: 900, dur: 0.05, ganho: 0.05 });
    },
    // conversar no WhatsApp: dois toques suaves, o segundo mais agudo
    whatsapp(c) {
      tom(c, { freq: 880, dur: 0.22, ganho: 0.08 });
      tom(c, { freq: 1175, em: 0.09, dur: 0.34, ganho: 0.07 });
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
