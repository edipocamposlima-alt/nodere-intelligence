# NODERE — Auditoria UX/UI Pós-Produção

Data: 2026-07-19

## Escopo observado

Foram navegados em produção Dashboard, Buscas, CRM, catálogo de empresas/Ficha, Propostas, Relatórios, Admin e Manual em sessão autenticada. Também foram executados cenários Playwright desktop/mobile para o gate de autenticação.

## Correções confirmadas

- onboarding do Dashboard usa empresas/propostas/histórico reais;
- dispensar o onboarding não falsifica a conclusão de etapas;
- Integrações distingue `OK`, `configurado — teste pendente`, ausente e erro;
- tela utiliza a obrigatoriedade devolvida pela API;
- Administração comunica convite, não senha temporária;
- página offline está pública e disponível;
- sessão inválida não renderiza conteúdo privado;
- CORS negado retorna resposta explícita e compreensível para diagnóstico.

## Consistência visual

As telas principais mantêm a linguagem escura NODERE, sidebar persistente, cards, badges semânticos e densidade alta adequada ao perfil operacional. CRM/Kanban e Dashboard continuam informacionalmente densos; isso é útil em desktop, mas requer ensaio visual dedicado para notebooks menores e zoom ampliado.

## Pendências verificáveis

- varredura axe completa autenticada;
- Lighthouse/PageSpeed real com chave;
- matriz visual de zoom 33% a 150%;
- navegação manual completa em aparelhos iOS/Android reais;
- redução dos bundles das rotas mais pesadas;
- revisão de estados vazios/erro de integrações ainda não contratadas.

Não foram observados erros de aplicação nas rotas do smoke final. Isso não equivale a cobertura visual exaustiva de todos os modais, combinações de papel ou resoluções.
