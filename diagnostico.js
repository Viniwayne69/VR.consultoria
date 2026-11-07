'use strict';

// CONFIGURAÇÃO · WhatsApp que recebe o resultado, com DDI e DDD, só números (exemplo: '5581999999999').
// Vazio: o WhatsApp abre só com a mensagem pronta e a pessoa escolhe o contato.
const WHATSAPP_NUMBER = '';
const SOM_ARQUIVO = 'assets/audio/get-away.mp3';

// ============================ Conteúdo: perguntas, áreas e perfis ============================
// Para mudar uma pergunta, opção, perfil ou rótulo, edite aqui: o resto só lê destes dados.

/** As 11 perguntas que pontuam: cada uma vale pontos de dificuldade (0, 1 ou 2). */
const camposDeDor = ['escolha', 'lembrado', 'procura', 'chega', 'medo', 'cobraMenos', 'sobra', 'doente', 'horas', 'doisAnos', 'plano'];

/** Seis áreas: cinco com duas perguntas e Dinheiro com uma. A área com mais dificuldade (em proporção) é a mais fraca. */
const areas = [
  { id: 'desejo', rotulo: 'Desejo', forte: 'os clientes já escolhem você', meio: 'parte dos clientes já escolhe você, e há espaço para mais', fraco: 'a sua marca ainda não é a primeira escolha do cliente', campos: ['escolha', 'lembrado'] },
  { id: 'vendas', rotulo: 'Vendas', forte: 'quem se interessa costuma comprar', meio: 'dá para converter muito mais quem se interessa', fraco: 'muita gente se interessa e ainda não compra', campos: ['procura', 'chega'] },
  { id: 'preco', rotulo: 'Preço', forte: 'você cobra com tranquilidade o que vale', meio: 'o seu preço tem espaço para subir', fraco: 'a sua marca ainda não sustenta o preço que merece', campos: ['medo', 'cobraMenos'] },
  { id: 'dinheiro', rotulo: 'Dinheiro', forte: 'o dinheiro acompanha o seu trabalho', meio: 'o dinheiro pode acompanhar melhor o trabalho', fraco: 'o seu trabalho ainda não rende o que deveria', campos: ['sobra'] },
  { id: 'liberdade', rotulo: 'Liberdade', forte: 'o negócio anda mesmo sem você', meio: 'o negócio pode andar melhor sem você', fraco: 'o negócio ainda depende só de você', campos: ['doente', 'horas'] },
  { id: 'futuro', rotulo: 'Futuro', forte: 'o seu negócio caminha para crescer', meio: 'o seu negócio pode crescer ainda mais', fraco: 'o seu negócio ainda não é uma marca desejada', campos: ['doisAnos', 'plano'] },
];

/** Em empate de áreas, vale esta ordem: da que mais liga à oferta para a que menos liga. */
const prioridadeAreas = ['desejo', 'preco', 'vendas', 'liberdade', 'dinheiro', 'futuro'];

/**
 * Dezesseis perguntas: nome, empresa, o que quer conseguir (sem pontos), 11 de dor, faturamento e WhatsApp.
 * Nas de dor, `pontos` dá a dificuldade de cada opção (0, 1 ou 2), na mesma ordem de `opcoes`. "Não sei ao certo" vale 1.
 */
const perguntas = [
  { id: 'nome', tipo: 'texto', titulo: 'Seu primeiro nome?', placeholder: 'Digite seu nome' },
  { id: 'empresa', tipo: 'texto', titulo: 'Nome do seu negócio?', placeholder: 'Ex: Almeida & Silva' },
  { id: 'trava', tipo: 'opcoes', titulo: 'O que você mais quer conseguir?', opcoes: ['Atrair mais clientes', 'Fechar mais vendas', 'Cobrar mais caro', 'Ficar com mais dinheiro', 'Ter uma equipe melhor', 'Não sei ao certo', 'Outro'] },
  { id: 'escolha', tipo: 'opcoes', titulo: 'Quantos clientes voltam a comprar?', opcoes: ['Quase todos', 'Mais da metade', 'Poucos', 'Quase nenhum', 'Não sei ao certo'], pontos: [0, 1, 2, 2, 1], dor: 'clientes não voltam' },
  { id: 'lembrado', tipo: 'opcoes', titulo: 'Clientes novos por indicação, nos últimos 3 meses?', opcoes: ['Vários', 'Alguns', 'Um ou dois', 'Nenhum', 'Não sei ao certo'], pontos: [0, 1, 2, 2, 1], dor: 'poucas indicações' },
  { id: 'procura', tipo: 'opcoes', titulo: 'De cada 10 que pedem preço, quantos compram?', opcoes: ['8 a 10', '5 a 7', '2 a 4', '0 a 1', 'Nunca contei'], pontos: [0, 0, 1, 2, 1], dor: 'poucos interessados compram' },
  { id: 'chega', tipo: 'opcoes', titulo: 'O cliente já chega querendo comprar?', opcoes: ['Quase sempre', 'Metade das vezes', 'Poucas vezes', 'Quase nunca', 'Não sei ao certo'], pontos: [0, 1, 2, 2, 1], dor: 'o cliente não chega querendo comprar' },
  { id: 'medo', tipo: 'opcoes', titulo: 'O seu preço, perto dos concorrentes, é:', opcoes: ['Maior', 'Parecido', 'Menor', 'Não sei ao certo'], pontos: [0, 1, 2, 1], dor: 'cobra menos que os concorrentes' },
  { id: 'cobraMenos', tipo: 'opcoes', titulo: 'Você cobra menos do que gostaria para vender?', opcoes: ['Não, cobro o que quero', 'Às vezes', 'Quase sempre', 'Não sei ao certo'], pontos: [0, 1, 2, 1], dor: 'cobra menos do que gostaria para vender' },
  { id: 'sobra', tipo: 'opcoes', titulo: 'Quanto sobrou no último mês, depois de pagar tudo?', opcoes: ['Um bom valor', 'Pouco', 'Nada', 'Faltou', 'Não sei ao certo'], pontos: [0, 1, 2, 2, 1], dor: 'não sobra dinheiro' },
  { id: 'doente', tipo: 'opcoes', titulo: 'Se você tirasse 30 dias de férias, o que aconteceria?', opcoes: ['Tudo normal', 'Com dificuldade', 'Cairia muito', 'Pararia', 'Nunca pensei nisso'], pontos: [0, 1, 2, 2, 1], dor: 'o negócio para sem ele' },
  { id: 'horas', tipo: 'opcoes', titulo: 'Quantas horas por semana você trabalha no negócio?', opcoes: ['Até 30 horas', 'De 30 a 44 horas', 'De 45 a 60 horas', 'Mais de 60 horas', 'Nunca contei'], pontos: [0, 1, 2, 2, 1], dor: 'trabalha horas demais' },
  { id: 'doisAnos', tipo: 'opcoes', titulo: 'Como será a sua empresa em 2 anos?', opcoes: ['Muito maior', 'Um pouco maior', 'Igual', 'Menor', 'Não sei ao certo'], pontos: [0, 1, 2, 2, 1], dor: 'não vê o negócio crescendo' },
  { id: 'plano', tipo: 'opcoes', titulo: 'Você tem um plano para os próximos 12 meses?', opcoes: ['Sim, com metas', 'Só na cabeça', 'Não tenho', 'Nunca pensei nisso'], pontos: [0, 1, 2, 2], dor: 'sem plano para os próximos 12 meses' },
  { id: 'faturamento', tipo: 'opcoes', titulo: 'Faturamento anual?', opcoes: ['Ainda não faturamos', 'Até R$ 60 mil/ano', 'R$ 60 – 180 mil/ano', 'R$ 180 – 500 mil/ano', 'R$ 500 mil – 1 mi/ano', 'R$ 1 – 5 mi/ano', 'Mais de R$ 5 mi/ano'] },
  { id: 'telefone', tipo: 'tel', titulo: 'Seu WhatsApp?', ajuda: 'Com DDD', placeholder: '(11) 99999-9999' },
];

/** Depois do nome, só esta pergunta chama a pessoa pelo primeiro nome, para não ficar repetitivo. */
const titulosComNome = { trava: (n) => `${n}, o que você mais quer conseguir?` };

/** Perfis pelos pontos de dificuldade (0 a 22). */
const perfis = [
  { ate: 5, titulo: 'MARCA JÁ DESEJADA', texto: 'Ela já atrai, vamos ver até onde pode chegar' },
  { ate: 13, titulo: 'DESEJO EM CRESCIMENTO', texto: 'A base existe, falta mais gente desejá-la' },
  { ate: 22, titulo: 'PRONTA PARA SER DESEJADA', texto: 'Ela pode ser a escolha do mercado, e o caminho começa agora' },
];

const forte = (p) => p <= 0.25;
const fraca = (p) => p >= 0.75;
/** Padrões que leem duas áreas juntas. O primeiro que combina vira o título do resultado (no lugar do perfil). */
const padroes = [
  { quando: (p) => forte(p.desejo) && fraca(p.preco), titulo: 'DESEJADA, MAS BARATA', texto: 'Os clientes já escolhem você, mas o preço ainda não mostra isso' },
  { quando: (p) => forte(p.vendas) && fraca(p.liberdade), titulo: 'VENDE BEM, MAS PRESO', texto: 'As vendas vão bem, mas o negócio ainda depende só de você' },
  { quando: (p) => fraca(p.desejo) && forte(p.vendas), titulo: 'VENDE, MAS NÃO ENCANTA', texto: 'Você vende, mas a marca ainda não é a escolha do cliente' },
  { quando: (p) => forte(p.desejo) && fraca(p.vendas), titulo: 'DESEJADA, MAS NÃO VENDE', texto: 'A marca chama atenção, falta transformar interesse em venda' },
  { quando: (p) => fraca(p.preco) && fraca(p.dinheiro), titulo: 'PREÇO BAIXO, CAIXA CURTO', texto: 'O preço baixo e o dinheiro curto andam juntos, e dá para mudar isso' },
  { quando: (p) => fraca(p.liberdade) && fraca(p.dinheiro), titulo: 'MUITA HORA, POUCA SOBRA', texto: 'Você trabalha muito e o dinheiro não acompanha, e dá para mudar isso' },
  { quando: (p) => fraca(p.desejo) && fraca(p.futuro), titulo: 'MARCA A CONSTRUIR', texto: 'Ainda não há uma marca desejada, e este é o melhor momento para começar' },
  { quando: (p) => forte(p.desejo) && fraca(p.futuro), titulo: 'BOA MARCA, SEM PLANO', texto: 'A marca já atrai, falta um plano para crescer' },
];

const t = {
  boasVindas: {
    rotulo: 'Diagnóstico gratuito',
    antes: 'O QUANTO A SUA MARCA É',
    destaque: 'DESEJADA',
    depois: 'HOJE?',
    paragrafo: 'Descubra o que pode estar impedindo sua marca de vender mais, com resultado na hora',
    recebe: ['Sua nota de desejo, de 1 a 10', 'Onde crescer mais', 'O primeiro passo'],
    fotoAlt: 'Imagem ilustrativa: a fachada de uma loja de shopping cheia de clientes e iluminada.',
    botao: 'Iniciar diagnóstico gratuito',
  },
  som: 'Escute um som enquanto nos conta sobre você',
  somCurto: 'Som',
  somLigado: 'Som ligado',
  ok: 'OK',
  dicaEnter: 'ou pressione Enter',
  voltar: 'Voltar',
  ver: 'Ver o meu resultado',
  de: 'de',
  incentivos: { quaseLa: 'Quase lá', ultima: 'Última pergunta' },
  erros: {
    obrigatoria: 'Esta pergunta é obrigatória',
    nome: 'Informe o seu primeiro nome',
    telefone: 'Informe um WhatsApp válido com DDD',
  },
  resultado: {
    rotulo: 'o seu resultado',
    medidorTitulo: 'O quanto a sua marca é desejada',
    medidorExtremos: ['Pouco', 'Muito'],
    whatsappBotao: 'Falar com o Vinicius no WhatsApp',
    calculando: 'Calculando o seu resultado',
    passos: ['Lendo as suas respostas', 'Cruzando as seis áreas', 'Achando o ponto mais fraco'],
    pontoFraco: 'Resolver agora',
    radarTitulo: 'A sua marca por área',
    toque: 'Toque em uma área',
    forte: 'Já é forte',
    atencao: 'Em crescimento',
    fragil: 'A construir',
    legendaBotao: 'Um plano de ação claro para a sua marca ser mais desejada e vender mais',
  },
};

// ============================ Cálculo do diagnóstico (só pelas respostas, sem IA) ============================
// Cada opção das perguntas de dor vale 0, 1 ou 2 pontos. A soma (0 a 22) vira a nota de 1 a 10 de desejo pela marca
// (quanto menos dificuldade, mais desejo), e a soma por área mostra qual está mais fraca.

function pontosDe(id, resposta) {
  const pergunta = perguntas.find((p) => p.id === id);
  if (!pergunta || pergunta.tipo !== 'opcoes') return 0;
  const indice = pergunta.opcoes.indexOf(resposta);
  if (indice < 0) return 0;
  return pergunta.pontos?.[indice] ?? Math.min(indice, 2);
}

function calcularDiagnostico(r) {
  const pontos = camposDeDor.reduce((soma, id) => soma + pontosDe(id, r[id]), 0);
  const maximo = camposDeDor.length * 2;
  const porArea = Object.fromEntries(areas.map((a) => [a.id, a.campos.reduce((soma, id) => soma + pontosDe(id, r[id]), 0)]));
  const proporcoes = Object.fromEntries(areas.map((a) => [a.id, porArea[a.id] / (a.campos.length * 2)]));
  const padrao = padroes.find((p) => p.quando(proporcoes));
  const base = perfis.find((p) => pontos <= p.ate) ?? perfis[perfis.length - 1];
  const perfil = padrao ?? { titulo: base.titulo, texto: base.texto };

  // A área mais fraca é a de maior proporção de pontos; em empate vale a ordem de prioridade
  let fraco = null;
  let melhor = 0;
  for (const id of prioridadeAreas) {
    const area = areas.find((a) => a.id === id);
    const proporcao = porArea[id] / (area.campos.length * 2);
    if (proporcao > melhor) {
      melhor = proporcao;
      fraco = id;
    }
  }
  return { pontos, nota: Math.round(1 + ((maximo - pontos) / maximo) * 9), perfil, porArea, fraco };
}

// ============================ Utilidades ============================
const apenasDigitos = (valor) => valor.replace(/\D/g, '');

/** Máscara de WhatsApp brasileiro: (11) 99999-9999 ou (11) 9999-9999. */
function formatarTelefone(valor) {
  let d = apenasDigitos(valor);
  if (d.startsWith('55') && d.length > 11) d = d.slice(2);
  d = d.slice(0, 11);
  if (!d) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

const capitalizar = (s) => (s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : '');
const doisDigitos = (n) => String(n).padStart(2, '0');
const semMovimento = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Vibração curta no celular (ignora onde não existe). */
function vibrar(padrao) {
  try { navigator.vibrate?.(padrao); } catch { /* sem vibração, segue normal */ }
}

/** Cria um elemento. Textos entram sempre como texto (nunca como HTML), para o que a pessoa digita ser seguro. */
function h(tag, props = {}, ...filhos) {
  const el = document.createElement(tag);
  for (const [chave, valor] of Object.entries(props)) {
    if (valor == null || valor === false) continue;
    if (chave === 'class') el.className = valor;
    else if (chave === 'style') el.style.cssText = valor;
    else if (chave.startsWith('on')) el.addEventListener(chave.slice(2), valor);
    else el.setAttribute(chave, valor === true ? '' : valor);
  }
  filhos.flat().forEach((f) => { if (f != null && f !== false) el.append(f); });
  return el;
}
const accent = (texto) => h('span', { class: 'dx-accent' }, texto);

// ============================ Estado e tela ============================
const total = perguntas.length;
const respostas = Object.fromEntries(perguntas.map((p) => [p.id, '']));
const estado = { etapa: -1, direcao: 'frente', calculando: false, armadilha: '' };

const raiz = document.getElementById('dx');
const palco = document.getElementById('dx-stage');
const progresso = document.getElementById('dx-bar');
const nav = document.getElementById('dx-nav');
let erroEl = null;
let contagemFrame = 0;

// Progresso: uma lâmina inclinada por pergunta
const laminas = Array.from({ length: total }, () => h('span'));
progresso.append(...laminas);

const primeiroNome = () => capitalizar((respostas.nome.trim().split(/\s+/)[0]) || '');

function mostrarErro(mensagem) {
  if (erroEl) erroEl.textContent = mensagem;
}

function validar(pergunta) {
  const valor = respostas[pergunta.id].trim();
  if (!valor) return t.erros.obrigatoria;
  if (pergunta.id === 'nome' && valor.length < 2) return t.erros.nome;
  if (pergunta.id === 'telefone' && ![10, 11].includes(apenasDigitos(valor).length)) return t.erros.telefone;
  return '';
}

function ir(proxima) {
  estado.direcao = proxima >= estado.etapa ? 'frente' : 'tras';
  estado.etapa = proxima;
  desenhar();
}

function avancar() {
  const pergunta = perguntas[estado.etapa];
  if (!pergunta) return;
  const mensagem = validar(pergunta);
  if (mensagem) { mostrarErro(mensagem); return; }
  vibrar(10);
  if (estado.etapa === total - 1) finalizar();
  else ir(estado.etapa + 1);
}

// Sem servidor: o resultado é calculado aqui e chega ao Vinicius pela mensagem do WhatsApp.
function finalizar() {
  estado.direcao = 'frente';
  estado.etapa = total;
  estado.calculando = !estado.armadilha;
  desenhar();
  if (estado.calculando) setTimeout(() => { estado.calculando = false; desenhar(); }, 3000);
}

// Escolher uma opção marca e avança sozinho
function escolherOpcao(pergunta, opcao, botao) {
  mostrarErro('');
  vibrar(10);
  respostas[pergunta.id] = opcao;
  palco.querySelectorAll('.dx-opt').forEach((b) => b.setAttribute('aria-pressed', String(b === botao)));
  setTimeout(() => { if (estado.etapa === perguntas.indexOf(pergunta)) ir(estado.etapa + 1); }, 260);
}

// Atalho de teclado: A, B, C... escolhem a opção correspondente
document.addEventListener('keydown', (e) => {
  const pergunta = perguntas[estado.etapa];
  if (!pergunta || pergunta.tipo !== 'opcoes') return;
  if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
  const i = e.key.toUpperCase().charCodeAt(0) - 65;
  const opcao = pergunta.opcoes[i];
  if (opcao) escolherOpcao(pergunta, opcao, palco.querySelectorAll('.dx-opt')[i]);
});

function desenhar() {
  cancelAnimationFrame(contagemFrame);
  const { etapa } = estado;
  const emPergunta = etapa >= 0 && etapa < total;
  const resultado = etapa === total && !estado.calculando;

  laminas.forEach((lamina, i) => {
    lamina.className = etapa >= total || i < etapa ? 'is-done' : i === etapa ? 'is-now' : '';
  });
  raiz.classList.toggle('is-claro', resultado);
  nav.hidden = !emPergunta;

  let conteudo;
  if (etapa === -1) conteudo = telaBoasVindas();
  else if (emPergunta) conteudo = telaPergunta(perguntas[etapa]);
  else if (estado.calculando) conteudo = telaCalculando();
  else conteudo = telaResultado(calcularDiagnostico(respostas));

  const passo = h('div', { class: `dx-step${estado.direcao === 'tras' ? ' is-back' : ''}` }, conteudo,
    h('input', { class: 'dx-trap', 'aria-hidden': 'true', tabindex: '-1', autocomplete: 'off', value: estado.armadilha, oninput: (e) => { estado.armadilha = e.target.value; } }));
  palco.replaceChildren(passo);

  // Leva o foco para o campo (ou para o título) a cada nova etapa
  if (etapa >= 0) (palco.querySelector('.dx-field') || palco.querySelector('h1'))?.focus({ preventScroll: true });
  if (resultado) { vibrar([20, 60, 20]); contarNota(calcularDiagnostico(respostas).nota); }
  window.scrollTo({ top: 0, behavior: 'instant' });
}

// ---------- Boas-vindas ----------
function telaBoasVindas() {
  return h('div', { class: 'dx-welcome' },
    h('div', { class: 'dx-welcome-copy' },
      h('p', { class: 'eyebrow' }, t.boasVindas.rotulo),
      h('h1', { class: 'dx-display' }, `${t.boasVindas.antes} `, accent(t.boasVindas.destaque), ` ${t.boasVindas.depois}`),
      h('p', { class: 'dx-lead' }, t.boasVindas.paragrafo),
      h('button', { type: 'button', class: 'button', onclick: () => { som.ligarAoIniciar(); ir(0); } }, t.boasVindas.botao)),
    h('div', { class: 'dx-visual' },
      h('div', { class: 'dx-photo' },
        h('div', { class: 'dx-photo-frame' },
          h('img', { src: 'assets/loja-depois.webp', alt: t.boasVindas.fotoAlt, width: 1536, height: 1024 }))),
      h('img', { class: 'stamp dx-stamp', src: 'assets/carimbo-vr.svg', alt: '', 'aria-hidden': 'true', width: 148, height: 148 })),
    h('ol', { class: 'dx-gets' }, t.boasVindas.recebe.map((item, i) =>
      h('li', {}, h('b', { class: 'number' }, doisDigitos(i + 1)), h('span', {}, item)))));
}

// ---------- Pergunta ----------
function telaPergunta(pergunta) {
  const nome = primeiroNome();
  const titulo = nome && titulosComNome[pergunta.id] ? titulosComNome[pergunta.id](nome) : pergunta.titulo;
  const etapa = estado.etapa;
  const incentivo = etapa === total - 1 ? t.incentivos.ultima : etapa === total - 3 ? t.incentivos.quaseLa : '';
  erroEl = h('p', { id: 'dx-erro', role: 'alert', class: 'dx-error' });

  const contador = h('p', { class: 'dx-count', 'aria-label': `Pergunta ${etapa + 1} ${t.de} ${total}` },
    h('b', { 'aria-hidden': 'true' }, doisDigitos(etapa + 1)),
    h('span', { 'aria-hidden': 'true' }, `/${doisDigitos(total)}`),
    incentivo && h('em', {}, incentivo));
  const cabecalho = [
    h('h1', { id: 'dx-pergunta', class: 'dx-display dx-q', tabindex: '-1' }, titulo),
    pergunta.ajuda && h('p', { class: 'dx-help' }, pergunta.ajuda),
  ];

  if (pergunta.tipo === 'texto' || pergunta.tipo === 'tel') {
    const campo = h('input', {
      class: 'dx-field',
      'aria-labelledby': 'dx-pergunta',
      'aria-describedby': 'dx-erro',
      type: pergunta.tipo === 'texto' ? 'text' : 'tel',
      inputmode: pergunta.tipo === 'tel' ? 'tel' : null,
      autocomplete: pergunta.id === 'nome' ? 'given-name' : pergunta.id === 'telefone' ? 'tel' : 'organization',
      placeholder: pergunta.placeholder,
      value: respostas[pergunta.id],
      oninput: (e) => {
        if (pergunta.id === 'telefone') e.target.value = formatarTelefone(e.target.value);
        respostas[pergunta.id] = e.target.value;
        mostrarErro('');
      },
      onkeydown: (e) => { if (e.key === 'Enter') { e.preventDefault(); avancar(); } },
    });
    return h('div', { class: 'dx-ask' }, contador,
      h('div', { class: 'dx-ask-main' }, cabecalho, campo,
        h('div', { class: 'dx-row' },
          h('button', { type: 'button', class: 'button', onclick: avancar }, pergunta.id === 'telefone' ? t.ver : t.ok),
          h('span', { class: 'dx-hint' }, t.dicaEnter)),
        erroEl));
  }

  const opcoes = pergunta.opcoes.map((opcao, i) => {
    const botao = h('button', {
      type: 'button',
      class: 'dx-opt dx-item',
      style: `--i:${i}`,
      'aria-pressed': String(respostas[pergunta.id] === opcao),
      onclick: () => escolherOpcao(pergunta, opcao, botao),
    }, h('span', { class: 'dx-key', 'aria-hidden': 'true' }, String.fromCharCode(65 + i)), opcao);
    return botao;
  });
  return h('div', { class: 'dx-ask' }, contador,
    h('div', { class: 'dx-ask-main' }, cabecalho,
      h('div', { role: 'group', 'aria-labelledby': 'dx-pergunta', class: `dx-options${pergunta.opcoes.length > 4 ? ' is-two' : ''}` }, opcoes),
      erroEl));
}

// ---------- Antecipação: o carimbo gira, as frases trocam e a faixa de listras enche ----------
function telaCalculando() {
  return h('div', { class: 'dx-calc', role: 'status' },
    h('img', { class: 'stamp', src: 'assets/carimbo-vr.svg', alt: '', 'aria-hidden': 'true', width: 132, height: 132 }),
    h('p', { class: 'eyebrow' }, t.resultado.calculando),
    h('p', { class: 'dx-passos', 'aria-hidden': 'true' }, t.resultado.passos.map((texto, i) => h('span', { style: `animation-delay:${i}s` }, texto))),
    h('div', { class: 'dx-calc-bar', 'aria-hidden': 'true' }, h('span')));
}

// ---------- Resultado em cena: medidor, radar das áreas, ponto mais fraco e WhatsApp ----------
const SVG = 'http://www.w3.org/2000/svg';
const RAIO = 88;
const RAIO_MIN = 20;
const CENTRO = 150;
const angulo = (i) => ((-90 + i * 60) * Math.PI) / 180;
const ponto = (i, raio) => [CENTRO + raio * Math.cos(angulo(i)), CENTRO + raio * Math.sin(angulo(i))];
const pontosSvg = (raios) => raios.map((r, i) => ponto(i, r).map((v) => v.toFixed(1)).join(',')).join(' ');
const nivelDe = (p) => (p === 0 ? 'forte' : p <= 0.5 ? 'meio' : 'fraco');

/** Monta um trecho de SVG a partir de texto fixo (só números calculados entram nele, nunca o que a pessoa digitou). */
function svg(markup, classe, viewBox) {
  const el = document.createElementNS(SVG, 'svg');
  el.setAttribute('viewBox', viewBox);
  el.setAttribute('aria-hidden', 'true');
  if (classe) el.setAttribute('class', classe);
  el.innerHTML = markup;
  return el;
}

function telaResultado(resultado) {
  const { nota, perfil, porArea, fraco } = resultado;
  const nome = primeiroNome();
  const proporcao = (id) => porArea[id] / (areas.find((x) => x.id === id).campos.length * 2);
  const raios = areas.map((a) => RAIO_MIN + (1 - proporcao(a.id)) * (RAIO - RAIO_MIN));
  const ang = -90 + nota * 18;
  const palavras = perfil.titulo.split(' ');

  // Medidor em arco (os cartões são escuros, então tudo aqui é papel e laranja sobre tinta): o ponteiro varre até a nota, passa um pouco e volta
  const ticks = [0, 2, 4, 6, 8, 10].map((v) => {
    const a = Math.PI * (1 - v / 10);
    return `<text x="${(120 + 114 * Math.cos(a)).toFixed(1)}" y="${(120 - 114 * Math.sin(a)).toFixed(1)}" font-size="9" font-weight="700" fill="#CDC5B5" text-anchor="middle" dominant-baseline="middle">${v}</text>`;
  }).join('');
  const medidor = svg(
    `<path d="M 20 120 A 100 100 0 0 1 220 120" pathLength="100" fill="none" stroke="#3A3437" stroke-width="14"/>` +
    `<path d="M 20 120 A 100 100 0 0 1 220 120" pathLength="100" fill="none" stroke="#F0601A" stroke-width="14" class="arco-enche" style="--off:${100 - nota * 10}"/>` +
    `<g class="ponteiro" style="--ang:${ang}deg"><line x1="120" y1="120" x2="120" y2="42" stroke="#ECE5D8" stroke-width="4"/></g>` +
    `<g class="dx-ticks">${ticks}</g>` +
    `<circle cx="120" cy="120" r="8" fill="#ECE5D8"/><circle cx="120" cy="120" r="3" fill="#F0601A"/>`,
    '', '0 0 240 190');
  const contagem = h('b', { class: 'dx-score-n' }, '0');
  const sectionMedidor = h('section', { class: 'res-card res-gauge res-entra', style: '--d:1000ms', 'aria-label': `${t.resultado.medidorTitulo}: ${nota} de 10` },
    h('p', { class: 'res-card-title' }, t.resultado.medidorTitulo),
    h('div', { class: 'res-gauge-box' }, medidor,
      h('p', { class: 'res-ext l' }, t.resultado.medidorExtremos[0]),
      h('p', { class: 'res-ext r' }, t.resultado.medidorExtremos[1]),
      h('p', { class: 'res-score' }, contagem, h('span', {}, 'de 10'))));

  // Radar das seis áreas: o desenho se traça sozinho e cada área é tocável
  const grade = [1, 0.66, 0.33].map((n) => `<polygon points="${pontosSvg(areas.map(() => RAIO * n))}" fill="none" stroke="#3A3437" stroke-width="1"/>`).join('');
  const eixos = areas.map((a, i) => { const [x, y] = ponto(i, RAIO); return `<line x1="${CENTRO}" y1="${CENTRO}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#3A3437" stroke-width="1"/>`; }).join('');
  const nos = areas.map((a, i) => {
    const [x, y] = ponto(i, raios[i]);
    const fracoAqui = a.id === fraco;
    const lado = fracoAqui ? 12 : 9;
    return (fracoAqui ? `<rect x="${(x - 11).toFixed(1)}" y="${(y - 11).toFixed(1)}" width="22" height="22" fill="none" stroke="#ECE5D8" stroke-width="2" class="radar-pulso"/>` : '') +
      `<rect x="${(x - lado / 2).toFixed(1)}" y="${(y - lado / 2).toFixed(1)}" width="${lado}" height="${lado}" fill="${fracoAqui ? '#9A1F33' : '#F0601A'}" stroke="${fracoAqui ? '#ECE5D8' : '#111012'}" stroke-width="1.5" class="radar-no" style="animation-delay:${(2.9 + i * 0.25).toFixed(2)}s"/>`;
  }).join('');
  const radar = svg(
    grade + eixos +
    `<polygon points="${pontosSvg(raios)}" fill="#F0601A" class="radar-fill"/>` +
    `<polygon points="${pontosSvg(raios)}" pathLength="100" fill="none" stroke="#F0601A" stroke-width="3" stroke-linejoin="miter" class="radar-traco"/>` +
    nos,
    '', '0 0 300 300');

  const detalhe = h('div', { 'aria-live': 'polite' });
  const botoesArea = [];
  function mostrarArea(id) {
    botoesArea.forEach(([botao, areaId]) => botao.setAttribute('aria-pressed', String(areaId === id)));
    const area = areas.find((a) => a.id === id);
    const nivel = nivelDe(proporcao(id));
    const rotulosNivel = { forte: t.resultado.forte, meio: t.resultado.atencao, fraco: t.resultado.fragil };
    const cabecalho = area.id === fraco
      ? [h('span', { class: 'res-dot', 'aria-hidden': 'true' }), t.resultado.pontoFraco]
      : [area.rotulo, h('span', { class: `res-chip ${nivel}` }, rotulosNivel[nivel])];
    detalhe.replaceChildren(h('div', { class: 'res-detail' },
      h('p', { class: 'res-detail-head' }, cabecalho),
      h('p', {}, area.id === fraco ? area.fraco : area[nivel])));
  }
  areas.forEach((a, i) => {
    const [x, y] = ponto(i, 124);
    const botao = h('button', {
      type: 'button',
      class: `res-area${a.id === fraco ? ' is-weak' : ''}`,
      'aria-pressed': 'false',
      style: `left:${((x / 300) * 100).toFixed(2)}%;top:${((y / 300) * 100).toFixed(2)}%;--d:${3300 + i * 90}ms`,
      onclick: () => mostrarArea(a.id),
    }, a.rotulo);
    botoesArea.push([botao, a.id]);
  });
  const sectionRadar = h('section', { class: 'res-card res-radar res-entra', style: '--d:2600ms', 'aria-label': t.resultado.radarTitulo },
    h('p', { class: 'res-card-title' }, t.resultado.radarTitulo),
    h('p', { class: 'res-tap' }, t.resultado.toque),
    h('div', { class: 'res-radar-box' }, radar, botoesArea.map(([b]) => b)),
    detalhe);
  if (fraco) mostrarArea(fraco);

  // Sem o número configurado, o link abre o WhatsApp só com a mensagem pronta (a pessoa escolhe o contato)
  const areaFraca = areas.find((a) => a.id === fraco);
  const mensagem = `Oi, sou ${nome}, da ${respostas.empresa.trim()}, fiz o diagnóstico e deu ${perfil.titulo} (desejo ${nota}/10)${areaFraca ? `, com ponto mais fraco em ${areaFraca.rotulo}` : ''}, quero conversar`;
  const link = `https://wa.me/${apenasDigitos(WHATSAPP_NUMBER)}?text=${encodeURIComponent(mensagem)}`;

  return h('div', { class: 'dx-result' },
    h('p', { class: 'res-label res-entra', style: '--d:900ms' }, `${nome}, ${t.resultado.rotulo}`),
    h('h1', { class: 'dx-display res-h1 res-titulo', tabindex: '-1' }, `${palavras.slice(0, -1).join(' ')} `, accent(palavras[palavras.length - 1])),
    perfil.texto && h('p', { class: 'res-text res-entra', style: '--d:1300ms' }, perfil.texto),
    sectionMedidor,
    sectionRadar,
    h('div', { class: 'res-cta-wrap res-entra', style: '--d:5600ms' },
      h('p', { class: 'res-legend' }, t.resultado.legendaBotao),
      h('a', { class: 'button res-cta', href: link, target: '_blank', rel: 'noopener noreferrer' }, t.resultado.whatsappBotao)));
}

/** Número que sobe de 0 até a nota, começando depois de 1,3 s. */
function contarNota(alvo) {
  const el = palco.querySelector('.dx-score-n');
  if (!el) return;
  if (semMovimento()) { el.textContent = String(alvo); return; }
  const inicio = performance.now() + 1300;
  const passo = (agora) => {
    const p = Math.min(1, Math.max(0, (agora - inicio) / 1600));
    el.textContent = String(Math.round(p * alvo));
    if (p < 1) contagemFrame = requestAnimationFrame(passo);
  };
  contagemFrame = requestAnimationFrame(passo);
}

// ============================ Voltar e som ============================
document.getElementById('dx-back').addEventListener('click', () => ir(Math.max(-1, estado.etapa - 1)));

/**
 * Botão de som: o navegador só deixa o áudio tocar depois de um toque da pessoa, então a música só é baixada e começa
 * quando ela liga. Fica em loop, com volume baixo, e para ao sair da página.
 */
const som = (function () {
  const caixa = document.getElementById('dx-sound');
  let audio = null;
  let manual = false; // se a pessoa mexeu no botão, o início do diagnóstico não liga o som por cima da escolha dela
  const icone = (ligado) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="butt" stroke-linejoin="miter" aria-hidden="true"><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z"/>${ligado ? '<path d="M15.5 9a4 4 0 0 1 0 6"/><path d="M18 6.5a8 8 0 0 1 0 11"/>' : '<path d="M16 9.5l5 5M21 9.5l-5 5"/>'}</svg>`;
  const botao = h('button', { type: 'button', class: 'dx-sound', 'aria-pressed': 'false', 'aria-label': t.som, title: t.som });
  const pintar = (ligado) => {
    botao.setAttribute('aria-pressed', String(ligado));
    botao.innerHTML = `${icone(ligado)}<span></span>`;
    botao.querySelector('span').textContent = ligado ? t.somLigado : t.somCurto;
  };
  pintar(false);
  const ligado = () => botao.getAttribute('aria-pressed') === 'true';
  async function tocar() {
    if (!audio) { audio = new Audio(SOM_ARQUIVO); audio.loop = true; audio.volume = 0.35; }
    try { await audio.play(); pintar(true); } catch { pintar(false); }
  }
  botao.addEventListener('click', () => {
    manual = true;
    if (ligado()) { audio.pause(); pintar(false); return; }
    tocar();
  });
  window.addEventListener('pagehide', () => audio?.pause());
  caixa.append(botao);
  // Chamado pelo botão "Iniciar diagnóstico": o toque da pessoa libera o áudio no navegador
  return { ligarAoIniciar() { if (!manual && !ligado()) tocar(); } };
})();

desenhar();
