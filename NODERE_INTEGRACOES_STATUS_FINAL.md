# NODERE — Integrações: Status Final

Data: 2026-07-18

Status significa o que foi possível provar, sem revelar valores de credenciais.

| Integração | Configuração observada | Teste realizado | Status final | Próxima ação |
|---|---|---|---|---|
| Supabase PostgreSQL | projeto ativo em `sa-east-1` | health, schema, contagens, advisors | Ativa com riscos de identidade/schema | backup, staging e reconciliação |
| Supabase Auth | 2 contas Auth e 162 registros de plataforma | correlação por `auth_user_id` | Crítica: só 1 vínculo válido | reconciliar usuários |
| Google Places | backend reporta configurado | health/API existente | Ativa no baseline | smoke autenticado de busca |
| Google Maps | chave de servidor observada; chave pública Vercel ausente | revisão de configuração | Parcial | confirmar mapa no browser autenticado |
| Google PageSpeed | backend reporta não configurado | health | Inativa | adicionar chave no Render e testar |
| OpenAI | backend reporta saudável | health e testes de descoberta | Ativa no baseline | monitorar quota/latência |
| Anthropic | backend reporta indisponível | health | Inativa | revisar chave/plano ou remover promessa da UI |
| WhatsApp wa.me | fluxo local sem secret | testes de rotas | Ativo em modo assistido | manter registro manual |
| WhatsApp Cloud | variáveis/painel não certificados | sem envio real | Não verificada | credencial de teste + webhook |
| Apollo | código e variáveis suportados | sem consulta paga certificada | Não verificada | validar plano/API com empresa teste |
| Econodata | código e variáveis suportados | sem endpoint contratado certificado | Não verificada | configurar URL/chave oficiais |
| Google Calendar | preparado | sem OAuth real | Não verificada | conta sandbox e consentimento |
| Outlook Calendar | preparado | sem conector/credencial real | Não verificada | configurar somente se necessário |
| Meta/Instagram/Facebook | preparado no Marketing | sem OAuth real | Não verificada | app Meta e conta teste |
| LinkedIn | busca assistida/OAuth preparado | sem OAuth real | Parcial | validar manualmente; não inventar decisores |
| Vercel | projeto `web`, domínios verificados | inspeção CLI/build | Ativa | deploy e smoke final |
| Render | API pública saudável | health/version | Ativa no baseline | acompanhar auto-deploy após push |

## Decisões de segurança

- Credenciais sensíveis permanecem em backend/ambiente; nenhuma foi copiada para documentos.
- O frontend não usa mais `NEXT_PUBLIC_API_KEY`; a variável ainda existente na Vercel deve ser removida/rotacionada após checagem de consumidores externos.
- `NEXT_PUBLIC_SUPABASE_*` pode continuar configurado, mas a aplicação canônica auditada não instancia cliente Supabase direto.
- Ausência de chave pública Google Maps na Vercel precisa ser confirmada contra a implementação atual; não se deve copiar chave de servidor para o browser sem restrições HTTP/referrer.

## Critério para mudar “não verificada” para “ativa”

Exige uma conta/tenant de teste, operação real de ida e volta, log no backend, tratamento de erro e confirmação de que nenhum segredo chegou ao bundle. Presença de nome de variável ou botão na interface não é prova de integração ativa.
