# RELATORIO — FICHA COMERCIAL / FICHA CLIENTE

Data: 23/06/2026
Branch: `fase-02-desenvolvimento`
Escopo: padronizacao das abas Historico, Contatos e Negociacoes com o padrao visual/funcional da aba Visao Geral.

## Arquivos alterados

| Arquivo | Alteracao |
| --- | --- |
| `apps/web/app/companies/[id]/LeadOperations.tsx` | Reestruturacao visual e funcional das abas Historico, Contatos e Negociacoes. |

## Componentes ajustados

- `LeadOperations`
- Abas:
  - `Historico`
  - `Contatos`
  - `Negociacoes`
- Novo helper local:
  - `TextInput`
- Ajuste do helper existente:
  - `Field`

## Ajustes implementados

### Historico

- Formulario padronizado em card, com labels e grid responsivo.
- Campos:
  - Tipo de interacao
  - Data da interacao
  - Responsavel
  - Canal utilizado
  - Resumo do contato
  - Proxima acao
  - Data da proxima acao
  - Observacoes detalhadas com `RichTextEditor`
  - Referencia a anexos existentes da ficha, quando houver
- Validacao para impedir registro vazio.
- Lista cronologica existente preservada.
- Exclusao de interacoes usando endpoint existente.
- Viewer em modo somente leitura.

### Contatos

- Formulario padronizado em card, com labels e grid responsivo.
- Campos:
  - Nome do contato
  - Cargo/funcao
  - Departamento
  - Telefone
  - WhatsApp
  - E-mail
  - LinkedIn
  - Nivel de influencia
  - Principal decisor
  - Observacoes com `RichTextEditor`
- Validacao para impedir contato sem nome.
- Criacao, edicao e exclusao de contatos.
- Lista de contatos preservada.
- Viewer em modo somente leitura.

### Negociacoes

- Formulario padronizado em card, com labels e grid responsivo.
- Campos:
  - Titulo da negociacao
  - Produto/servico de interesse
  - Valor estimado
  - Etapa da negociacao
  - Temperatura
  - Probabilidade de fechamento
  - Origem da oportunidade
  - Data prevista de fechamento
  - Motivo de perda
  - Proxima acao
  - Observacoes com `RichTextEditor`
- Validacao para impedir negociacao vazia.
- Criacao, edicao e exclusao de negociacoes salvas como documentos do tipo `negociacao`.
- Lista de negociacoes preservada.
- Servicos contratados existentes preservados.
- Viewer em modo somente leitura.

## Endpoints utilizados

Nenhum endpoint novo foi criado. Foram reutilizados endpoints existentes:

| Finalidade | Endpoint |
| --- | --- |
| Carregar contatos | `GET /api/companies/:id/contacts` |
| Criar contato | `POST /api/companies/:id/contacts` |
| Editar contato | `PATCH /api/companies/:id/contacts/:contactId` |
| Excluir contato | `DELETE /api/companies/:id/contacts/:contactId` |
| Carregar historico | `GET /api/companies/:id/communications` |
| Criar historico | `POST /api/companies/:id/communications` |
| Excluir historico | `DELETE /api/companies/:id/communications/:commId` |
| Carregar documentos/negociacoes | `GET /api/companies/:id/documents` |
| Criar negociacao | `POST /api/companies/:id/documents` |
| Editar negociacao | `PATCH /api/companies/:id/documents/:documentId` |
| Excluir negociacao | `DELETE /api/companies/:id/documents/:documentId` |

## Migrations

Nenhuma migration foi criada.

Motivo:

- As abas reutilizam tabelas e endpoints ja existentes.
- Nao foram criadas tabelas duplicadas.
- Nao houve necessidade de alterar schema para a padronizacao visual/funcional.

## Testes executados

| Teste | Resultado |
| --- | --- |
| `npm run lint` em `apps/web` | OK |
| `npm run build` em `apps/web` | OK |
| `npm run build` em `apps/api` | OK |

## Testes pendentes de homologacao manual

- Abrir ficha de cliente existente com sessao real.
- Preencher e salvar historico.
- Preencher e salvar contato.
- Preencher e salvar negociacao.
- Recarregar a pagina e confirmar persistencia.
- Testar edicao e exclusao de contatos.
- Testar exclusao de historico.
- Testar edicao e exclusao de negociacoes.
- Testar viewer somente leitura.
- Testar owner/admin/operator com permissao de edicao.
- Testar tema claro e escuro.
- Testar layout mobile.

## Pendencias encontradas

- A edicao de historico nao foi habilitada porque o endpoint atual de `communications` em `/api/companies` possui criacao e exclusao, mas nao possui `PATCH`. Para preservar escopo e evitar alteracao de backend, a interface permite registrar nova interacao e excluir interacao existente.
- A validacao real de persistencia precisa ser feita com sessao autenticada e banco conectado.

## Status final

Status final: APROVADO TECNICAMENTE PARA HOMOLOGACAO MANUAL.

Nao liberado automaticamente para deploy sem executar os testes manuais de persistencia, perfis, tema claro/escuro e mobile.
