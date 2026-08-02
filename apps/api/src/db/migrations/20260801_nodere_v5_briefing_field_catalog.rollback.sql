-- Remove only the official NODERE V5 catalog entries. The V5 schema rollback
-- already removes the entire mapping table when a full rollback is required.

begin;

delete from public.briefing_field_mappings
where field_key in (
  'company_name', 'segment', 'cnpj', 'city', 'state', 'full_address',
  'website', 'social_networks', 'google_business_profile', 'products_services',
  'target_audience', 'differentiators', 'customer_acquisition', 'service_process',
  'sales_team', 'employees', 'direct_competitors', 'decision_maker_name',
  'decision_maker_role', 'phone', 'whatsapp', 'email', 'best_channel',
  'positive_points', 'opportunities', 'diagnosis', 'evidence', 'hypotheses',
  'approach_objective', 'contact_date', 'next_action', 'next_action_date',
  'next_action_time', 'status', 'priority', 'general_notes', 'planned_approach',
  'objection_risks', 'budget_range', 'decision_process', 'business_goals',
  'success_metrics', 'current_tools', 'current_agency', 'timeline', 'sources', 'tags'
);

commit;
