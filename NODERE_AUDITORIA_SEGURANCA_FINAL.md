# NODERE — Auditoria de Segurança Final

Data: 2026-07-19  
Commit: `098ef844...`

## Controles aprovados

- CORS por origens exatas; origem Vercel não autorizada recebeu `403 CORS_ORIGIN_DENIED`.
- segredo de sessão administrativa sem fallback conhecido em produção.
- assinatura HMAC-SHA256 e comparação constant-time nos webhooks Meta/WhatsApp.
- webhooks falham fechados quando o segredo não está configurado.
- limite JSON de 1 MB; corpo bruto preservado somente onde a assinatura exige.
- scanner protegido contra SSRF e redirects para redes privadas/reservadas.
- validação de esquema/protocolo, DNS, porta, timeout e tamanho de resposta.
- health de IA faz probe autenticado e sanitiza falhas.
- convites de usuários sem senha temporária conhecida.
- sessão privada mediada por cookie httpOnly/proxy same-origin; token não persistido em `localStorage`.
- cache PWA restrito a recursos públicos.
- testes específicos de hardening: 13/13.
- auditoria de dependências de produção: zero vulnerabilidades conhecidas em Web/API.

## Pendências críticas

- helper de workspace no banco ainda confia em `user_metadata`, pois a migração segura não foi aplicada;
- grants de funções Security Definer e políticas sobrepostas permanecem no baseline;
- proteção contra senhas vazadas está desabilitada no Supabase Auth;
- não existe backup restaurável/staging para ensaiar RLS;
- 26 vínculos UID são órfãos e 135 perfis não têm UID Auth;
- `META_APP_SECRET` está ausente: o webhook está protegido por indisponibilidade intencional, não operacional;
- faltam testes por papel/workspace no banco endurecido.

## Advisor Supabase

O baseline de 42 avisos de segurança e 82 de performance permanece intencionalmente inalterado. A redução só pode ser medida após staging/backup, execução da migração e regressão de acesso. Criar políticas permissivas genéricas para “zerar” avisos foi rejeitado.

## Segredos

Nenhum valor de secret é reproduzido neste relatório. Variáveis sensíveis devem permanecer no Render/Supabase/cofre do CI. Caso exista suspeita de exposição histórica, rotacionar service role, chaves de IA/Google/Meta e segredo de sessão, com implantação coordenada.

## Classificação

Aplicação: hardening relevante concluído e em produção.  
Banco/identidade: **pendente crítico controlado** por ausência de pré-condições seguras.  
Resultado global: **PARCIALMENTE CONCLUÍDO**.
