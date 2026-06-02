# Regra de Persistencia NODERE

O NODERE nao pode perder leads, observacoes, tarefas, arquivos, etapas do funil, cores do CRM ou preferencias de tema apos atualizacao, deploy, troca de navegador ou restart do backend.

## Regra operacional

1. Em producao, todo dado operacional deve ser salvo no Supabase/PostgreSQL.
2. `localStorage` pode ser usado somente como cache visual/offline do navegador.
3. Se `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` estiverem configurados e uma gravacao falhar, o backend deve retornar erro `PERSISTENCE_UNAVAILABLE`.
4. O backend nao deve cair para memoria temporaria em producao quando uma escrita critica falhar.
5. A interface nao deve mostrar listas vazias como se os dados tivessem desaparecido quando o backend/banco falhar; deve exibir erro tecnico claro.

## Dados protegidos por esta regra

- Leads e empresas.
- Observacoes e historico.
- Tarefas e agenda.
- Arquivos/documentos gerados.
- Status do pipeline.
- Etapas e cores do funil.
- Tema, fonte, densidade e layout.

## Tabela de configuracoes

Execute o schema atualizado em `apps/api/src/db/schema.sql` ou `docs/database/nodere_production_schema.sql`.

Tabela adicionada:

```sql
create table if not exists nodere_app_settings (
  key text primary key,
  value jsonb not null default '{}',
  updated_at timestamptz not null default now()
);
```

Valores usados:

- `preferences`: tema, modo, cor principal, fonte, densidade e visual.
- `pipeline`: etapas e cores do funil CRM.

## Como testar

1. Salve um lead vindo da busca.
2. Crie uma observacao no lead.
3. Crie uma nova etapa do CRM e escolha uma cor.
4. Altere o tema/fonte/layout em Configuracoes.
5. Atualize a pagina.
6. Abra em outro navegador/dispositivo.
7. Redeploye o backend/frontend.
8. Confirme que os dados continuam no sistema.

Se algo falhar, verificar:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- se o schema foi executado no Supabase
- logs do Render
- retorno `PERSISTENCE_UNAVAILABLE`
