drop table if exists public.nodere_test_data_registry;
drop table if exists public.nodere_domain_events;
drop table if exists public.nodere_research_runs;
drop table if exists public.nodere_owner_entitlements;

alter table if exists public.nodere_ai_model_registry
  drop column if exists availability_error,
  drop column if exists discovery_source,
  drop column if exists rate_limit_profile,
  drop column if exists supports_audio,
  drop column if exists supports_web_search,
  drop column if exists supports_tools,
  drop column if exists supports_responses,
  drop column if exists availability_checked_at,
  drop column if exists provider_available;
