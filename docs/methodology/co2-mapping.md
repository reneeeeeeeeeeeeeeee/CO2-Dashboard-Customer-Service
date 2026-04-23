# CO2 Mapping

## Purpose

This page explains how customer service activity data is translated into estimated CO2 metrics.

The model always follows the same structure:

1. operational activity data
2. energy assumptions
3. CO2 conversion

Core principle:

`CO2e = electricity use (kWh) x electricity carbon factor (kg CO2e / kWh)`

## Mapping Logic

The data model does not store CO2 values directly.
It stores operational facts such as time, traffic, volume, retries, and routing events.

The calculator then derives:

- channel CO2 metrics
- case CO2 metrics
- workforce CO2 metrics
- root-cause CO2 metrics

## Call Metrics

### `co2e_per_call_g`

Uses:

- `resolved_calls`
- `avg_handle_time_min`
- `avg_queue_time_min`
- `avg_hold_time_min`
- `after_call_work_min`
- `customer_network_type`

Assumptions:

- `agent_device_power_w`
- `voice_traffic_gb_per_min`
- `fixed_network_kwh_per_gb`
- `mobile_network_kwh_per_gb`
- `customer_device_power_w`
- `grid_factor_kg_per_kwh`

Meaning:

This metric estimates the digital footprint of one resolved call by combining:

- agent workstation time
- provider-side voice traffic
- optional customer-side device and network usage

### `co2e_from_queue_time_kg`

Uses:

- `resolved_calls`
- `avg_queue_time_min`

Meaning:

This isolates the avoidable waiting share of call-related CO2.

### `co2e_from_hold_time_kg`

Uses:

- `resolved_calls`
- `avg_hold_time_min`

Meaning:

This isolates the hold-related portion of call CO2.

### `co2e_from_callback_retries_kg`

Uses:

- `callback_retry_attempts`
- `callback_retry_minutes`

Meaning:

This estimates repeated callback attempts as extra operational load.

## Email Metrics

### `co2e_per_email_g`

Uses:

- `emails_sent`
- `avg_email_handling_time_min`
- `customer_email_read_time_min`
- `simple_email_size_gb`
- `customer_network_type`

Assumptions:

- `agent_device_power_w`
- `customer_device_power_w`
- `fixed_network_kwh_per_gb`
- `mobile_network_kwh_per_gb`
- `grid_factor_kg_per_kwh`

Meaning:

This estimates one email handling event as a mix of:

- agent time
- transmission volume
- optional customer-side reading activity

### `co2e_from_reopened_email_cases_kg`

Uses:

- `reopened_email_cases`
- `avg_email_handling_time_min`
- `customer_email_read_time_min`

Meaning:

A reopen is modeled as an extra operational handling cycle, not as a fixed grams-per-email shortcut.

### `co2e_from_attachment_transmission_kg`

Uses:

- `attachment_total_gb`

Meaning:

This isolates payload movement from large attachments.

### `co2e_from_attachment_storage_kg`

Uses:

- `email_storage_gb`
- `retention_months`

Meaning:

This estimates retained attachment burden when storage is included in scope.

## Chatbot Metrics

### `co2e_per_chatbot_session_g`

Uses:

- `chatbot_sessions`
- `avg_chatbot_turns`
- `avg_chatbot_session_min`

Assumptions:

- `llm_kwh_per_turn`
- `customer_device_power_w`
- `grid_factor_kg_per_kwh`

Meaning:

This estimates one chatbot session as:

- AI compute per turn
- optional customer device time

### `co2e_added_by_failed_chatbot_sessions_kg`

Uses:

- `chatbot_escalated_sessions`
- `chatbot_abandoned_sessions`

Meaning:

This shows bot operating cost that did not produce a successful resolution.

### `co2e_avoided_by_call_deflection_kg`

Uses:

- `chatbot_deflected_calls`

Meaning:

This compares avoided human calls against chatbot operating load.

### `co2e_avoided_by_email_deflection_kg`

Uses:

- `chatbot_deflected_emails`

Meaning:

This compares avoided email handling against chatbot operating load.

### `net_avoided_co2e_kg`

Meaning:

Avoided human workload minus chatbot footprint.

## Voice Bot Metrics

### `co2e_per_voice_bot_session_g`

Uses:

- `voice_bot_sessions`
- `avg_voice_bot_duration_min`
- `avg_llm_turns_per_voice_session`
- `customer_network_type`

Assumptions:

- `voice_traffic_gb_per_min`
- `fixed_network_kwh_per_gb`
- `mobile_network_kwh_per_gb`
- `customer_device_power_w`
- `llm_kwh_per_turn`
- `grid_factor_kg_per_kwh`

Meaning:

This estimates voice bot usage as network plus compute plus optional customer-side device time.

### `co2e_from_retry_loops_kg`

Uses:

- `voice_retry_loops`
- `retry_penalty_minutes`

Meaning:

This isolates failed automation cycles.

### `co2e_added_by_voice_to_agent_handover_kg`

Uses:

- `voice_bot_transferred_sessions`

Meaning:

This captures the extra burden of a bot journey that still ends in a human call.

### `co2e_avoided_by_voice_bot_resolution_kg`

Uses:

- `voice_bot_resolved_sessions`

Meaning:

This compares resolved voice bot journeys against human-only call handling.

## Case And Workforce Metrics

### `co2e_per_resolution_g`

Uses:

- total estimated CO2 across active channels
- total resolved cases across active channels

Meaning:

This is the blended CO2 intensity of one resolved case.

### `co2e_from_repeat_contacts_kg`

Uses:

- `repeat_contact_rate`
- `resolved_cases_total`

Meaning:

This translates repeat demand into an avoidable CO2 layer.

### `co2e_per_agent_kg`

Uses:

- total estimated CO2
- `active_agent_count`

Meaning:

This expresses staffing intensity of service operations.

### `co2e_per_productive_hour_g`

Uses:

- total estimated CO2
- `productive_hours`

Meaning:

This gives a normalized workforce productivity CO2 intensity view.

## Root-Cause Metrics

### `co2e_from_preventable_drivers_kg`

Uses:

- contact volume by driver group
- repeat rate by driver group
- preventability flags

Meaning:

This allocates total estimated CO2 into root-cause buckets and sums the preventable share.

### `co2e_per_driver_case_g`

Uses:

- estimated CO2 allocated to one driver
- resolved cases in that driver

Meaning:

This gives a comparable intensity metric by problem type.

## Interpretation

The model should be read as:

- an activity-based estimate
- an operational decision-support layer
- a structured way to compare workflows and inefficiencies

It should not be read as:

- a direct meter reading
- a certified greenhouse gas inventory
- a universal grams-per-email or grams-per-call claim
