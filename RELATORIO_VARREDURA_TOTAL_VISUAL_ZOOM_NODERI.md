# RELATORIO_VARREDURA_TOTAL_VISUAL_ZOOM_NODERI

Data: 09/07/2026

## Objetivo

Corrigir a causa raiz dos icones desconfigurados no NODERE/Noderi, com foco nos icones de lapis e lixeira dos cabecalhos do Kanban/CRM, e padronizar a escala visual de icones para toda a plataforma.

## Causa raiz identificada

- Os botoes de acao do Kanban usavam classes locais compactas (`p-1`, `h-3.5`, `w-3.5`), mas tambem eram afetados pela regra global de botoes com `aria-label`, que aplicava area minima maior.
- Em titulos longos de etapa, o grupo de acoes do cabecalho podia ultrapassar alguns pixels do container em zoom 100% e 150%.
- A escala global de icones estava baseada em `rem`, criando dependencia direta da escala tipografica do usuario. A correcao definitiva passou a usar tokens em `px` para icones e areas clicaveis.

## Correcoes aplicadas

- Escala global de icones convertida para tokens fixos em pixels:
  - `--nodere-icon-xs: 14px`
  - `--nodere-icon-sm: 16px`
  - `--nodere-icon-md: 18px`
  - `--nodere-icon-lg: 20px`
  - `--nodere-icon-xl: 24px`
  - `--nodere-icon-action: 16px`
  - `--nodere-icon-action-compact: 14px`
- SVGs Lucide dentro do shell NODERE agora recebem largura, altura, limites e stroke consistentes.
- Criadas classes especificas para o Kanban:
  - `.crm-stage-action`
  - `.crm-stage-action-danger`
  - `.crm-stage-color-input`
- Os botoes de renomear/remover/salvar/cancelar etapa no Kanban passaram a usar caixa compacta de 24px e SVG interno de 14px.
- O grupo de acoes do cabecalho do Kanban foi reduzido para `gap-1` e marcado como `shrink-0`, evitando estouro visual.
- O seletor de cor de etapa passou a seguir a mesma largura/altura compacta das acoes.

## Arquivos alterados

- `apps/web/app/globals.css`
- `apps/web/app/crm/CrmBoard.tsx`
- `apps/web/app/manual/page.tsx`
- `docs/manual-nodere.md`
- `RELATORIO_ATUALIZACAO_MANUAL_NODERE.md`

## Evidencias tecnicas

Validacao local em `http://localhost:3127/crm` com cookie local apenas para bypass visual do middleware, sem alterar dados.

### Varredura de visibilidade dos icones do Kanban

Niveis testados: 33%, 50%, 67%, 75%, 80%, 90%, 100%, 110%, 125% e 150%.

Resultado:
- 18 acoes do cabecalho Kanban encontradas em cada nivel.
- 0 acoes invisiveis.
- 0 icones sem dimensao.
- 0 icones sem cor calculada.

Referencia em 100%:
- botao: 24px x 24px;
- SVG: 14px x 14px;
- cor calculada presente.

### Overflow

Antes do ajuste final:
- 1 acao ultrapassava o cabecalho em colunas com titulo longo nos zooms 100% e 150%.

Depois do ajuste:
- 33%: 0 itens fora do cabecalho.
- 100%: 0 itens fora do cabecalho.
- 150%: 0 itens fora do cabecalho.

## Tipografia

A plataforma ja usa a arquitetura de preferencia de fonte por `--nodere-font-family`, com padrao `Inter`. Nesta rodada nao foi adicionada nova familia para nao trocar identidade visual nem afetar preferencias existentes do usuario. A alteracao de icones deixou de depender de `rem`, reduzindo interferencia entre escala de fonte e escala de icones.

## Validacao de funcionalidades

Nesta rodada foram validados estruturalmente:
- CRM/Kanban renderizando colunas.
- Cabecalhos das etapas.
- Acoes de renomear/remover/salvar/cancelar etapa.
- Manual NODERE atualizado.

Validacoes completas de criacao/edicao/exclusao de dados reais devem continuar sendo executadas com prefixo controlado quando houver autorizacao operacional para manipular producao.

## Pendencias

- Sem pendencia tecnica no ponto corrigido.
- Integracoes externas com efeito real, como WhatsApp/e-mail/cobranca, devem ser homologadas em janela operacional para evitar disparos indevidos.

## Status final

APROVADO PARA PUBLICACAO APOS BUILD E SMOKE FINAL.
