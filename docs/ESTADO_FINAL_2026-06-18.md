# Estado da Plataforma NODERE - 2026-06-18

## O que foi alterado nesta reconstrução
- BLOCO 01: autenticação e compatibilidade Supabase Auth.
- BLOCO 02: configurações de workspace e integrações protegidas.
- BLOCO 03: site público, contato, preços e páginas legais.
- BLOCO 04: billing persistente preparado para Stripe e SMTP.
- BLOCO 05: propostas comerciais persistentes, PDF e ajustes de admin/billing.
- BLOCO 06: landing page pública final, relatórios executivos e documentação de estado.

## O que foi corrigido
- Landing pública reposicionada com mensagem de inteligência comercial, CRM e IA.
- Relatórios ganharam endpoint executivo, proposta por status, operadores e exportação CSV.
- PDFs de relatórios mantêm marca NODERE e fundo branco.
- Menu lateral já contém Ajuda / Manual NODERE.

## O que foi criado
- Landing page institucional completa em `apps/web/app/page.tsx`.
- Endpoint `GET /api/reports/executive`.
- Endpoint `GET /api/reports/proposals`.
- Exportação CSV no módulo de relatórios.
- Documento final de estado do projeto.

## O que ainda falta (backlog)
- [ ] WhatsApp Cloud API totalmente integrada.
- [ ] Tema claro 100% validado em navegação real autenticada.
- [ ] Módulo de Automações com templates funcionais.
- [ ] Assinatura digital em propostas.
- [ ] API pública com documentação.
- [ ] Notificações push PWA.
- [ ] Follow-up automático com alertas.
- [ ] Importação de leads via CSV/Excel com fluxo guiado.
- [ ] Integração nativa com Google Meu Negócio OAuth.
- [ ] Modo demo para novos usuários com dados fictícios.

## Variáveis de ambiente obrigatórias para produção

### Vercel (Frontend)
| Variável | Status | Descrição |
|----------|--------|-----------|
| NEXT_PUBLIC_API_URL | Configurar | URL do backend |
| NEXT_PUBLIC_SUPABASE_URL | Configurar | URL do Supabase |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Configurar | Chave anon Supabase |
| NEXT_PUBLIC_GOOGLE_MAPS_KEY | Configurar | Chave Google Maps |

### Render (Backend)
| Variável | Status | Descrição |
|----------|--------|-----------|
| DATABASE_URL | Configurar | Supabase connection string |
| SUPABASE_SERVICE_ROLE_KEY | Configurar | Chave service role |
| JWT_SECRET | Configurar | Secret para JWT |
| GOOGLE_MAPS_API_KEY | Configurar | Google Maps server-side |
| OPENAI_API_KEY | Configurar | OpenAI |
| ANTHROPIC_API_KEY | Opcional | Anthropic fallback |
| STRIPE_SECRET_KEY | Configurar | Stripe |
| STRIPE_WEBHOOK_SECRET | Configurar | Stripe webhook |
| STRIPE_PRICE_* | Configurar | IDs de preço Stripe |
| WHATSAPP_TOKEN | Opcional | WhatsApp Cloud API |
| APOLLO_API_KEY | Opcional | Apollo.io |
| SMTP_* | Opcional | Configuração de e-mail |
| FRONTEND_URL | Configurar | URL do frontend para CORS |

## Tabelas criadas/alteradas no Supabase
- `nodere_workspaces`: base real de workspaces.
- `nodere_platform_users`: base real de usuários da plataforma.
- `nodere_companies`: base real de leads/empresas.
- `nodere_workspace_settings`: configurações por workspace.
- `nodere_billing_subscriptions`: assinaturas persistentes.
- `nodere_stripe_events`: idempotência de eventos Stripe.
- `nodere_plan_limits`: limites e módulos por plano.
- `nodere_proposals`: propostas comerciais persistentes.
- `nodere_audit_logs`: auditoria administrativa complementar.

## Como testar
1. Acessar `https://nodere.com.br`.
2. Criar conta com e-mail de teste ou entrar com administrador.
3. Fazer busca por "clínicas" em "Caxias do Sul RS".
4. Verificar Score NODERE nos resultados.
5. Salvar um lead no CRM.
6. Abrir ficha do lead e gerar diagnóstico IA.
7. Criar uma proposta para o lead.
8. Gerar PDF da proposta.
9. Abrir Relatórios, validar gráficos, operadores, PDF e CSV.

## Como fazer deploy
### Frontend (Vercel)
`git push origin main` aciona o fluxo conectado. Também é possível publicar manualmente via `vercel deploy --prod`.

### Backend (Render)
`git push origin main` aciona deploy automático se o serviço estiver conectado ao repositório.

## Riscos conhecidos
1. Backend gratuito no Render pode ter cold start de 30-60s após inatividade.
2. Google Places pode falhar por cota ou billing; ideal adicionar cache de resultados.
3. PDFs no backend podem ficar lentos em plano gratuito.
4. Alguns recursos externos dependem de credenciais ainda não configuradas: SMTP, Stripe, WhatsApp Cloud e Apollo.

## Próximos blocos sugeridos
- BLOCO 07: WhatsApp Cloud API completa.
- BLOCO 08: Marketing Intelligence.
- BLOCO 09: Automações com templates.
- BLOCO 10: Notificações, follow-up automático e alertas.
- BLOCO 11: API pública e webhooks.
- BLOCO 12: White-label Enterprise.
