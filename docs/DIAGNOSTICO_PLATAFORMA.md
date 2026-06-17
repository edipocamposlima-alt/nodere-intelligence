# Diagnóstico NODERE Nexus — 2026-06-17

## Status por módulo

| Módulo | Status | Bloco de correção |
|---|---|---|
| Home pública | OK | Marca revisada para NODERE Nexus. |
| Login | OK local/build | Supabase Auth preservado. |
| Cadastro | OK local/build | Mensagem de erro sanitizada. |
| Dashboard | Parcial operacional | Mensagens técnicas removidas; depende de sessão e backend. |
| Busca de Empresas | Parcial operacional | Mensagens técnicas removidas; mapa avançado depende de chave pública. |
| CRM / Funil | OK local/build | Header correto via mapa centralizado. |
| Ficha da Empresa | OK local/build | PDFs e observações preservados. |
| Inbox | OK local/build | Sem alteração funcional neste bloco. |
| Calendário | OK local/build | Sem alteração funcional neste bloco. |
| Automações | Corrigido | Header agora usa `PAGE_TITLES`. |
| Operadores | Parcial | Depende de backend e dados reais. |
| Relatórios | Corrigido | Erro amigável e retry com `ErrorState`. |
| Marketing | Parcial | Textos técnicos removidos; OAuth ainda depende de credenciais. |
| Catálogo | Corrigido | Abre primeiro em listagem/estado vazio; formulário via CTA. |
| Integrações | Corrigido | Sempre lista integrações estáticas e mescla status real. |
| Billing | Parcial | Mensagem amigável; Stripe real segue pendente. |
| Settings | Parcial | URL de API centralizada e textos técnicos reduzidos. |
| Admin | Corrigido | Timeout de carregamento adicionado; roles dependem de dados reais. |
| Termos/Privacidade | OK local/build | Marca NODERE revisada. |

## Variáveis de ambiente

| Variável | Backend/Frontend | Status |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Frontend | Configurada com fallback. |
| `NEXT_PUBLIC_SUPABASE_URL` | Frontend | Obrigatória; validar na Vercel. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Frontend | Obrigatória; validar como pública. |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | Frontend | Opcional pendente para pins avançados. |
| `SUPABASE_URL` | Backend | Obrigatória. |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend | Obrigatória. |
| `GOOGLE_PLACES_API_KEY` | Backend | Obrigatória para busca real. |
| `OPENAI_API_KEY` | Backend | Obrigatória para IA real. |
| `STRIPE_SECRET_KEY` | Backend | Pendente controlado. |
| `STRIPE_WEBHOOK_SECRET` | Backend | Pendente controlado. |
| `SMTP_HOST/SMTP_USER/SMTP_PASS/SMTP_FROM` | Backend | Pendente controlado. |
| `WHATSAPP_CLOUD_TOKEN/WHATSAPP_PHONE_NUMBER_ID` | Backend | Verificar para WhatsApp Cloud real. |
| `APOLLO_API_KEY` | Backend | Verificar para enriquecimento real. |

## Dependências entre correções

- Integrações e busca real dependem do backend acessível e CORS correto.
- Admin depende de sessão real e role `owner` ou `admin` em `nodere_platform_users`.
- Relatórios dependem dos endpoints `/api/reports/*` e dados persistidos por workspace.
- Billing depende de credenciais Stripe reais.
- SMTP depende de credenciais reais no backend.

## O que ainda falta após este bloco

- Validar `role` real do usuário administrador no Supabase.
- Confirmar variáveis reais na Vercel e Render.
- Configurar Stripe real.
- Configurar SMTP real.
- Configurar WhatsApp Cloud API, se a operação for sair do fluxo `wa.me`.
- Configurar Google Maps público se pins interativos forem obrigatórios.

## Riscos identificados

- Algumas integrações externas podem estar ausentes e devem falhar de forma controlada.
- Dados zerados podem indicar workspace sem registros ou sessão sem contexto.
- Se Render ainda estiver em deploy antigo, frontend novo pode chamar endpoints que só existirão após novo deploy backend.
- A marca foi padronizada para NODERE Nexus em textos visíveis, mas nomes técnicos `nodere_*` foram preservados para não quebrar banco, domínio e integrações.
