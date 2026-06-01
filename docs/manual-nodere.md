# Manual NODERE Intelligence

## Visão geral
O NODERE Intelligence é uma ferramenta de prospecção e CRM para encontrar empresas no Google, salvar leads, acompanhar o funil comercial, registrar conversas, criar observações, gerar documentos e organizar follow-ups.

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
Abra **Buscas** no menu e pesquise por nome da empresa, segmento, cidade, estado ou palavra-chave. O sistema consulta Google Places pelo backend seguro. Cada resultado mostra score, avaliação, falhas detectadas e ações.

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

## Ficha do cliente
Clique no nome do lead para abrir a ficha. Use:
- **Observações** para registrar atendimento.
- **Agenda** para tarefas e follow-up.
- **IA / Editor** para gerar textos.
- **Propostas e contratos** para PDFs/documentos.
- **WhatsApp** para mensagem pronta e wa.me.

## Observações
Escreva uma observação, escolha o tipo e salve. Ela fica vinculada ao cliente e persiste no banco/Supabase quando configurado.

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

## IA
A IA usa o backend `/api/openai/analyze`. Se a OpenAI retornar quota/billing insuficiente, configure créditos na OpenAI Platform. O texto gerado pode ser editado antes de salvar, copiar ou transformar em documento.

## PageSpeed
Configure `GOOGLE_PAGESPEED_API_KEY` no Render para ativar análise de performance, SEO, acessibilidade e boas práticas.

## Propostas, contratos e PDFs
Na aba **IA / Editor**, escolha o tipo, gere ou escreva o conteúdo e clique em **Salvar proposta PDF** ou **Salvar contrato PDF**. O documento fica disponível na aba **Propostas e contratos** para baixar.

## Anexos e conversas
Como mínimo operacional, cole conversas na Caixa de Entrada ou salve conteúdos como documentos vinculados ao lead. Para upload real de arquivos, configure storage dedicado.

## Dashboard e relatórios
O Dashboard mostra totais reais do CRM, pipeline e oportunidades. A busca fica separada em **Buscas** para manter a tela inicial limpa. Relatórios leem os dados atuais do backend.

## Enriquecimento CNPJ, decisor e LinkedIn
O NODERE exibe campos de enriquecimento público na ficha do cliente. Quando CNPJ, decisor, e-mail ou LinkedIn não forem encontrados por fonte pública/API autorizada, o sistema mostra “não localizado em fonte pública”. O usuário pode complementar manualmente quando tiver uma fonte confiável. Não invente decisores.

## Automações
A área Automações lista sequências comerciais e pode ativar fluxos por empresa. Integrações oficiais de e-mail/WhatsApp exigem chaves específicas; sem elas, use modelos e tarefas manuais.

## Erros comuns
- **Unauthorized**: rota protegida ou token ausente.
- **OpenAI insufficient_quota**: falta crédito/billing na OpenAI.
- **PageSpeed not_configured**: falta `GOOGLE_PAGESPEED_API_KEY`.
- **Google sem resultados**: revise chave, billing e Places API.
- **Respostas WhatsApp não aparecem**: wa.me não possui retorno automático; configure WhatsApp Cloud API/webhook ou registre manualmente.

## Backup e persistência
Com Supabase configurado, leads, notas e histórico persistem fora do navegador. localStorage é usado apenas como preferência/cache local.
