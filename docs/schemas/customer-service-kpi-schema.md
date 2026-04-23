# Customer Service KPI Schema

## Purpose

This schema defines the operational inputs and derived KPIs for a customer service dashboard with estimated CO2 impact.

The structure is designed for:

- typical service reporting
- channel-level CO2 impact
- baseline comparison
- auditable formulas

## Core design

Use three layers:

1. `Raw Inputs`
2. `Operational KPIs`
3. `CO2 KPIs`

Every CO2 KPI should be traceable back to operational inputs.

## Dimensions

Recommended dimensions for slicing:

- `date`
- `week`
- `month`
- `team`
- `queue`
- `market`
- `country`
- `language`
- `channel`
- `customer_segment`
- `issue_type`
- `contact_driver`
- `contact_driver_group`
- `contact_driver_group_level_1`
- `contact_driver_group_level_2`
- `is_preventable`
- `bot_version`
- `model_class`

## Channels

- `call`
- `email`
- `chatbot`
- `voice_bot`
- `chat_human`

## 1. Raw inputs

### Shared reference inputs

These values are configurable and reused in calculations.

| Field | Type | Example | Notes |
|---|---|---:|---|
| `grid_factor_kg_per_kwh` | number | `0.363` | country or region specific |
| `agent_device_power_w` | number | `40` | laptop or desktop default |
| `customer_smartphone_power_w` | number | `5` | default assumption |
| `customer_laptop_power_w` | number | `30` | default assumption |
| `fixed_network_kwh_per_gb` | number | `0.29` | based on reviewed source |
| `mobile_network_kwh_per_gb` | number | `0.60` | based on reviewed source |
| `llm_kwh_per_turn` | number | `0.0003` | default for typical GPT-4o style turn |
| `simple_email_size_gb` | number | `0.0001` | 0.1 MB |
| `avg_voice_traffic_gb_per_min` | number | `0.00096` | 128 kbps combined |
| `attachment_storage_kwh_per_gb_month` | number | configurable | customer-specific when available |

### Agent base raw inputs

| Field | Type | Example |
|---|---|---:|
| `agent_count` | integer | `240` |
| `active_agent_count` | integer | `210` |
| `scheduled_hours` | number | `31200` |
| `productive_hours` | number | `24850` |
| `occupancy_rate` | number | `0.79` |
| `shrinkage_rate` | number | `0.18` |
| `avg_system_count` | integer | `4` |
| `device_type` | enum | `desktop` |
| `work_mode` | text | `hybrid` |

### Contact driver raw inputs

| Field | Type | Example |
|---|---|---:|
| `contact_driver` | text | `invoice_not_received` |
| `contact_driver_group` | text | `billing` |
| `contact_driver_group_level_1` | text | `billing` |
| `contact_driver_group_level_2` | text | `documents` |
| `is_preventable` | boolean | `true` |
| `is_policy_driven` | boolean | `false` |
| `is_process_driven` | boolean | `true` |
| `is_product_driven` | boolean | `false` |
| `is_information_gap` | boolean | `true` |

### Call raw inputs

| Field | Type | Example |
|---|---|---:|
| `inbound_calls` | integer | `120000` |
| `outbound_calls` | integer | `18000` |
| `resolved_calls` | integer | `102500` |
| `abandoned_calls` | integer | `9500` |
| `avg_handle_time_min` | number | `6.2` |
| `avg_queue_time_min` | number | `1.4` |
| `avg_hold_time_min` | number | `0.7` |
| `after_call_work_min` | number | `1.3` |
| `transfer_count` | integer | `8200` |
| `escalation_count` | integer | `4100` |
| `callback_requests` | integer | `7600` |
| `callback_successes` | integer | `5900` |
| `callback_retry_attempts` | integer | `2800` |
| `failed_callbacks` | integer | `900` |
| `repeat_call_cases` | integer | `11500` |
| `customer_network_type` | enum | `fixed` / `mobile` |
| `customer_device_type` | enum | `smartphone` / `laptop` |

### Email raw inputs

| Field | Type | Example |
|---|---|---:|
| `emails_received` | integer | `450000` |
| `emails_sent` | integer | `420000` |
| `resolved_email_cases` | integer | `310000` |
| `reopened_email_cases` | integer | `42000` |
| `duplicate_email_cases` | integer | `17000` |
| `avg_email_handling_time_min` | number | `3.8` |
| `avg_response_time_min` | number | `92` |
| `avg_resolution_time_min` | number | `410` |
| `avg_replies_per_case` | number | `1.7` |
| `attachments_sent` | integer | `86000` |
| `avg_attachment_size_gb` | number | `0.01` |
| `email_storage_gb` | number | `2200` |
| `avg_retention_months` | number | `18` |
| `customer_email_read_time_min` | number | `1.0` |
| `customer_device_type` | enum | `smartphone` / `laptop` |
| `customer_network_type` | enum | `fixed` / `mobile` |

### Chatbot raw inputs

| Field | Type | Example |
|---|---|---:|
| `chatbot_sessions` | integer | `300000` |
| `chatbot_resolved_sessions` | integer | `126000` |
| `chatbot_escalated_sessions` | integer | `138000` |
| `chatbot_abandoned_sessions` | integer | `36000` |
| `avg_chatbot_turns` | number | `6.4` |
| `avg_turns_before_escalation` | number | `4.8` |
| `avg_chatbot_session_min` | number | `4.2` |
| `repeat_chatbot_sessions` | integer | `28000` |
| `chatbot_deflected_calls` | integer | `24000` |
| `chatbot_deflected_emails` | integer | `51000` |
| `model_class` | text | `gpt-4o-like` |
| `customer_device_type` | enum | `smartphone` / `laptop` |
| `customer_network_type` | enum | `fixed` / `mobile` |

### Voice bot raw inputs

| Field | Type | Example |
|---|---|---:|
| `voice_bot_sessions` | integer | `95000` |
| `voice_bot_resolved_sessions` | integer | `36000` |
| `voice_bot_transferred_sessions` | integer | `47000` |
| `voice_bot_abandoned_sessions` | integer | `12000` |
| `avg_voice_bot_duration_min` | number | `2.8` |
| `avg_voice_bot_retry_loops` | number | `1.6` |
| `intent_recognition_failures` | integer | `14000` |
| `auth_failures` | integer | `5000` |
| `callbacks_scheduled_by_voice_bot` | integer | `6200` |
| `avg_asr_tts_kwh_per_min` | number | configurable |
| `llm_enabled` | boolean | `true` |
| `avg_llm_turns_per_voice_session` | number | `3.2` |

## 2. Operational KPIs

### Shared KPIs

| KPI | Formula |
|---|---|
| `resolution_rate` | `resolved_cases / created_cases` |
| `repeat_contact_rate` | `repeat_contacts / resolved_cases` |
| `fcr` | `first_contact_resolutions / total_cases` |
| `sla_compliance` | `cases_within_sla / total_cases` |
| `contact_rate_per_driver` | `contacts / contact_driver_cases` |
| `preventable_contact_rate` | `preventable_cases / total_cases` |

### Agent base KPIs

| KPI | Formula |
|---|---|
| `occupancy_rate` | `productive_hours / scheduled_hours` |
| `cases_per_agent` | `resolved_cases / active_agent_count` |
| `contacts_per_agent` | `contacts / active_agent_count` |
| `productive_hours_per_case` | `productive_hours / resolved_cases` |

### Call KPIs

| KPI | Formula |
|---|---|
| `abandon_rate` | `abandoned_calls / inbound_calls` |
| `callback_success_rate` | `callback_successes / callback_requests` |
| `callback_retry_rate` | `callback_retry_attempts / callback_requests` |
| `transfer_rate` | `transfer_count / inbound_calls` |
| `escalation_rate` | `escalation_count / inbound_calls` |
| `repeat_call_rate` | `repeat_call_cases / resolved_calls` |
| `avg_total_call_time_min` | `avg_handle_time_min + avg_hold_time_min + after_call_work_min` |

### Email KPIs

| KPI | Formula |
|---|---|
| `reopen_rate` | `reopened_email_cases / resolved_email_cases` |
| `duplicate_email_rate` | `duplicate_email_cases / resolved_email_cases` |
| `attachment_rate` | `attachments_sent / emails_sent` |
| `avg_email_case_messages` | `avg_replies_per_case + 1` |

### Chatbot KPIs

| KPI | Formula |
|---|---|
| `bot_containment_rate` | `chatbot_resolved_sessions / chatbot_sessions` |
| `bot_escalation_rate` | `chatbot_escalated_sessions / chatbot_sessions` |
| `bot_abandon_rate` | `chatbot_abandoned_sessions / chatbot_sessions` |
| `bot_repeat_rate` | `repeat_chatbot_sessions / chatbot_sessions` |

### Voice bot KPIs

| KPI | Formula |
|---|---|
| `voice_bot_containment_rate` | `voice_bot_resolved_sessions / voice_bot_sessions` |
| `voice_bot_transfer_rate` | `voice_bot_transferred_sessions / voice_bot_sessions` |
| `voice_bot_abandon_rate` | `voice_bot_abandoned_sessions / voice_bot_sessions` |
| `voice_bot_retry_rate` | `intent_recognition_failures / voice_bot_sessions` |

## 3. CO2 calculation building blocks

### Device energy

`device_kwh = power_w x minutes / 60 / 1000`

### Network energy

`network_kwh = data_gb x network_kwh_per_gb`

### Voice network per minute

`voice_network_kwh_per_min = avg_voice_traffic_gb_per_min x network_kwh_per_gb`

### LLM energy

`llm_session_kwh = turns x llm_kwh_per_turn`

### CO2 conversion

`co2_kg = kwh x grid_factor_kg_per_kwh`

`co2_g = co2_kg x 1000`

## 4. Derived CO2 KPIs

### Call CO2 KPIs

#### `co2e_per_call_g`

Provider-side:

`((agent_device_power_w x (avg_handle_time_min + after_call_work_min) / 60 / 1000) + (avg_handle_time_min + avg_hold_time_min + avg_queue_time_min) x voice_network_kwh_per_min_provider) x grid_factor x 1000`

#### `co2e_from_queue_time_kg`

`inbound_calls x avg_queue_time_min x voice_network_kwh_per_min_customer x grid_factor`

#### `co2e_from_hold_time_kg`

`resolved_calls x avg_hold_time_min x voice_network_kwh_per_min_customer x grid_factor`

#### `co2e_from_callback_retries_kg`

`callback_retry_attempts x avg_handle_time_min x per_min_call_kwh x grid_factor`

#### `co2e_avoided_by_aht_reduction_kg`

`avoided_call_minutes x per_min_call_kwh x grid_factor`

### Email CO2 KPIs

#### `co2e_per_email_g`

`((agent_device_power_w x avg_email_handling_time_min / 60 / 1000) + (simple_email_size_gb x network_kwh_per_gb_provider)) x grid_factor x 1000`

#### `co2e_from_reopened_email_cases_kg`

`reopened_email_cases x reopen_case_kwh x grid_factor`

Where:

`reopen_case_kwh = extra_agent_email_minutes x agent_device_factor + extra_customer_read_minutes x customer_device_factor + extra_email_data_gb x network_factor`

#### `co2e_from_attachment_transmission_kg`

`attachments_sent x avg_attachment_size_gb x network_kwh_per_gb_provider x grid_factor`

#### `co2e_from_attachment_storage_kg`

`email_storage_gb x attachment_storage_kwh_per_gb_month x grid_factor`

#### `co2e_avoided_by_lower_email_volume_kg`

`avoided_emails x co2e_per_email_kg`

### Chatbot CO2 KPIs

#### `co2e_per_chatbot_session_g`

`(avg_chatbot_turns x llm_kwh_per_turn + customer_device_kwh_per_session + text_network_kwh_per_session) x grid_factor x 1000`

#### `co2e_per_chatbot_resolution_g`

`total_chatbot_co2e / chatbot_resolved_sessions`

#### `co2e_added_by_failed_chatbot_sessions_kg`

`chatbot_escalated_sessions x chatbot_session_kwh x grid_factor`

#### `co2e_avoided_by_call_deflection_kg`

`chatbot_deflected_calls x (call_case_kwh - chatbot_session_kwh) x grid_factor`

#### `co2e_avoided_by_email_deflection_kg`

`chatbot_deflected_emails x (email_case_kwh - chatbot_session_kwh) x grid_factor`

### Voice bot CO2 KPIs

#### `co2e_per_voice_bot_session_g`

`(voice_duration_network_kwh + asr_tts_kwh + optional_llm_kwh) x grid_factor x 1000`

#### `co2e_added_by_voice_to_agent_handover_kg`

`voice_bot_transferred_sessions x (voice_bot_session_kwh + human_call_kwh) x grid_factor`

#### `co2e_from_retry_loops_kg`

`retry_loop_minutes x (voice_network_kwh + asr_tts_kwh_per_min) x grid_factor`

#### `co2e_avoided_by_voice_bot_resolution_kg`

`voice_bot_resolved_sessions x (human_call_kwh - voice_bot_session_kwh) x grid_factor`

### Agent base CO2 KPIs

#### `co2e_per_agent_kg`

`total_estimated_co2e_kg / active_agent_count`

#### `co2e_per_productive_hour_g`

`total_estimated_co2e_kg x 1000 / productive_hours`

#### `channel_co2e_per_agent_kg`

`channel_estimated_co2e_kg / active_agent_count`

### Contact driver CO2 KPIs

#### `co2e_by_contact_driver_kg`

`sum(estimated_co2e for cases/interactions in one contact driver)`

#### `co2e_per_driver_case_g`

`co2e_by_contact_driver_kg x 1000 / resolved_cases_in_driver`

#### `avoidable_co2e_by_preventable_driver_kg`

`sum(estimated_co2e where is_preventable = true)`

## 5. Suggested dashboard metric groups

### Executive

- `contacts_total`
- `resolved_cases_total`
- `fcr`
- `aht`
- `reopen_rate`
- `bot_containment_rate`
- `total_estimated_co2e_kg`
- `co2e_per_resolution_g`
- `avoided_co2e_vs_baseline_kg`

### Call center

- `inbound_calls`
- `abandon_rate`
- `avg_queue_time_min`
- `avg_handle_time_min`
- `transfer_rate`
- `callback_success_rate`
- `co2e_per_call_g`
- `co2e_from_queue_time_kg`
- `co2e_from_callback_retries_kg`

### Email operations

- `emails_received`
- `emails_sent`
- `reopen_rate`
- `attachment_rate`
- `avg_email_handling_time_min`
- `co2e_per_email_g`
- `co2e_from_attachment_transmission_kg`
- `co2e_from_attachment_storage_kg`
- `co2e_from_reopened_email_cases_kg`

### Automation

- `chatbot_sessions`
- `bot_containment_rate`
- `voice_bot_sessions`
- `voice_bot_containment_rate`
- `co2e_per_chatbot_session_g`
- `co2e_per_voice_bot_session_g`
- `co2e_avoided_by_call_deflection_kg`
- `co2e_avoided_by_voice_bot_resolution_kg`

### Workforce

- `active_agent_count`
- `occupancy_rate`
- `contacts_per_agent`
- `cases_per_agent`
- `co2e_per_agent_kg`
- `co2e_per_productive_hour_g`

### Root cause

- `contact_driver`
- `contact_driver_group`
- `preventable_contact_rate`
- `co2e_by_contact_driver_kg`
- `co2e_per_driver_case_g`
- `avoidable_co2e_by_preventable_driver_kg`

## 6. Baseline fields

Add baseline fields for comparison:

| Field | Example |
|---|---:|
| `baseline_period` | `2026-01` |
| `baseline_aht_min` | `7.1` |
| `baseline_reopen_rate` | `0.16` |
| `baseline_bot_containment_rate` | `0.27` |
| `baseline_co2e_per_call_g` | `5.3` |
| `baseline_co2e_per_email_g` | `0.31` |
| `baseline_total_co2e_kg` | `1840` |

Then derive:

- `delta_vs_baseline`
- `percent_change_vs_baseline`
- `avoided_co2e_vs_baseline`

## 7. Data model recommendation

Use a star-schema style model:

### Fact table

`fact_service_metrics`

Key columns:

- `date`
- `team`
- `queue`
- `country`
- `channel`
- `issue_type`
- `bot_version`

Measure columns:

- all raw inputs
- all derived operational KPIs
- all derived CO2 KPIs

### Dimension tables

- `dim_channel`
- `dim_team`
- `dim_country`
- `dim_issue_type`
- `dim_bot_version`
- `dim_assumptions`

`dim_assumptions` should version all configurable factors so calculations are auditable over time.

## 8. MVP minimum schema

If you want the smallest viable version, start with:

### Raw fields

- `date`
- `channel`
- `contacts`
- `resolved_cases`
- `avg_handle_time_min`
- `avg_queue_time_min`
- `reopened_cases`
- `attachments_sent`
- `avg_attachment_size_gb`
- `chatbot_sessions`
- `chatbot_resolved_sessions`
- `voice_bot_sessions`
- `voice_bot_resolved_sessions`
- `grid_factor_kg_per_kwh`

### Derived fields

- `fcr`
- `reopen_rate`
- `bot_containment_rate`
- `voice_bot_containment_rate`
- `co2e_per_call_g`
- `co2e_per_email_g`
- `co2e_per_chatbot_session_g`
- `co2e_per_voice_bot_session_g`
- `total_estimated_co2e_kg`
- `avoided_co2e_vs_baseline_kg`
