'use strict';

// Aberto por cima do site (iframe de tela cheia): o CSS deixa uma folga embaixo, onde o Safari do iPhone põe a barra
try { if (window.parent !== window) document.documentElement.classList.add('dx-embutido'); } catch { /* nada */ }

// CONFIGURAÇÃO · WhatsApp que recebe o resultado, com DDI e DDD, só números (exemplo: '5581999999999').
// Vazio: o WhatsApp abre só com a mensagem pronta e a pessoa escolhe o contato.
const WHATSAPP_NUMBER = '';
const SOM_ARQUIVO = 'assets/audio/diagnostico.mp3';
// Gravação do que o analisador ao vivo entrega ao orbe com este áudio (usada só no iPhone, que não usa o analisador ao vivo)
const SOM_ONDAS = 'assets/audio/diagnostico-ondas.json';
// Voz de cada pergunta (pergunta-01.mp3 a pergunta-16.mp3, na ordem das perguntas) a do cálculo do resultado e a do resultado
const SOM_PERGUNTA = (n) => `assets/audio/perguntas/pergunta-${String(n).padStart(2, '0')}.mp3`;
const SOM_CALCULANDO = 'assets/audio/perguntas/calculando.mp3';
const SOM_RESULTADO = 'assets/audio/perguntas/resultado.mp3'; // fala quando o resultado aparece
// Som ligado: com false o ícone "Som" continua no cabeçalho, mas nada toca (nem ao clicar).
const SOM_ATIVO = true;

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
    antes: 'O QUANTO A SUA MARCA É',
    destaque: 'DESEJADA',
    depois: 'HOJE?',
    botao: 'Iniciar diagnóstico',
    nota: 'Menos de 2 minutos',
  },

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
    whatsappBotao: 'Falar com Vinicius no WhatsApp',
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

// Efeito de som de um botão (vem de efeitos.js); nunca quebra a página se o som não estiver disponível
const efeito = (nome) => { try { window.vrEfeitos?.tocar(nome); } catch { /* sem som */ } };

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
  efeito('ok');
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
  efeito('pop');
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

  // A voz acompanha a etapa: cada pergunta tem a sua, o cálculo tem a dele e o resultado tem a sua
  if (emPergunta) som.falar(`p${etapa}`, SOM_PERGUNTA(etapa + 1));
  else if (estado.calculando) { som.falar('calculando', SOM_CALCULANDO); efeito('carregando'); }
  else if (etapa === total) { som.falar('resultado', SOM_RESULTADO); efeito('estouro'); }
  else som.calar(); // tela inicial
}

// ---------- Boas-vindas ----------
/** Orbe que se mexe com a voz do áudio; some sozinho se o navegador não tiver WebGL. */
function orbeDaVoz() {
  const canvas = h('canvas', { class: 'dx-orb-canvas' });
  const caixa = h('div', { class: 'dx-orb', 'aria-hidden': 'true' }, canvas);
  if (!iniciarOrbe(canvas)) caixa.hidden = true;
  return caixa;
}

/**
 * Dá profundidade ao botão: o conjunto se inclina em 3D para o lado do mouse (--px e --py, de -1 a 1) e, sem mouse
 * (celular ou parado), balança sozinho bem de leve. Termina quando a tela sai da página; parado com prefers-reduced-motion.
 */
function inclinarBotao(caixa) {
  if (semMovimento()) return;
  let alvoX = 0;
  let alvoY = 0;
  let x = 0;
  let y = 0;
  let mouse = false;
  const limite = (v) => Math.max(-1, Math.min(1, v));
  const mover = (e) => {
    if (e.pointerType === 'touch') return;
    mouse = true;
    const r = caixa.getBoundingClientRect();
    alvoX = limite((e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2));
    alvoY = limite((e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2));
  };
  const saiu = () => { mouse = false; };
  window.addEventListener('pointermove', mover);
  document.documentElement.addEventListener('pointerleave', saiu);
  const passo = (agora) => {
    if (!caixa.isConnected) {
      window.removeEventListener('pointermove', mover);
      document.documentElement.removeEventListener('pointerleave', saiu);
      return;
    }
    requestAnimationFrame(passo);
    if (!mouse) { alvoX = Math.sin(agora * 0.0006) * 0.7; alvoY = Math.cos(agora * 0.00045) * 0.5; }
    x += (alvoX - x) * 0.06;
    y += (alvoY - y) * 0.06;
    caixa.style.setProperty('--px', x.toFixed(3));
    caixa.style.setProperty('--py', y.toFixed(3));
  };
  requestAnimationFrame(passo);
}

function telaBoasVindas() {
  return h('div', { class: 'dx-welcome' },
    h('h1', { class: 'dx-display' }, `${t.boasVindas.antes} `, accent(t.boasVindas.destaque), ` ${t.boasVindas.depois}`),
    orbeDaVoz(),
    // Tudo gira em torno do botão: placa vinho inclinada, borda de luz que corre e o botão em relevo (3D)
    botaoGrande(),
    h('p', { class: 'dx-go-note' }, t.boasVindas.nota));
}

/** O botão do início: placa, luz que corre pela borda e a tecla em relevo que afunda ao apertar. */
function botaoGrande() {
  const caixa = h('div', { class: 'dx-go' },
    h('span', { class: 'dx-go-edge', 'aria-hidden': 'true' }),
    h('span', { class: 'dx-go-plate', 'aria-hidden': 'true' }),
    h('div', { class: 'dx-go-key' },
      h('span', { class: 'dx-go-depth', 'aria-hidden': 'true' }),
      h('button', { type: 'button', class: 'button dx-go-btn', onclick: () => { efeito('iniciar'); ir(0); } }, t.boasVindas.botao)));
  inclinarBotao(caixa);
  return caixa;
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

/** Cartão que se inclina em 3D na direção do dedo ou do mouse. */
function inclinarCartao(cartao) {
  if (semMovimento()) return;
  const max = 9; // graus
  let quadro = 0;
  const aplicar = (px, py, ativo) => {
    cartao.style.setProperty('--tx', (px * max).toFixed(2));
    cartao.style.setProperty('--ty', (-py * max).toFixed(2));
    cartao.classList.toggle('is-tilting', ativo);
  };
  const soltar = () => { cancelAnimationFrame(quadro); aplicar(0, 0, false); };
  cartao.addEventListener('pointermove', (e) => {
    const r = cartao.getBoundingClientRect();
    const px = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
    const py = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
    cancelAnimationFrame(quadro);
    quadro = requestAnimationFrame(() => aplicar(px, py, true));
  });
  cartao.addEventListener('pointerleave', soltar);
  cartao.addEventListener('pointercancel', soltar);
  cartao.addEventListener('pointerup', (e) => { if (e.pointerType !== 'mouse') soltar(); });
}

function telaResultado(resultado) {
  const { nota, perfil, porArea, fraco } = resultado;
  const nome = primeiroNome();
  const proporcao = (id) => porArea[id] / (areas.find((x) => x.id === id).campos.length * 2);
  const raios = areas.map((a) => RAIO_MIN + (1 - proporcao(a.id)) * (RAIO - RAIO_MIN));
  const ang = -90 + nota * 18;
  const palavras = perfil.titulo.split(' ');

  const ticks = [0, 2, 4, 6, 8, 10].map((v) => {
    const a = Math.PI * (1 - v / 10);
    return `<text x="${(120 + 114 * Math.cos(a)).toFixed(1)}" y="${(120 - 114 * Math.sin(a)).toFixed(1)}" font-size="9" font-weight="700" fill="#CDC5B5" text-anchor="middle" dominant-baseline="middle">${v}</text>`;
  }).join('');
  // Medidor em 3D, em duas camadas: o mostrador (canal fundo e arco em tubo) e, por cima e mais perto de quem olha, o ponteiro com o pino
  const arcoDe = (r) => `M ${120 - r} 120 A ${r} ${r} 0 0 1 ${120 + r} 120`;
  const defsMostrador =
    `<defs>` +
    `<radialGradient id="g-mostrador" cx="120" cy="120" r="116" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#2E282C"/><stop offset=".72" stop-color="#1B171A"/><stop offset="1" stop-color="#111012" stop-opacity="0"/></radialGradient>` +
    `<linearGradient id="g-sobe" x1="0" y1="118" x2="0" y2="182" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>` +
    `<mask id="g-desce" maskUnits="userSpaceOnUse" x="0" y="0" width="240" height="190"><rect x="0" y="0" width="240" height="190" fill="url(#g-sobe)"/><rect x="0" y="0" width="240" height="118" fill="#fff"/></mask>` +
    `<filter id="g-borra" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="5"/></filter>` +
    `</defs>`;
  const defsPonteiro =
    `<defs>` +
    `<linearGradient id="g-ponteiro" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#A39B8E"/><stop offset=".5" stop-color="#FFFFFF"/><stop offset="1" stop-color="#B5AC9D"/></linearGradient>` +
    `<radialGradient id="g-metal" cx=".35" cy=".3" r=".85"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".4" stop-color="#ECE5D8"/><stop offset="1" stop-color="#6A6358"/></radialGradient>` +
    `<radialGradient id="g-joia" cx=".35" cy=".3" r=".85"><stop offset="0" stop-color="#FFD2AE"/><stop offset=".45" stop-color="#F0601A"/><stop offset="1" stop-color="#7E2704"/></radialGradient>` +
    `<filter id="g-sombra" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2"/></filter>` +
    `</defs>`;
  const medidor = svg(
    defsMostrador +
    `<circle cx="120" cy="120" r="116" fill="url(#g-mostrador)" mask="url(#g-desce)"/>` +
    `<path d="${arcoDe(100)}" fill="none" stroke="#050405" stroke-width="20"/>` +
    `<path d="${arcoDe(100)}" fill="none" stroke="#3A3437" stroke-width="14"/>` +
    `<path d="${arcoDe(94.5)}" fill="none" stroke="#1E1A1D" stroke-width="3"/>` +
    `<path d="${arcoDe(110.5)}" fill="none" stroke="#fff" stroke-opacity=".16" stroke-width="1.5"/>` +
    `<path d="${arcoDe(100)}" pathLength="100" fill="none" stroke="#F0601A" stroke-opacity=".55" stroke-width="24" filter="url(#g-borra)" class="arco-enche" style="--off:${100 - nota * 10}"/>` +
    `<path d="${arcoDe(100)}" pathLength="100" fill="none" stroke="#F0601A" stroke-width="14" class="arco-enche" style="--off:${100 - nota * 10}"/>` +
    `<path d="${arcoDe(94.5)}" pathLength="100" fill="none" stroke="#8A2E06" stroke-width="3" class="arco-enche" style="--off:${100 - nota * 10}"/>` +
    `<path d="${arcoDe(104.5)}" pathLength="100" fill="none" stroke="#FFB680" stroke-width="3.5" stroke-opacity=".9" class="arco-enche" style="--off:${100 - nota * 10}"/>` +
    `<g class="dx-ticks">${ticks}</g>`,
    '', '0 0 240 190');
  const agulha = svg(
    defsPonteiro +
    `<g class="ponteiro" style="--ang:${ang}deg">` +
      `<polygon points="115,120 125,120 121.2,38 118.8,38" fill="#000" fill-opacity=".55" transform="translate(5 7)" filter="url(#g-sombra)"/>` +
      `<polygon points="116,120 124,120 120.9,40 119.1,40" fill="url(#g-ponteiro)"/>` +
      `<polygon points="116,120 124,120 122.5,138 117.5,138" fill="#8F877B"/>` +
    `</g>` +
    `<circle cx="124" cy="127" r="13" fill="#000" fill-opacity=".55" filter="url(#g-sombra)"/>` +
    `<circle cx="120" cy="120" r="12" fill="url(#g-metal)"/>` +
    `<circle cx="120" cy="120" r="12" fill="none" stroke="#000" stroke-opacity=".3"/>` +
    `<circle cx="120" cy="120" r="5.5" fill="url(#g-joia)"/>` +
    `<ellipse cx="116.5" cy="115.5" rx="3.2" ry="2" fill="#fff" fill-opacity=".75"/>`,
    'res-agulha', '0 0 240 190');
  const contagem = h('b', { class: 'dx-score-n' }, '0');
  const sectionMedidor = h('section', { class: 'res-card res-gauge res-entra', style: '--d:1000ms', 'aria-label': `${t.resultado.medidorTitulo}: ${nota} de 10` },
    h('p', { class: 'res-card-title' }, t.resultado.medidorTitulo),
    h('div', { class: 'res-gauge-box' }, medidor, agulha,
      h('p', { class: 'res-ext l' }, t.resultado.medidorExtremos[0]),
      h('p', { class: 'res-ext r' }, t.resultado.medidorExtremos[1]),
      h('p', { class: 'res-score' }, contagem, h('span', {}, 'de 10'))));

  // Radar das seis áreas: o desenho se traça sozinho e cada área é tocável
  // Radar em relevo: um piso de pedra com espessura, a sombra do desenho no piso e o desenho como um prisma de luz, com pontos em esfera
  const mexer = (pts, dy) => `<polygon points="${pts}" transform="translate(0 ${dy})"`;
  const hexPiso = pontosSvg(areas.map(() => RAIO));
  const hexDados = pontosSvg(raios);
  const espessuraPiso = [10, 8, 6, 4, 2].map((dy, i) => `${mexer(hexPiso, dy)} fill="${['#080708', '#0E0C0E', '#151215', '#1C181B', '#231F22'][i]}"/>`).join('');
  const grade = [0.66, 0.33].map((n) => `<polygon points="${pontosSvg(areas.map(() => RAIO * n))}" fill="none" stroke="#4A4448" stroke-width="1"/>`).join('');
  const eixos = areas.map((a, i) => { const [x, y] = ponto(i, RAIO); return `<line x1="${CENTRO}" y1="${CENTRO}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#4A4448" stroke-width="1"/>`; }).join('');
  const lados = [8, 7, 6, 5, 4, 3, 2, 1].map((dy, i) => {
    const mistura = i / 7; // do fundo escuro (embaixo) ao laranja da parede (perto do topo)
    const cor = [0x5A, 0x1E, 0x05].map((b, k) => Math.round(b + ([0xC0, 0x4A, 0x0C][k] - b) * mistura).toString(16).padStart(2, '0')).join('');
    return `${mexer(hexDados, dy)} fill="#${cor}" stroke="#${cor}" stroke-width="1" stroke-linejoin="round"/>`;
  }).join('');
  const nos = areas.map((a, i) => {
    const [x, y] = ponto(i, raios[i]);
    const fracoAqui = a.id === fraco;
    const r = fracoAqui ? 8 : 6;
    return (fracoAqui ? `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="11" fill="none" stroke="#ECE5D8" stroke-width="2" class="radar-pulso"/>` : '') +
      `<circle cx="${x.toFixed(1)}" cy="${(y + 1.5).toFixed(1)}" r="${r}" fill="#000" fill-opacity=".45" filter="url(#r-sombra)" class="radar-no" style="animation-delay:${(2.9 + i * 0.25).toFixed(2)}s"/>` +
      `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="url(#${fracoAqui ? 'r-vinho' : 'r-esfera'})" stroke="${fracoAqui ? '#ECE5D8' : '#111012'}" stroke-width="1.2" class="radar-no" style="animation-delay:${(2.9 + i * 0.25).toFixed(2)}s"/>` +
      `<ellipse cx="${(x - r * 0.32).toFixed(1)}" cy="${(y - r * 0.38).toFixed(1)}" rx="${(r * 0.32).toFixed(1)}" ry="${(r * 0.2).toFixed(1)}" fill="#fff" fill-opacity=".7" class="radar-no" style="animation-delay:${(2.9 + i * 0.25).toFixed(2)}s"/>`;
  }).join('');
  // Radar em 3D, em duas camadas: o piso de pedra com a sombra do desenho e, mais perto de quem olha, o prisma com os pontos
  const radarPiso = svg(
    `<defs>` +
    `<radialGradient id="r-piso" cx="150" cy="150" r="96" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#352F33"/><stop offset="1" stop-color="#1C181B"/></radialGradient>` +
    `<filter id="r-borra" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4"/></filter>` +
    `</defs>` +
    espessuraPiso +
    `<polygon points="${hexPiso}" fill="url(#r-piso)" stroke="#5A5256" stroke-width="1.2" stroke-linejoin="round"/>` +
    grade + eixos +
    `<polygon points="${hexDados}" transform="translate(5 12)" fill="#000" fill-opacity=".55" filter="url(#r-borra)" class="radar-fill"/>`,
    'res-piso', '0 0 300 300');
  const radarTopo = svg(
    `<defs>` +
    `<linearGradient id="r-topo" x1="0" y1="52" x2="0" y2="248" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#FFA766"/><stop offset=".55" stop-color="#F0601A"/><stop offset="1" stop-color="#D24A0C"/></linearGradient>` +
    `<radialGradient id="r-esfera" cx=".35" cy=".3" r=".85"><stop offset="0" stop-color="#FFE6D0"/><stop offset=".4" stop-color="#F0601A"/><stop offset="1" stop-color="#8C3006"/></radialGradient>` +
    `<radialGradient id="r-vinho" cx=".35" cy=".3" r=".85"><stop offset="0" stop-color="#FF8CA0"/><stop offset=".4" stop-color="#B8263D"/><stop offset="1" stop-color="#4A0C18"/></radialGradient>` +
    `<filter id="r-sombra" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="1.6"/></filter>` +
    `</defs>` +
    `<g class="radar-prisma">${lados}` +
    `<polygon points="${hexDados}" fill="url(#r-topo)" stroke="#FFD2AE" stroke-width="1.5" stroke-linejoin="round"/></g>` +
    `<polygon points="${hexDados}" pathLength="100" fill="none" stroke="#FFE3C8" stroke-width="2.5" stroke-linejoin="round" class="radar-traco"/>` +
    nos,
    'res-topo', '0 0 300 300');

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
      onclick: () => { efeito('tecla'); mostrarArea(a.id); },
    }, a.rotulo);
    botoesArea.push([botao, a.id]);
  });
  const sectionRadar = h('section', { class: 'res-card res-radar res-entra', style: '--d:2600ms', 'aria-label': t.resultado.radarTitulo },
    h('p', { class: 'res-card-title' }, t.resultado.radarTitulo),
    h('p', { class: 'res-tap' }, t.resultado.toque),
    h('div', { class: 'res-radar-box' }, radarPiso, radarTopo, botoesArea.map(([b]) => b)),
    detalhe);
  if (fraco) mostrarArea(fraco);

  // Sem o número configurado, o link abre o WhatsApp só com a mensagem pronta (a pessoa escolhe o contato)
  const areaFraca = areas.find((a) => a.id === fraco);
  const mensagem = `Oi, sou ${nome}, da ${respostas.empresa.trim()}, fiz o diagnóstico e deu ${perfil.titulo} (desejo ${nota}/10)${areaFraca ? `, com ponto mais fraco em ${areaFraca.rotulo}` : ''}, quero conversar`;
  const link = `https://wa.me/${apenasDigitos(WHATSAPP_NUMBER)}?text=${encodeURIComponent(mensagem)}`;

  [sectionMedidor, sectionRadar].forEach(inclinarCartao);

  return h('div', { class: 'dx-result' },
    h('p', { class: 'res-label res-entra', style: '--d:900ms' }, `${nome}, ${t.resultado.rotulo}`),
    h('h1', { class: 'dx-display res-h1 res-titulo', tabindex: '-1' }, `${palavras.slice(0, -1).join(' ')} `, accent(palavras[palavras.length - 1])),
    perfil.texto && h('p', { class: 'res-text res-entra', style: '--d:1300ms' }, perfil.texto),
    sectionMedidor,
    sectionRadar,
    h('div', { class: 'res-cta-wrap res-entra', style: '--d:5600ms' },
      h('p', { class: 'res-legend' }, t.resultado.legendaBotao),
      h('a', { class: 'button res-cta', href: link, target: '_blank', rel: 'noopener noreferrer', onclick: () => efeito('whatsapp') }, t.resultado.whatsappBotao)));
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

// ============================ Orbe da voz ============================
// Esfera de luz desenhada em WebGL (sem bibliotecas), nas cores da VR: núcleo laranja e pêssego, borda vinho.
// O volume do áudio que está tocando (voz) dá o movimento: com a voz alta o orbe gira, ondula e infla, tudo em câmera lenta; nas pausas ele acalma.
const ORBE_VERT = `
  precision highp float;
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const ORBE_FRAG = `
  precision highp float;
  uniform float iTime;
  uniform vec3 iResolution;
  uniform float hover;
  uniform float rot;
  uniform float hoverIntensity;
  uniform float uLevel;
  uniform float uAgudos;
  uniform float uProg;
  varying vec2 vUv;

  vec3 hash33(vec3 p3) {
    p3 = fract(p3 * vec3(0.1031, 0.11369, 0.13787));
    p3 += dot(p3, p3.yxz + 19.19);
    return -1.0 + 2.0 * fract(vec3(p3.x + p3.y, p3.x + p3.z, p3.y + p3.z) * p3.zyx);
  }

  float snoise3(vec3 p) {
    const float K1 = 0.333333333;
    const float K2 = 0.166666667;
    vec3 i = floor(p + (p.x + p.y + p.z) * K1);
    vec3 d0 = p - (i - (i.x + i.y + i.z) * K2);
    vec3 e = step(vec3(0.0), d0 - d0.yzx);
    vec3 i1 = e * (1.0 - e.zxy);
    vec3 i2 = 1.0 - e.zxy * (1.0 - e);
    vec3 d1 = d0 - (i1 - K2);
    vec3 d2 = d0 - (i2 - K1);
    vec3 d3 = d0 - 0.5;
    vec4 h = max(0.6 - vec4(dot(d0, d0), dot(d1, d1), dot(d2, d2), dot(d3, d3)), 0.0);
    vec4 n = h * h * h * h * vec4(dot(d0, hash33(i)), dot(d1, hash33(i + i1)), dot(d2, hash33(i + i2)), dot(d3, hash33(i + 1.0)));
    return dot(vec4(31.316), n);
  }

  vec4 extractAlpha(vec3 colorIn) {
    float a = max(max(colorIn.r, colorIn.g), colorIn.b);
    return vec4(colorIn.rgb / (a + 1e-5), a);
  }

  // Cores da marca: laranja (fogo), pêssego e vinho
  const vec3 color1 = vec3(0.941176, 0.376471, 0.101961);
  const vec3 color2 = vec3(1.0, 0.760784, 0.560784);
  const vec3 color3 = vec3(0.603922, 0.121569, 0.2);
  const float innerRadius = 0.6;
  const float noiseScale = 0.65;

  float light1(float intensity, float attenuation, float dist) {
    return intensity / (1.0 + dist * attenuation);
  }

  float light2(float intensity, float attenuation, float dist) {
    return intensity / (1.0 + dist * dist * attenuation);
  }

  vec4 draw(vec2 uv) {
    float ang = atan(uv.y, uv.x);
    float len = length(uv);
    float invLen = len > 0.0 ? 1.0 / len : 0.0;

    float n0 = snoise3(vec3(uv * noiseScale * (1.0 + uAgudos * 0.6), iTime * 0.5)) * 0.5 + 0.5;
    float r0 = mix(mix(innerRadius, 1.0, 0.4), mix(innerRadius, 1.0, 0.6), n0);
    float d0 = distance(uv, (r0 * invLen) * uv);
    float v0 = light1(1.0, 10.0, d0);
    v0 *= smoothstep(r0 * 1.05, r0, len);
    float cl = cos(ang + iTime * 2.0 + uProg * 6.283) * 0.5 + 0.5;

    float a = iTime * -1.0 - uProg * 12.566;
    vec2 pos = vec2(cos(a), sin(a)) * r0;
    float d = distance(uv, pos);
    float v1 = light2(1.5, 5.0, d);
    v1 *= light1(1.0, 50.0, d0);
    v1 *= 1.0 + uAgudos * 1.5;

    float v2 = smoothstep(1.0, mix(innerRadius, 1.0, n0 * 0.5), len);
    float v3 = smoothstep(innerRadius, mix(innerRadius, 1.0, 0.5), len);

    vec3 col = mix(color1, color2, cl);
    col = mix(color3, col, v0);
    col = (col + v1) * v2 * v3;
    col = clamp(col, 0.0, 1.0);

    return extractAlpha(col);
  }

  void main() {
    vec2 fragCoord = vUv * iResolution.xy;
    vec2 center = iResolution.xy * 0.5;
    float size = min(iResolution.x, iResolution.y);
    vec2 uv = (fragCoord - center) / size * 2.0;

    // Margem de folga: o brilho se apaga antes da borda do canvas, sem aparecer um quadrado
    float borda = 1.0 - smoothstep(0.7, 1.0, length(uv));
    uv *= 1.3;

    // A voz infla o orbe
    uv /= 1.0 + uLevel * 0.16;

    float s = sin(rot);
    float c = cos(rot);
    uv = vec2(c * uv.x - s * uv.y, s * uv.x + c * uv.y);

    uv.x += hover * hoverIntensity * 0.1 * sin(uv.y * 10.0 + iTime);
    uv.y += hover * hoverIntensity * 0.1 * sin(uv.x * 10.0 + iTime);

    vec4 col = draw(uv);
    col.a *= borda;
    gl_FragColor = vec4(col.rgb * col.a, col.a);
  }
`;

/** Liga o orbe a um <canvas>. Termina sozinho quando o canvas sai da página. Devolve false se o navegador não tiver WebGL. */
function iniciarOrbe(canvas) {
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false });
  if (!gl) return false;

  const compilar = (tipo, codigo) => {
    const shader = gl.createShader(tipo);
    gl.shaderSource(shader, codigo);
    gl.compileShader(shader);
    return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
  };
  const vert = compilar(gl.VERTEX_SHADER, ORBE_VERT);
  const frag = compilar(gl.FRAGMENT_SHADER, ORBE_FRAG);
  if (!vert || !frag) return false;
  const programa = gl.createProgram();
  gl.attachShader(programa, vert);
  gl.attachShader(programa, frag);
  gl.linkProgram(programa);
  if (!gl.getProgramParameter(programa, gl.LINK_STATUS)) return false;
  gl.useProgram(programa);

  // Um triângulo que cobre a tela inteira do canvas
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const posicao = gl.getAttribLocation(programa, 'position');
  gl.enableVertexAttribArray(posicao);
  gl.vertexAttribPointer(posicao, 2, gl.FLOAT, false, 0, 0);

  const u = (nome) => gl.getUniformLocation(programa, nome);
  const uTempo = u('iTime');
  const uTamanho = u('iResolution');
  const uHover = u('hover');
  const uRot = u('rot');
  const uIntensidade = u('hoverIntensity');
  const uNivel = u('uLevel');
  const uAgudos = u('uAgudos');
  const uProg = u('uProg');
  gl.clearColor(0, 0, 0, 0);

  let rot = 0;
  let relogio = 0; // tempo do shader: só anda para frente, então o desenho nunca volta ao mesmo ponto
  let progresso = 0;
  const voz = { nivel: 0, graves: 0, medios: 0, agudos: 0 }; // a voz já suavizada
  let ultimo = 0;
  let quadro = 0;

  const pintarQuadro = (tempo, v, prog) => {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const largura = Math.round(canvas.clientWidth * dpr);
    const altura = Math.round(canvas.clientHeight * dpr);
    if (!largura || !altura) return;
    if (canvas.width !== largura || canvas.height !== altura) {
      canvas.width = largura;
      canvas.height = altura;
      gl.viewport(0, 0, largura, altura);
    }
    gl.uniform1f(uTempo, tempo);
    gl.uniform3f(uTamanho, largura, altura, largura / altura);
    gl.uniform1f(uHover, Math.min(v.medios * 1.5, 1));
    gl.uniform1f(uIntensidade, 0.25 + v.medios * 0.55);
    gl.uniform1f(uRot, rot);
    gl.uniform1f(uNivel, v.graves);
    gl.uniform1f(uAgudos, v.agudos);
    gl.uniform1f(uProg, prog);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  // Sem movimento (prefers-reduced-motion): um quadro parado
  if (semMovimento()) {
    requestAnimationFrame(() => pintarQuadro(2.5, { nivel: 0.1, graves: 0.1, medios: 0.05, agudos: 0.05 }, 0.2));
    return true;
  }

  const passo = (agora) => {
    if (!canvas.isConnected) { gl.getExtension('WEBGL_lose_context')?.loseContext(); return; }
    quadro = requestAnimationFrame(passo);
    const dt = Math.min((agora - ultimo) * 0.001, 0.05);
    ultimo = agora;
    const l = som.leitura();
    // Sobe rápido com a voz e desce mais devagar, para acompanhar cada palavra sem tremer
    for (const k of ['nivel', 'graves', 'medios', 'agudos']) voz[k] += (l[k] - voz[k]) * (l[k] > voz[k] ? 0.3 : 0.07);
    progresso += (l.progresso - progresso) * 0.2;
    // Parado, o orbe "respira" devagar; quando o áudio acaba ele volta a esse estado
    const respira = 0.05 + 0.035 * Math.sin(agora * 0.0007);
    const energia = Math.min(voz.nivel + respira, 1);
    rot += dt * (0.06 + energia * 0.7);
    relogio += dt * (0.3 + energia * 0.9 + voz.agudos * 0.5);
    pintarQuadro(relogio, { nivel: energia, graves: Math.min(voz.graves + respira, 1), medios: voz.medios, agudos: voz.agudos }, progresso);
  };
  quadro = requestAnimationFrame(passo);
  return true;
}

// ============================ Voltar e som ============================
document.getElementById('dx-back').addEventListener('click', () => { efeito('voltar'); ir(Math.max(-1, estado.etapa - 1)); });
// Aberto por cima do site, a marca fecha o diagnóstico em vez de abrir o site de novo dentro dele
document.querySelector('.dx-header .brand')?.addEventListener('click', (e) => {
  try {
    if (window.parent !== window && window.parent.vrFecharDiagnostico) { e.preventDefault(); window.parent.vrFecharDiagnostico(); }
  } catch { /* abre o site normalmente */ }
});

/**
 * Áudio explicando o diagnóstico (cerca de 25 segundos). Não há botão: ele só toca quando a pessoa vem de um botão de
 * diagnóstico do site (o clique deixa um recado e a página liga o som ao carregar). Toca uma vez, para ao sair da página
 * e alimenta o orbe com o volume da voz: ao vivo por um analisador (Web Audio) no computador e no Android; no iPhone, onde o
 * som do Web Audio some com a chave de silencioso, sem analisador, tocando a gravação do mesmo analisador em sincronia com o áudio.
 */
const som = (function () {
  let audio = null;
  // No iPhone o Safari só deixa o áudio tocar depois de um toque, e o som que passa pelo Web Audio é mudo com a chave de silencioso
  const ehIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  let atual = 'intro'; // qual áudio está carregado: a apresentação, a voz de uma pergunta (p0, p1...) ou a do resultado
  let tocouUmaVez = false; // o áudio toca uma vez só: depois disso o botão não liga de novo
  let analisador = null; // mede o volume da voz enquanto o áudio toca (alimenta o orbe)
  let dados = null;
  let curva = null; // iPhone: gravação do analisador, um ponto por quadro (taxa por segundo), em porcentagem
  if (ehIOS) {
    fetch(SOM_ONDAS).then((r) => r.json()).then((j) => { if (j && j.taxa && Array.isArray(j.nivel)) curva = j; }).catch(() => { /* sem a gravação: movimento simulado */ });
  }
  // Aberto por cima do site (iframe), o áudio e o analisador já vêm ligados pelo clique no botão do site
  try {
    const doSite = window.parent !== window ? window.parent.__vrSom : null;
    if (doSite && doSite.audio) {
      audio = doSite.audio;
      tocouUmaVez = true;
      if (doSite.analisador) { analisador = doSite.analisador; dados = new Uint8Array(analisador.frequencyBinCount); }
    }
  } catch { /* página aberta direto, sem o site por baixo */ }
  // O áudio passa por um analisador (Web Audio) antes de sair. Só entra no caminho se o navegador deixar o contexto rodar:
  // um áudio ligado a um contexto parado ficaria mudo. No iPhone não há analisador ao vivo (o orbe toca a gravação dele).
  async function prepararAnalise() {
    if (ehIOS) return;
    try {
      const Contexto = window.AudioContext || window.webkitAudioContext;
      if (!Contexto) return;
      const contexto = new Contexto();
      await contexto.resume().catch(() => {});
      if (contexto.state !== 'running') { contexto.close(); return; }
      const fonte = contexto.createMediaElementSource(audio);
      analisador = contexto.createAnalyser();
      analisador.fftSize = 512;
      analisador.smoothingTimeConstant = 0.3;
      fonte.connect(analisador);
      analisador.connect(contexto.destination);
      dados = new Uint8Array(analisador.frequencyBinCount);
    } catch { analisador = null; }
  }
  async function tocar() {
    const novo = !audio;
    if (novo) { audio = new Audio(SOM_ARQUIVO); audio.preload = 'auto'; }
    const inicio = audio.play(); // sai direto do toque da pessoa, sem esperar nada (o iPhone exige)
    if (novo) prepararAnalise(); // o analisador entra logo depois que o som começa
    try { await inicio; tocouUmaVez = true; return true; } catch { return false; /* o navegador não deixou tocar sem um toque da pessoa */ }
  }
  // Troca a faixa do mesmo elemento de áudio. No iPhone, só um elemento que já foi liberado por um toque pode tocar depois sem
  // novo toque; por isso é sempre o mesmo elemento, e o analisador (computador e Android) continua ligado a ele.
  let precarregado = false;
  function precarregar() {
    if (precarregado) return;
    precarregado = true;
    // Aquece o cache: as vozes são pequenas e assim cada pergunta começa a falar sem esperar a rede
    const arquivos = Array.from({ length: perguntas.length }, (_, i) => SOM_PERGUNTA(i + 1)).concat(SOM_CALCULANDO, SOM_RESULTADO);
    arquivos.forEach((a) => fetch(a).catch(() => { /* sem rede: carrega na hora */ }));
  }
  function falar(chave, arquivo) {
    if (!SOM_ATIVO) return;
    if (audio && atual === chave) return; // já está nessa faixa
    const novo = !audio;
    if (novo) { audio = new Audio(); audio.preload = 'auto'; }
    atual = chave;
    tocouUmaVez = true;
    audio.src = arquivo;
    const inicio = audio.play(); // sai do toque da pessoa (ou segue no elemento já liberado)
    if (novo) prepararAnalise();
    if (inicio && inicio.catch) inicio.catch(() => { /* o navegador não deixou tocar sem um toque: a próxima etapa tenta de novo */ });
    precarregar();
  }
  // Voltar para a tela inicial: corta a voz da etapa que ficou para trás (a apresentação não é cortada)
  function calar() {
    if (!audio || atual === 'intro') return;
    audio.pause();
    atual = '';
  }
  // Se o navegador bloqueou o som ao carregar (iPhone), ele começa no primeiro toque da pessoa na página
  function aguardarToque() {
    const ligar = () => {
      ['click', 'touchend', 'keydown'].forEach((e) => document.removeEventListener(e, ligar, true));
      tocar();
    };
    ['click', 'touchend', 'keydown'].forEach((e) => document.addEventListener(e, ligar, true));
  }
  const progressoDe = () => {
    const total = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 24;
    return Math.min(audio.currentTime / total, 1);
  };
  window.addEventListener('pagehide', () => audio?.pause());
  // Veio do botão de diagnóstico do site: liga já ao carregar (o Chrome libera, pois o clique foi no mesmo site)
  try { if (SOM_ATIVO && sessionStorage.getItem('vr-som')) { sessionStorage.removeItem('vr-som'); tocar().then((ok) => { if (!ok) aguardarToque(); }); } } catch { /* sem armazenamento */ }

  return {
    /** Liga o áudio dentro do toque da pessoa (o botão Iniciar diagnóstico), se ele ainda não tocou. */
    ligar() { if (SOM_ATIVO && !tocouUmaVez) tocar(); },
    /** Fala a voz de uma etapa (troca a faixa do áudio e toca). */
    falar,
    /** Para a voz de uma pergunta ou do resultado. */
    calar,
    /**
     * O que a voz está fazendo agora: volume geral, graves, médios e agudos (de 0 a 1) e o andamento do áudio (0 a 1).
     * Com o áudio parado tudo é 0; depois que ele acaba o andamento fica em 1.
     */
    leitura() {
      const quieto = { nivel: 0, graves: 0, medios: 0, agudos: 0, progresso: 0 };
      if (!audio) return quieto;
      if (audio.ended) return { ...quieto, progresso: 1 };
      if (audio.paused) return { ...quieto, progresso: progressoDe() };
      const progresso = progressoDe();
      if (analisador) {
        analisador.getByteFrequencyData(dados);
        // Cada bin tem uns 86 Hz: graves até uns 350 Hz, médios até 1,2 kHz e agudos até 4 kHz (a faixa da voz)
        const faixa = (de, ate) => {
          let soma = 0;
          for (let i = de; i < ate; i++) { const v = dados[i] / 255; soma += v * v; }
          return Math.min(Math.sqrt(soma / (ate - de)) * 3.2, 1);
        };
        const graves = faixa(1, 5);
        const medios = faixa(5, 14);
        const agudos = faixa(14, 48);
        return { nivel: Math.min(faixa(0, 48) * 1.4, 1), graves, medios, agudos, progresso };
      }
      if (curva && atual === 'intro') {
        // Mesmo movimento do analisador ao vivo: lê a gravação no ponto em que o áudio está (entre dois quadros, interpola)
        const x = Math.max(audio.currentTime * curva.taxa, 0);
        const i = Math.min(Math.floor(x), curva.nivel.length - 1);
        const j = Math.min(i + 1, curva.nivel.length - 1);
        const f = Math.min(x - i, 1);
        const ponto = (s) => (s[i] + (s[j] - s[i]) * f) / 100;
        return { nivel: ponto(curva.nivel), graves: ponto(curva.graves), medios: ponto(curva.medios), agudos: ponto(curva.agudos), progresso };
      }
      // Sem análise nem gravação: ondas que se misturam sem repetir e acompanham o andamento do áudio
      const t = audio.currentTime;
      const fala = 0.5 + 0.5 * Math.sin(t * 3.1 + Math.sin(t * 0.7) * 2.4);
      const faixa = (a, b, c) => Math.max(0, Math.min(1, fala * (0.55 + 0.45 * Math.sin(t * a + Math.sin(t * b) * c))));
      return { nivel: fala * 0.8, graves: faixa(2.3, 0.41, 1.7), medios: faixa(4.1, 0.63, 2.1), agudos: faixa(7.9, 0.37, 2.9), progresso };
    },
  };
})();

desenhar();
