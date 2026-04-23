# Calculator Test Matrix

This matrix focuses on the V2 calculator in [demo-calculator-v2.html](../../demo/demo-calculator-v2.html).
It is written from an operations and customer service validation perspective, not only from a formula-testing perspective.

## Goal

Use this matrix to verify three things:

- each input field affects the intended result
- operationally plausible input combinations produce plausible outputs
- impossible combinations are either rejected or clearly visible as invalid

## Core Principles

- test one field at a time before testing multi-field stories
- test directional behavior, not only exact numbers
- test valid operations separately from intentionally invalid operations
- compare `provider-side` against `provider + customer` for boundary-sensitive fields

## Section Matrix

| Section | Fields | Directional checks | Consistency checks | High-value combinations |
| --- | --- | --- | --- | --- |
| Assumptions | `grid_factor`, `fixed_network`, `mobile_network`, `llm_kwh_per_turn`, `voice_traffic_gb_per_min`, `agent_device_power_w`, `customer_device_power_w`, `storage_kwh_per_gb_month` | Higher energy assumptions should not reduce total CO2e. `llm_kwh_per_turn` should raise chatbot and voice results. `voice_traffic_gb_per_min` should raise call and voice results. `storage_kwh_per_gb_month` should raise email storage impact. | Boundary switch from `provider-side` to `provider + customer` should not reduce call, email, chatbot, or voice totals. | low-energy vs high-energy assumption set; provider-side vs interaction boundary |
| Calls | `call_resolved`, `call_aht_min`, `call_queue_min`, `call_hold_min`, `call_acw_min`, `call_callback_retry_attempts`, `call_callback_retry_min` | More calls or more time should raise call totals. More queue or hold should raise their specific sub-components. More callback retries should raise retry CO2e. | `0` resolved calls with positive callback retries must still calculate without broken summary behavior. | low-volume fast operation; extreme-volume high-friction operation; callback-heavy operation |
| Email | `email_received`, `email_sent`, `email_resolved`, `email_reopened_cases`, `email_handling_min`, `email_customer_read_min`, `email_simple_size_gb`, `email_attachment_total_gb`, `email_storage_gb`, `email_retention_months` | More handling time should raise per-email CO2e. More reopened cases should raise reopen CO2e. More storage, attachment volume, or retention should raise storage CO2e. | `email_reopened_cases <= email_resolved`; ideally `email_resolved <= email_received`. Backlog should stay non-negative. | lean inbox; attachment-heavy backlog; high-storage retention case |
| Chatbot | `chatbot_sessions`, `chatbot_resolved_sessions`, `chatbot_escalated_sessions`, `chatbot_abandoned_sessions`, `chatbot_avg_turns`, `chatbot_session_min`, `chatbot_deflected_calls`, `chatbot_deflected_emails` | More sessions should raise chatbot total. More turns should raise CO2e per session. More resolved sessions should improve containment. More deflected calls or emails should improve avoided CO2e vs baseline. | `resolved + escalated + abandoned <= sessions`; containment must stay `<= 100%`. | high-containment bot; failure-heavy bot; high-volume deflection story |
| Voice Bot | `voice_sessions`, `voice_resolved_sessions`, `voice_transferred_sessions`, `voice_duration_min`, `voice_retry_loops`, `voice_retry_penalty_min`, `voice_llm_turns` | More sessions or duration should raise total voice CO2e. More retries should raise retry-loop CO2e. More transfers should raise handover add-on. More LLM turns should raise voice total. | `voice_resolved_sessions <= voice_sessions`; `voice_transferred_sessions <= voice_sessions`. Transfer rate must stay `<= 100%`. | efficient voice bot; retry-heavy handover flow; AI-heavy voice session |
| Cases And Workforce | `fcr`, `repeat_contact_rate`, `transfer_rate`, `escalation_rate`, `active_agent_count`, `scheduled_hours`, `productive_hours`, `call_team_agents`, `email_team_agents`, `chatbot_team_agents`, `voice_team_agents` | Higher repeat or escalation should raise repeat-contact CO2e. More active agents should reduce CO2e per agent. More productive hours should reduce CO2e per productive hour. | `productive_hours <= scheduled_hours`; team totals must not exceed `active_agent_count`; occupancy must stay `<= 100%`. | well-staffed low-friction operation; understaffed high-friction operation |
| Root Causes | `billing_contacts`, `shipping_contacts`, `returns_contacts`, `authentication_contacts`, `billing_repeat_rate`, `shipping_repeat_rate`, `returns_repeat_rate`, `authentication_repeat_rate` | More contacts in a driver group should raise that group’s CO2e. Higher repeat rate should raise group CO2e and preventable-demand impact when the group is marked preventable. | preventable rate must stay `<= 100%`; no group CO2e should become negative. | billing spike; shipping repeat issue; authentication failure month |

## Cross-Section Stories

These are the combinations a CS or operations person usually cares about most:

| Story | What to vary | What should happen |
| --- | --- | --- |
| Boundary sensitivity | keep all operational inputs fixed, switch boundary | `provider + customer` should be equal or higher than `provider-side` |
| Automation success | raise chatbot/voice resolved share, keep escalations/transfers low | containment improves and avoided CO2e should improve |
| Automation failure | raise escalations, transfers, retries, and duration | total CO2e rises and operational efficiency worsens |
| Backlog month | set `email_received` far above `email_resolved` | backlog component increases |
| Friction month | raise queue, hold, repeat contact, escalation, reopen cases | avoidable components increase across sections |
| Staffing pressure | lower `active_agent_count`, keep workload high | `cases_per_agent` and `CO2e / agent` rise |
| Root-cause event | raise one driver group sharply | top driver and group metrics should switch accordingly |

## Invalid States Worth Testing On Purpose

- `chatbot_resolved_sessions > chatbot_sessions`
- `chatbot_resolved_sessions + chatbot_escalated_sessions + chatbot_abandoned_sessions > chatbot_sessions`
- `voice_resolved_sessions > voice_sessions`
- `voice_transferred_sessions > voice_sessions`
- `email_reopened_cases > email_resolved`
- `productive_hours > scheduled_hours`
- `call_team_agents + email_team_agents + chatbot_team_agents + voice_team_agents > active_agent_count`

## Priority Order

If time is limited, test in this order:

1. boundary change
2. calls friction story
3. email backlog story
4. chatbot containment story
5. voice retry and transfer story
6. workforce consistency story
7. root-cause ranking story

