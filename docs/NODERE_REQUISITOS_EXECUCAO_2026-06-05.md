# NODERE - Execução dos requisitos organizados

Data: 05/06/2026

## Bloco executado nesta rodada

- Busca de empresas: adicionada visualização real do Google Maps embutida na tela de busca, sem expor chave no frontend. A busca continua passando pelo backend seguro.
- Busca de empresas: nova busca continua limpando resultados anteriores e ignorando respostas antigas, evitando mistura entre pesquisas.
- Tema e layout: adicionados temas `Vibrante NODERE` e `Vibrante claro`.
- Tema e layout: adicionada preferência real de tamanho de fonte: pequena, normal e grande.
- Tema claro: reforçadas regras globais de contraste para ícones, botões de ação, bordas e sombras.
- Ajuda / Manual: atualizado com instruções sobre Google Maps visual, busca avançada, temas vibrantes e tamanho de fonte.

## Validação executada

- `npm run build` em `apps/web`: passou.
- `npm run build` em `apps/api`: passou.
- `npm run lint` em `apps/web`: não pôde ser concluído porque o projeto ainda aciona configuração interativa do `next lint`.
- `npm run lint` em `apps/api`: não existe script `lint`.
- `GET https://nodere-api.onrender.com/api/health`: 200.
- `GET https://nodere-api.onrender.com/api/settings`: 200.
- `GET https://nodere-api.onrender.com/api/places/search?segment=academia&city=Caxias%20do%20Sul&state=RS&limit=3`: 200.
- `GET https://nodere.com.br/searches`: 200.
- `GET https://nodere.com.br/manual`: 200.
- `GET https://nodere.com.br/settings`: 200.

## Requisitos já cobertos no código atual

- Login, cadastro e recuperação de senha com páginas dedicadas.
- Rotas públicas para `/terms` e `/privacy`.
- Dashboard com dados reais do backend.
- Busca Google Places via backend.
- Busca CNPJ via backend.
- Deduplicação de empresas salvas.
- Importação CSV/XLSX com mapeamento, validação no backend e relatório de erros.
- CRM Kanban com drag and drop, criação, renomeação, remoção de etapas vazias e cor manual por etapa.
- Rolagem vertical por etapa do funil.
- Ficha de empresa com dados editáveis, observações, agenda, histórico, IA/editor, PageSpeed, documentos, WhatsApp e enriquecimento.
- Catálogo de produtos/serviços com campos comerciais e técnicos avançados.
- Propostas e contratos geráveis como documentos/PDF pela ficha do cliente.
- Calendário com eventos reais, status, prioridade e persistência.
- Inbox com mensagens manuais.
- Relatórios com dados reais do backend.
- Administração de usuários e auditoria.
- Configurações de backend, tema, fonte, densidade, visual, push e API developer.
- PWA com manifest e ícones NODERE.

## Pendências externas ou dependentes de credenciais

- Apollo.io: erros `API_INACCESSIBLE` ou HTTP 403 dependem de plano/API habilitada na conta Apollo. O sistema não deve inventar decisores.
- Econodata: depende de `ECONODATA_API_URL` e `ECONODATA_API_KEY` oficiais.
- Google Business Profile e Google Ads: dependem de OAuth/autorização do cliente e escopos corretos.
- Push remoto completo: depende de `VAPID_PUBLIC_KEY` e `VAPID_PRIVATE_KEY`.
- Stripe: checkout real depende das variáveis de Payment Link/Stripe configuradas.
- E-mail real: depende de SMTP ou provedor transacional configurado no backend.

## Próximos blocos recomendados

1. Configurar lint não interativo para web e API.
2. Adicionar auditoria explícita para downloads feitos no navegador.
3. Evoluir importação de documentos PDF/Word com extração assistida, mantendo aviso claro quando OCR/IA não estiver configurado.
4. Revisar RLS diretamente no Supabase para garantir isolamento multiempresa em todos os novos objetos.
5. Testar visualmente o PWA instalado em Android/iOS reais.
