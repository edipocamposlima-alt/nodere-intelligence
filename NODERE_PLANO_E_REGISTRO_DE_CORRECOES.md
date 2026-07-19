# NODERE — Plano e Registro de Correções

Data: 2026-07-18

## Critério usado

Prioridade P0 significa risco de exposição, sessão ou perda de dados; P1 afeta resultado operacional; P2 afeta usabilidade/desempenho; P3 é evolução. Cada correção só é considerada concluída quando código e evidência correspondente existem.

| ID | Prioridade | Problema | Correção implementada | Evidência | Status |
|---|---:|---|---|---|---|
| AUTH-01 | P0 | Área privada renderizada antes de validar sessão | `AuthProvider` bloqueia filhos até `/workspace/me` confirmar o token | E2E de sessão inválida em desktop/mobile | Concluído |
| AUTH-02 | P0 | Cookie criado para token não validado | rota `/api/auth/session` valida no backend antes do `Set-Cookie` | POST inválido retorna 401 | Concluído |
| SEC-01 | P0 | Chave de API pública enviada pelo cliente | fallback `NEXT_PUBLIC_API_KEY` removido das chamadas do navegador | busca estática e typecheck | Concluído |
| DATA-01 | P0 | Leituras diretas do Supabase em workspace/configurações | leitura movida para API autenticada; pacote Supabase removido do web | build e busca por cliente direto | Concluído |
| PWA-01 | P0 | Risco de cache de navegação privada | rede obrigatória para navegações; cache só público/estático | 19/19 no validador PWA | Concluído |
| IMP-01 | P0 | Parser XLSX vulnerável e sem limites | ExcelJS, limites e rejeição de XLS legado | 4/4 testes de importação | Concluído |
| CRM-01 | P1 | Conversão de 47.400% | ordem canônica, alcance acumulado e teto de 100% | teste visual/código e build | Concluído |
| CRM-02 | P1 | Kanban denso e controles competindo com operação | customização recolhida, colunas maiores e scroll-snap | inspeção responsiva | Concluído |
| RPT-01 | P1 | Teste de período falhava conforme a data atual | relógio explícito em filtro e fixture fixa | 4/4 testes de relatório | Concluído |
| SET-01 | P1 | URL duplicava `/api/settings` | caminho corrigido para `/settings` | typecheck/build | Concluído |
| CMS-01 | P1 | `/admin/blog` tentava escrever em tabela não oficial | redirect para `/admin/content?type=blog` | build da rota | Concluído |
| UX-01 | P2 | Dashboard sem hierarquia e muito comprimido | agrupamentos, títulos, largura e espaçamento revisados | build e inspeção visual | Concluído |
| A11Y-01 | P2 | foco e movimento inconsistentes | `focus-visible` global e `prefers-reduced-motion` | revisão CSS | Concluído |
| DEP-01 | P2 | avisos conhecidos em dependências | Nodemailer atualizado; PostCSS/UUID atualizados; XLSX removido | `npm audit`: 0/0 | Concluído |
| DB-01 | P0 | funções `SECURITY DEFINER`, `search_path` e vínculo auth | migração transacional + rollback preparados | revisão SQL | Preparado, não aplicado |
| DB-02 | P1 | usuários órfãos/sem vínculo | inventário e bloqueio operacional documentados | consulta Supabase | Pendente de reconciliação |
| PERF-01 | P2 | bundles elevados em rotas críticas | inventário registrado para divisão futura | saída do build | Pendente |
| E2E-01 | P1 | ausência de login automatizado real | cenários escritos; requer conta dedicada | 2 testes ignorados | Bloqueado por credencial de teste |

## Alterações de dependência

- Frontend: `@supabase/supabase-js` removido por não existir uso canônico após a migração das leituras; override de PostCSS para versão corrigida.
- Backend: `xlsx` removido; `exceljs` instalado; Nodemailer atualizado; UUID transitivo fixado por override.
- Resultado: zero vulnerabilidades reportadas pelo `npm audit` nos dois workspaces no corte desta auditoria.

## Alterações no banco preparadas

O hardening SQL:

1. usa transação e advisory lock;
2. valida duplicidade antes de criar índice único parcial de `auth_user_id`;
3. move helpers internos para schema privado;
4. recria sete políticas observadas para `authenticated`;
5. fixa `search_path` de funções públicas;
6. revoga execução de função de event trigger para `anon` e `authenticated`.

O rollback restaura a forma observada antes da mudança. Nenhum dos dois scripts substitui backup ou staging.

## Pendências programadas

- P0: reconciliar 161 registros de plataforma sem vínculo válido; ativar leaked password protection; validar/aplicar DB-01.
- P1: criar conta E2E; confirmar Anthropic/PageSpeed/WhatsApp/Apollo/Econodata; instalar schema oficial do CMS.
- P2: dividir bundles, remover índices comprovadamente inúteis após janela de observabilidade e indexar FKs conforme planos de consulta.
- P3: métricas de Core Web Vitals, orçamento de bundle e testes visuais autenticados.
