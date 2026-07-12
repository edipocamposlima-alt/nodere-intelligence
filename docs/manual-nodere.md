# Manual NODERE

## Visão geral
O NODERE é uma ferramenta de prospecção e CRM para encontrar empresas no Google, salvar leads, acompanhar o funil comercial, registrar conversas, criar observações, gerar documentos e organizar follow-ups.

## Acesso e login
Use `https://nodere.com.br`. A área administrativa fica em `/admin` e usa as credenciais configuradas no backend Render. Chaves de API nunca devem ser colocadas no frontend.

## Instalação como app
No Android/Chrome, abra o menu do navegador e toque em **Instalar app**. No iPhone/Safari, use **Compartilhar > Adicionar à Tela de Início**. O app usa o mesmo sistema web e mantém as configurações visíveis em telas pequenas.

## Configuração de APIs
As chaves sensíveis ficam no Render/backend:
- `GOOGLE_PLACES_API_KEY`
- `GOOGLE_MAPS_API_KEY`
- `GOOGLE_PAGESPEED_API_KEY`
- `OPENAI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `WHATSAPP_CLOUD_TOKEN`, quando houver integração oficial

Na tela **Configurações**, você pode testar a URL do backend, alterar tema, fonte, densidade e layout. Preferências locais são salvas no navegador e enviadas ao backend como configurações seguras, sem secrets.

## Busca de empresas
Abra **Busca de empresas** no menu e pesquise por nome da empresa, segmento, cidade, estado ou palavra-chave. O sistema consulta Google Places pelo backend seguro. Cada resultado mostra score, avaliação, falhas detectadas e ações.

O backend tenta buscar lotes ampliados usando variações do termo pesquisado e remove duplicidades pelo `place_id`. A própria API do Google pode limitar a quantidade devolvida por consulta; quando isso ocorrer, refine cidade, nicho ou palavra-chave.

### Seleção em massa
Na tabela de resultados você pode:
- marcar uma empresa individualmente;
- selecionar todas as empresas visíveis;
- salvar selecionadas no CRM;
- ignorar selecionadas;
- exportar CSV;
- baixar relatório PDF.

Depois que um lead é salvo, ele sai da lista visível da busca naquele navegador para evitar duplicidade operacional. A chave principal usada é o `place_id` do Google.

## Salvar lead
Clique em **Salvar lead** no resultado. O sistema registra o lead no CRM, cria histórico automático e remove o item da lista visível da busca para evitar retrabalho.

## CRM e pipeline
Abra **CRM**. Arraste o card do lead entre as etapas:
- Novo Lead
- Qualificado
- Contatado
- Diagnóstico enviado
- Reunião marcada
- Proposta enviada
- Negociação
- Fechado
- Perdido

Cada alteração é salva no backend e refletida no dashboard.

### Criar e remover etapas
No topo do CRM, use o campo **Nova etapa do funil** para criar etapas como:
- Retomar futuramente
- Aguardando orçamento
- Contrato enviado
- Sem interesse

Etapas personalizadas são salvas no navegador do operador. Uma etapa só pode ser removida quando estiver vazia, para evitar perda operacional.

## Ficha do cliente
Clique no nome do lead para abrir a ficha. Use:
- **Observações** para registrar atendimento.
- **Agenda** para tarefas e follow-up.
- **IA / Editor** para gerar textos.
- **Propostas e contratos** para PDFs/documentos.
- **WhatsApp** para mensagem pronta e wa.me.

Ao abrir a ficha a partir da Busca de empresas, o NODERE salva o lead ou resolve duplicidade antes de navegar. Se uma URL antiga usar identificador externo do Google Places/Discovery, a API resolve o registro persistido e a página redireciona para o ID interno canônico quando o lead já existe no CRM.

## Observações
Escreva uma observação, escolha o tipo e salve. Ela fica vinculada ao cliente e persiste no banco/Supabase quando configurado.

## Agenda, lembretes e sininho
Na ficha do cliente, abra **Agenda** e cadastre:
- título;
- descrição;
- data e hora;
- prioridade;
- canal de contato.

O sininho no topo do sistema lista tarefas vencidas ou programadas para o dia. Ao criar um follow-up, o navegador pode solicitar permissão para notificação local.

## WhatsApp
Sem WhatsApp Cloud API, o NODERE abre `wa.me` e permite registrar respostas manualmente na Caixa de Entrada. Respostas enviadas diretamente pelo WhatsApp não voltam automaticamente sem webhook oficial.

Com WhatsApp Cloud API configurado, o webhook pode receber mensagens e salvar conversas na Caixa de Entrada.

## Caixa de Entrada
Use para criar conversas manuais, colar mensagens, responder via wa.me e arquivar. Conversas sem lead vinculado ficam na própria Caixa de Entrada e podem ser tratadas manualmente.

## Templates WhatsApp
Na ficha do cliente, gere ou escreva uma mensagem, edite o texto e use **Salvar como template**. Modelos recomendados:
- Primeira abordagem
- Follow-up
- Envio de diagnóstico
- Envio de proposta
- Recuperação de lead parado
- Pós-reunião
- Fechamento

## Editor de texto padronizado
Campos de observação, histórico, agenda, contatos, negociações, propostas, contratos, WhatsApp, marketing, calendário de conteúdo, posts, campanhas, templates, Admin/CMS, blog, páginas institucionais, e-mails, relatórios com notas e documentos usam o editor rico padronizado do NODERE quando permitem conteúdo formatado.

### Onde localizar
O editor aparece dentro das telas e abas que aceitam criação, edição ou registro de texto. Exemplos principais:
- Ficha do Cliente: observações, histórico, negociações, IA/Editor, propostas e contratos.
- Propostas: observações comerciais e observações internas.
- Marketing: posts, campanhas e templates.
- Caixa de Entrada: registros manuais e mensagens.
- Admin/CMS: conteúdos públicos, manual, blog e páginas institucionais.

### Quem pode utilizar
Owner, Administrador e Operador podem editar conforme permissões de cada módulo. Visualizador deve acessar em modo somente leitura quando a tela permitir consulta sem edição.

### Como usar
1. Abra a tela ou aba desejada.
2. Clique no campo de texto.
3. Use a barra do editor para escolher fonte, tamanho, negrito, itálico, sublinhado, tachado, listas, alinhamento, cor, destaque, espaçamento, links, imagens ou limpar formatação.
4. Revise o conteúdo.
5. Clique no botão de salvar, gerar documento ou publicar da própria tela.

### Barra de ferramentas
A barra do editor é dividida em grupos para manter os botões alinhados em Observações, Marketing, Propostas, Contratos, Templates, Admin/CMS e demais áreas com texto formatado:
- Fonte e tamanho.
- Estilos de texto.
- Alinhamento.
- Listas.
- Cor, destaque e espaçamento.
- Link, imagem e anexos permitidos pela tela.
- Limpar formatação, desfazer e refazer.

No celular, os grupos quebram em linhas para evitar botões cortados ou sobrepostos. Se a tela estiver estreita, role o conteúdo normalmente; a toolbar deve permanecer dentro do campo de edição.

### Boas práticas
- Use títulos e listas para textos longos.
- Evite colar HTML bruto de sites externos.
- Revise observações internas antes de gerar PDFs para clientes.
- Use links apenas quando forem necessários e confiáveis.
- No mobile, role a barra do editor ou deixe que ela quebre em linhas; os botões não devem ficar cortados.

### PDFs e exportações
Propostas, contratos e documentos usam o conteúdo salvo como origem. O sistema preserva formatação útil, limpa tags HTML indevidas no PDF e não deve expor observações internas ao cliente.

### Problemas comuns
- **Texto sem formatação após salvar**: confirme se clicou no botão de salvar da tela e se a sessão continua autenticada.
- **Botão indisponível**: confira seu perfil de acesso ou se o registro está em modo somente leitura.
- **PDF com conteúdo diferente**: gere novamente o documento após salvar as alterações no editor.
- **Toolbar desalinhada**: atualize a página e confirme que está usando a versão mais recente. A barra padronizada deve exibir botões alinhados e agrupados em tema claro, tema escuro, desktop e mobile.

## IA
A IA usa o backend `/api/openai/analyze`. Se a OpenAI retornar quota/billing insuficiente, configure créditos na OpenAI Platform. O texto gerado pode ser editado antes de salvar, copiar ou transformar em documento.

## PageSpeed
Configure `GOOGLE_PAGESPEED_API_KEY` no Render para ativar análise de performance, SEO, acessibilidade e boas práticas.

## Propostas, contratos e PDFs
Na aba **IA / Editor** ou **Propostas e contratos**, use a composição controlada por produtos/serviços quando disponível e revise as observações no editor rico. O documento fica disponível na aba **Propostas e contratos** para baixar.

Os PDFs usam cabeçalho visual NODERE com marca, nome NODERE e conteúdo revisado pelo operador. O relatório exportado pela ficha também exibe o logo NODERE no topo. Observações internas da negociação não devem aparecer no PDF do cliente.

### PDF da Ficha Comercial / Ficha Cliente
O PDF da ficha segue a mesma identidade visual do relatório NODERE: cabeçalho com logo, título, data de geração, blocos organizados, divisores visuais, rodapé "Gerado pelo NODERE - nodere.com.br" e paginação. As seções principais são:
- Dados da empresa.
- Score e oportunidade.
- Sinais digitais.
- Oportunidades detectadas.
- Sugestões comerciais.
- Histórico e observações.
- Follow-ups e agenda.
- Documentos anexados.

Textos vindos de observações, histórico ou editor rico são limpos antes de entrar no PDF para evitar HTML cru, markdown visível, símbolos quebrados ou `\n` literal.

## Anexos e conversas
Como mínimo operacional, cole conversas na Caixa de Entrada ou salve conteúdos como documentos vinculados ao lead. Para upload real de arquivos, configure storage dedicado.

## Dashboard e relatórios
O Dashboard mostra totais reais do CRM, pipeline e oportunidades. A busca fica separada em **Buscas** para manter a tela inicial limpa. Relatórios leem os dados atuais do backend.

### Regra obrigatória de atualização
Toda alteração relevante na plataforma deve revisar **Relatórios Executivos** e **Ajuda / Manual NODERE** antes de ser considerada concluída.

A regra vale para mudanças em CRM, Ficha Comercial, Dashboard, Discovery, Relatórios, Propostas, Contratos, Produtos/Serviços, WhatsApp, E-mail, Agenda, IA, Admin, CMS, Configurações, Permissões, Planos, Integrações, PDFs, Exportações, tema, mobile/PWA e navegação.

O relatório final de cada tarefa deve conter a seção **Atualização obrigatória — Relatórios Executivos e Manual NODERE**, informando se ambos foram revisados, quais ajustes foram feitos, o que não exigiu atualização e se há pendências.

Arquivo oficial da regra: `REGRA_ATUALIZACAO_RELATORIOS_MANUAL.md`.

## Enriquecimento CNPJ, decisor e LinkedIn
O NODERE exibe campos de enriquecimento público na ficha do cliente. Quando CNPJ, decisor, e-mail ou LinkedIn não forem encontrados por fonte pública/API autorizada, o sistema mostra “não localizado em fonte pública”. O usuário pode complementar manualmente quando tiver uma fonte confiável. Não invente decisores.

Integrações preparadas:
- `ECONODATA_API_KEY`: chave da Econodata.
- `ECONODATA_API_URL`: endpoint oficial contratado para consulta automatizada.
- `APOLLO_API_KEY`: chave da Apollo.
- `APOLLO_API_URL`: padrão `https://api.apollo.io/api/v1`.

A aba **Apollo/Econodata** na ficha do lead executa enriquecimento externo. Apollo consulta organização por domínio e tenta buscar decisores quando o plano/API permite. Econodata consulta CNPJ/razão social quando o endpoint oficial estiver configurado. Se Apollo retornar `API_INACCESSIBLE`, o plano atual não habilita a API necessária e precisa ser liberado na Apollo.

Enquanto essas chaves não estiverem configuradas no backend/Render ou no Admin, os cards de integração aparecem como pendentes.

## Tema, fonte e layout
Em **Configurações**, ajuste:
- tema visual;
- cor principal;
- modo claro/escuro;
- fonte;
- densidade compacta/expandida;
- visual em cards/listas.

As preferências são salvas em `nodere_settings`, aplicadas antes da renderização visual da página e sincronizadas com o backend quando disponível. O sistema mantém compatibilidade com chaves antigas, mas a fonte local oficial do tema é única. O NODERE mostra os rótulos **Claro** e **Escuro** para o usuário, enquanto usa internamente os valores técnicos `light` e `dark`. Ao carregar a plataforma, o tema é reaplicado no `html` e no `body` para evitar que a interface fique presa no modo escuro. O modo claro/escuro deve permanecer estável ao trocar páginas, atualizar o navegador, fazer logout/login, reabrir o navegador, usar mobile ou PWA.

O tema claro mantém a mesma hierarquia visual do tema escuro: fundo com identidade NODERE, cards com bordas verdes suaves, badges coloridos, barras de progresso, sidebar, topbar, tabelas, abas, indicadores e editores com contraste adequado. O objetivo é clarear a interface sem transformar o sistema em uma tela genérica ou sem marca.

### Preferências rápidas
No topo do sistema, clique no botão do usuário para abrir **Preferências rápidas**. Esse painel permite alternar rapidamente:
- Tema Claro, Escuro ou Sistema.
- Tamanho da fonte.
- Densidade da interface.
- Foto do usuário.
- Nome exibido.

As preferências rápidas são aplicadas imediatamente no navegador e tentam sincronizar com o backend quando existe sessão/API disponível. Para ajustes completos, como cor principal, layout e visual, use **Configurações**.

### Como validar ou restaurar o tema
1. Abra **Preferências rápidas** ou **Configurações**.
2. Selecione **Claro**, **Escuro** ou **Sistema**.
3. Clique em **Salvar**.
4. Atualize a página.
5. Confirme que sidebar, cards, campos, modais, editores e textos assumiram o tema escolhido.
6. Se a API indicar sessão expirada, faça login novamente e salve a preferência outra vez para sincronizar com a conta.

### Boas práticas de tema
- Use **Claro** para ambientes com muita luz ou apresentações.
- Use **Escuro** para operação contínua, baixa luminosidade ou dashboards em monitor.
- Após alterar o tema, recarregue a página se algum navegador antigo mantiver cache visual.
- Se a interface parecer misturar claro e escuro, salve novamente em **Configurações** ou **Preferências rápidas** e atualize a página.
- Se o tema continuar diferente do selecionado após atualizar, faça logout/login para renovar a sessão e tente salvar novamente.

## Mobile e app instalado
No celular, o menu inferior é rolável para permitir acesso a:
- Início;
- Busca;
- Empresas;
- CRM;
- Agenda;
- IA;
- Inbox;
- Relatórios;
- Integrações;
- Configurações;
- Manual;
- Admin.

## Acesso e interface pública oculta
A plataforma NODERE/Noderi usa a tela de login como única porta pública operacional. Ao acessar a raiz do domínio sem sessão, o navegador é redirecionado automaticamente para **/login**. Páginas institucionais, marketing, blog, cadastro e manual permanecem no repositório, mas não ficam expostas como interface pública direta para usuários sem autenticação.

Regras do fluxo:
- sem sessão, a raiz do domínio redireciona para login;
- rotas internas sem sessão redirecionam para login com o destino original;
- após login válido, o usuário segue para dashboard ou para a rota solicitada;
- após logout, a sessão é encerrada e novas tentativas de acesso interno voltam para login;
- termos e privacidade continuam acessíveis para suporte legal ao login.

## Ficha 360° do cliente
A Ficha 360° deve ser aberta sempre a partir de um registro persistido no CRM. Quando o usuário clica em **Ficha** em um resultado novo da Busca de empresas, o NODERE salva o lead ou resolve o duplicado existente antes de navegar. Assim, a ficha usa o `id` real salvo em `nodere_companies` e não um identificador externo temporário do Google Places, Discovery, Apollo ou Econodata. Se uma URL antiga com ID externo resolver uma empresa salva, a página redireciona automaticamente para o ID interno canônico.

Se a ficha não abrir:
1. Confirme se a empresa foi salva no CRM.
2. Se veio da busca, clique novamente em **Ficha** para o sistema resolver o lead persistido.
3. Se aparecer sessão expirada, faça login novamente.
4. Se houver permissão negada, solicite revisão do perfil no workspace.
5. Se o registro tiver dados parciais, a ficha deve abrir com estados vazios claros em vez de travar.

## Ícones, botões e ações visuais
Os ícones da plataforma seguem uma escala global NODERE para manter consistência em menus, cabeçalhos, cards, tabelas, formulários, modais, editores, ações rápidas e componentes administrativos.

Padrões aplicados:
- ícones pequenos usam 14px, ícones de ação usam 16px, ícones médios usam 18px, ícones grandes usam 20px e destaques usam 24px;
- ícones de navegação usam o mesmo tamanho visual em sidebar e menu mobile;
- cores de ícones são semânticas e independentes do tema, portanto o modo claro não transforma ícones coloridos em cinza;
- verde identifica CRM, leads salvos e ações recomendadas; azul identifica score, relatórios e propostas enviadas; laranja identifica leads quentes, WhatsApp e follow-up; dourado identifica conversões, atenção moderada e propostas em aberto; roxo/magenta identifica ausência de redes sociais; laranja escuro identifica ausência de Google Ads; vermelho identifica falhas críticas e ações destrutivas;
- botões apenas com ícone mantêm área mínima clicável e centralização;
- ícones dentro de botões com texto mantêm espaçamento padrão;
- SVGs não devem ser deformados por zoom, escala, wrappers ou containers;
- imagens usadas como ícone devem preservar proporção 1:1;
- toolbars e editores usam a mesma lógica de alinhamento para evitar corte ou sobreposição.

No CRM/Kanban, os ícones de lápis, lixeira, salvar e cancelar nos cabeçalhos de etapa usam ação compacta própria. Eles permanecem centralizados, coloridos e dentro do cabeçalho da coluna mesmo com títulos longos, zoom reduzido ou zoom ampliado.

Boas práticas:
1. Use os componentes compartilhados (`Button`, `Input`, navegação e editor) sempre que possível.
2. Evite `style` inline para `width`, `height`, `fontSize`, `transform` ou `strokeWidth` em ícones.
3. Para ações sem texto, informe `aria-label` ou `title` para manter acessibilidade.
4. Valide em desktop, notebook, mobile e zoom 33%, 50%, 67%, 75%, 80%, 90%, 100%, 110%, 125% e 150% quando a ação estiver em área compacta.
5. Não substitua o significado do ícone sem revisar o rótulo, tooltip e ação vinculada.

## Arquitetura e deploy seguro
A fonte oficial do NODERE atual é:
- Frontend: `apps/web`.
- Backend: `apps/api`.
- Banco: Supabase PostgreSQL.
- Frontend em produção: Vercel, projeto `web`, com Root Directory `apps/web`.
- Backend em produção: Render, serviço `nodere-api`.
- Domínios oficiais: `nodere.com.br` e `www.nodere.com.br`.

O deploy pela raiz do repositório é bloqueado para evitar publicação acidental da versão legada em `dist/index.html`. GitHub Pages não é canal oficial de produção do NODERE atual.

Regras práticas:
1. Para publicar frontend, use sempre o projeto Vercel configurado em `apps/web`.
2. Para publicar backend, use o serviço Render `nodere-api`.
3. Não use `app.js`, `index.html`, `styles.css`, `dist/`, `backend/` ou `serve-nodere.mjs` como fonte oficial do produto atual.
4. Links novos devem seguir a matriz de rotas canônicas em `docs/ROTAS_CANONICAS_NODERE.md`.
5. O serviço Render `nodere-ts-api` precisa de decisão humana antes de qualquer remoção ou unificação.

## Automações
A área Automações lista sequências comerciais e pode ativar fluxos por empresa. Integrações oficiais de e-mail/WhatsApp exigem chaves específicas; sem elas, use modelos e tarefas manuais.

## Erros comuns
- **Unauthorized**: rota protegida ou token ausente.
- **OpenAI insufficient_quota**: falta crédito/billing na OpenAI.
- **PageSpeed not_configured**: falta `GOOGLE_PAGESPEED_API_KEY`.
- **Apollo API_INACCESSIBLE**: plano/token sem acesso à People API ou enrichment.
- **Econodata pendente**: configure `ECONODATA_API_KEY` e `ECONODATA_API_URL`.
- **Google sem resultados**: revise chave, billing e Places API.
- **Respostas WhatsApp não aparecem**: wa.me não possui retorno automático; configure WhatsApp Cloud API/webhook ou registre manualmente.

## Backup e persistência
Com Supabase configurado, leads, notas e histórico persistem fora do navegador. localStorage é usado apenas como preferência/cache local.
