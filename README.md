# Vinicius Ribeiro — Marca e vendas

Página única em HTML, CSS e JavaScript puro. Sem dependências, instalação ou etapa de build. A estrutura de navegação, os blocos do briefing (a seção de palestras foi retirada) e as correções obrigatórias estão implementados.

## Estrutura

- `index.html`: conteúdo, navegação, FAQ e template de retrato.
- `styles.css`: identidade visual, responsividade e estados de foco.
- `script.js`: configurações, menu mobile, retratos e acordeão acessível.
- `assets/`: carimbo, favicon, listras, placeholder de retrato e fachadas ilustrativas.

## Links e canais

As primeiras linhas de `script.js` concentram a configuração:

```js
const CTA_URL = '#contato';
const EMAIL = '';
const PHONE = '';
const INSTAGRAM = '';
const PHOTO_SRC = '';
```

Troque `CTA_URL` pelo endereço de agendamento, formulário ou WhatsApp. Todos os cinco botões de diagnóstico seguem esse único valor. Enquanto estiver em `#contato`, os botões só navegam para a chamada final: não enviam dados nem fazem agendamento.

Preencha `EMAIL` com seu endereço de e-mail, `PHONE` com o número internacional e `INSTAGRAM` com a URL completa do perfil. Os três links no rodapé ficam ativos nesses canais após o preenchimento. Enquanto estiverem vazios, levam ao mesmo destino de `CTA_URL`.

## Sua foto

1. Coloque o arquivo em `assets/`, por exemplo `assets/vinicius-ribeiro.webp`.
2. Altere `PHOTO_SRC` para esse caminho no topo de `script.js`.
3. Ajuste `PHOTO_ALT` se precisar descrever o retrato de outra maneira.

O mesmo componente atualiza o hero e a seção Quem sou eu, remove a legenda SUA FOTO e aplica preto e branco de alto contraste automaticamente. Prefira uma foto vertical, com o rosto e o tronco centralizados. Para ajustar o enquadramento, edite `object-position` na regra `.portrait-image` em `styles.css`.

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

Os arquivos `assets/fachada-antes.webp` e `assets/fachada-depois.webp` derivam de uma composição criada com o gerador de imagens integrado. Briefing usado: a mesma pequena fachada brasileira vista de frente, com toldo, janela e porta central; antes apagada e sem pessoas em tons de tinta e papel; depois em vinho e papel com clientes anônimos na entrada; fotografia editorial com grão, sem texto, logotipo ou rosto identificável. O carimbo e os demais elementos geométricos são SVGs editáveis.

## Animações e interação

Tudo está no fim de `styles.css` (bloco MOVIMENTO) e de `script.js` (bloco ANIMAÇÕES AO ROLAR). Só `transform` e `opacity`, sem bibliotecas.

- Entrada ao rolar: cada título, cartão e bloco sobe e aparece. A lista do que anima fica em `revealGroups`, no `script.js`: para animar um elemento novo, acrescente o seletor lá.
- Hero: o carimbo VR "bate" na página e gira de leve ao rolar, e o retângulo vinho do retrato anda mais devagar que o resto.
- Antes e depois: a fachada ganha cor conforme a rolagem e a faixa laranja se desenha sobre "Marca ignorada".
- Sintomas, causa, pilares e método: números e cartões entram em sequência, o bloco vinho da causa abre e a linha entre as etapas do método se desenha.
- FAQ: a resposta abre e fecha com a altura deslizando.
- Barra de progresso laranja no topo, cabeçalho que ganha sombra ao rolar, cartões e botões que reagem ao mouse.
- Quem ativa "reduzir movimento" no sistema vê a página parada: a classe `anim` nem chega a ser ligada. O mesmo vale sem JavaScript.
