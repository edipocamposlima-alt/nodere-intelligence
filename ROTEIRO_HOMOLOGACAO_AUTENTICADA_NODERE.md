# ROTEIRO DE HOMOLOGACAO AUTENTICADA REAL — NODERE

Data: 23/06/2026
Branch obrigatoria: `fase-02-desenvolvimento`
Arquivo base: `HOMOLOGACAO_FINAL_NODERE.md`
Objetivo: validar manualmente a plataforma em navegador com sessao real antes de qualquer deploy.

## Regras

- Nao executar deploy durante este roteiro.
- Nao executar SQL durante este roteiro.
- Nao criar funcionalidades durante este roteiro.
- Registrar evidencia para cada item: print, video curto, status HTTP, mensagem exibida ou observacao objetiva.
- Classificar cada item como: APROVADO, PARCIAL ou REPROVADO.
- Se algum item critico for REPROVADO, nao liberar deploy.

## Preparacao

1. Confirmar que a branch local e `fase-02-desenvolvimento`.
2. Confirmar que o ambiente usado para homologacao aponta para as mesmas variaveis esperadas de API, Supabase e integracoes.
3. Abrir o navegador em janela anonima ou perfil limpo.
4. Abrir DevTools com abas Console e Network visiveis.
5. Limpar cache/localStorage/cookies antes do primeiro teste.
6. Separar usuarios reais ou contas de teste para os perfis owner, admin, operator e viewer.

Campo geral de ambiente:

| Item | Valor |
| --- | --- |
| URL testada | |
| Data/hora da homologacao | |
| Navegador | |
| Sistema operacional | |
| Responsavel pelo teste | |

## Checklist de Homologacao

### 1. Login

Passo a passo:
1. Abrir `/login`.
2. Informar e-mail e senha de usuario valido.
3. Clicar em entrar.
4. Observar redirecionamento para a area autenticada.
5. Conferir Console e Network.

Resultado esperado:
- Login conclui sem erro.
- Usuario e workspace sao carregados.
- Nenhum erro 401/403 indevido apos autenticacao.
- Nenhuma chave sensivel aparece no frontend.

Status: [ ] APROVADO [ ] PARCIAL [ ] REPROVADO

Evidencia necessaria:
- Print da tela autenticada.
- Observacao do status das chamadas principais.

Observacoes:

---

### 2. Logout

Passo a passo:
1. Com sessao ativa, clicar em sair.
2. Confirmar redirecionamento para login ou pagina publica.
3. Tentar acessar `/app/dashboard` novamente.

Resultado esperado:
- Sessao e encerrada.
- Rotas protegidas redirecionam ou bloqueiam acesso.
- Chamadas protegidas retornam 401 sem sessao.

Status: [ ] APROVADO [ ] PARCIAL [ ] REPROVADO

Evidencia necessaria:
- Print apos logout.
- Status HTTP de uma rota protegida sem sessao.

Observacoes:

---

### 3. Sessao Persistente

Passo a passo:
1. Fazer login.
2. Recarregar a pagina.
3. Fechar e reabrir a aba.
4. Alternar entre Dashboard, CRM, Discovery e Configuracoes.

Resultado esperado:
- Sessao permanece ativa.
- Usuario nao volta indevidamente para login.
- Token e refresh funcionam sem perda de workspace.

Status: [ ] APROVADO [ ] PARCIAL [ ] REPROVADO

Evidencia necessaria:
- Print antes e depois do reload.
- Observacao de chamadas autenticadas com status 200.

Observacoes:

---

### 4. Expiracao de Sessao

Passo a passo:
1. Manter a sessao aberta ate expirar ou simular expiracao autorizada no ambiente de teste.
2. Recarregar uma rota protegida.
3. Tentar executar uma acao autenticada.

Resultado esperado:
- Expiracao e tratada de forma controlada.
- Usuario recebe aviso ou e redirecionado corretamente.
- Nao ocorre tela quebrada nem loop infinito.

Status: [ ] APROVADO [ ] PARCIAL [ ] REPROVADO

Evidencia necessaria:
- Print da mensagem/fluxo.
- Observacao do comportamento de refresh ou redirecionamento.

Observacoes:

---

### 5. Perfil Owner

Passo a passo:
1. Entrar com usuario owner.
2. Acessar Dashboard, CRM, Companies, Settings, Operators, Admin, Reports e Calendar.
3. Criar/editar/remover um registro de teste onde permitido.
4. Conferir chamadas Network.

Resultado esperado:
- Owner possui acesso total.
- Mutacoes permitidas retornam 200/201/204.
- Nenhum bloqueio indevido por plano/modulo.

Status: [ ] APROVADO [ ] PARCIAL [ ] REPROVADO

Evidencia necessaria:
- Print do perfil carregado.
- Print ou anotacao de uma mutacao bem-sucedida.

Observacoes:

---

### 6. Perfil Admin

Passo a passo:
1. Entrar com usuario admin.
2. Acessar modulos administrativos e operacionais.
3. Validar criacao/edicao de registros permitidos.
4. Testar area de administracao.

Resultado esperado:
- Admin possui acesso administrativo permitido.
- Mutacoes administrativas autorizadas funcionam.
- Workspace correto permanece carregado.

Status: [ ] APROVADO [ ] PARCIAL [ ] REPROVADO

Evidencia necessaria:
- Print da topbar/perfil.
- Print do acesso a uma tela administrativa.

Observacoes:

---

### 7. Perfil Operator

Passo a passo:
1. Entrar com usuario operator.
2. Acessar Dashboard, Discovery, CRM, Calendar e Reports.
3. Validar que o usuario ve apenas dados do escopo permitido.
4. Tentar acessar Operators/Admin Roles.

Resultado esperado:
- Operator executa tarefas operacionais permitidas.
- Operator nao administra operadores nem papeis.
- Acesso indevido retorna 403 ou bloqueio visual claro.

Status: [ ] APROVADO [ ] PARCIAL [ ] REPROVADO

Evidencia necessaria:
- Print de acao permitida.
- Print/status 403 de acao bloqueada.

Observacoes:

---

### 8. Perfil Viewer

Passo a passo:
1. Entrar com usuario viewer.
2. Acessar telas de leitura permitidas.
3. Tentar criar, editar ou excluir registros.
4. Testar endpoints protegidos por mutacao.

Resultado esperado:
- Viewer consegue apenas leitura.
- Mutacoes retornam 403.
- A interface nao exibe comandos perigosos ou trata bloqueio corretamente.

Status: [ ] APROVADO [ ] PARCIAL [ ] REPROVADO

Evidencia necessaria:
- Print de tela em modo leitura.
- Print/status 403 de mutacao bloqueada.

Observacoes:

---

### 9. Dashboard

Passo a passo:
1. Acessar `/app/dashboard` ou `/dashboard`.
2. Conferir cards, metricas, atalhos e alertas.
3. Trocar tema claro/escuro se disponivel.
4. Recarregar a pagina.

Resultado esperado:
- Dashboard carrega sem erro.
- Dados aparecem conforme perfil.
- Nao ha textos apagados, sobreposicao ou erro de backend.

Status: [ ] APROVADO [ ] PARCIAL [ ] REPROVADO

Evidencia necessaria:
- Print desktop.
- Print tema claro/escuro se aplicavel.

Observacoes:

---

### 10. Discovery

Passo a passo:
1. Acessar `/app/discovery` ou `/discovery`.
2. Pesquisar por segmento e cidade.
3. Abrir detalhes de um resultado.
4. Salvar lead no CRM.

Resultado esperado:
- Busca retorna resultados ou erro controlado.
- Detalhes por placeId funcionam.
- Adicionar ao CRM persiste o lead.

Status: [ ] APROVADO [ ] PARCIAL [ ] REPROVADO

Evidencia necessaria:
- Print da busca.
- Print do lead salvo no CRM.

Observacoes:

---

### 11. CRM

Passo a passo:
1. Acessar `/crm` ou `/app/leads`.
2. Criar ou selecionar lead de teste.
3. Mover entre etapas do funil.
4. Editar temperatura, probabilidade, proxima acao e motivo de perda.
5. Abrir ficha do lead/empresa.

Resultado esperado:
- Funil visual funciona.
- Drag-and-drop persiste.
- Ficha abre sem erro.
- Historico de movimentacoes e atualizado.

Status: [ ] APROVADO [ ] PARCIAL [ ] REPROVADO

Evidencia necessaria:
- Print antes/depois da movimentacao.
- Observacao do status da API.

Observacoes:

---

### 12. Calendario

Passo a passo:
1. Acessar `/calendar` ou `/calendario`.
2. Criar evento com data futura.
3. Editar horario/status.
4. Associar evento a lead/empresa quando possivel.
5. Excluir evento de teste.

Resultado esperado:
- Eventos sao criados, editados e excluidos.
- Visualizacoes mensal/semanal funcionam.
- Lembrete interno aparece conforme configurado.

Status: [ ] APROVADO [ ] PARCIAL [ ] REPROVADO

Evidencia necessaria:
- Print do evento criado.
- Print ou observacao do evento removido.

Observacoes:

---

### 13. Relatorios

Passo a passo:
1. Acessar `/reports` ou `/relatorios`.
2. Aplicar filtros por periodo, operador, empresa, status e origem.
3. Conferir cards e graficos.
4. Exportar CSV.
5. Exportar PDF.

Resultado esperado:
- Filtros alteram os dados exibidos.
- CSV e PDF sao gerados sem erro.
- Viewer/operator veem apenas escopo permitido.

Status: [ ] APROVADO [ ] PARCIAL [ ] REPROVADO

Evidencia necessaria:
- Print dos filtros.
- Arquivos gerados ou print do download.

Observacoes:

---

### 14. Inbox

Passo a passo:
1. Acessar `/inbox`.
2. Abrir conversa existente ou registro de teste.
3. Conferir timeline.
4. Validar anexos quando existirem.

Resultado esperado:
- Inbox carrega sem erro.
- Conversas aparecem em ordem cronologica.
- Anexos nao quebram a tela.

Status: [ ] APROVADO [ ] PARCIAL [ ] REPROVADO

Evidencia necessaria:
- Print da inbox.
- Observacao sobre mensagens/anexos.

Observacoes:

---

### 15. WhatsApp / Historico

Passo a passo:
1. Abrir lead/empresa com historico.
2. Acessar area de WhatsApp/historico.
3. Verificar mensagens enviadas/recebidas.
4. Testar template de abordagem/follow-up se disponivel.

Resultado esperado:
- Historico por lead/empresa aparece.
- Templates comerciais estao disponiveis.
- Sem credencial externa, o sistema retorna erro controlado.

Status: [ ] APROVADO [ ] PARCIAL [ ] REPROVADO

Evidencia necessaria:
- Print do historico.
- Print do erro controlado ou template gerado.

Observacoes:

---

### 16. Configuracoes

Passo a passo:
1. Acessar `/app/settings` ou `/settings`.
2. Conferir dados do workspace.
3. Testar salvamento de campo de teste permitido.
4. Conferir integracoes e permissoes por perfil.

Resultado esperado:
- Admin/owner acessam configuracoes.
- Viewer nao altera integracoes.
- Chaves reais nao aparecem no frontend.

Status: [ ] APROVADO [ ] PARCIAL [ ] REPROVADO

Evidencia necessaria:
- Print da tela.
- Print de valor mascarado quando aplicavel.

Observacoes:

---

### 17. Administracao

Passo a passo:
1. Entrar como admin/owner.
2. Acessar `/admin` e `/admin/content`.
3. Validar acesso a usuarios, planos, modulos, conteudo e permissoes.
4. Entrar como operator/viewer e tentar acessar admin.

Resultado esperado:
- Admin/owner acessam administracao.
- Operator/viewer sao bloqueados.
- Nenhuma tela administrativa fica publica.

Status: [ ] APROVADO [ ] PARCIAL [ ] REPROVADO

Evidencia necessaria:
- Print admin/owner.
- Print/status de bloqueio operator/viewer.

Observacoes:

---

### 18. Mobile 375px

Passo a passo:
1. Abrir DevTools em largura 375px.
2. Testar login, dashboard, menu, CRM, calendar, reports e settings.
3. Verificar botao sair.

Resultado esperado:
- Sem overflow critico.
- Menu e botao sair visiveis.
- Formularios e cards utilizaveis.

Status: [ ] APROVADO [ ] PARCIAL [ ] REPROVADO

Evidencia necessaria:
- Prints das principais telas em 375px.

Observacoes:

---

### 19. Mobile 390px

Passo a passo:
1. Abrir DevTools em largura 390px.
2. Repetir navegacao principal.
3. Validar textos, botoes e tabelas.

Resultado esperado:
- Navegacao touch funcional.
- Textos nao cortam comandos essenciais.
- Topbar/menu nao sobrepoem conteudo.

Status: [ ] APROVADO [ ] PARCIAL [ ] REPROVADO

Evidencia necessaria:
- Prints das principais telas em 390px.

Observacoes:

---

### 20. Mobile 414px

Passo a passo:
1. Abrir DevTools em largura 414px.
2. Testar dashboard, discovery, CRM, inbox e relatorios.
3. Validar instalacao PWA quando aplicavel.

Resultado esperado:
- Layout responsivo sem quebra critica.
- Cards e formularios adaptados.
- Menu mobile permanece acessivel.

Status: [ ] APROVADO [ ] PARCIAL [ ] REPROVADO

Evidencia necessaria:
- Prints das principais telas em 414px.

Observacoes:

---

### 21. PWA

Passo a passo:
1. Abrir a aplicacao em Chrome/Edge.
2. Verificar se aparece opcao de instalar app.
3. Instalar PWA.
4. Abrir app instalado.
5. Testar navegacao basica e offline fallback.

Resultado esperado:
- Instalacao disponivel.
- Icone e nome corretos.
- App abre em modo standalone.
- Offline fallback funciona para navegacao basica.

Status: [ ] APROVADO [ ] PARCIAL [ ] REPROVADO

Evidencia necessaria:
- Print do prompt/app instalado.
- Print do app em standalone.

Observacoes:

---

### 22. IA

Passo a passo:
1. Abrir lead/empresa com dados suficientes.
2. Gerar diagnostico comercial ou insight.
3. Gerar sugestao de abordagem/follow-up/proposta.
4. Conferir registro de resposta no historico quando aplicavel.

Resultado esperado:
- IA responde com contexto real do lead.
- Sem credencial, erro e amigavel e controlado.
- Nenhuma chave aparece no frontend.

Status: [ ] APROVADO [ ] PARCIAL [ ] REPROVADO

Evidencia necessaria:
- Print da resposta ou erro controlado.
- Observacao sobre uso de contexto real.

Observacoes:

---

### 23. Discovery Avancado

Passo a passo:
1. Pesquisar empresa no Discovery.
2. Abrir detalhes/enriquecimento.
3. Conferir score comercial, sinais digitais e recomendacao de abordagem.
4. Salvar no CRM.
5. Conferir score/recomendacao no lead.

Resultado esperado:
- Score e classificacao aparecem.
- Baixa maturidade digital e sinais de oportunidade sao identificados.
- Insights sao refletidos no CRM sem quebrar dados existentes.

Status: [ ] APROVADO [ ] PARCIAL [ ] REPROVADO

Evidencia necessaria:
- Print do score.
- Print do lead salvo com insight.

Observacoes:

---

## Consolidado Final

| Area | Status | Evidencia registrada | Observacoes |
| --- | --- | --- | --- |
| Login | | | |
| Logout | | | |
| Sessao persistente | | | |
| Expiracao de sessao | | | |
| Owner | | | |
| Admin | | | |
| Operator | | | |
| Viewer | | | |
| Dashboard | | | |
| Discovery | | | |
| CRM | | | |
| Calendario | | | |
| Relatorios | | | |
| Inbox | | | |
| WhatsApp/Historico | | | |
| Configuracoes | | | |
| Administracao | | | |
| Mobile 375px | | | |
| Mobile 390px | | | |
| Mobile 414px | | | |
| PWA | | | |
| IA | | | |
| Discovery avancado | | | |

## Criterio de liberacao

Liberar para deploy somente se:

- Login, logout e sessao persistente forem APROVADOS.
- Owner/admin/operator/viewer forem APROVADOS.
- Dashboard, Discovery, CRM, Calendario, Relatorios, Configuracoes e Administracao forem APROVADOS ou tiverem apenas pendencias nao criticas.
- Mobile/PWA nao tiver quebra critica.
- Nenhuma credencial sensivel aparecer no frontend.
- Nenhuma rota protegida ficar acessivel sem sessao.

HOMOLOGACAO MANUAL PRONTA PARA EXECUCAO: SIM
