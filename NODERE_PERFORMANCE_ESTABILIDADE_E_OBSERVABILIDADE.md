# NODERE — Performance, Estabilidade e Observabilidade

Data: 2026-07-19

## Estado final

- builds Web/API e typechecks aprovados;
- 46/46 testes de API aprovados;
- nenhuma vulnerabilidade de produção no `npm audit` de Web/API;
- nenhum erro de runtime agrupado no Vercel na janela final de uma hora;
- nenhum log warning/error/fatal do deployment Vercel final nessa janela;
- Render iniciou a API 1.1.0 e a marcou como `live`;
- probes de health de API, Supabase e OpenAI aprovados.

O Render está em plano Free; cold start pode atrasar requisições por dezenas de segundos. Isso deve ser distinguido de indisponibilidade permanente no suporte e nos monitores.

## Tamanho inicial por rotas de maior peso

| Rota/grupo | JS inicial observado |
|---|---:|
| Ficha/Empresas por ID | 471 kB |
| Empresas | 390 kB |
| Marketing | 329 kB |
| Calendário | 323–324 kB |
| CRM/Leads | 275 kB |
| Buscas | 262 kB |
| Relatórios | 231 kB |

O build passa, mas esses números justificam um orçamento de performance e code splitting orientado por medição. A revisão React aplicada nesta entrega simplificou dependências de estado/efeitos nas telas alteradas e evitou derivar estado redundante; não houve reescrita ampla sem benchmark.

## Banco

Os advisors apontam 19 FKs sem índice, 13 tabelas sem PK, 31 índices não usados, 1 auth initplan e 18 grupos de políticas permissivas. Nenhum índice foi removido e nenhuma política foi alterada sem staging. “Unused” não prova inutilidade; exige janela representativa de observação e EXPLAIN.

## Próximas medições

1. PageSpeed/Lighthouse autenticado e público após configurar chave;
2. Core Web Vitals por rota na Vercel;
3. p50/p95/p99 e taxa de erro da API no Render;
4. tracing dos fluxos Busca → CRM → Ficha → Proposta;
5. slow queries/EXPLAIN no staging restaurado;
6. orçamento inicial sugerido: regressão máxima de 10% por rota até baseline aprovado;
7. alerta separado para cold start e erro 5xx real.
