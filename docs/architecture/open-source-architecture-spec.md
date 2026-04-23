# Open Source Architecture Spec

## Positioning

This project should be an open standard and reference implementation for measuring customer service operations and their estimated CO2 impact.

It should consist of:

- a `canonical data model`
- a `calculation engine`
- an `adapter interface`
- reference `connectors`
- a reference `dashboard app`

The dashboard is not the core.
The core is the model and the measurement logic.

## Product principle

Any organization should be able to:

1. take the open-source code
2. map its own CRM / ERP / telephony / bot systems to the canonical model
3. run the engine
4. get service KPIs and CO2 KPIs

## High-level architecture

### Package 1: `core-model`

Contains:

- schemas
- entity definitions
- enums
- validation rules
- assumption registry schema

### Package 2: `core-engine`

Contains:

- KPI calculations
- CO2 calculations
- baseline logic
- confidence scoring
- aggregation logic

### Package 3: `connectors`

Contains:

- connector SDK
- CSV importer
- JSON importer
- sample provider adapters

### Package 4: `app`

Contains:

- API
- UI
- auth
- setup wizard
- mapping UI
- dashboard

## Repo layout

```text
/packages
  /core-model
  /core-engine
  /connector-sdk
  /connectors
    /csv
    /json-api
    /zendesk
    /salesforce
    /genesys
    /asterisk
  /app
/docs
  /methodology
  /schemas
  /adapters
  /examples
```

## Design principles

- `canonical-first`: all external systems map into one shared model
- `channel-neutral`: same calculation framework across calls, email, chat, bots
- `auditable`: every CO2 result must be traceable to assumptions and source fields
- `configurable`: power, grid, storage, and traffic assumptions are versioned
- `extensible`: new customer service cases can be added without breaking existing adapters

## Canonical data model

The model should support both:

- `event-level ingestion`
- `aggregated KPI ingestion`

Event-level is best.
Aggregated KPI mode is needed for easier adoption.

## Main entities

### 1. `Organization`

Represents one deployment or reporting tenant.

Core fields:

- `organization_id`
- `name`
- `country`
- `timezone`
- `default_grid_factor`
- `default_language`

### 2. `ReportingPeriod`

Defines the time grain used for reporting.

Core fields:

- `period_id`
- `date`
- `week`
- `month`
- `quarter`
- `year`

### 3. `Case`

Represents a customer issue, request, complaint, or service ticket.

Core fields:

- `case_id`
- `external_case_id`
- `created_at`
- `closed_at`
- `status`
- `channel_origin`
- `issue_type`
- `priority`
- `customer_segment`
- `team_id`
- `queue_id`
- `market`
- `language`

Important case-level flags:

- `first_contact_resolved`
- `reopened`
- `escalated`
- `transferred`
- `duplicate_case`
- `automation_assisted`
- `bot_resolved`
- `voice_bot_resolved`

### 4. `Interaction`

Base object for any customer service touchpoint.

Core fields:

- `interaction_id`
- `case_id`
- `external_interaction_id`
- `channel`
- `direction`
- `started_at`
- `ended_at`
- `duration_seconds`
- `customer_id`
- `agent_id`
- `team_id`
- `queue_id`
- `resolved`
- `handover_occurred`
- `repeat_contact`

### 5. `CallInteraction`

Extends `Interaction`.

Fields:

- `call_type`
- `inbound_or_outbound`
- `queue_time_seconds`
- `hold_time_seconds`
- `talk_time_seconds`
- `after_call_work_seconds`
- `abandoned`
- `callback_requested`
- `callback_scheduled`
- `callback_attempt_number`
- `callback_success`
- `voicemail_left`
- `transfer_count`
- `conference_call`
- `auth_time_seconds`
- `customer_network_type`
- `customer_device_type`

### 6. `EmailInteraction`

Extends `Interaction`.

Fields:

- `message_count_in_thread`
- `is_reopen_message`
- `is_duplicate_message`
- `reply_time_seconds`
- `agent_handling_seconds`
- `customer_read_estimate_seconds`
- `cc_count`
- `bcc_count`
- `forward_count`
- `has_attachment`
- `attachment_count`
- `attachment_total_gb`
- `storage_gb`
- `retention_months`
- `delivery_failure`
- `resent`

### 7. `ChatSession`

Human chat session or live messaging session.

Fields:

- `message_count`
- `avg_response_time_seconds`
- `agent_handling_seconds`
- `customer_wait_seconds`
- `transfer_count`
- `escalated`
- `resolved`
- `attachment_total_gb`

### 8. `BotSession`

Generic bot session for web chat, app chat, messenger bot, or assistant.

Fields:

- `bot_session_id`
- `case_id`
- `channel`
- `bot_type`
- `bot_version`
- `model_class`
- `started_at`
- `ended_at`
- `duration_seconds`
- `turn_count`
- `customer_messages`
- `bot_messages`
- `llm_turn_count`
- `retrieval_requests`
- `tool_calls`
- `attachment_upload_gb`
- `authenticated`
- `resolved`
- `escalated_to_human`
- `handover_target`
- `repeat_bot_session`
- `drop_off`
- `deflected_channel`

### 9. `VoiceBotSession`

Specialized automated voice interaction.

Fields:

- `voice_bot_session_id`
- `case_id`
- `started_at`
- `ended_at`
- `duration_seconds`
- `asr_seconds`
- `tts_seconds`
- `ivr_path_depth`
- `retry_loop_count`
- `intent_recognition_failure`
- `authentication_attempts`
- `authentication_failure`
- `resolved`
- `transferred_to_agent`
- `callback_scheduled`
- `llm_enabled`
- `llm_turn_count`

### 10. `Attachment`

Tracks heavy data movement and storage.

Fields:

- `attachment_id`
- `case_id`
- `interaction_id`
- `channel`
- `file_type`
- `size_gb`
- `uploaded_at`
- `download_count`
- `stored_months`

### 11. `Callback`

Separate object for callback workflows.

Fields:

- `callback_id`
- `case_id`
- `requested_at`
- `scheduled_at`
- `attempt_count`
- `successful`
- `failed_reason`
- `total_callback_seconds`
- `followup_required`

### 12. `Transfer`

Tracks routing inefficiency and multi-team handling.

Fields:

- `transfer_id`
- `case_id`
- `interaction_id`
- `from_team`
- `to_team`
- `reason`
- `warm_transfer`
- `handover_seconds`

### 13. `Escalation`

Tracks escalation to another queue, team, or level.

Fields:

- `escalation_id`
- `case_id`
- `level_from`
- `level_to`
- `reason`
- `created_at`
- `resolved_at`

### 14. `AgentActivity`

Tracks agent-side time outside direct interaction.

Fields:

- `activity_id`
- `case_id`
- `interaction_id`
- `agent_id`
- `activity_type`
- `duration_seconds`
- `system_count`
- `ai_assist_used`
- `notes_created`

Example activity types:

- `case_research`
- `documentation`
- `after_call_work`
- `quality_review`
- `translation`
- `knowledge_lookup`
- `manual_followup`

### 14a. `AgentBase`

Tracks staffing and workforce context behind channel load.

Fields:

- `agent_base_id`
- `organization_id`
- `period_start`
- `period_end`
- `team_id`
- `queue_id`
- `channel`
- `agent_count`
- `active_agent_count`
- `scheduled_hours`
- `productive_hours`
- `occupancy_rate`
- `shrinkage_rate`
- `avg_system_count`
- `device_type`
- `work_mode`

This entity supports:

- CO2 per agent
- CO2 per productive hour
- channel staffing efficiency
- identifying whether rising impact is driven by volume or staffing footprint

### 15. `KnowledgeUsage`

Tracks self-service and knowledge base interactions.

Fields:

- `knowledge_usage_id`
- `case_id`
- `session_id`
- `source_type`
- `search_count`
- `article_views`
- `article_resolved`
- `failed_search`
- `escalated_after_search`

### 16. `AssumptionSet`

Versions calculation assumptions.

Fields:

- `assumption_set_id`
- `effective_from`
- `grid_factor_kg_per_kwh`
- `agent_laptop_power_w`
- `agent_desktop_power_w`
- `customer_smartphone_power_w`
- `customer_laptop_power_w`
- `fixed_network_kwh_per_gb`
- `mobile_network_kwh_per_gb`
- `llm_kwh_per_turn`
- `voice_traffic_gb_per_min`
- `storage_kwh_per_gb_month`
- `confidence_level`
- `source_reference`

### 17. `ContactDriver`

Defines the business-side reason why contact happened.

This is intentionally flexible because every company structures contact reasons differently.

Fields:

- `contact_driver_id`
- `organization_id`
- `driver_code`
- `driver_name`
- `driver_group`
- `driver_group_level_1`
- `driver_group_level_2`
- `channel`
- `issue_type`
- `journey_stage`
- `is_preventable`
- `is_policy_driven`
- `is_process_driven`
- `is_product_driven`
- `is_information_gap`

This entity supports:

- root cause analysis
- avoidable contact analysis
- grouping company-specific taxonomies into comparable buckets

### 18. `CaseDriverLink`

Links cases or interactions to one or more contact drivers.

Fields:

- `case_driver_link_id`
- `case_id`
- `interaction_id`
- `contact_driver_id`
- `driver_confidence`
- `primary_driver`
- `assigned_by`

Assigned-by examples:

- `source_system`
- `agent_tagging`
- `analytics_rule`
- `ai_classification`

## Broader customer service cases to support

The model should explicitly support more than classic call center reporting.

### Call center cases

- inbound support calls
- outbound support calls
- callback requests
- callback retries
- failed callback attempts
- abandoned calls
- long queue times
- excessive hold time
- transfer loops
- escalations
- conference calls
- repeat contact within 24h / 7d
- failed authentication
- post-call documentation

### Email support cases

- simple case email
- long reply chain
- reopened ticket thread
- duplicate case emails
- attachment-heavy workflow
- delivery failure and resend
- multi-recipient emails
- internal forwarding
- long retention mailbox storage

### Live chat cases

- live agent chat resolution
- long waiting chats
- transfers between agents
- attachments inside chat
- repeat live chat on same issue

### Chatbot cases

- bot fully resolves issue
- bot partially resolves then hands over
- bot fails and user switches to call
- bot fails and user sends email
- repeated bot session on same case
- long-turn LLM session
- knowledge retrieval heavy session
- bot authentication flow
- multilingual bot
- bot with file upload

### Voice bot cases

- voice bot containment
- IVR navigation without resolution
- recognition retry loops
- failed authentication
- handover after long bot session
- callback scheduled by voice bot
- outbound automated reminder / confirmation
- generative voice bot with ASR + TTS + LLM

### Self-service cases

- FAQ article resolves issue
- failed help-center search
- customer uses portal instead of contacting support
- form-based guided resolution

### Back-office and hybrid cases

- ERP-driven service request
- order status inquiry
- returns and refund handling
- technical support escalation
- claims handling
- billing support
- identity verification workflow
- translation workflow
- AI agent-assist inside human handling

### Workforce and root-cause cases

- overstaffed low-volume channel windows
- understaffed queues creating queue-time inflation
- repeat contacts caused by policy confusion
- repeat contacts caused by product defects
- avoidable billing inquiries
- shipping-status contact spikes
- authentication-heavy contact clusters
- bot failures tied to one contact-driver group
- attachment-heavy cases concentrated in one driver category

## Minimum required fields by channel

### Calls

Required:

- `interaction_id`
- `channel=call`
- `started_at`
- `ended_at` or `duration_seconds`
- `talk_time_seconds`

Recommended:

- `queue_time_seconds`
- `hold_time_seconds`
- `after_call_work_seconds`
- `callback_attempt_number`
- `callback_success`

### Email

Required:

- `interaction_id`
- `channel=email`
- `started_at`
- `agent_handling_seconds`

Recommended:

- `message_count_in_thread`
- `attachment_total_gb`
- `storage_gb`
- `retention_months`
- `is_reopen_message`

### Chatbot

Required:

- `bot_session_id`
- `channel`
- `turn_count`
- `duration_seconds`
- `resolved`

Recommended:

- `llm_turn_count`
- `escalated_to_human`
- `deflected_channel`
- `repeat_bot_session`

### Voice bot

Required:

- `voice_bot_session_id`
- `duration_seconds`
- `resolved`

Recommended:

- `retry_loop_count`
- `transferred_to_agent`
- `llm_turn_count`
- `asr_seconds`
- `tts_seconds`

## Adapter contract

Every connector should implement:

### `extract()`

Pull raw records from source systems.

### `map()`

Map source records into the canonical entities.

### `validate()`

Validate required fields, types, and reference integrity.

### `publish()`

Write normalized records to the engine input store.

### `describe()`

Return metadata:

- supported entities
- supported channels
- required credentials
- sync mode
- known limitations

## Supported ingestion modes

### Mode 1: aggregated KPI import

For simple adoption.
Supports:

- monthly or weekly metrics
- CSV / Excel
- manual exports from CRM / telephony / BI

### Mode 2: normalized event import

For better accuracy.
Supports:

- API sync
- JSON import
- warehouse sync

### Mode 3: streaming events

For advanced deployments.
Supports:

- webhook ingestion
- event bus integration

## Calculation boundaries

The engine should expose distinct outputs:

- `operational_kpis`
- `co2_kpis`
- `avoided_co2_vs_baseline`
- `confidence_scores`

It should not require the dashboard app to perform business logic.

## Confidence model

Each metric should carry a confidence label:

- `high`
- `medium`
- `low`

Example:

- measured `talk_time_seconds`: `high`
- estimated `customer_read_estimate_seconds`: `medium`
- assumed `attachment_storage_kwh_per_gb_month`: `low` or `medium`

## Recommended first reference connectors

- `CSV`
- `JSON API`
- `Zendesk`
- `Salesforce Service Cloud`
- `Genesys Cloud`
- `Asterisk` or `3CX`

## Recommended next document

After this spec, the next practical artifact should be:

- `canonical-schema-v0.1`

That document should define:

- JSON schema or TypeScript types
- required vs optional fields
- enums
- sample records
- migration/versioning rules
