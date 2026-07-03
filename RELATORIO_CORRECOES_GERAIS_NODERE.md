# RELATORIO - Correcoes Gerais NODERE

Data: 03/07/2026

## Bugs corrigidos

- Editor rich text com barra de ferramentas quebrada, com rolagem horizontal e risco de botoes cortados.
- Icones de editor e botoes de card com contraste/visibilidade inconsistentes.
- Cards de empresas com acoes secundarias visualmente soltas.
- Configuracoes em mobile com overflow horizontal real na area administrativa.
- PDF Ficha Cliente exibindo HTML bruto de observacoes/historico.

## Arquivos alterados

- `apps/web/app/globals.css`
- `apps/web/components/CompanyTable.tsx`
- `apps/web/app/settings/page.tsx`
- `apps/api/src/routes/companies.ts`
- `RELATORIO_AUDITORIA_FUNCIONAL_COMPLETA_NODERE.md`
- `RELATORIO_CORRECOES_GERAIS_NODERE.md`

## Componentes ajustados

- `RichTextEditor` via CSS global:
  - toolbar flexivel;
  - quebra em multiplas linhas;
  - sem overflow horizontal;
  - contraste de icones reforcado;
  - conteudo e preview com `overflow-wrap:anywhere`.
- `CompanyTable`:
  - `Salvar lead` permanece visivel;
  - `Ficha` permanece visivel;
  - acoes secundarias organizadas em `nodere-company-action-strip`;
  - botoes usam tokens de tema claro/escuro.
- `SettingsPage`:
  - classe `nodere-settings-page` aplicada ao wrapper;
  - textos, links, botoes e cards agora quebram linha e respeitam `max-width: 100%`.

## APIs ajustadas

- `apps/api/src/routes/companies.ts`
  - `renderCompanyExportPdf` passou a usar `cleanPdfText`.
  - HTML de rich text e removido antes de escrever no PDF.
  - Listas, paragrafos e quebras basicas sao convertidos para texto limpo.

## PDFs corrigidos

- PDF Ficha Cliente:
  - remove tags `<span>`, `<p>`, `<ul>`, `<li>`, `<div>`, `<font>` e atributos inline;
  - remove `style=`, `font-size`, `font-family` do conteudo vindo de rich text;
  - preserva texto, quebras de linha e listas em formato textual;
  - mantem cabecalho, logo, rodape, paginacao e hierarquia PDFKit.
  - corrige cursor do PDFKit apos o cabecalho para impedir deslocamento do conteudo para a direita.

PDFs preservados em producao antes do deploy desta correcao:

- PDF Relatorio: `200 application/pdf`.
- PDF Proposta: `200 application/pdf`.
- PDF Contrato: `200 application/pdf`.

## Testes executados

- `apps/web npm run lint` - aprovado.
- `apps/web npm run typecheck` - aprovado.
- `apps/web npm run build` - aprovado.
- `apps/api npm run typecheck` - aprovado.
- `apps/api npm run build` - aprovado.
- `npm run build` - aprovado.
- `git diff --check` - aprovado, apenas avisos LF/CRLF do Windows.

## Validacoes reais executadas

- Login owner/admin em producao: `200`, perfil `owner`.
- `GET /api/companies`: `200`, 474 empresas.
- `GET /api/settings`: `200`.
- PDF Relatorio: `200 application/pdf`.
- PDF Proposta: `200 application/pdf`.
- PDF Contrato: `200 application/pdf`.
- PDF Ficha Cliente antes da correcao local: `200 application/pdf`, porem continha HTML bruto, confirmando causa raiz.

## Deploy realizado

- Commits publicados em `main`:
  - `ecc5d3d01921ad129495760ab194725b11c90892` - `fix: corrigir editores cards e pdf ficha cliente`.
  - `d479165` - `fix: alinhar pdf da ficha cliente`.
  - `e6b159d` - `fix: corrigir overflow mobile em configuracoes`.
- Frontend Vercel:
  - deployment `dpl_A6BuYKwBCBM9S25L57CanSGccJgJ`.
  - URL tecnica `https://web-hrdxhv5c4-edipo-lima-s-projects.vercel.app`.
  - alias de producao `https://nodere.com.br`.
  - status `READY`.
- Backend Render:
  - API `https://nodere-api.onrender.com` validada em producao.
  - `GET /api/health`: `200`.
  - `POST /api/admin/login`: `200`, perfil `owner`.
  - `GET /api/settings`: `200`.
  - PDF Ficha Cliente autenticado: `200 application/pdf`, arquivo `%PDF`.

## Pendencias

- Nenhuma pendencia tecnica bloqueante identificada nesta rodada.
- Relatorios antigos e `.codex_tmp/` permanecem fora do commit/deploy por serem artefatos locais ou documentos preexistentes.

## Status final

Status final: APROVADO E PUBLICADO.

Validacao final em producao:

- Login real owner/admin: aprovado.
- Dashboard, Empresas, CRM, Discovery, Propostas e Configuracoes: aprovados em desktop.
- Dashboard, Empresas, CRM, Discovery, Propostas e Configuracoes: aprovados em mobile 375px.
- Overflow global em mobile: `0px` nas rotas validadas.
- PDF Ficha Cliente: 2 paginas, texto extraido sem tags HTML visiveis, cabecalho NODERE presente.
- PDFs Proposta/Contrato/Relatorio: endpoints preservados e retornando `application/pdf`.
