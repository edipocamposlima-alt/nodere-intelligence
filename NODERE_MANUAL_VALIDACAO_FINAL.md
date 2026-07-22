# NODERE — Manual de Validação Final

Data: 2026-07-19

## 1. Versão e disponibilidade

1. Abra `https://nodere.com.br` e confirme redirecionamento ao login sem sessão.
2. Consulte `https://nodere-api.onrender.com/api/health/version`.
3. Confirme versão `1.1.0`, ambiente `production` e commit `098ef844...`.
4. Valide `/manifest.webmanifest`, `/sw.js` e `/offline.html` com HTTP 200.

## 2. Sessão e permissões

1. Tente abrir `/dashboard` sem sessão: deve ir para `/login`.
2. Faça login com usuário autorizado.
3. Navegue entre Dashboard, Buscas, Empresas, CRM, Agenda, Relatórios e Admin conforme o papel.
4. Faça logout e confirme que uma rota privada volta ao login.
5. Repita com viewer/operator/admin após o staging existir; confirme negações esperadas.

## 3. Fluxo comercial

1. Execute busca controlada por nicho/cidade.
2. Salve uma empresa de teste e confirme duplicidade por `place_id`.
3. Abra a Ficha pelo ID interno.
4. Registre nota e follow-up.
5. Mova o lead entre etapas e confira Dashboard/Relatórios.
6. Gere proposta/PDF sem dados internos indevidos.
7. Remova/arquive somente os dados sintéticos conforme política aprovada.

## 4. Integrações

1. Abra Integrações e confirme que status configurado não aparece como OK real.
2. Consulte `/api/backend/integrations/health` com sessão.
3. Supabase e OpenAI devem responder OK no baseline desta versão.
4. Anthropic/PageSpeed devem permanecer ausentes até configuração oficial.
5. Teste cada provedor contratado com um caso de ida e volta e registre request ID sanitizado.

## 5. Segurança

1. Envie preflight com origem não autorizada e espere 403.
2. Envie webhook sem assinatura: deve falhar fechado.
3. Teste URL pública, localhost, IP privado e redirect para IP privado no scanner.
4. Execute a suíte de hardening.
5. Não execute o SQL de banco antes de backup restaurado em staging.

## 6. Banco e reconciliação

1. Gere backup e restaure em staging.
2. Rode o reconciliador sem `--apply` e compare `NODERE_RECONCILIACAO_AUTH_RESULTADO.csv`.
3. Revise cada candidato com o responsável de negócio.
4. Aplique a migração em staging; teste todos os papéis/workspaces.
5. Execute o rollback em staging.
6. Só então aprove a janela produtiva.

## 7. Critério de aceite

Aceite requer evidência de resposta HTTP, teste aprovado, chamada externa real ou restore executado. Configuração declarada, card verde ou existência de código não substitui prova operacional.
