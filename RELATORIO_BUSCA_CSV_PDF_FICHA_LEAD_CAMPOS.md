# Relatorio - Ampliacao de campos da Busca, CSV, PDF e Ficha do Lead

## Status

APROVADO TECNICAMENTE.

Nao houve commit, push, deploy, SQL ou alteracao manual de banco nesta etapa.

## O que foi implementado

- A busca passa a carregar e preservar os campos comerciais obrigatorios quando disponiveis.
- A listagem de resultados ganhou visualizacao ampliada com empresa/segmento, localizacao, contato, links, avaliacao, score e resumo.
- O CSV da busca foi padronizado com todos os campos obrigatorios, separador `;`, quebras `CRLF` e UTF-8 com BOM para Excel/Google Sheets.
- O PDF exportado pela busca passou a incluir todos os campos obrigatorios em blocos por empresa.
- A Ficha do Lead passou a exibir a secao `Dados comerciais da empresa`.
- O salvamento do lead a partir da busca preserva e-mail e resumo comercial quando esses dados vierem da busca/enriquecimento.
- A regra de deduplicacao e a separacao entre resultado temporario e lead salvo foram mantidas.

## Campos adicionados/padronizados

- segmento
- empresa
- cidade
- estado
- CNPJ
- telefone
- email
- site
- avaliacao
- avaliacoes
- score
- maps
- resumo_sobre_a_empresa

## Origem dos dados

- Segmento: Google Places `primaryTypeDisplayName`, filtro de segmento ou cadastro/manual CRM.
- Empresa: Google Places `displayName`, cadastro/manual CRM ou importacao.
- Cidade/Estado: filtros da busca, cadastro CRM ou importacao.
- CNPJ: enriquecimento CNPJ, cadastro manual, importacao ou payload salvo.
- Telefone: Google Places `nationalPhoneNumber`, cadastro manual ou importacao.
- E-mail: cadastro manual, importacao, enriquecimento externo ou payload salvo.
- Site: Google Places `websiteUri`, cadastro manual, importacao ou enriquecimento.
- Avaliacao: Google Places `rating`.
- Avaliacoes: Google Places `userRatingCount`.
- Score: score NODERE ja calculado pelo backend.
- Maps: Google Places `googleMapsUri`.
- Resumo sobre a empresa: resumo deterministico gerado a partir dos dados publicos/localizados, sem inventar fatos; quando nao ha dado suficiente, indica sinais nao localizados.

## Arquivos alterados nesta etapa

- `apps/api/src/types.ts`
- `apps/api/src/services/google.ts`
- `apps/api/src/services/companyStore.ts`
- `apps/api/src/routes/companies.ts`
- `apps/web/lib/types.ts`
- `apps/web/components/CompanyTable.tsx`
- `apps/web/app/companies/[id]/page.tsx`
- `RELATORIO_BUSCA_CSV_PDF_FICHA_LEAD_CAMPOS.md`

Observacao: o worktree ja continha alteracoes anteriores. Nenhuma alteracao anterior foi revertida.

## Exemplo de CSV gerado

Cabecalho obrigatorio:

```csv
segmento;empresa;cidade;estado;CNPJ;telefone;email;site;avaliacao;avaliacoes;score;maps;resumo_sobre_a_empresa
```

Exemplo de linha:

```csv
"Clínica odontológica";"Clínica Sorriso Sul";"Caxias do Sul";"RS";"Não localizado";"+555499999999";"Não localizado";"https://exemplo.com.br";"4.1";"42";"72";"https://maps.google.com/...";"Clínica Sorriso Sul atua em Clínica odontológica em Caxias do Sul/RS. Sinais comerciais: possui site público, telefone localizado, perfil no Google Maps localizado, avaliação 4.1 com 42 avaliações."
```

## Exemplo de bloco no PDF

```text
1. Clínica Sorriso Sul
Segmento: Clínica odontológica
Cidade/Estado: Caxias do Sul/RS
CNPJ: Não localizado
Telefone: +555499999999 | E-mail: Não localizado
Site: https://exemplo.com.br
Avaliacao: 4.1 | Avaliacoes: 42 | Score: 72
Maps: https://maps.google.com/...
Resumo: Clínica Sorriso Sul atua em Clínica odontológica em Caxias do Sul/RS. Sinais comerciais: possui site público, telefone localizado, perfil no Google Maps localizado, avaliação 4.1 com 42 avaliações.
```

## Testes executados

- `apps/api`: `npm run typecheck` - aprovado.
- `apps/api`: `npm run build` - aprovado.
- `apps/web`: `npm run typecheck` - aprovado.
- `apps/web`: `npm run lint` - aprovado.
- `apps/web`: `npm run build` - aprovado.
- raiz: `npm run build` - aprovado.

## Validacoes cobertas

- CSV possui todos os campos obrigatorios.
- CSV usa separador `;` e UTF-8 com BOM.
- PDF inclui todos os campos obrigatorios em blocos legiveis.
- Ficha do Lead exibe os dados comerciais salvos/localizados.
- Campos vazios sao tratados como `Não localizado`/`Não informado`.
- Nenhuma funcionalidade atual de salvar lead, salvar selecionadas, ficha, WhatsApp, site, telefone, CSV, PDF e ignorar foi removida.
- Nenhum dado falso e criado; o resumo usa somente sinais existentes ou informa que o dado nao foi localizado.

## Pendencias

- Homologacao visual em navegador com busca real autenticada para conferir preenchimento vindo de Google Places/Maps no ambiente ativo.
- CNPJ e e-mail dependem de fontes que efetivamente retornem esses dados; Google Places normalmente nao fornece CNPJ/e-mail direto.

## Recomendacao

Liberado para homologacao funcional autenticada. Para deploy, validar uma busca real, baixar CSV/PDF e abrir a ficha do lead salvo no ambiente alvo.
