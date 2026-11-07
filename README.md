# Vinicius Ribeiro — Marca e vendas

Página única em HTML, CSS e JavaScript puro. Sem dependências, instalação ou etapa de build. A estrutura de navegação, os blocos do briefing (a seção de palestras foi retirada) e as correções obrigatórias estão implementados.

## Estrutura

- `index.html`: conteúdo, navegação, FAQ e template de retrato.
- `styles.css`: identidade visual, responsividade e estados de foco.
- `script.js`: configurações, menu mobile, retratos e acordeão acessível.
- `diagnostico.html`, `diagnostico.css`, `diagnostico.js`: o diagnóstico (quiz de 16 perguntas com resultado na hora).
- `assets/`: carimbo, favicon, listras, placeholder de retrato, fachadas ilustrativas e o áudio do diagnóstico.

## Links e canais

As primeiras linhas de `script.js` concentram a configuração:

```js
const CTA_URL = 'diagnostico.html';
const EMAIL = '';
const PHONE = '';
const INSTAGRAM = '';
const PHOTO_SRC = 'assets/vinicius-ribeiro.webp';
```

Todos os botões de diagnóstico seguem o valor de `CTA_URL`, hoje a página `diagnostico.html`. Para apontar para outro destino (agendamento, formulário ou WhatsApp), troque esse único valor.

Preencha `EMAIL` com seu endereço de e-mail, `PHONE` com o número internacional e `INSTAGRAM` com a URL completa do perfil. Os três links no rodapé ficam ativos nesses canais após o preenchimento. Enquanto estiverem vazios, levam ao mesmo destino de `CTA_URL`.

## Diagnóstico

A página `diagnostico.html` leva a lógica do diagnóstico da HAZE (perguntas, pontuação, áreas e perfis), mas com tela, movimento e identidade próprios da VR: fundo tinta, cartões de linha fina, títulos em caixa-alta condensada, progresso em lâminas inclinadas de 10°, botões em paralelogramo, bloco vinho atrás da foto, o carimbo que bate e gira, listras laranja, e o resultado como a seção clara do site (uma lâmina de papel varre a tela), com cartões escuros e faixa vinho no fim. Não há névoa, brilho nem degradê.

- **Boas-vindas:** só o título, o botão "Iniciar diagnóstico" e a linha "Menos de 2 minutos", porque o áudio explica o resto. O botão fica no centro de tudo: uma tecla em relevo 3D (o corpo escuro aparece embaixo e a face afunda ao apertar) sobre uma placa vinho inclinada (10°), com luz que corre pela borda, brilho que atravessa a face e faísca elétrica; o conjunto se inclina em 3D para o lado do mouse (textos em `t.boasVindas`, no topo de `diagnostico.js`).
- **Orbe da voz:** entre o título e o botão fica uma esfera de luz em WebGL puro (sem bibliotecas), nas cores da marca (laranja, pêssego e vinho). Um analisador do Web Audio separa a voz em graves, médios e agudos: os graves incham o orbe, os médios o fazem ondular e os agudos acendem a luz que corre por ele. O andamento do áudio (do começo ao fim) leva a luz e as cores adiante, e o tempo do desenho só anda para frente, então o movimento não se repete até o áudio acabar; quando termina, o orbe volta a só respirar. Com `prefers-reduced-motion` fica um quadro parado, e sem WebGL ele some sozinho (código em `iniciarOrbe`, `diagnostico.js`). Se o navegador não liberar o Web Audio, o movimento é simulado a partir do tempo do áudio.
- **Fluxo:** boas-vindas, 16 perguntas (nome, negócio, o que quer conseguir, 11 de dor, faturamento e WhatsApp), tela de cálculo e resultado.
- **Pontuação:** cada resposta de dor vale 0, 1 ou 2 pontos (0 a 22 no total); a nota de 1 a 10 mede o quanto a marca é desejada, e as seis áreas (Desejo, Vendas, Preço, Dinheiro, Liberdade, Futuro) mostram o ponto mais fraco no radar.
- **Perfis e padrões:** o título do resultado vem de um padrão entre duas áreas ou, sem padrão, do perfil pela pontuação. Tudo fica nos dados do topo de `diagnostico.js`, junto com as perguntas, opções e textos.
- **WhatsApp:** no topo de `diagnostico.js`, preencha `WHATSAPP_NUMBER` com DDI e DDD, só números (exemplo: `5581999999999`). Vazio, o botão abre o WhatsApp só com a mensagem pronta e a pessoa escolhe o contato. As respostas não vão para nenhum servidor: chegam a você pela mensagem.
- **Som:** o áudio explicando o diagnóstico (`assets/audio/diagnostico.mp3`, cerca de 24 segundos, toca uma vez) começa sozinho quando a pessoa clica em um botão "Iniciar diagnóstico" do site (o clique deixa um recado e a página do diagnóstico liga o som ao carregar). Não há botão de som: o próprio botão "Iniciar diagnóstico" da tela inicial também liga o áudio ao ser tocado (se ele ainda não tiver começado), então quem abre o link direto ouve a partir dali. No iPhone (o Safari não deixa tocar áudio sozinho ao carregar a página), o som começa no primeiro toque da pessoa na tela, e lá o orbe usa o movimento simulado, porque o áudio que passa pelo Web Audio fica mudo com a chave de silencioso. Para desligar o som sem apagar o código, use `SOM_ATIVO = false` no topo de `diagnostico.js`. Para trocar o áudio, substitua o arquivo ou mude `SOM_ARQUIVO`.
- **Teclado:** A, B, C... escolhem a opção, Enter avança nos campos. Com `prefers-reduced-motion`, as animações são desligadas.
## Sua foto

1. Coloque o arquivo em `assets/`, por exemplo `assets/vinicius-ribeiro.webp`.
2. Altere `PHOTO_SRC` para esse caminho no topo de `script.js`.
3. Ajuste `PHOTO_ALT` se precisar descrever o retrato de outra maneira.

O mesmo componente atualiza o hero e a seção Quem sou eu, remove a legenda SUA FOTO e mantém a foto em cores originais. Prefira uma foto vertical, com o rosto e o tronco centralizados. Para ajustar o enquadramento, edite `object-position` na regra `.portrait-image` em `styles.css`.

## Perguntas frequentes

Em `index.html`, procure o comentário `FAQ:`. Substitua somente o texto de cada `<p>` nos quatro elementos `.faq-panel`. Preserve os IDs, `aria-controls`, `aria-labelledby` e `aria-expanded` para manter a acessibilidade.

## Provas reais

Os três blocos ESPAÇO RESERVADO estão na seção `#quem-sou`. Cada um tem um comentário `PROVA 01`, `PROVA 02` ou `PROVA 03` indicando onde inserir números, casos e clientes autorizados. Não foram criados depoimentos, métricas ou clientes fictícios.

As fachadas são imagens ilustrativas geradas para a comparação visual, não um caso de cliente real. Os textos alternativos identificam essa natureza ilustrativa.

## Publicar na Vercel

Use a pasta que contém `index.html` como raiz do projeto. Escolha um projeto estático, sem framework ou comando de build, e sirva essa própria pasta. Não há backend, formulário ou pacote para instalar. A versão navegável entregue separadamente é privada; publicar na sua conta Vercel é uma etapa independente.

## Verificação realizada

- Layout medido em larguras de 320, 390, 768, 1024 e 1440 px, sem transbordamento horizontal ou de títulos.
- Menu compacto abre, fecha com Escape e fecha depois de navegar para uma seção.
- FAQ abre e fecha por teclado, atualiza `aria-expanded` e oculta os outros painéis.
- Setas, Home e End navegam entre as perguntas.
- Um único h1, imagens com texto alternativo, links de âncora válidos e cinco CTAs configurados.
- Os recortes usam 10°, com a rotação de -8° do carimbo como exceção prevista no briefing.

## Imagens

Os arquivos `assets/loja-antes.webp` e `assets/loja-depois.webp` (comparador Antes e depois) e `assets/sintoma-*.webp` (cartões de sintomas) foram gerados com IA a partir de prompts próprios, em formato 3:2 (1536×1024). O Antes e o Depois mostram a mesma loja de shopping, com o mesmo enquadramento: no Antes ela está cinza e vazia, com um homem e uma mulher tristes; no Depois está viva, cheia de clientes, com os dois sorrindo. São pessoas fictícias. O carimbo e os demais elementos geométricos são SVGs editáveis.

## Animações e interação

Tudo está no fim de `styles.css` (bloco MOVIMENTO) e de `script.js` (bloco ANIMAÇÕES AO ROLAR). Só `transform`, `translate` e `opacity`, sem bibliotecas.

- Entrada ao rolar: cada bloco sobe, cresce e aparece; os cartões lado a lado entram de lados opostos (no desktop). Os títulos sobem palavra por palavra, por trás de uma máscara. A lista do que anima fica em `revealGroups`, no `script.js`: para animar um elemento novo, acrescente o seletor lá.
- Paralaxe: imagens dos cartões de sintomas, retrato de "Quem sou eu" e números dos pilares andam em velocidades diferentes do resto (lista `parallaxItems`).
- Só com mouse: cartões que inclinam em 3D e botões que puxam o cursor (magnéticos). Em telas de toque nada disso é ligado.
- Hero: o carimbo VR "bate" na página e gira de leve ao rolar, e o retângulo vinho do retrato anda mais devagar que o resto.
- Antes e depois: um comparador arrastável (`.ba` em `index.html`, lógica no bloco ANTES E DEPOIS ARRASTÁVEL do `script.js`). As duas fotos ficam sobrepostas e uma linha com botão redondo revela uma ou outra. Com mouse, arrasta-se em qualquer ponto da foto; no celular só o botão central responde, para a página continuar rolando; as setas do teclado movem 5% (Home e End vão às pontas). Ao aparecer na tela, a linha faz uma varredura de convite (0 → 100 → 0 → 100 → 50) se o visitante ainda não mexeu e se o sistema não pede "reduzir movimento". A faixa laranja se desenha sobre "Cliente comparando preço." nas legendas abaixo.
- Quebras de expectativa (cada uma reforça a tese "marca desejada vende sem desconto"): o título do hero abre com "VENDER BARATO.", que é riscado e cai, e "O DOBRO." sobe no lugar (`.dobro` no `index.html`, `data-keep` impede que o script divida o bloco em palavras); os sintomas "congelam" (paralaxe e inclinação dos cartões param, classe `is-frozen`) até a causa tomar a tela, e o movimento volta; ao arrastar o comparador para o ANTES o fundo da seção esfria (cinza) e para o DEPOIS ele acende (variáveis `--cool` e `--glow`), enquanto o rótulo e o título mantêm a cor de sempre; em "O PROBLEMA NÃO É A FALTA DE CLIENTES" a parte negada é riscada ao vivo e só depois entra a linha laranja com a resposta; o botão final vira "Boa escolha." ao passar o mouse, focar ou tocar; e a aba do navegador troca o título quando a pessoa sai ("O cliente que sai sem comprar também não volta") e quando volta.
- Sintomas, causa, pilares e método: números e cartões entram em sequência, o bloco vinho da causa abre e a linha entre as etapas do método se desenha.
- FAQ: a resposta abre e fecha com a altura deslizando.
- Barra de progresso laranja no topo, cabeçalho que ganha sombra ao rolar, cartões e botões que reagem ao mouse.
- Quem ativa "reduzir movimento" no sistema vê a página parada: a classe `anim` nem chega a ser ligada. O mesmo vale sem JavaScript.
