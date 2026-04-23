# Adapter Mapping Guide

## Purpose

This guide explains how external systems should map their source data into the canonical schema.

The goal is not to force every source into perfect event-level fidelity.
The goal is to normalize enough operational data so the core engine can calculate:

- standard customer service KPIs
- estimated CO2 KPIs
- avoided CO2 versus baseline

## Mapping principles

### 1. Map semantics, not field names

Do not map a source field because the label looks similar.
Map it because the business meaning matches.

Example:

- `avg_handle_secs`
- `talk_time`
- `conversation_duration`

These are not automatically the same field.

### 2. Prefer raw values over pre-aggregated ratios

Use counts and durations when possible.

Better:

- `resolved_cases = 1200`
- `reopened_cases = 80`

Worse:

- `reopen_rate = 6.7%`

The engine should derive the KPI when possible.

### 3. Preserve source provenance

Each mapped field should retain:

- source system
- source table or endpoint
- source field name
- transformation note

### 4. Separate known values from assumptions

Do not fake missing operational data.

If the source does not provide:

- customer read time
- customer device type
- attachment retention

these should come from assumptions, not from invented source mappings.

## Mapping modes

### Mode A: event-level mapping

Best option.
Map source records into:

- `case`
- `interaction`
- `call_interaction`
- `email_interaction`
- `bot_session`
- `voice_bot_session`

### Mode B: aggregated KPI mapping

Fallback for systems where only reports or exports are available.
Map into:

- `aggregated_metrics`

This is acceptable for MVP and enterprise pilots.

## Required adapter outputs

Each adapter should produce:

1. `mapped records`
2. `mapping manifest`
3. `validation report`
4. `unsupported fields report`

## Mapping manifest format

Recommended fields:

| Field | Meaning |
|---|---|
| `source_system` | e.g. Zendesk |
| `source_entity` | e.g. tickets export |
| `source_field` | e.g. `first_reply_time_in_minutes` |
| `target_entity` | e.g. `email_interaction` |
| `target_field` | e.g. `reply_time_seconds` |
| `transformation` | e.g. `minutes x 60` |
| `confidence` | high / medium / low |
| `notes` | interpretation note |

## General field mapping patterns

### Time

Common source fields:

- `created_at`
- `updated_at`
- `closed_at`
- `opened_at`
- `wait_seconds`
- `handle_secs`

Map to:

- timestamps remain timestamps
- durations should normalize to integer `_seconds`

### Boolean status

Common source fields:

- `solved`
- `resolved`
- `closed`
- `reopened`
- `escalated`

Map to:

- canonical boolean flags only when semantics are clear

### Identifiers

Use:

- source record id as `external_*_id`
- stable generated canonical id as primary id if needed

## Source-specific mapping guidance

## 1. Zendesk

### Typical source objects

- tickets
- ticket metrics
- users
- updates / comments
- macros / automations

### Good fit

Zendesk is strong for:

- cases
- email-like interactions
- chat / messaging depending on setup
- reopen tracking
- SLA and response metrics

### Example mapping

| Zendesk field | Canonical target | Notes |
|---|---|---|
| `ticket.id` | `case.external_case_id` | retain original id |
| `ticket.created_at` | `case.created_at` | direct |
| `ticket.status` | `case.status` | map values |
| `ticket.priority` | `case.priority` | direct |
| `ticket.via.channel` | `case.channel_origin` | map channel enum |
| `ticket_metrics.reopens` | `case.is_reopened` or aggregated reopen count | depends on grain |
| `ticket_metrics.replies` | `email_interaction.message_count_in_thread` | or aggregate |
| `ticket_metrics.first_resolution_time_in_minutes` | derived KPI input | do not confuse with handling time |
| `ticket.comment_count` | `email_interaction.message_count_in_thread` | approximate thread size |
| `ticket.assignee_id` | `interaction.agent_id` | when interaction-level derivable |

### Risks

- ticket metrics are case-level, not always interaction-level
- email versus web form versus chat can be merged depending on setup
- attachment details may require comment or audit APIs

## 2. Salesforce Service Cloud

### Typical source objects

- Case
- EmailMessage
- Task
- LiveChatTranscript
- MessagingSession
- KnowledgeArticle

### Good fit

Salesforce is strong for:

- case model
- email interactions
- live chat
- workflow / escalation
- knowledge usage

### Example mapping

| Salesforce field | Canonical target | Notes |
|---|---|---|
| `Case.Id` | `case.external_case_id` | direct |
| `Case.CreatedDate` | `case.created_at` | direct |
| `Case.ClosedDate` | `case.closed_at` | direct |
| `Case.Status` | `case.status` | map values |
| `Case.Origin` | `case.channel_origin` | map channel |
| `Case.Priority` | `case.priority` | direct |
| `Case.IsClosed` | `case.status=closed/resolved` | interpret carefully |
| `EmailMessage.Id` | `email_interaction.external_interaction_id` | direct |
| `EmailMessage.HasAttachment` | `email_interaction.has_attachment` | direct |
| `LiveChatTranscript.StartTime` | `chat_session.started_at` | direct |
| `LiveChatTranscript.EndTime` | `chat_session.duration_seconds` | derive |
| `KnowledgeArticleVersion` usage logs | `knowledge_usage` | if available |

### Risks

- heavy customization is common
- many useful fields may exist only in custom objects
- handling time may live outside native Case objects

## 3. Genesys Cloud

### Typical source objects

- conversations
- participants
- segments
- queues
- wrap-up codes
- callback data

### Good fit

Genesys is strong for:

- calls
- queues
- hold time
- callbacks
- transfers
- voice bot and IVR metadata

### Example mapping

| Genesys field | Canonical target | Notes |
|---|---|---|
| `conversationId` | `interaction.external_interaction_id` | direct |
| `conversationStart` | `interaction.started_at` | direct |
| `conversationEnd` | `interaction.ended_at` | direct |
| `queueId` | `interaction.queue_id` | direct |
| `tTalk` or segment talk duration | `call_interaction.talk_time_seconds` | direct if available |
| `tHold` | `call_interaction.hold_time_seconds` | direct |
| `tAcw` | `call_interaction.after_call_work_seconds` | direct |
| `callback` participant / segment | `call_interaction.callback_requested` or `callback` entity | depends on source |
| `transfer` segment count | `call_interaction.transfer_count` | direct or derived |
| `abandon` outcome | `call_interaction.abandoned` | direct |

### Risks

- field semantics differ across exports and APIs
- queue time may require segment reconstruction
- voice bot flows may sit in separate products or logs

## 4. Asterisk / 3CX / telephony systems

### Typical source objects

- call detail records
- queue logs
- IVR logs
- callback logs

### Good fit

Strong for:

- raw call timing
- queue timing
- callback attempts
- failed call attempts

### Example mapping

| Telephony field | Canonical target | Notes |
|---|---|---|
| `call_id` | `interaction.external_interaction_id` | direct |
| `start_time` | `interaction.started_at` | direct |
| `answer_time` | queue and answer derivation | may need transformation |
| `end_time` | `interaction.ended_at` | direct |
| `billsec` | `call_interaction.talk_time_seconds` | common mapping |
| `duration` | `interaction.duration_seconds` | common mapping |
| `disposition=NO ANSWER` | callback or failed attempt semantics | interpret carefully |
| `queue_log ENTERQUEUE / CONNECT / ABANDON` | queue and abandon modeling | requires event stitching |

### Risks

- no case id by default
- no customer service resolution status
- often needs CRM join to become analytically valuable

## 5. CSV / Excel exports

### Recommended use

This should be a first-class ingestion path.

Use cases:

- pilot deployments
- historical imports
- unsupported providers
- manual enterprise exports

### Mapping approach

1. upload file
2. detect columns
3. user selects entity type
4. map columns to canonical fields
5. validate
6. store mapping template

### Typical useful CSV shapes

- call center monthly KPI export
- ticket export
- email operations report
- chatbot analytics export
- callback performance report

## Ambiguous fields to handle carefully

These source fields are often misunderstood:

| Source-like field | Why it is risky |
|---|---|
| `resolution_time` | not the same as active handling time |
| `response_time` | can mean first response or any response |
| `duration` | may include wait, hold, or only talk |
| `replies` | may include internal notes or only public replies |
| `contacts` | may mean cases, interactions, or customers |
| `containment` | often defined differently across bot tools |
| `handover` | may mean transfer, escalation, or channel switch |

## Mapping strategy for missing data

### If interaction-level data is missing

Fallback to:

- `aggregated_metrics`

### If customer-side data is missing

Use:

- default assumptions from `assumption_set`

### If attachment storage is missing

Use:

- transmission only
- or mark storage CO2 as unsupported

### If bot inference data is missing

Use:

- session duration
- turn count
- assumed `llm_kwh_per_turn`

## Recommended adapter confidence rules

### High confidence mapping

- direct source field with clear business meaning
- no transformation except type conversion or seconds conversion

### Medium confidence mapping

- derived from 2-3 source fields
- business meaning is mostly clear

### Low confidence mapping

- inferred from reports
- reconstructed from incomplete exports
- depends on assumptions about source semantics

## Example end-to-end mapping

### Case: Genesys call + CRM case join

Source:

- Genesys conversation data
- CRM case export

Canonical output:

- `case`
- `call_interaction`
- `callback`
- `transfer`

Derived capability:

- queue-time CO2
- hold-time CO2
- callback retry CO2
- transfer inefficiency CO2

### Case: Zendesk email support export

Source:

- ticket export
- ticket metrics export
- comments export

Canonical output:

- `case`
- `email_interaction`
- `attachment`
- `aggregated_metrics` for gaps

Derived capability:

- reopen CO2
- attachment transmission CO2
- estimated email handling CO2

### Case: LLM chatbot analytics

Source:

- session logs
- turn counts
- model metadata

Canonical output:

- `bot_session`

Derived capability:

- CO2 per session
- CO2 per resolution
- avoided CO2 by call deflection

## Minimum adapter quality bar

An adapter should not be published as production-ready unless it can:

- map all required fields for at least one canonical entity
- document unsupported metrics
- emit a validation report
- provide a sample dataset
- specify confidence level per mapped metric

## Recommended next artifacts

- `csv-template-calls.csv`
- `csv-template-emails.csv`
- `sample-mapping-manifest.json`
- `connector-sdk-interface.md`
