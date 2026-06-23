# Validacao Home Humanizada

Data: 2026-06-23

Branch: fase-02-desenvolvimento

## Escopo validado

Validacao somente da alteracao feita em:

- `apps/web/app/page.tsx`

A versao humanizada encontrada anteriormente em `apps/web/public/index.html` foi parcialmente portada para a rota real da home do App Router em `apps/web/app/page.tsx`.

## Arquivos alterados

Alterado no escopo da home:

- `apps/web/app/page.tsx`

Arquivos com alteracoes pendentes fora do escopo desta validacao, ja existentes no worktree:

- `apps/web/app/companies/[id]/LeadOperations.tsx`
- `HOMOLOGACAO_FINAL_NODERE.md`
- `RELATORIO_FICHA_COMERCIAL_ABAS.md`
- `RELATORIO_FINAL_FASE_02.md`
- `ROTEIRO_HOMOLOGACAO_AUTENTICADA_NODERE.md`

## Validacoes executadas

| Validacao | Status | Observacao |
| --- | --- | --- |
| `git diff -- apps/web/app/page.tsx` | OK | Diff revisado. Alteracao restrita ao arquivo da home publica. |
| Imports | OK | `Metadata`, `Link`, `SitePageShell`, `DynamicCmsPage`, `Logo` e `getPublicPage` continuam coerentes. |
| Fallback CMS preservado | OK | A condicao `cmsPage?.nodere_cms_sections?.length` continua renderizando `DynamicCmsPage` antes do fallback estatico. |
| JSX invalido | OK | TypeScript/lint e build passaram sem erro. |
| CTAs para rotas existentes | OK | `/app/register`, `/app/login`, `/solucoes`, `/contato`, `/blog`, `/precos`, `/planos`, `/register` e `/login` existem no projeto. |
| Area logada | OK | Nenhuma nova alteracao foi feita em rotas ou componentes autenticados durante esta validacao. |
| IDs duplicados | ATENCAO | Ha duplicidade de `id="faq"` em duas secoes da home. Nao quebra build, mas deve ser corrigido no ajuste seguinte. |
| Imagens em `public` | ATENCAO | As imagens portadas sao URLs externas do Unsplash, como na versao de `public/index.html`; nao sao arquivos locais dentro de `apps/web/public`. |
| Lint web | OK | `npm run lint` em `apps/web` passou. |
| Build web | OK | `npm run build` em `apps/web` passou. |

## Comandos executados

```powershell
git diff -- apps/web/app/page.tsx
rg -n 'id="|href="|href=\{|import |<img|DynamicCmsPage|getPublicPage|SitePageShell' apps\web\app\page.tsx
Get-ChildItem -Recurse -Directory apps\web\app | Where-Object { $_.FullName -match 'login|register|precos|planos|contato|solucoes|blog|app\\login|app\\register' } | Select-Object FullName
npm run lint
npm run build
```

## Erros encontrados

Nenhum erro de compilacao ou TypeScript foi encontrado.

Pontos de atencao encontrados:

1. `id="faq"` duplicado.
2. Imagens humanizadas ainda referenciam URLs externas do Unsplash, nao assets locais em `public`.
3. As novas classes adicionadas no JSX dependem do proximo ajuste de CSS para que a home fique visualmente finalizada.

## Status da home

Status tecnico: OK para compilacao.

Status visual final: PARCIAL.

A home real do App Router compila com a estrutura humanizada portada, o CMS foi preservado e os CTAs apontam para rotas existentes. Ainda falta seguir para os ajustes de CSS e refinamento visual para finalizar a aplicacao da versao humanizada.

## Pode seguir para ajustes de CSS?

SIM.

Recomendacao para o proximo passo:

- corrigir o `id="faq"` duplicado;
- adicionar/ajustar CSS das novas secoes humanizadas;
- decidir se as imagens externas do Unsplash devem ser mantidas ou copiadas/substituidas por assets locais em `apps/web/public`;
- validar visualmente desktop e mobile antes de qualquer deploy.
