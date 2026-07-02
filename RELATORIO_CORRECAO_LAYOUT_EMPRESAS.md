# Relatorio de Correcao do Layout da Aba Empresas

Data: 2026-07-02

## Causa do problema

A correcao anterior ainda mantinha a lista de empresas como uma tabela desktop larga, com `min-width`, `overflow-auto` e coluna de acoes sticky. Mesmo com a coluna fixa, a experiencia continuava dependente de uma estrutura horizontal pesada e desconfortavel em notebook, zoom 100% e telas menores.

## Componente real alterado

- Rota: `/companies`
- Pagina: `apps/web/app/companies/page.tsx`
- Componente real da lista: `apps/web/components/CompanyTable.tsx`

## Arquivos alterados

- `apps/web/components/CompanyTable.tsx`
- `RELATORIO_CORRECAO_LAYOUT_EMPRESAS.md`

## Solucao aplicada

- A tabela foi removida como layout padrao da aba Empresas.
- A lista agora usa cards/blocos responsivos em todos os viewports.
- O grid usa uma coluna em telas menores e duas colunas em telas largas.
- A selecao individual continua dentro de cada card.
- A selecao em massa foi movida para a barra de acoes como `Selecionar visiveis`.
- As acoes de cada empresa ficam visiveis no proprio card.
- Foram removidos do componente os pontos que causavam rolagem horizontal: `<table>`, `min-w-[1040px]`, `overflow-auto` da tabela e coluna `sticky right`.
- Campos longos usam quebra de linha e `title`, evitando estouro lateral.

## Informacoes preservadas

- Checkbox de selecao individual.
- Selecao em massa.
- Empresa.
- Segmento.
- CNPJ.
- Cidade.
- Estado.
- Endereco.
- Telefone.
- E-mail.
- Site.
- Maps.
- Avaliacao.
- Numero de avaliacoes.
- Score NODERE.
- Score legado.
- Status.
- Nivel de oportunidade.
- Resumo sobre a empresa.
- Alertas e oportunidades.
- Botao `Salvar lead`.
- Botao `Ficha`.
- WhatsApp.
- Telefone.
- Site/Maps/link externo.
- Acoes de IA.
- Acoes em massa.
- Ignorar.
- CSV.
- PDF.
- Filtro local.
- Contador de empresas visiveis.
- Contador de empresas selecionadas.

## Funcionalidades preservadas

- Salvar lead individual.
- Salvar selecionadas.
- Ignorar selecionadas.
- Exportar CSV.
- Exportar PDF.
- Abrir ficha.
- Chamar WhatsApp quando disponivel.
- Ligar para telefone.
- Abrir site.
- Abrir Google Maps.
- Gerar diagnostico IA.
- Gerar mensagem WhatsApp IA.
- Gerar roteiro de ligacao IA.
- Corrigir WhatsApp invalido.
- Filtrar empresas salvas.

## Validacoes tecnicas

- `apps/web`: `npm run lint` aprovado.
- `apps/web`: `npm run typecheck` aprovado.
- `apps/web`: `npm run build` aprovado.
- Raiz: `npm run build` aprovado.
- `git diff --check` aprovado, apenas aviso LF/CRLF do Windows.
- Backend/API nao foi alterado.
- Render nao foi necessario.

## Validacao local

- O componente foi auditado por busca textual e nao contem mais `<table>`, `</table>`, `min-w-[1040px]`, `overflow-auto` da tabela ou `sticky right`.
- O servidor local redirecionou `/companies` para login por ausencia de sessao local, portanto a validacao visual autenticada final deve ocorrer em producao apos deploy.

## Validacao visual em producao

Pendente ate publicacao desta correcao.

Checklist esperado em producao:

- `https://nodere.com.br/companies` abre com sessao real.
- Desktop 1366px exibe cards, nao tabela.
- Notebook/zoom 100% nao mostra barra horizontal no final da lista.
- Mobile 375px empilha cards em uma coluna.
- Botoes do card continuam visiveis.
- Tema claro e tema escuro usam os tokens existentes.

## Pendencias

- Publicar frontend na Vercel.
- Validar visualmente em producao com sessao autenticada real.

## Status atual

- Layout em cards implementado: SIM
- Tabela horizontal removida como padrao: SIM
- Barra horizontal no final da lista eliminada no componente: SIM
- Botoes visiveis em cada card: SIM
- Todas as informacoes preservadas: SIM
- Todas as funcionalidades preservadas: SIM
- Testes tecnicos locais aprovados: SIM
- Producao validada: PENDENTE
