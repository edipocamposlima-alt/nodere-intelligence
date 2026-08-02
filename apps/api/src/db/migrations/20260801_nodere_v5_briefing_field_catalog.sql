-- NODERE V5 - official 47-field commercial briefing catalog.
-- Idempotent and workspace-scoped so every tenant receives the same contract.

begin;

set local lock_timeout = '5s';
set local statement_timeout = '30s';

with field_catalog(field_key, label, section_name, field_type, sort_order, required_for_completion, company_path, contact_path, legacy_keys) as (
  values
    ('company_name', 'Empresa', 'Empresa', 'text', 1, true, 'name', null, array['nome_empresa']::text[]),
    ('segment', 'Segmento', 'Empresa', 'text', 2, true, 'category', null, array['segmento']::text[]),
    ('cnpj', 'CNPJ', 'Empresa', 'text', 3, false, 'cnpj', null, '{}'::text[]),
    ('city', 'Cidade', 'Empresa', 'text', 4, false, 'city', null, array['cidade']::text[]),
    ('state', 'UF', 'Empresa', 'text', 5, false, 'state', null, array['estado', 'uf']::text[]),
    ('full_address', 'Endereço completo', 'Empresa', 'textarea', 6, false, 'address', null, array['endereco_completo']::text[]),
    ('website', 'Site', 'Presença digital', 'url', 7, false, 'website', null, '{}'::text[]),
    ('social_networks', 'Redes sociais', 'Presença digital', 'textarea', 8, false, null, null, array['instagram', 'redes_sociais']::text[]),
    ('google_business_profile', 'Google Perfil da Empresa', 'Presença digital', 'url', 9, false, null, null, array['google_perfil_empresa']::text[]),
    ('products_services', 'Principais produtos e serviços', 'Negócio', 'textarea', 10, false, null, null, array['principais_produtos_servicos']::text[]),
    ('target_audience', 'Público-alvo', 'Negócio', 'textarea', 11, false, null, null, '{}'::text[]),
    ('differentiators', 'Diferenciais', 'Negócio', 'textarea', 12, false, null, null, '{}'::text[]),
    ('customer_acquisition', 'Como adquire clientes', 'Operação comercial', 'textarea', 13, false, null, null, '{}'::text[]),
    ('service_process', 'Processo de atendimento', 'Operação comercial', 'textarea', 14, false, null, null, '{}'::text[]),
    ('sales_team', 'Equipe comercial', 'Operação comercial', 'textarea', 15, false, null, null, '{}'::text[]),
    ('employees', 'Funcionários', 'Operação comercial', 'number', 16, false, null, null, '{}'::text[]),
    ('direct_competitors', 'Concorrentes diretos', 'Mercado', 'textarea', 17, false, null, null, array['concorrentes_diretos']::text[]),
    ('decision_maker_name', 'Nome do decisor', 'Decisor e contato', 'text', 18, true, null, 'name', array['nome_decisor']::text[]),
    ('decision_maker_role', 'Cargo do decisor', 'Decisor e contato', 'text', 19, false, null, 'role', array['cargo_decisor']::text[]),
    ('phone', 'Telefone', 'Decisor e contato', 'tel', 20, false, null, 'phone', '{}'::text[]),
    ('whatsapp', 'WhatsApp', 'Decisor e contato', 'tel', 21, false, null, 'whatsapp', '{}'::text[]),
    ('email', 'E-mail', 'Decisor e contato', 'email', 22, false, null, 'email', '{}'::text[]),
    ('best_channel', 'Melhor canal', 'Decisor e contato', 'select', 23, false, null, null, '{}'::text[]),
    ('positive_points', 'Pontos positivos identificados', 'Diagnóstico', 'textarea', 24, false, null, null, array['pontos_positivos_identificados']::text[]),
    ('opportunities', 'Possíveis oportunidades', 'Diagnóstico', 'textarea', 25, false, null, null, array['possiveis_oportunidades']::text[]),
    ('diagnosis', 'Diagnóstico', 'Diagnóstico', 'textarea', 26, false, null, null, '{}'::text[]),
    ('evidence', 'Evidências encontradas', 'Diagnóstico', 'textarea', 27, false, null, null, array['evidencias_encontradas']::text[]),
    ('hypotheses', 'Hipóteses a validar', 'Diagnóstico', 'textarea', 28, false, null, null, array['hipoteses_a_validar']::text[]),
    ('approach_objective', 'Objetivo da abordagem', 'Planejamento', 'textarea', 29, false, null, null, array['objetivo_da_abordagem']::text[]),
    ('contact_date', 'Data do contato', 'Planejamento', 'date', 30, false, null, null, array['data_do_contato']::text[]),
    ('next_action', 'Próxima ação', 'Planejamento', 'textarea', 31, true, null, null, array['proxima_acao']::text[]),
    ('next_action_date', 'Data da próxima ação', 'Planejamento', 'date', 32, false, null, null, array['data_da_proxima_acao']::text[]),
    ('next_action_time', 'Hora da próxima ação', 'Planejamento', 'time', 33, false, null, null, '{}'::text[]),
    ('status', 'Status', 'Controle', 'select', 34, false, null, null, '{}'::text[]),
    ('priority', 'Prioridade', 'Controle', 'select', 35, false, null, null, '{}'::text[]),
    ('general_notes', 'Observações gerais', 'Controle', 'textarea', 36, false, null, null, array['observacoes_gerais']::text[]),
    ('planned_approach', 'Abordagem planejada', 'Estratégia', 'textarea', 37, false, null, null, '{}'::text[]),
    ('objection_risks', 'Objeções e riscos', 'Estratégia', 'textarea', 38, false, null, null, '{}'::text[]),
    ('budget_range', 'Faixa de investimento', 'Qualificação', 'text', 39, false, null, null, '{}'::text[]),
    ('decision_process', 'Processo de decisão', 'Qualificação', 'textarea', 40, false, null, null, '{}'::text[]),
    ('business_goals', 'Objetivos de negócio', 'Qualificação', 'textarea', 41, false, null, null, '{}'::text[]),
    ('success_metrics', 'Métricas de sucesso', 'Qualificação', 'textarea', 42, false, null, null, '{}'::text[]),
    ('current_tools', 'Ferramentas atuais', 'Contexto atual', 'textarea', 43, false, null, null, '{}'::text[]),
    ('current_agency', 'Agência ou fornecedor atual', 'Contexto atual', 'text', 44, false, null, null, '{}'::text[]),
    ('timeline', 'Prazo desejado', 'Contexto atual', 'text', 45, false, null, null, '{}'::text[]),
    ('sources', 'Fontes', 'Rastreabilidade', 'tags', 46, false, null, null, '{}'::text[]),
    ('tags', 'Tags', 'Rastreabilidade', 'tags', 47, false, null, null, '{}'::text[])
)
insert into public.briefing_field_mappings (
  workspace_id, field_key, label, section, field_type, sort_order,
  required_for_completion, company_path, contact_path, legacy_keys, active
)
select
  workspace.id, field.field_key, field.label, field.section_name, field.field_type,
  field.sort_order, field.required_for_completion, field.company_path,
  field.contact_path, field.legacy_keys, true
from public.nodere_workspaces workspace
cross join field_catalog field
on conflict (workspace_id, field_key) do update set
  label = excluded.label,
  section = excluded.section,
  field_type = excluded.field_type,
  sort_order = excluded.sort_order,
  required_for_completion = excluded.required_for_completion,
  company_path = excluded.company_path,
  contact_path = excluded.contact_path,
  legacy_keys = excluded.legacy_keys,
  active = true,
  updated_at = now();

commit;
