# Backup logico comercial pre-migracao

Gerado em: 2026-06-30T01:19:06.636Z

Este arquivo registra metadados e contagens antes da migracao comercial. Nao contem dados sensiveis, senhas, tokens ou connection string.

## Contagens

| table_name | row_count |
| --- | --- |
| catalog_items | 2 |
| nodere_audit_logs | 0 |
| nodere_companies | 661 |
| nodere_platform_users | 2 |
| nodere_proposals | 0 |

## Colunas

| table_name | column_name | data_type | is_nullable | column_default |
| --- | --- | --- | --- | --- |
| catalog_items | id | text | NO | (gen_random_uuid())::text |
| catalog_items | workspace_id | text | NO | 'default'::text |
| catalog_items | code | text | NO |  |
| catalog_items | name | text | NO |  |
| catalog_items | commercial_name | text | YES |  |
| catalog_items | category | text | NO |  |
| catalog_items | subcategory | text | YES |  |
| catalog_items | brand | text | YES |  |
| catalog_items | image_url | text | YES |  |
| catalog_items | images | ARRAY | NO | '{}'::text[] |
| catalog_items | type | text | NO |  |
| catalog_items | status | text | NO | 'active'::text |
| catalog_items | description_short | text | NO | ''::text |
| catalog_items | description_full | text | YES |  |
| catalog_items | features | text | YES |  |
| catalog_items | benefits | text | YES |  |
| catalog_items | differentials | text | YES |  |
| catalog_items | target_audience | text | YES |  |
| catalog_items | use_cases | text | YES |  |
| catalog_items | cost | numeric | NO | 0 |
| catalog_items | price | numeric | NO | 0 |
| catalog_items | commission_pct | numeric | YES |  |
| catalog_items | max_discount_pct | numeric | YES |  |
| catalog_items | promotional_price | numeric | YES |  |
| catalog_items | promotion_expires_at | date | YES |  |
| catalog_items | supplier | text | YES |  |
| catalog_items | delivery_days | integer | YES |  |
| catalog_items | warranty | text | YES |  |
| catalog_items | exchange_policy | text | YES |  |
| catalog_items | cancellation_policy | text | YES |  |
| catalog_items | payment_conditions | text | YES |  |
| catalog_items | installments_available | integer | YES |  |
| catalog_items | unit_measure | text | YES |  |
| catalog_items | weight_kg | numeric | YES |  |
| catalog_items | height_cm | numeric | YES |  |
| catalog_items | width_cm | numeric | YES |  |
| catalog_items | length_cm | numeric | YES |  |
| catalog_items | color | text | YES |  |
| catalog_items | material | text | YES |  |
| catalog_items | model | text | YES |  |
| catalog_items | voltage | text | YES |  |
| catalog_items | technical_specs | text | YES |  |
| catalog_items | execution_time | text | YES |  |
| catalog_items | scope | text | YES |  |
| catalog_items | limitations | text | YES |  |
| catalog_items | deliverables | text | YES |  |
| catalog_items | complexity | text | YES |  |
| catalog_items | sla | text | YES |  |
| catalog_items | stock_current | integer | YES |  |
| catalog_items | stock_min | integer | YES |  |
| catalog_items | stock_max | integer | YES |  |
| catalog_items | stock_location | text | YES |  |
| catalog_items | keywords | ARRAY | NO | '{}'::text[] |
| catalog_items | market_segment | text | YES |  |
| catalog_items | campaign_url | text | YES |  |
| catalog_items | support_material_urls | ARRAY | NO | '{}'::text[] |
| catalog_items | registered_by | text | YES |  |
| catalog_items | created_at | timestamp with time zone | NO | now() |
| catalog_items | updated_at | timestamp with time zone | NO | now() |
| nodere_audit_logs | id | uuid | NO | gen_random_uuid() |
| nodere_audit_logs | workspace_id | text | NO |  |
| nodere_audit_logs | user_id | text | YES |  |
| nodere_audit_logs | action | text | NO |  |
| nodere_audit_logs | resource_type | text | NO |  |
| nodere_audit_logs | resource_id | text | YES |  |
| nodere_audit_logs | metadata | jsonb | NO | '{}'::jsonb |
| nodere_audit_logs | ip_address | text | YES |  |
| nodere_audit_logs | user_agent | text | YES |  |
| nodere_audit_logs | created_at | timestamp with time zone | NO | now() |
| nodere_companies | id | text | NO |  |
| nodere_companies | name | text | NO |  |
| nodere_companies | category | text | NO | ''::text |
| nodere_companies | city | text | NO | ''::text |
| nodere_companies | state | text | NO | ''::text |
| nodere_companies | address | text | NO | ''::text |
| nodere_companies | phone | text | YES |  |
| nodere_companies | whatsapp | text | YES |  |
| nodere_companies | website | text | YES |  |
| nodere_companies | instagram | text | YES |  |
| nodere_companies | facebook | text | YES |  |
| nodere_companies | linkedin | text | YES |  |
| nodere_companies | youtube | text | YES |  |
| nodere_companies | rating | numeric | YES |  |
| nodere_companies | review_count | integer | YES |  |
| nodere_companies | maps_url | text | YES |  |
| nodere_companies | latitude | numeric | YES |  |
| nodere_companies | longitude | numeric | YES |  |
| nodere_companies | status | text | NO | 'Novo Lead'::text |
| nodere_companies | score | integer | NO | 0 |
| nodere_companies | opportunity_level | text | NO | 'Baixa'::text |
| nodere_companies | enrichment_status | text | NO | 'none'::text |
| nodere_companies | last_contact_at | timestamp with time zone | YES |  |
| nodere_companies | digital_signals | jsonb | NO | '{}'::jsonb |
| nodere_companies | detected_opportunities | jsonb | NO | '[]'::jsonb |
| nodere_companies | suggestions | jsonb | NO | '[]'::jsonb |
| nodere_companies | created_at | timestamp with time zone | NO | now() |
| nodere_companies | updated_at | timestamp with time zone | NO | now() |
| nodere_companies | workspace_id | text | NO | 'default'::text |
| nodere_companies | place_id | text | YES |  |
| nodere_companies | google_place_id | text | YES |  |
| nodere_companies | opening_hours | jsonb | NO | '{}'::jsonb |
| nodere_companies | business_status | text | YES |  |
| nodere_companies | website_scan | jsonb | NO | '{}'::jsonb |
| nodere_companies | social_scan | jsonb | NO | '{}'::jsonb |
| nodere_companies | opportunity_reasons | jsonb | NO | '[]'::jsonb |
| nodere_companies | crm_value | numeric | NO | 0 |
| nodere_companies | expected_close_at | date | YES |  |
| nodere_companies | lost_reason | text | YES |  |
| nodere_companies | source_detail | text | YES |  |
| nodere_platform_users | id | text | NO | (gen_random_uuid())::text |
| nodere_platform_users | workspace_id | text | NO |  |
| nodere_platform_users | name | text | NO |  |
| nodere_platform_users | email | text | NO |  |
| nodere_platform_users | role | text | NO | 'operator'::text |
| nodere_platform_users | active | boolean | NO | true |
| nodere_platform_users | password_hash | text | NO |  |
| nodere_platform_users | created_at | timestamp with time zone | NO | now() |
| nodere_platform_users | updated_at | timestamp with time zone | NO | now() |
| nodere_platform_users | auth_user_id | uuid | YES |  |
| nodere_platform_users | legacy_id | text | YES |  |
| nodere_platform_users | legacy_workspace_id | text | YES |  |
| nodere_platform_users | auth_imported_at | timestamp with time zone | YES |  |
| nodere_platform_users | auth_import_error | text | YES |  |
| nodere_proposals | id | uuid | NO | gen_random_uuid() |
| nodere_proposals | workspace_id | text | NO |  |
| nodere_proposals | lead_id | text | YES |  |
| nodere_proposals | title | text | NO |  |
| nodere_proposals | status | text | NO | 'draft'::text |
| nodere_proposals | service_type | text | YES |  |
| nodere_proposals | content | text | YES |  |
| nodere_proposals | items | jsonb | NO | '[]'::jsonb |
| nodere_proposals | subtotal | numeric | NO | 0 |
| nodere_proposals | discount | numeric | NO | 0 |
| nodere_proposals | total | numeric | NO | 0 |
| nodere_proposals | currency | text | NO | 'BRL'::text |
| nodere_proposals | valid_until | date | YES |  |
| nodere_proposals | version | integer | NO | 1 |
| nodere_proposals | created_by | text | YES |  |
| nodere_proposals | metadata | jsonb | NO | '{}'::jsonb |
| nodere_proposals | created_at | timestamp with time zone | NO | now() |
| nodere_proposals | updated_at | timestamp with time zone | NO | now() |
| nodere_proposals | company_id | text | YES |  |
| nodere_proposals | subtotal_cents | integer | NO | 0 |
| nodere_proposals | discount_percent | numeric | YES |  |
| nodere_proposals | discount_value_cents | integer | YES |  |
| nodere_proposals | discount_reason | text | YES |  |
| nodere_proposals | total_cents | integer | NO | 0 |
| nodere_proposals | commercial_snapshot | jsonb | NO | '{}'::jsonb |
| nodere_proposals | updated_by | text | YES |  |

## Constraints

_Nenhum registro._

## Indices

| table_name | indexname |
| --- | --- |
| catalog_items | catalog_items_pkey |
| catalog_items | catalog_items_workspace_id_code_key |
| catalog_items | idx_catalog_items_workspace |
| nodere_audit_logs | idx_nodere_audit_logs_workspace |
| nodere_audit_logs | nodere_audit_logs_pkey |
| nodere_companies | idx_companies_city_state |
| nodere_companies | idx_companies_score |
| nodere_companies | idx_companies_status |
| nodere_companies | idx_companies_workspace |
| nodere_companies | idx_nodere_companies_discovery_score |
| nodere_companies | idx_nodere_companies_google_place_id |
| nodere_companies | idx_nodere_companies_place_id |
| nodere_companies | idx_nodere_companies_status_workspace |
| nodere_companies | nodere_companies_pkey |
| nodere_platform_users | idx_platform_users_email |
| nodere_platform_users | idx_platform_users_workspace |
| nodere_platform_users | nodere_platform_users_email_key |
| nodere_platform_users | nodere_platform_users_pkey |
| nodere_proposals | idx_nodere_proposals_workspace |
| nodere_proposals | nodere_proposals_pkey |

## Policies

| table_name | policyname | cmd |
| --- | --- | --- |
| nodere_audit_logs | nodere_audit_logs_workspace_delete | DELETE |
| nodere_audit_logs | nodere_audit_logs_workspace_insert | INSERT |
| nodere_audit_logs | nodere_audit_logs_workspace_select | SELECT |
| nodere_audit_logs | nodere_audit_logs_workspace_update | UPDATE |
| nodere_proposals | nodere_proposals_read_workspace | SELECT |
| nodere_proposals | nodere_proposals_workspace_delete | DELETE |
| nodere_proposals | nodere_proposals_workspace_insert | INSERT |
| nodere_proposals | nodere_proposals_workspace_select | SELECT |
| nodere_proposals | nodere_proposals_workspace_update | UPDATE |
| nodere_proposals | nodere_proposals_write_workspace | ALL |
