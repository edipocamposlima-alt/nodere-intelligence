# 11 — Auditoria UX/UI e responsividade

- Nova página `/ai` com cabeçalho operacional, chat, histórico, seletores, saldo e painéis de contexto.
- Desktop XL: três colunas. Tablet/mobile: chat prioritário; navegação móvel ganha NODERE AI como primeiro item.
- Estados explícitos: carregando, gateway indisponível, sem saldo, streaming, erro, aprovação pedida/aceita/negada e recibo.
- Entradas usam elementos semânticos, labels/sr-only, `role=alert` e botões reais.
- AI Elements oficiais: Conversation, Message, PromptInput, Confirmation e Tool.
- Plugins pesados de matemática/Mermaid/syntax highlight foram removidos da rota; JSON de recibo usa `<pre>` acessível.
- Login, registro e `/` autenticado redirecionam para `/ai`; `/ia` virou alias.

O smoke Playwright confirmou em Desktop Chrome e Pixel 5 que /ai sem sessão redireciona e sessão inválida não revela conteúdo privado. A habilidade de browser interno tentou anexar a webview local duas vezes e falhou; inspeção visual autenticada e matriz 320/375/768/1024 continuam pendentes até preview + schema + usuário fictício.
