# Canonical Schema v0.1

## Purpose

This schema defines the first canonical data model for customer service sustainability measurement.

It is designed for:

- open-source adapters
- normalized event ingestion
- aggregated KPI ingestion
- operational KPI calculation
- CO2 impact calculation

## Schema principles

- `stable ids`
- `channel-specific extensions`
- `required core fields`
- `optional detail fields`
- `versioned assumptions`
- `forward-compatible enums`

## Naming rules

- field names use `snake_case`
- timestamps use ISO 8601 UTC strings
- durations use integer `_seconds`
- energy uses `kwh`
- emissions use `kg_co2e` or `g_co2e`
- boolean fields start with `is_`, `has_`, or explicit true/false meaning

## Common scalar types

| Type | Description | Example |
|---|---|---|
| `id` | stable string identifier | `case_123` |
| `timestamp` | ISO 8601 UTC | `2026-04-15T18:30:00Z` |
| `date` | ISO 8601 date | `2026-04-15` |
| `integer` | whole number | `42` |
| `number` | decimal number | `0.363` |
| `boolean` | true/false | `true` |
| `string` | text value | `billing` |
| `enum` | fixed value set | `email` |

## Enums

### `channel`

- `call`
- `email`
- `chat_human`
- `chatbot`
- `voice_bot`
- `self_service`
- `social`
- `sms`
- `messaging`
- `portal`
- `other`

### `direction`

- `inbound`
- `outbound`
- `internal`

### `status`

- `open`
- `pending`
- `resolved`
- `closed`
- `cancelled`

### `network_type`

- `fixed`
- `mobile`
- `unknown`

### `device_type`

- `smartphone`
- `laptop`
- `desktop`
- `tablet`
- `unknown`

### `bot_type`

- `rule_based`
- `llm`
- `hybrid`

### `handover_target`

- `human_agent`
- `email`
- `call`
- `voice_bot`
- `self_service`
- `none`

### `activity_type`

- `case_research`
- `documentation`
- `after_call_work`
- `quality_review`
- `translation`
- `knowledge_lookup`
- `manual_followup`
- `agent_assist_review`
- `other`

### `failed_reason`

- `no_answer`
- `busy`
- `voicemail`
- `wrong_number`
- `technical_failure`
- `customer_unavailable`
- `unknown`

## Entity overview

Core entities in v0.1:

- `organization`
- `assumption_set`
- `case`
- `interaction`
- `call_interaction`
- `email_interaction`
- `chat_session`
- `bot_session`
- `voice_bot_session`
- `attachment`
- `callback`
- `transfer`
- `escalation`
- `agent_activity`
- `agent_base`
- `knowledge_usage`
- `contact_driver`
- `case_driver_link`
- `aggregated_metrics`

## 1. Organization

### Required fields

| Field | Type |
|---|---|
| `organization_id` | `id` |
| `name` | `string` |
| `country` | `string` |
| `timezone` | `string` |

### Optional fields

| Field | Type |
|---|---|
| `default_grid_factor_kg_per_kwh` | `number` |
| `default_language` | `string` |
| `industry` | `string` |

### Example

```json
{
  "organization_id": "org_demo",
  "name": "Demo Support GmbH",
  "country": "DE",
  "timezone": "Europe/Berlin",
  "default_grid_factor_kg_per_kwh": 0.363,
  "default_language": "de"
}
```

## 2. AssumptionSet

### Required fields

| Field | Type |
|---|---|
| `assumption_set_id` | `id` |
| `effective_from` | `date` |
| `grid_factor_kg_per_kwh` | `number` |
| `fixed_network_kwh_per_gb` | `number` |
| `mobile_network_kwh_per_gb` | `number` |
| `llm_kwh_per_turn` | `number` |
| `voice_traffic_gb_per_min` | `number` |

### Optional fields

| Field | Type |
|---|---|
| `agent_laptop_power_w` | `number` |
| `agent_desktop_power_w` | `number` |
| `customer_smartphone_power_w` | `number` |
| `customer_laptop_power_w` | `number` |
| `storage_kwh_per_gb_month` | `number` |
| `confidence_level` | `string` |
| `source_reference` | `string` |

## 3. Case

### Required fields

| Field | Type |
|---|---|
| `case_id` | `id` |
| `organization_id` | `id` |
| `created_at` | `timestamp` |
| `status` | `status` |
| `channel_origin` | `channel` |

### Optional fields

| Field | Type |
|---|---|
| `external_case_id` | `string` |
| `closed_at` | `timestamp` |
| `issue_type` | `string` |
| `priority` | `string` |
| `customer_segment` | `string` |
| `team_id` | `string` |
| `queue_id` | `string` |
| `market` | `string` |
| `language` | `string` |
| `first_contact_resolved` | `boolean` |
| `is_reopened` | `boolean` |
| `is_escalated` | `boolean` |
| `is_transferred` | `boolean` |
| `is_duplicate_case` | `boolean` |
| `is_automation_assisted` | `boolean` |
| `is_bot_resolved` | `boolean` |
| `is_voice_bot_resolved` | `boolean` |

## 4. Interaction

Base entity for all interaction records.

### Required fields

| Field | Type |
|---|---|
| `interaction_id` | `id` |
| `organization_id` | `id` |
| `case_id` | `id` |
| `channel` | `channel` |
| `direction` | `direction` |
| `started_at` | `timestamp` |

### Optional fields

| Field | Type |
|---|---|
| `external_interaction_id` | `string` |
| `ended_at` | `timestamp` |
| `duration_seconds` | `integer` |
| `customer_id` | `string` |
| `agent_id` | `string` |
| `team_id` | `string` |
| `queue_id` | `string` |
| `resolved` | `boolean` |
| `handover_occurred` | `boolean` |
| `repeat_contact` | `boolean` |

## 5. CallInteraction

### Required fields

| Field | Type |
|---|---|
| `interaction_id` | `id` |
| `channel` | fixed `call` |
| `started_at` | `timestamp` |
| `talk_time_seconds` | `integer` |

### Optional fields

| Field | Type |
|---|---|
| `ended_at` | `timestamp` |
| `duration_seconds` | `integer` |
| `queue_time_seconds` | `integer` |
| `hold_time_seconds` | `integer` |
| `after_call_work_seconds` | `integer` |
| `abandoned` | `boolean` |
| `callback_requested` | `boolean` |
| `callback_scheduled` | `boolean` |
| `callback_attempt_number` | `integer` |
| `callback_success` | `boolean` |
| `voicemail_left` | `boolean` |
| `transfer_count` | `integer` |
| `conference_call` | `boolean` |
| `auth_time_seconds` | `integer` |
| `customer_network_type` | `network_type` |
| `customer_device_type` | `device_type` |

### Example

```json
{
  "interaction_id": "call_1001",
  "organization_id": "org_demo",
  "case_id": "case_1001",
  "channel": "call",
  "direction": "inbound",
  "started_at": "2026-04-15T09:01:00Z",
  "ended_at": "2026-04-15T09:08:12Z",
  "duration_seconds": 432,
  "talk_time_seconds": 300,
  "queue_time_seconds": 72,
  "hold_time_seconds": 30,
  "after_call_work_seconds": 90,
  "abandoned": false,
  "callback_requested": false,
  "transfer_count": 1,
  "customer_network_type": "mobile",
  "customer_device_type": "smartphone"
}
```

## 6. EmailInteraction

### Required fields

| Field | Type |
|---|---|
| `interaction_id` | `id` |
| `channel` | fixed `email` |
| `started_at` | `timestamp` |
| `agent_handling_seconds` | `integer` |

### Optional fields

| Field | Type |
|---|---|
| `message_count_in_thread` | `integer` |
| `is_reopen_message` | `boolean` |
| `is_duplicate_message` | `boolean` |
| `reply_time_seconds` | `integer` |
| `customer_read_estimate_seconds` | `integer` |
| `cc_count` | `integer` |
| `bcc_count` | `integer` |
| `forward_count` | `integer` |
| `has_attachment` | `boolean` |
| `attachment_count` | `integer` |
| `attachment_total_gb` | `number` |
| `storage_gb` | `number` |
| `retention_months` | `integer` |
| `delivery_failure` | `boolean` |
| `resent` | `boolean` |

### Example

```json
{
  "interaction_id": "email_2001",
  "organization_id": "org_demo",
  "case_id": "case_2001",
  "channel": "email",
  "direction": "inbound",
  "started_at": "2026-04-15T10:15:00Z",
  "agent_handling_seconds": 240,
  "message_count_in_thread": 3,
  "is_reopen_message": true,
  "has_attachment": true,
  "attachment_count": 2,
  "attachment_total_gb": 0.018,
  "storage_gb": 0.018,
  "retention_months": 12
}
```

## 7. ChatSession

### Required fields

| Field | Type |
|---|---|
| `interaction_id` | `id` |
| `channel` | fixed `chat_human` |
| `started_at` | `timestamp` |
| `duration_seconds` | `integer` |

### Optional fields

| Field | Type |
|---|---|
| `message_count` | `integer` |
| `avg_response_time_seconds` | `integer` |
| `agent_handling_seconds` | `integer` |
| `customer_wait_seconds` | `integer` |
| `transfer_count` | `integer` |
| `escalated` | `boolean` |
| `resolved` | `boolean` |
| `attachment_total_gb` | `number` |

## 8. BotSession

### Required fields

| Field | Type |
|---|---|
| `bot_session_id` | `id` |
| `organization_id` | `id` |
| `case_id` | `id` |
| `channel` | `chatbot` or `messaging` |
| `bot_type` | `bot_type` |
| `started_at` | `timestamp` |
| `duration_seconds` | `integer` |
| `turn_count` | `integer` |
| `resolved` | `boolean` |

### Optional fields

| Field | Type |
|---|---|
| `bot_version` | `string` |
| `model_class` | `string` |
| `customer_messages` | `integer` |
| `bot_messages` | `integer` |
| `llm_turn_count` | `integer` |
| `retrieval_requests` | `integer` |
| `tool_calls` | `integer` |
| `attachment_upload_gb` | `number` |
| `authenticated` | `boolean` |
| `escalated_to_human` | `boolean` |
| `handover_target` | `handover_target` |
| `repeat_bot_session` | `boolean` |
| `drop_off` | `boolean` |
| `deflected_channel` | `channel` |

### Example

```json
{
  "bot_session_id": "bot_3001",
  "organization_id": "org_demo",
  "case_id": "case_3001",
  "channel": "chatbot",
  "bot_type": "llm",
  "bot_version": "v1.2",
  "model_class": "gpt-4o-like",
  "started_at": "2026-04-15T11:00:00Z",
  "duration_seconds": 210,
  "turn_count": 6,
  "llm_turn_count": 6,
  "retrieval_requests": 2,
  "resolved": true,
  "escalated_to_human": false,
  "deflected_channel": "call"
}
```

## 9. VoiceBotSession

### Required fields

| Field | Type |
|---|---|
| `voice_bot_session_id` | `id` |
| `organization_id` | `id` |
| `case_id` | `id` |
| `started_at` | `timestamp` |
| `duration_seconds` | `integer` |
| `resolved` | `boolean` |

### Optional fields

| Field | Type |
|---|---|
| `asr_seconds` | `integer` |
| `tts_seconds` | `integer` |
| `ivr_path_depth` | `integer` |
| `retry_loop_count` | `integer` |
| `intent_recognition_failure` | `boolean` |
| `authentication_attempts` | `integer` |
| `authentication_failure` | `boolean` |
| `transferred_to_agent` | `boolean` |
| `callback_scheduled` | `boolean` |
| `llm_enabled` | `boolean` |
| `llm_turn_count` | `integer` |

## 10. Attachment

### Required fields

| Field | Type |
|---|---|
| `attachment_id` | `id` |
| `case_id` | `id` |
| `channel` | `channel` |
| `size_gb` | `number` |

### Optional fields

| Field | Type |
|---|---|
| `interaction_id` | `id` |
| `file_type` | `string` |
| `uploaded_at` | `timestamp` |
| `download_count` | `integer` |
| `stored_months` | `integer` |

## 11. Callback

### Required fields

| Field | Type |
|---|---|
| `callback_id` | `id` |
| `case_id` | `id` |
| `requested_at` | `timestamp` |

### Optional fields

| Field | Type |
|---|---|
| `scheduled_at` | `timestamp` |
| `attempt_count` | `integer` |
| `successful` | `boolean` |
| `failed_reason` | `failed_reason` |
| `total_callback_seconds` | `integer` |
| `followup_required` | `boolean` |

## 12. Transfer

### Required fields

| Field | Type |
|---|---|
| `transfer_id` | `id` |
| `case_id` | `id` |
| `from_team` | `string` |
| `to_team` | `string` |

### Optional fields

| Field | Type |
|---|---|
| `interaction_id` | `id` |
| `reason` | `string` |
| `warm_transfer` | `boolean` |
| `handover_seconds` | `integer` |

## 13. Escalation

### Required fields

| Field | Type |
|---|---|
| `escalation_id` | `id` |
| `case_id` | `id` |
| `level_from` | `string` |
| `level_to` | `string` |
| `created_at` | `timestamp` |

### Optional fields

| Field | Type |
|---|---|
| `reason` | `string` |
| `resolved_at` | `timestamp` |

## 14. AgentActivity

### Required fields

| Field | Type |
|---|---|
| `activity_id` | `id` |
| `agent_id` | `string` |
| `activity_type` | `activity_type` |
| `duration_seconds` | `integer` |

### Optional fields

| Field | Type |
|---|---|
| `case_id` | `id` |
| `interaction_id` | `id` |
| `system_count` | `integer` |
| `ai_assist_used` | `boolean` |
| `notes_created` | `integer` |

## 15. KnowledgeUsage

### Required fields

| Field | Type |
|---|---|
| `knowledge_usage_id` | `id` |
| `source_type` | `string` |

### Optional fields

| Field | Type |
|---|---|
| `case_id` | `id` |
| `session_id` | `id` |
| `search_count` | `integer` |
| `article_views` | `integer` |
| `article_resolved` | `boolean` |
| `failed_search` | `boolean` |
| `escalated_after_search` | `boolean` |

## 16. AgentBase

Tracks workforce context behind service demand.

### Required fields

| Field | Type |
|---|---|
| `agent_base_id` | `id` |
| `organization_id` | `id` |
| `period_start` | `date` |
| `period_end` | `date` |
| `channel` | `channel` |

### Optional fields

| Field | Type |
|---|---|
| `team_id` | `string` |
| `queue_id` | `string` |
| `agent_count` | `integer` |
| `active_agent_count` | `integer` |
| `scheduled_hours` | `number` |
| `productive_hours` | `number` |
| `occupancy_rate` | `number` |
| `shrinkage_rate` | `number` |
| `avg_system_count` | `integer` |
| `device_type` | `device_type` |
| `work_mode` | `string` |

## 17. ContactDriver

Represents the business reason behind a contact.

### Required fields

| Field | Type |
|---|---|
| `contact_driver_id` | `id` |
| `organization_id` | `id` |
| `driver_code` | `string` |
| `driver_name` | `string` |

### Optional fields

| Field | Type |
|---|---|
| `driver_group` | `string` |
| `driver_group_level_1` | `string` |
| `driver_group_level_2` | `string` |
| `channel` | `channel` |
| `issue_type` | `string` |
| `journey_stage` | `string` |
| `is_preventable` | `boolean` |
| `is_policy_driven` | `boolean` |
| `is_process_driven` | `boolean` |
| `is_product_driven` | `boolean` |
| `is_information_gap` | `boolean` |

## 18. CaseDriverLink

Links one case or interaction to a contact driver.

### Required fields

| Field | Type |
|---|---|
| `case_driver_link_id` | `id` |
| `contact_driver_id` | `id` |

### Optional fields

| Field | Type |
|---|---|
| `case_id` | `id` |
| `interaction_id` | `id` |
| `driver_confidence` | `string` |
| `primary_driver` | `boolean` |
| `assigned_by` | `string` |

## 19. AggregatedMetrics

Supports low-friction ingestion when event-level data is not available.

### Required fields

| Field | Type |
|---|---|
| `record_id` | `id` |
| `organization_id` | `id` |
| `period_start` | `date` |
| `period_end` | `date` |
| `channel` | `channel` |

### Optional fields

| Field | Type |
|---|---|
| `team_id` | `string` |
| `queue_id` | `string` |
| `market` | `string` |
| `country` | `string` |
| `contacts` | `integer` |
| `resolved_cases` | `integer` |
| `avg_handle_time_seconds` | `integer` |
| `avg_queue_time_seconds` | `integer` |
| `avg_hold_time_seconds` | `integer` |
| `reopened_cases` | `integer` |
| `attachments_sent` | `integer` |
| `attachment_total_gb` | `number` |
| `bot_resolved_sessions` | `integer` |
| `bot_escalated_sessions` | `integer` |
| `voice_bot_resolved_sessions` | `integer` |
| `callback_retry_attempts` | `integer` |

### Example

```json
{
  "record_id": "agg_2026_04_email_team_a",
  "organization_id": "org_demo",
  "period_start": "2026-04-01",
  "period_end": "2026-04-30",
  "channel": "email",
  "team_id": "team_a",
  "contacts": 420000,
  "resolved_cases": 310000,
  "reopened_cases": 42000,
  "attachments_sent": 86000,
  "attachment_total_gb": 860.0
}
```

## Example root-cause records

```json
{
  "contact_driver_id": "drv_billing_invoice_missing",
  "organization_id": "org_demo",
  "driver_code": "BILL_01",
  "driver_name": "Invoice not received",
  "driver_group": "billing",
  "driver_group_level_1": "billing",
  "driver_group_level_2": "documents",
  "is_preventable": true,
  "is_process_driven": true,
  "is_information_gap": true
}
```

```json
{
  "case_driver_link_id": "cdl_1001",
  "case_id": "case_1001",
  "contact_driver_id": "drv_billing_invoice_missing",
  "driver_confidence": "high",
  "primary_driver": true,
  "assigned_by": "agent_tagging"
}
```

## Validation rules

### Core

- every record must have a stable primary id
- every child entity referencing `case_id` must reference an existing case in event mode
- `ended_at` must be greater than or equal to `started_at`
- duration fields must be `>= 0`
- storage, size, energy, and emission fields must be `>= 0`

### Channel rules

- `call_interaction.channel` must equal `call`
- `email_interaction.channel` must equal `email`
- `chat_session.channel` must equal `chat_human`
- `bot_session.channel` must equal `chatbot` or `messaging`

### Soft rules

- `talk_time_seconds` should be less than or equal to `duration_seconds` when both exist
- `queue_time_seconds + hold_time_seconds + talk_time_seconds` may exceed `duration_seconds` only if source semantics differ
- `attachment_total_gb` should be `> 0` when `has_attachment=true`

## Versioning rules

- schema versions use `vMAJOR.MINOR`
- `v0.x` allows additive changes and field renames with migration notes
- once adapters exist in the wild, breaking changes require a new major version

## Recommended next artifacts

- `canonical-schema-v0.1.json`
- `typescript-types-v0.1.ts`
- `sample-dataset-v0.1.json`
- `adapter-mapping-guide.md`
