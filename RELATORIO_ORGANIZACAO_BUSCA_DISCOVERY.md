# Relatorio - Organizacao visual da aba Busca de Empresas / Discovery

## Status final

Aprovado tecnicamente para a reorganizacao visual implementada.

Nao foram alteradas regras de busca, endpoints, permissoes, integracoes, banco, autenticacao, payloads ou nomes de campos enviados ao backend.

## Arquivos alterados nesta tarefa

- `apps/web/app/searches/page.tsx`
- `apps/web/components/SearchPanel.tsx`
- `apps/web/components/CompanyTable.tsx`
- `apps/web/app/discovery/page.tsx`
- `apps/web/components/discovery/DiscoverySearch.tsx`
- `apps/web/components/discovery/DiscoveryResults.tsx`

## Melhorias visuais aplicadas

- Reorganizado o topo de `/searches` com titulo unico `Busca de Empresas`, descricao objetiva e contadores separados.
- Removido o bloco visual redundante de marca que competia com o painel principal de busca.
- Reestruturado o formulario principal em grupos claros:
  - fonte da busca;
  - empresa e intencao comercial;
  - localizacao e raio;
  - filtros avancados e Score NODERE.
- Mantidos todos os campos originais com os mesmos `name` usados pelo backend.
- Padronizadas altura, largura, alinhamento, foco e espacamento de inputs, selects e botoes.
- Mantido o bloco de filtros avancados recolhido por padrao.
- Reorganizado mapa e lista `Empresas no mapa` em dois cards lado a lado no desktop e empilhados no mobile.
- Aumentada a altura visual do mapa para 420px, com lista lateral de rolagem interna consistente.
- Melhorado o destaque do item selecionado no mapa.
- Criado cabecalho claro para `Resultados da busca atual`, separando resultados pesquisados de leads salvos no CRM.
- Reorganizada a barra interna da tabela com filtro, contadores visiveis e acoes em massa.
- Melhorados os contadores de:
  - resultados visiveis;
  - itens selecionados;
  - resultados da busca atual;
  - empresas com coordenadas no mapa.
- Ajustado `/discovery` simplificado para seguir a mesma hierarquia visual e paleta.

## Funcionalidades preservadas

Foram preservados os mesmos campos, handlers e integracoes existentes para:

- Google Places.
- Busca por CNPJ.
- Busca internacional/global.
- Nome da empresa.
- Segmento e segmento customizado.
- Palavra-chave.
- Cidade, estado e pais.
- Endereco de referencia.
- Raio / cidade inteira.
- Minha localizacao.
- Geocodificacao do endereco.
- Google Maps visual/iframe fallback.
- Lista de empresas no mapa.
- Selecao de empresa no mapa.
- Rolagem ate resultado ao selecionar empresa.
- Deduplicacao por IDs salvos.
- Ocultacao de leads ja salvos.
- Salvar lead.
- Salvar selecionadas.
- Ignorar selecionadas.
- Exportacao CSV.
- Exportacao PDF.
- Abrir ficha.
- WhatsApp.
- Ajuste/correcao de WhatsApp invalido.
- Diagnostico IA.
- Mensagem WhatsApp IA.
- Roteiro de ligacao IA.
- Filtro interno da tabela.

## Testes executados

- `apps/web`: `npm run lint` - aprovado.
- `apps/web`: `npm run typecheck` - aprovado.
- `apps/web`: `npm run build` - aprovado.
- Raiz: `npm run build` - aprovado.
- `git diff --check` - aprovado, com avisos esperados de CRLF em ambiente Windows.

## Evidencias

- Build do Next concluiu com sucesso e incluiu as rotas `/searches` e `/discovery`.
- Dev server local foi iniciado em `127.0.0.1:3016`.
- Acesso HTTP local a `/searches` e `/discovery` retornou `307`, comportamento esperado para rotas autenticadas sem sessao local.
- A validacao visual autenticada real nao foi concluida nesta execucao porque nao havia sessao autenticada disponivel para o dev server local neste contexto.

## Pendencias

- Homologar visualmente com sessao real autenticada:
  - desktop;
  - notebook;
  - mobile;
  - tema claro;
  - tema escuro.
- Executar uma busca real com credenciais Google ativas no ambiente conectado.
- Validar salvamento real de lead e exportacoes CSV/PDF com usuario autenticado.

## Recomendacao

Liberado para proxima etapa de homologacao funcional autenticada. Nao ha pendencia tecnica de build/lint relacionada a esta reorganizacao visual.
