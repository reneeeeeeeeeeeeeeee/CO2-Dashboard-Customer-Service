# Data Requirements by Channel

## Purpose

This document defines which data is needed to calculate operational and CO2 metrics by channel.

It separates:

- `required fields`
- `recommended fields`
- `optional fields`
- `assumption-based fallback fields`

The goal is to make adoption practical for companies using different source systems.

## General rule

The more event-level operational data is available, the better the CO2 calculations.

If required fields are missing:

- the metric cannot be calculated reliably
- or it must be downgraded to lower confidence

## Reporting modes

Each channel supports two reporting modes:

- `event-level`
- `aggregated`

Event-level is preferred.
Aggregated mode is acceptable for pilots and CSV-based adoption.

## 1. Calls

## Required fields

These are the minimum fields for meaningful call KPIs and baseline CO2 estimates.

| Field | Why needed |
|---|---|
| `interaction_id` | unique record tracking |
| `case_id` or equivalent grouping id | connect call to case where possible |
| `started_at` | timing and period assignment |
| `talk_time_seconds` | core handling duration |

## Recommended fields

These significantly improve the quality of call-related CO2 metrics.

| Field | Why needed |
|---|---|
| `queue_time_seconds` | queue-time impact |
| `hold_time_seconds` | hold inefficiency impact |
| `after_call_work_seconds` | agent-side handling impact |
| `abandoned` | abandon rate and repeat-contact modeling |
| `transfer_count` | duplicate handling and inefficiency |
| `callback_requested` | callback workflow modeling |
| `callback_attempt_number` | retry modeling |
| `callback_success` | failed callback impact |
| `customer_network_type` | fixed vs mobile network assumptions |
| `customer_device_type` | customer device energy assumptions |

## Optional fields

| Field | Why useful |
|---|---|
| `auth_time_seconds` | authentication overhead |
| `conference_call` | multi-agent resource impact |
| `voicemail_left` | failed contact tracking |
| `agent_id` | agent-level reporting |
| `team_id` / `queue_id` | operational slicing |

## Aggregated fallback fields

If event-level data is unavailable, use:

| Field | Example |
|---|---:|
| `contacts` | `120000` |
| `resolved_cases` | `102500` |
| `avg_handle_time_seconds` | `372` |
| `avg_queue_time_seconds` | `84` |
| `avg_hold_time_seconds` | `42` |
| `callback_retry_attempts` | `2800` |

## Metrics enabled

### With required fields only

- basic call volume
- basic call duration
- coarse `co2e_per_call`

### With recommended fields

- `co2e_from_queue_time`
- `co2e_from_hold_time`
- `co2e_from_callback_retries`
- `co2e_avoided_by_aht_reduction`
- transfer inefficiency modeling

## Confidence guidance

- required only: `low to medium`
- required + recommended: `medium to high`

## 2. Emails

## Required fields

| Field | Why needed |
|---|---|
| `interaction_id` | unique tracking |
| `case_id` | thread/case grouping |
| `started_at` | period assignment |
| `agent_handling_seconds` | main handling energy driver |

## Recommended fields

| Field | Why needed |
|---|---|
| `message_count_in_thread` | thread complexity |
| `is_reopen_message` | reopen impact |
| `has_attachment` | transmission impact |
| `attachment_total_gb` | attachment transmission and storage impact |
| `storage_gb` | storage impact |
| `retention_months` | storage duration |
| `customer_read_estimate_seconds` | customer-side interaction footprint |
| `reply_time_seconds` | service reporting |

## Optional fields

| Field | Why useful |
|---|---|
| `attachment_count` | richer attachment analytics |
| `cc_count` / `bcc_count` | multi-recipient impact |
| `forward_count` | duplicate internal handling |
| `delivery_failure` | resend modeling |
| `resent` | extra transmission |
| `is_duplicate_message` | duplicate contact analysis |

## Aggregated fallback fields

| Field | Example |
|---|---:|
| `contacts` | `420000` |
| `resolved_cases` | `310000` |
| `reopened_cases` | `42000` |
| `attachments_sent` | `86000` |
| `attachment_total_gb` | `860` |

## Metrics enabled

### With required fields only

- basic `co2e_per_email`
- email handling time impact

### With recommended fields

- `co2e_from_reopened_email_cases`
- `co2e_from_attachment_transmission`
- `co2e_from_attachment_storage`
- `co2e_avoided_by_lower_email_volume`

## Confidence guidance

- required only: `low to medium`
- required + recommended: `medium`
- with attachment and storage detail: `medium to high`

## 3. Human chat

## Required fields

| Field | Why needed |
|---|---|
| `interaction_id` | unique tracking |
| `case_id` | case link |
| `started_at` | period assignment |
| `duration_seconds` | session duration |

## Recommended fields

| Field | Why needed |
|---|---|
| `message_count` | session complexity |
| `agent_handling_seconds` | agent-side effort |
| `customer_wait_seconds` | wait inefficiency |
| `transfer_count` | duplicate handling |
| `resolved` | operational KPI |

## Optional fields

| Field | Why useful |
|---|---|
| `attachment_total_gb` | file sharing impact |
| `avg_response_time_seconds` | service reporting |
| `escalated` | handover analysis |

## Aggregated fallback fields

Use if available:

| Field | Example |
|---|---:|
| `contacts` | `90000` |
| `resolved_cases` | `62000` |
| `avg_handle_time_seconds` | `540` |

## Metrics enabled

- `co2e_per_chat_session`
- wait and transfer inefficiency estimates

## 4. Chatbots

## Required fields

| Field | Why needed |
|---|---|
| `bot_session_id` | unique tracking |
| `case_id` | link to service issue |
| `started_at` | period assignment |
| `duration_seconds` | session duration |
| `turn_count` | bot session intensity |
| `resolved` | containment and resolution |

## Recommended fields

| Field | Why needed |
|---|---|
| `bot_type` | rule-based vs LLM modeling |
| `llm_turn_count` | direct LLM energy estimation |
| `escalated_to_human` | failed session impact |
| `deflected_channel` | avoided channel impact |
| `repeat_bot_session` | failed self-service loop |
| `retrieval_requests` | richer AI session modeling |
| `model_class` | assumption tuning |

## Optional fields

| Field | Why useful |
|---|---|
| `authenticated` | auth flow tracking |
| `drop_off` | unsuccessful session tracking |
| `tool_calls` | advanced AI analytics |
| `attachment_upload_gb` | richer payload impact |
| `customer_messages` / `bot_messages` | conversational analysis |

## Aggregated fallback fields

| Field | Example |
|---|---:|
| `contacts` | `300000` |
| `bot_resolved_sessions` | `126000` |
| `bot_escalated_sessions` | `138000` |

## Metrics enabled

### With required fields only

- `bot_containment_rate`
- basic `co2e_per_chatbot_session`

### With recommended fields

- `co2e_added_by_failed_chatbot_sessions`
- `co2e_avoided_by_call_deflection`
- `co2e_avoided_by_email_deflection`

## Confidence guidance

- without `llm_turn_count`: `medium`
- with `llm_turn_count` and `deflected_channel`: `medium to high`

## 5. Voice bots

## Required fields

| Field | Why needed |
|---|---|
| `voice_bot_session_id` | unique tracking |
| `case_id` | issue link |
| `started_at` | period assignment |
| `duration_seconds` | session length |
| `resolved` | containment logic |

## Recommended fields

| Field | Why needed |
|---|---|
| `retry_loop_count` | retry inefficiency |
| `transferred_to_agent` | handover impact |
| `llm_turn_count` | generative voice modeling |
| `asr_seconds` | speech recognition compute |
| `tts_seconds` | speech synthesis compute |
| `authentication_attempts` | identity flow overhead |
| `intent_recognition_failure` | quality impact |

## Optional fields

| Field | Why useful |
|---|---|
| `callback_scheduled` | callback flow modeling |
| `ivr_path_depth` | navigation complexity |
| `authentication_failure` | repeat or drop-off analysis |

## Aggregated fallback fields

| Field | Example |
|---|---:|
| `contacts` | `95000` |
| `voice_bot_resolved_sessions` | `36000` |

## Metrics enabled

### With required fields only

- basic `co2e_per_voice_bot_session`
- containment rate

### With recommended fields

- `co2e_from_retry_loops`
- `co2e_added_by_voice_to_agent_handover`
- `co2e_avoided_by_voice_bot_resolution`

## Confidence guidance

- required only: `low to medium`
- required + recommended: `medium`

## 6. Attachments and storage

Attachments are not a separate channel, but they are important enough to define explicitly.

## Required fields

| Field | Why needed |
|---|---|
| `attachment_id` | unique tracking |
| `case_id` | case link |
| `channel` | context |
| `size_gb` | transmission and storage impact |

## Recommended fields

| Field | Why needed |
|---|---|
| `interaction_id` | interaction link |
| `stored_months` | retention impact |
| `download_count` | repeated transmission |
| `file_type` | optional reporting |

## Metrics enabled

- attachment transmission CO2
- attachment storage CO2
- high-volume file workflow impact

## 7. Knowledge and self-service

These fields help model avoided contact and digital self-resolution.

## Required fields

| Field | Why needed |
|---|---|
| `knowledge_usage_id` | unique tracking |
| `source_type` | source classification |

## Recommended fields

| Field | Why needed |
|---|---|
| `search_count` | search effort |
| `article_views` | self-service usage |
| `article_resolved` | avoided contact proxy |
| `failed_search` | failed self-service |
| `escalated_after_search` | self-service breakdown |

## Metrics enabled

- self-service success proxy
- avoided contact estimates
- failed knowledge journey tracking

## 8. Assumptions required per deployment

Some data will almost always come from assumptions rather than source systems.

At minimum define:

| Field | Why needed |
|---|---|
| `grid_factor_kg_per_kwh` | CO2 conversion |
| `fixed_network_kwh_per_gb` | network energy |
| `mobile_network_kwh_per_gb` | network energy |
| `llm_kwh_per_turn` | chatbot and voice bot modeling |
| `voice_traffic_gb_per_min` | voice transport modeling |
| `agent_laptop_power_w` | agent-side energy |
| `agent_desktop_power_w` | agent-side energy |
| `customer_smartphone_power_w` | customer-side energy |
| `customer_laptop_power_w` | customer-side energy |

Optional but useful:

| Field | Why needed |
|---|---|
| `storage_kwh_per_gb_month` | attachment and mailbox storage |

## 9. Minimum viable company input pack

If a company wants to start quickly, the minimum practical input pack is:

### Calls

- monthly `contacts`
- monthly `resolved_cases`
- `avg_handle_time_seconds`
- `avg_queue_time_seconds`

### Emails

- monthly `contacts`
- monthly `resolved_cases`
- `reopened_cases`
- `attachments_sent`
- `attachment_total_gb`

### Chatbot

- `contacts`
- `bot_resolved_sessions`
- `bot_escalated_sessions`
- `avg_turn_count` if available

### Shared assumptions

- `grid factor`
- `agent device default`
- `network default`
- `llm default`

## 10. Data quality grading

Recommended grading:

### Grade A

- event-level data
- most recommended fields present
- assumptions documented

### Grade B

- mixed event-level and aggregated data
- some recommended fields missing

### Grade C

- aggregated-only reporting
- several fallback assumptions

### Grade D

- insufficient required fields
- only partial reporting possible

## Recommended next artifacts

- `csv-template-calls.csv`
- `csv-template-emails.csv`
- `csv-template-chatbot.csv`
- `claims-and-disclaimers.md`
