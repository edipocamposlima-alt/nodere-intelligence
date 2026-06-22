# Plano de Execução da Fase 2

Data: 22/06/2026  
Branch obrigatória: `fase-02-desenvolvimento`  
Documento-base: `RELATORIO_BASE_FASE_02.md`  
Estado de entrada: Fase 1 homologada  
Escopo desta etapa: somente planejamento

## 1. Premissas e limites

- Autenticação, autorização, schema, endpoints críticos e regressão da Fase 1 são baseline aprovada e não devem ser reimplementados.
- As tabelas oficiais continuam sendo `nodere_workspaces`, `nodere_platform_users` e `nodere_companies`.
- Não criar tabelas paralelas de usuários, workspaces, empresas ou leads.
- Cada bloco deve preservar os contratos de API, RLS, isolamento por `workspace_id` e matriz Owner/Admin/Operator/Viewer.
- Qualquer necessidade de banco deve resultar primeiro em SQL incremental separado, revisão de impacto e aplicação manual autorizada.
- Dependências externas devem ter timeout, erro controlado, observabilidade e nenhum segredo exposto no frontend.
- Nenhum bloco autoriza deploy automaticamente.
- Alterações de um bloco não devem ser misturadas com as de outro bloco no mesmo commit.

## 2. Ordem de execução

| Ordem | Bloco | Objetivo | Dependência principal | Gate de saída |
| --- | --- | --- | --- | --- |
| 1 | Calendário e agendamentos | Consolidar a agenda comercial | CRM e perfis homologados | Agenda e permissões aprovadas |
| 2 | WhatsApp e histórico | Centralizar conversas por empresa | Empresas, contatos e agenda | Histórico persistente e seguro |
| 3 | Relatórios | Entregar métricas filtráveis e exportáveis | Dados dos blocos 1 e 2 | Métricas e arquivos consistentes |
| 4 | CRM avançado | Completar operação comercial | Agenda, conversas e relatórios | Fluxo ponta a ponta aprovado |
| 5 | Mobile/PWA | Tornar os fluxos homologados utilizáveis no celular | UI funcional dos blocos anteriores | Matriz responsiva e PWA aprovadas |
| 6 | IA e Discovery avançado | Enriquecer prospecção e decisão | CRM consolidado e telemetria | Integrações reais com fallback aprovado |

## 3. Estratégia comum por bloco

Cada bloco deve seguir esta sequência:

1. Auditar frontend, API, schema e testes já existentes.
2. Registrar comportamento atual e lacunas em relatório pré-execução.
3. Definir alterações mínimas e arquivos permitidos.
4. Gerar SQL incremental, se necessário, sem executar.
5. Implementar em unidade pequena e reversível.
6. Executar lint, typecheck, testes e builds de API e Web.
7. Validar Owner, Admin, Operator e Viewer.
8. Validar ausência de regressão em Dashboard, Discovery, CRM, Relatórios, Configurações, Catálogo e Calendário.
9. Criar relatório de homologação do bloco.
10. Parar antes de commit, SQL ou deploy quando esses atos não estiverem expressamente autorizados.

## 4. Bloco 1 — Calendário e agendamentos

### Objetivo

Consolidar o calendário existente como agenda comercial confiável, vinculado a empresa, lead, operador e workspace.

### Escopo funcional

- Visões mensal, semanal, diária e agenda.
- Criação, edição, reagendamento, conclusão e cancelamento.
- Vínculo opcional com `nodere_companies`.
- Responsável, participantes, tipo comercial, status e lembretes internos.
- Agenda global para Owner/Admin.
- Agenda própria e atribuída para Operator.
- Somente leitura para Viewer.
- Criação de evento a partir da ficha comercial e tarefas elegíveis.
- Eventos do calendário não podem bloquear a ficha comercial quando indisponíveis.

### Auditoria inicial

- Mapear componentes e rotas de calendário existentes.
- Confirmar tabela real, colunas, tipos de IDs e índices.
- Verificar timezone do workspace e conversões no frontend.
- Identificar duplicidade entre eventos, tarefas e follow-ups.
- Conferir notificações internas e de navegador já implementadas.

### Áreas prováveis

- `apps/api/src/routes/calendar.ts`
- `apps/api/src/server.ts`
- páginas e componentes Web de calendário
- componentes da ficha comercial e tarefas
- tipos compartilhados de API e Web
- migração específica do calendário, somente se necessária

### Validação

- CRUD completo por perfil.
- Datas corretas em mudança de timezone e horário de verão.
- Filtros por operador, empresa, tipo, status e período.
- Evento criado na ficha aparece no calendário e vice-versa.
- Viewer não altera eventos; Operator não altera eventos fora do escopo.
- Calendário indisponível não quebra CRM ou ficha comercial.

### Riscos e controles

- Datas inconsistentes: armazenar UTC e exibir no timezone do workspace.
- Eventos duplicados: usar idempotência na criação automática.
- Vazamento entre workspaces: filtrar e validar `workspace_id` no backend e RLS.

### Entrega do bloco

- Relatório de auditoria.
- Eventual SQL incremental revisável.
- Matriz de permissões.
- Evidências das quatro visões e integração com CRM.

## 5. Bloco 2 — WhatsApp e histórico de conversas

### Objetivo

Associar mensagens e conversas ao workspace, empresa, lead e contato, preservando histórico auditável.

### Escopo funcional

- Configuração da integração sem exposição de credenciais.
- Conversas vinculadas automaticamente por telefone normalizado.
- Mensagens recebidas e enviadas em ordem cronológica.
- Templates, anexos suportados e status de entrega.
- Associação manual quando não houver correspondência segura.
- Registro de atividade na ficha comercial.
- Webhook público apenas para verificação e recebimento autenticado pelo provedor.

### Auditoria inicial

- Mapear Inbox, comunicações, templates e webhooks existentes.
- Confirmar provedor, credenciais esperadas e estado da configuração externa.
- Verificar tabelas `inbox_messages`, `communications` e `message_templates`.
- Definir fonte única de verdade e evitar gravação duplicada.
- Auditar normalização de telefone e deduplicação de eventos.

### Áreas prováveis

- rotas de Inbox, comunicações e WhatsApp da API
- serviços de webhook e envio
- páginas de Inbox/WhatsApp e ficha comercial
- settings de integrações
- tabelas homologadas de mensagens, comunicações e templates

### Validação

- Webhook inválido rejeitado; evento repetido ignorado.
- Mensagem autorizada persiste e aparece na conversa correta.
- Falha do provedor gera erro real e controlado.
- Viewer somente lê; Operator atua no escopo atribuído; Owner/Admin gerenciam.
- Tokens e segredos nunca aparecem em HTML, bundle, logs ou respostas.

### Riscos e controles

- Eventos duplicados: chave única do provedor e processamento idempotente.
- Associação ao lead incorreto: telefone normalizado mais confirmação manual em ambiguidades.
- Credencial ausente: estado de configuração explícito, sem simular envio bem-sucedido.

### Entrega do bloco

- Fluxo documentado de webhook e envio.
- Matriz de estados da mensagem.
- Testes de idempotência e autorização.
- Lista de pendências externas da Meta/WhatsApp.

## 6. Bloco 3 — Relatórios com filtros e exportação

### Objetivo

Garantir relatórios consistentes, filtráveis e exportáveis, calculados sobre dados reais e respeitando permissões.

### Escopo funcional

- Filtros por período, operador, empresa, segmento, cidade/UF, origem, etapa e temperatura.
- Indicadores de empresas, leads, funil, conversão, propostas, negociações, agenda e atividades.
- Comparação entre períodos quando a métrica permitir.
- Exportação CSV com os mesmos filtros da tela.
- Exportação PDF com marca, data, filtros e paginação.
- Escopo de dados por workspace, papel e atribuição.

### Auditoria inicial

- Inventariar endpoints de reports já homologados.
- Comparar fórmulas entre cards, gráficos, CSV e PDF.
- Identificar consultas duplicadas, N+1 e timeouts.
- Definir dicionário de métricas e origem de cada campo.
- Verificar bibliotecas atuais de gráficos e geração de documentos.

### Áreas prováveis

- rotas e serviços de reports/dashboard
- páginas e componentes de Relatórios
- utilitários de CSV e PDF
- tipos de filtros e respostas
- índices de banco, somente após evidência de consulta lenta

### Validação

- Mesmos filtros produzem números equivalentes em tela, CSV e PDF.
- Intervalos e timezone não omitem nem duplicam registros.
- Owner/Admin visualizam workspace; Operator visualiza escopo permitido; Viewer somente leitura.
- Estado vazio, timeout e erro são distinguíveis.
- Exportações possuem conteúdo, MIME type e nome corretos.

### Riscos e controles

- Divergência de métricas: dicionário único e testes com dataset conhecido.
- Consultas lentas: medir antes de adicionar índices ou cache.
- CSV perigoso: neutralizar formula injection em células exportadas.

### Entrega do bloco

- Dicionário de métricas.
- Matriz filtro versus endpoint.
- Evidências de CSV e PDF.
- Relatório de desempenho das consultas críticas.

## 7. Bloco 4 — CRM avançado

### Objetivo

Completar o ciclo comercial desde a entrada do lead até fechamento, perda e histórico auditável.

### Escopo funcional

- Cadastro, edição, exclusão controlada e deduplicação.
- Pipeline configurável e movimentação entre etapas.
- Histórico de mudanças, responsável, origem e timestamps.
- Contatos completos, atividades, tarefas, observações e follow-ups.
- Negociações com valor, probabilidade, previsão e motivo de perda.
- Propostas, contratos e arquivos associados.
- Busca, filtros, importação e exportação com validação.

### Auditoria inicial

- Mapear os dois fluxos atuais de leads/companies e consolidar a entidade oficial.
- Verificar `LeadDrawer`, ficha comercial, Ficha 360 e endpoints associados.
- Auditar drag and drop, concorrência e atualização otimista.
- Confirmar modelo atual de contatos, atividades, contratos, propostas e arquivos.
- Identificar operações ainda baseadas em fallback ou estado local.

### Áreas prováveis

- rotas `companies`, `crm`, `leads`, `proposals`, `contracts` e `files`
- serviços de persistência e auditoria
- páginas de empresas, leads, CRM e ficha comercial
- componentes de pipeline, drawer e editor de texto
- tabelas homologadas da Fase 1

### Validação

- Fluxo completo: criar lead, qualificar, mover, registrar interação, negociar e fechar/perder.
- Histórico mantém autor, data e valores anterior/novo.
- Contatos e atividades permanecem vinculados à empresa correta.
- Concorrência não perde alterações silenciosamente.
- PDFs e arquivos gerados/baixados funcionam e respeitam permissão.
- Importação informa erros por linha sem corromper registros válidos.

### Riscos e controles

- Duplicidade company/lead: manter `nodere_companies` como entidade oficial.
- Perda por drag and drop: persistir antes de confirmar visualmente ou reverter em falha.
- Exclusão destrutiva: preferir arquivamento quando houver histórico relacionado.

### Entrega do bloco

- Diagrama do ciclo comercial.
- Matriz CRUD por perfil.
- Cenário ponta a ponta automatizado.
- Relatório de compatibilidade com dados históricos.

## 8. Bloco 5 — Mobile/PWA

### Objetivo

Disponibilizar os fluxos homologados em desktop, tablet e celular, com instalação PWA confiável.

### Escopo funcional

- Navegação, menu, topbar, botão Sair e ações primárias acessíveis.
- Dashboard, Discovery, CRM, ficha, calendário e relatórios responsivos.
- Tabelas e kanban com estratégia móvel explícita.
- Manifest, ícones, service worker e prompt de instalação válidos.
- Estados offline e de atualização sem prometer operações indisponíveis.
- Áreas de toque, foco, contraste e leitura acessíveis.

### Auditoria inicial

- Inventariar breakpoints, overflow, dimensões fixas e componentes não responsivos.
- Validar manifest, ícones, escopo, start URL e service worker.
- Auditar cache para evitar servir código ou sessão obsoletos.
- Medir navegação e carregamento em conexão móvel simulada.

### Viewports obrigatórios

- 375px
- 390px
- 414px
- 768px
- 1024px
- 1440px

### Validação

- Tema claro e escuro em todos os viewports.
- Sem corte de botões, sobreposição ou rolagem horizontal acidental.
- Sair e troca de tela funcionam no modo instalado.
- Instalação disponível quando os critérios do navegador forem atendidos.
- Atualização do service worker não mantém assets incompatíveis.
- Lighthouse PWA e acessibilidade registrados como evidência, sem tratar score isolado como homologação.

### Riscos e controles

- Cache obsoleto: versionar caches e limpar somente os controlados pelo app.
- Kanban inviável no celular: oferecer navegação horizontal estável ou visão alternativa funcional.
- Regressão desktop: validar matriz completa após cada ajuste responsivo.

### Entrega do bloco

- Matriz visual por viewport e tema.
- Evidência de instalação PWA.
- Lista de estratégias móveis por componente complexo.
- Relatório de desempenho antes/depois.

## 9. Bloco 6 — IA e Discovery avançado

### Objetivo

Evoluir prospecção, enriquecimento e assistência comercial usando contexto real, custos controlados e integrações verificáveis.

### Escopo funcional

- Busca Google Places/Maps por termo, segmento, cidade e região.
- Detalhes por `placeId`, scanner de site e sinais sociais disponíveis.
- Deduplicação antes de adicionar ao CRM.
- Score explicável com dados de origem identificados.
- Diagnóstico, resumo, próximos passos e textos comerciais por IA.
- Contexto limitado ao workspace e à empresa autorizada.
- Registro de uso, tokens, custo estimado, modelo e finalidade.
- Fallback controlado quando Google, OpenAI ou outro provedor estiver indisponível.

### Auditoria inicial

- Mapear rotas Discovery, Places, PageSpeed, Intelligence e AI.
- Confirmar variáveis apenas no backend e settings mascarados.
- Verificar limites, timeouts, retries e cache permitidos por provedor.
- Auditar prompt injection, conteúdo não confiável e dados enviados a terceiros.
- Confirmar tabela real de uso de IA ou necessidade futura de migração.

### Áreas prováveis

- rotas e serviços de Discovery, Places, PageSpeed, AI e Intelligence
- páginas de Discovery, resultados e ficha comercial
- settings de integrações e créditos
- logs de uso e auditoria

### Validação

- Busca e detalhes retornam dados reais ou erro explícito, nunca sucesso fictício.
- Adicionar ao CRM cria ou reutiliza empresa sem duplicar.
- IA recebe apenas contexto permitido e não revela segredos.
- Resposta identifica falha de credencial, quota, timeout e indisponibilidade.
- Uso e custos são registrados de modo idempotente.
- Admin tem bypass somente conforme regra homologada; demais perfis respeitam limites.

### Riscos e controles

- Custos imprevisíveis: limites por operação, workspace e período.
- Dados de terceiros: consentimento, minimização e política de retenção.
- Alucinação: marcar conteúdo gerado, citar dados de origem e exigir confirmação em ações críticas.
- Chaves públicas: chamadas sensíveis exclusivamente pelo backend.

### Entrega do bloco

- Matriz provedor, credencial, timeout e fallback.
- Evidências de uso real e cenários de falha.
- Relatório de segurança de dados e prompts.
- Métricas de uso e custo por workspace.

## 10. Gates de segurança entre blocos

Um bloco somente libera o seguinte quando todos os itens abaixo estiverem aprovados:

- Escopo isolado e arquivos listados.
- SQL, se necessário, revisado e ainda não executado sem autorização.
- Lint, typecheck, testes e builds aprovados.
- Matriz Owner/Admin/Operator/Viewer aprovada.
- Sem regressão nos módulos homologados da Fase 1.
- Sem segredos no frontend, logs ou artefatos.
- Relatório de homologação com itens `OK`, `FALHOU` ou `PENDENTE CONTROLADO`.
- Pendência crítica implica parada; não avançar automaticamente.

## 11. Critérios globais de conclusão da Fase 2

- Os seis blocos foram implementados e homologados separadamente.
- Dados históricos foram preservados.
- Não existem tabelas paralelas das entidades centrais.
- Todas as rotas protegidas mantêm `401` sem sessão e `403` sem permissão.
- Operações autorizadas retornam sucesso real, sem mascarar falhas externas.
- Exportações, documentos e PWA foram testados em ambiente apropriado.
- Mobile e desktop foram validados nos viewports definidos.
- Builds de API e Web estão aprovados.
- SQL e deploy ocorreram somente mediante autorização explícita e com evidência pós-execução.

## 12. Próxima ação recomendada

Iniciar somente a auditoria técnica do **Bloco 1 — Calendário e agendamentos**, produzindo inventário de rotas, componentes, tabelas, permissões e lacunas. Nenhuma implementação deve começar antes da aprovação desse inventário.
