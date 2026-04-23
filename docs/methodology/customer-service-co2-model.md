# Customer Service CO2 Impact Model

## Goal

Model the CO2 impact of customer service operations as an `estimated operational footprint`.

The defensible approach is:

`CO2e = electricity use (kWh) x carbon intensity of electricity (kg CO2e / kWh)`

Instead of using hard-coded claims like `1 email = x g CO2`, we derive emissions from:

- agent device time
- customer device time
- network traffic
- cloud / SaaS / AI usage

This is an activity-based model. It is better suited for a dashboard than generic internet claims.

## What kind of model this is

This document describes an `operational customer-service CO2 model`.

That means:

- it is designed for service operations
- it is designed for dashboards, KPI layers, and product storytelling
- it estimates operational impact from activity data and assumptions

It does not try to be a complete greenhouse-gas inventory by itself.

In practice, the repository should be read in two layers:

1. `Operational CS model`
2. `Stricter THG extension`

The operational CS model is the right choice when the main question is:

- which channels create operational load
- where avoidable digital demand is created
- how automation changes estimated CO2e
- which contact drivers create preventable emissions

The stricter THG extension is the right choice when the main question is:

- which activity data belongs in a more formal inventory structure
- which factors, gases, and sources must be stored explicitly
- how to separate factor tables from calculated emissions
- how to support stronger traceability and auditability

For that stricter extension layer, see:

- [final-thg-data-schema-v0.1.md](../schemas/final-thg-data-schema-v0.1.md)
- the workbooks in `data/reference/` for factor and source context

## What this model does not replace

This model should not be confused with:

- a certified carbon accounting platform
- a full Scope 1 / Scope 2 / Scope 3 reporting system
- a formal company-wide greenhouse-gas inventory

Those use cases often require additional structure such as:

- explicit `scope` separation
- source-category classification
- factor metadata by year and geography
- gas-specific GWP handling
- data-quality statements
- source-reference catalogs

The operational model here is still valid in those contexts.
It is simply not sufficient on its own for every stricter reporting use case.

## Relationship to the stricter THG schema

The repository now includes a stricter extension schema.

The simplest distinction is:

- this document explains `how the operational estimates work`
- the stricter schema explains `how data should be stored when stronger THG traceability is needed`

In other words:

- this page is about modeling logic
- the stricter schema is about data structure and evidence handling

The stricter schema can contain:

- `activity_record`
- `emission_factor`
- `gas_factor`
- `source_reference`
- `data_quality_record`
- `emission_calculation`

This operational model uses many of the same ideas.
It just applies them in a more product-oriented and implementation-light way.

## Recommended boundaries

Use two reporting views:

1. `Provider-side footprint`
Includes only the service organization's own operations:
- agent workstation
- service software / cloud usage
- provider-side network / telephony
- chatbot / AI inference

2. `Interaction footprint`
Includes provider-side plus customer-side digital usage:
- customer device time
- customer network traffic

The provider-side view is easier to defend commercially.
The interaction view is better for showing total avoided digital load.

## Source-backed defaults

### Electricity carbon intensity

- Germany 2024 consumed electricity mix: `0.363 kg CO2 / kWh`
- US national delivered electricity average based on EPA eGRID 2022: `0.394 kg CO2 / kWh`

Prefer region- and time-specific values where available.

### Network energy intensity

From the reviewed PDF citing Andrae and Edler:

- fixed network: `0.29 kWh / GB`
- 4G mobile network: `0.60 kWh / GB`

These are more defensible than using fixed `g per email` or `g per minute`.

### LLM chatbot energy

Epoch AI estimate for a typical GPT-4o query:

- typical query: `0.3 Wh` = `0.0003 kWh`
- long input around 10k tokens: `2.5 Wh`
- very long input around 100k tokens: `~40 Wh`

For an LLM chatbot session:

`session_kWh = turns x kWh_per_query`

## Practical defaults for MVP

These are modeling defaults, not universal truths. They should be configurable per customer.

### Device power assumptions

- agent laptop active: `40 W`
- agent desktop + monitor active: `90 W`
- customer smartphone active: `5 W`
- customer laptop active: `30 W`

Convert power to energy with:

`kWh = watts x hours / 1000`

### Voice traffic assumption

For a VoIP-style support call, use a combined audio bitrate of:

- `128 kbps` total

This gives:

- `0.00096 GB / minute`

Network energy per minute:

- fixed network: `0.00096 x 0.29 = 0.000278 kWh/min`
- mobile network: `0.00096 x 0.60 = 0.000576 kWh/min`

### Simple email traffic assumption

For a simple operational email:

- message size: `0.1 MB` = `0.0001 GB`

Network energy per send/open event on fixed network:

- `0.0001 x 0.29 = 0.000029 kWh`

This is tiny. In practice, the biggest factor is usually the time a human spends handling the email.

### Attachment-heavy email assumption

For a large attachment:

- attachment size: `10 MB` = `0.01 GB`

Network energy:

- fixed network: `0.01 x 0.29 = 0.0029 kWh`

This is materially larger than a plain text email.

## Core formulas

## 1. Call handling footprint

Provider-side:

`call_kWh_provider = agent_device_kW x handle_minutes / 60 + provider_network_kWh_per_min x handle_minutes`

Interaction footprint:

`call_kWh_total = call_kWh_provider + customer_device_kW x customer_minutes / 60 + customer_network_kWh_per_min x customer_minutes`

CO2:

`call_CO2e = call_kWh x grid_factor`

## 2. Email handling footprint

Provider-side:

`email_kWh_provider = agent_device_kW x handling_minutes / 60 + network_intensity x email_data_GB`

Interaction footprint:

`email_kWh_total = email_kWh_provider + customer_device_kW x reading_minutes / 60 + customer_network_intensity x open_data_GB`

If storage should be included, add:

`storage_kWh = stored_GB x storage_factor`

But for MVP, storage can be excluded unless the customer has measurable retention data.

## 3. Reopened email footprint

If a case is reopened, model it as an extra handling event:

`reopen_kWh = extra_agent_time + extra_customer_read_time + extra_email_transmissions`

This is much more defensible than pretending a reopen has a fixed universal carbon value.

## 4. Chatbot footprint

Rule-based bot:

`bot_kWh_rule = session_minutes x web_device_and_network_factor`

LLM bot:

`bot_kWh_llm = turns x llm_kWh_per_turn + customer_device_kW x session_minutes / 60 + text_network_kWh`

Net savings from chatbot resolution:

`net_savings = avoided_human_case_kWh - bot_case_kWh`

## Modeled customer service cases

## Case A: Reduce average handle time for calls

Assumptions:

- 1 minute less per call
- agent desktop: `90 W`
- provider network fixed: `0.000278 kWh/min`
- Germany factor: `0.363 kg CO2/kWh`

Energy saved per call minute:

- agent device: `0.09 / 60 = 0.0015 kWh`
- network: `0.000278 kWh`
- total: `0.001778 kWh`

CO2 saved per call minute:

- `0.001778 x 0.363 = 0.000645 kg`
- `= 0.645 g CO2`

Impact at scale:

- `100,000` call minutes avoided per month
- `177.8 kWh`
- `64.5 kg CO2/month`

If customer-side impact is included, savings rise further.

## Case B: Avoid one reopened email

Assumptions:

- extra agent handling: `3 minutes`
- agent laptop: `40 W`
- customer reads follow-up for `1 minute` on smartphone `5 W`
- simple message size only
- Germany factor: `0.363 kg CO2/kWh`

Energy:

- agent time: `0.04 x 3/60 = 0.0020 kWh`
- customer time: `0.005 x 1/60 = 0.000083 kWh`
- email traffic: about `0.000029 kWh` per simple send/open event, negligible here

Total:

- about `0.00211 kWh`

CO2:

- `0.00211 x 0.363 = 0.000766 kg`
- `= 0.77 g CO2`

Interpretation:

For reopened emails, human time dominates more than pure transmission.

## Case C: Reduce unnecessary email volume

Assumptions per avoided simple email:

- agent writing/review: `1 minute` on laptop `40 W`
- customer reading: `1 minute` on smartphone `5 W`
- `0.1 MB` email size
- fixed network
- Germany factor: `0.363 kg CO2/kWh`

Energy:

- agent time: `0.000667 kWh`
- customer time: `0.000083 kWh`
- network send/open: roughly `0.000029 to 0.000058 kWh`

Total:

- about `0.00078 kWh`

CO2:

- `0.00078 x 0.363 = 0.000283 kg`
- `= 0.28 g CO2`

This lands close to some public low-end email estimates, but here the derivation is transparent.

Impact at scale:

- `500,000` unnecessary emails avoided per month
- about `390 kWh`
- about `141 kg CO2/month`

## Case D: Chatbot resolves issue instead of human call

Human call baseline assumptions:

- `6 minute` call
- agent desktop `90 W`
- provider fixed network voice traffic
- customer smartphone `5 W`
- customer mobile network `0.000576 kWh/min`

Human call energy:

- provider side:
`6 x (0.0015 + 0.000278) = 0.010668 kWh`
- customer side:
`6 x (0.000083 + 0.000576) = 0.003954 kWh`
- total:
`0.014622 kWh`

Human call CO2:

- `0.014622 x 0.363 = 0.00531 kg`
- `= 5.31 g CO2`

LLM chatbot assumptions:

- `6 turns`
- `0.3 Wh` per turn
- customer smartphone for `5 minutes`
- text network negligible

Bot energy:

- LLM:
`6 x 0.0003 = 0.0018 kWh`
- customer device:
`0.005 x 5/60 = 0.000417 kWh`
- total:
`0.002217 kWh`

Bot CO2:

- `0.002217 x 0.363 = 0.000805 kg`
- `= 0.81 g CO2`

Net savings if chatbot fully deflects the call:

- `5.31 - 0.81 = 4.50 g CO2 per case`

Impact at scale:

- `100,000` successfully deflected calls
- about `450 kg CO2` avoided

## Case E: Chatbot resolves issue instead of email exchange

If a chatbot session prevents:

- one inbound email
- one agent reply
- one reopen

then avoided footprint is typically driven by:

- avoided agent handling time
- avoided customer reopen/read time
- avoided LLM replacement cost must be subtracted

This case is usually favorable for chatbot resolution if the bot resolves within a few short turns.

## What should be configurable per customer

- country / grid factor
- channel mix by market
- agent device type and power
- average email handling time
- average call handle time
- average email size and attachment size
- customer device mix
- customer network mix
- chatbot turns per resolution
- model class used by chatbot

## Confidence levels

### High confidence

- converting `kWh` to `CO2e` with a known grid factor
- using measured call minutes, email counts, reopen counts, chatbot turns

### Medium confidence

- device power assumptions
- network intensity assumptions
- typical audio bitrates

### Lower confidence

- generic public `g per email` values
- generic public `g per call minute` values
- any model that does not separate device, network, and compute

## Recommended dashboard KPIs

- `CO2e per resolved call`
- `CO2e per handled email`
- `CO2e per reopened email`
- `CO2e per chatbot resolution`
- `CO2e avoided via bot deflection`
- `CO2e avoided via lower AHT`
- `CO2e avoided via lower email volume`
- `CO2e avoided via lower reopen rate`

## Typical customer service reporting dashboard

The dashboard should not look like a climate calculator with service metrics added later.
It should look like a normal customer service performance dashboard with a parallel `CO2 impact` layer.

### Dashboard structure

Use four sections:

1. `Volume`
2. `Efficiency`
3. `Quality / Resolution`
4. `CO2 Impact`

The operational KPI remains the primary metric.
CO2 is shown as:

- `CO2e per unit`
- `total CO2e`
- `avoided CO2e vs baseline`

## 1. Volume section

Typical reporting metrics:

- `Inbound Calls`
- `Outbound Calls`
- `Emails Received`
- `Emails Sent`
- `Chats Started`
- `Chatbot Sessions`
- `Voice Bot Sessions`
- `Cases Created`
- `Cases Closed`
- `Repeat Contacts`

CO2 view:

- `CO2e from Call Volume`
- `CO2e from Email Volume`
- `CO2e from Chatbot Sessions`
- `CO2e from Voice Bot Sessions`
- `CO2e from Repeat Contacts`

Example logic:

- more interactions usually means higher total footprint
- channel mix matters: `call` is typically heavier than `chatbot`, especially if the bot resolves the issue quickly

## 2. Efficiency section

Typical reporting metrics:

- `Average Handle Time (AHT)`
- `Average Queue Time`
- `Hold Time`
- `After Call Work`
- `Average Email Handling Time`
- `Average Response Time`
- `Average Resolution Time`
- `Transfers`
- `Escalations`
- `Callback Requests`
- `Callback Retry Attempts`
- `Failed Callback Attempts`

CO2 view:

- `CO2e per Call`
- `CO2e per Email`
- `CO2e per Callback`
- `CO2e from Queue Time`
- `CO2e from Failed Callback Attempts`
- `CO2e from Transfers and Escalations`
- `CO2e avoided from lower AHT`

Example logic:

- `Queue Time` creates customer-side device and telephony load
- `Hold Time` increases call footprint without solving anything
- `Callback Retry Attempts` are pure inefficiency loops
- `Transfers` often duplicate handling time across agents

## 3. Quality and resolution section

Typical reporting metrics:

- `First Contact Resolution (FCR)`
- `Resolution Rate`
- `Reopen Rate`
- `Abandon Rate`
- `SLA Compliance`
- `CSAT`
- `NPS`
- `Bot Containment Rate`
- `Voice Bot Containment Rate`
- `Human Handover Rate`
- `Repeat Contact Rate`

CO2 view:

- `CO2e from Reopened Cases`
- `CO2e from Repeat Contacts`
- `CO2e avoided by higher FCR`
- `CO2e avoided by better Bot Containment`
- `CO2e added by Human Handover after Bot`

Example logic:

- better `FCR` means fewer extra interactions
- lower `Reopen Rate` means fewer duplicate email and case cycles
- high `Bot Containment` lowers impact only if `failed bot journeys` stay short

## 4. Channel-specific CO2 cases

### Calls

Report:

- `Inbound Call Volume`
- `AHT`
- `Queue Time`
- `Hold Time`
- `Abandon Rate`
- `Transfers`
- `Escalations`
- `Callback Requests`
- `Callback Success Rate`
- `Callback Retry Attempts`

Derived CO2 metrics:

- `CO2e per Call`
- `CO2e from Queue Time`
- `CO2e from Hold Time`
- `CO2e from Callback Retries`
- `CO2e avoided via shorter AHT`
- `CO2e avoided via lower Abandon + Repeat`

### Emails

Report:

- `Emails Received`
- `Emails Sent`
- `Reopen Rate`
- `Reply Count per Case`
- `Average Handling Time`
- `Attachments Sent`
- `Average Attachment Size`
- `Storage Volume`
- `Retention Duration`
- `Duplicate Emails`

Derived CO2 metrics:

- `CO2e per Email`
- `CO2e per Reopened Email Case`
- `CO2e from Attachment Transmission`
- `CO2e from Attachment Storage`
- `CO2e avoided via lower Email Volume`
- `CO2e avoided via lower Reopen Rate`

### Chatbots

Report:

- `Sessions`
- `Resolved by Bot`
- `Escalated to Human`
- `Average Turns`
- `Average Turns before Escalation`
- `Containment Rate`
- `Repeat Bot Sessions`
- `Bot Drop-off Rate`

Derived CO2 metrics:

- `CO2e per Bot Session`
- `CO2e per Bot Resolution`
- `CO2e added by failed Bot Sessions`
- `CO2e avoided by Call Deflection`
- `CO2e avoided by Email Deflection`

### Voice bots

Report:

- `Voice Bot Sessions`
- `Contained by Voice Bot`
- `Transferred to Agent`
- `Average Voice Bot Duration`
- `Intent Recognition Failure Rate`
- `Retry Loops`
- `Authentication Success Rate`
- `Callback Scheduled by Bot`

Derived CO2 metrics:

- `CO2e per Voice Bot Session`
- `CO2e per Voice Bot Resolution`
- `CO2e added by Voice-to-Agent Handover`
- `CO2e from Recognition Retry Loops`
- `CO2e avoided by successful automated resolution`

## Recommended executive dashboard tiles

For the top layer, use standard business tiles with CO2 right beside them:

- `Contacts`
- `Resolved Cases`
- `AHT`
- `FCR`
- `Reopen Rate`
- `Bot Containment`
- `Total Estimated CO2e`
- `CO2e per Resolution`
- `Avoided CO2e vs Baseline`

This keeps the dashboard familiar for service leaders.

## Recommended baseline comparisons

Every CO2 view should compare against one of these:

- `Previous period`
- `Baseline month`
- `Before automation rollout`
- `Before chatbot rollout`
- `Before process improvement`

This allows claims like:

- `AHT down 12%, estimated CO2e per call down 9%`
- `Reopen rate down 18%, estimated email-related CO2e down 14%`
- `Bot containment up 22%, estimated avoided call CO2e 380 kg this month`

## Metric design principle

Do not lead with climate-only metrics.
Lead with standard service reporting and make climate impact the second dimension.

Good format:

- `AHT: 6.2 min`
- `Estimated CO2e per call: 4.8 g`

- `Reopen rate: 11.4%`
- `Estimated CO2e from reopened cases: 32 kg/month`

- `Bot containment: 43%`
- `Estimated avoided CO2e vs human-only handling: 180 kg/month`

## MVP recommendation

For the first version:

1. show `estimated CO2 impact`, not `exact emissions`
2. separate `provider-side` from `interaction footprint`
3. use customer-configurable operational inputs
4. keep formulas visible and auditable
5. avoid using a single universal `CO2 per email` or `CO2 per call` factor

## Source links used for the model

- UBA Germany electricity factor 2024: https://www.umweltbundesamt.de/themen/co2-emissionen-pro-kilowattstunde-strom-2024
- EPA eGRID average US delivered electricity factor: https://www.epa.gov/energy/greenhouse-gas-equivalencies-calculator-calculations-and-references
- IEA Energy and AI overview: https://www.iea.org/reports/energy-and-ai/executive-summary%C2%A0
- Epoch AI chatbot energy estimate: https://epoch.ai/gradient-updates/how-much-energy-does-chatgpt-use
- Local PDF reviewed in workspace: `scratch/the-carbon-footprint-of-information-technology.pdf`
