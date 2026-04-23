# Implementation Guide

## Purpose

This guide explains how a company can adopt the repository and start producing customer service KPIs with estimated CO2 impact.

The project is designed to be used in two ways:

- `lightweight mode` with exports and CSV files
- `integrated mode` with adapters and event-level data

## What this repository is

This repository provides:

- a canonical data model
- a KPI and CO2 methodology
- adapter contracts
- reference schema and sample data
- reference workbook material for factor and source modeling

It should be treated as:

- a measurement framework
- a reference implementation
- an open integration standard

## What this repository is not

This repository is not:

- a plug-and-play integration for every CRM
- a certified carbon accounting system
- a replacement for formal corporate emissions reporting

It is best used for:

- operational sustainability reporting
- customer service optimization
- baseline comparison
- automation impact measurement

## Operational model versus stricter THG layer

The repository should be read in two distinct but compatible ways:

1. `Operational customer-service model`
Used for channel KPIs, calculator flows, root-cause views, and estimated operational CO2 impact.

2. `Stricter THG extension`
Used when teams want a more explicit structure for:

- activity data
- emission factors
- gas-specific GWP values
- source references
- calculated emissions

The stricter extension does not replace the canonical CS model.
It sits beside it as an accounting-oriented layer.

See:

- [final-thg-data-schema-v0.1.md](../schemas/final-thg-data-schema-v0.1.md)
- the workbooks in `data/reference/` for factor and source context

## Adoption paths

## Path A: CSV-first adoption

Recommended for:

- pilots
- teams without engineering support
- teams using multiple fragmented systems
- quick proof-of-value

Steps:

1. export monthly or weekly data from service tools
2. map exports into the canonical CSV templates
3. validate fields and assumptions
4. run KPI and CO2 calculations
5. review outputs and data gaps

Benefits:

- lowest implementation effort
- fastest way to test the model

Tradeoffs:

- lower granularity
- more assumptions
- lower metric confidence

## Path B: Event-level adoption

Recommended for:

- larger service teams
- companies with data engineering support
- organizations wanting better confidence and drill-down

Steps:

1. identify source systems
2. build or configure adapters
3. map source records to canonical entities
4. validate and publish normalized events
5. run engine and reporting

Benefits:

- better metric quality
- support for richer cases like callbacks, transfers, retry loops

Tradeoffs:

- higher implementation effort

## Path C: Warehouse-first adoption

Recommended for:

- enterprises with central analytics teams
- organizations already consolidating service data

Steps:

1. pull service data from warehouse tables
2. map warehouse views to canonical entities or aggregated metrics
3. run engine

Benefits:

- avoids many direct SaaS integrations
- often best for enterprise adoption

## Recommended adoption sequence

For most companies, the recommended order is:

1. `define scope`
2. `choose channels`
3. `collect required data`
4. `map to canonical model`
5. `validate assumptions`
6. `run baseline`
7. `review confidence`
8. `iterate`

## Step 1: Define scope

Before connecting data, decide:

- which teams are in scope
- which channels are in scope
- which markets are in scope
- whether reporting is `provider-side` only or `interaction footprint`
- which use cases matter most

Recommended MVP scope:

- `call`
- `email`
- `chatbot`

Optional next scope:

- `voice_bot`
- `live chat`
- `self_service`

## Step 2: Choose reporting mode

Decide whether the organization wants:

- `monthly operational reporting`
- `weekly trend tracking`
- `near-real-time monitoring`

Recommended default:

- monthly baseline
- weekly trend view

## Step 3: Identify source systems

Typical source systems:

- CRM / ticketing
- telephony / CCaaS
- chatbot analytics
- voice bot platform
- BI exports
- data warehouse

Useful examples:

- Zendesk
- Salesforce Service Cloud
- Genesys
- Freshdesk
- Intercom
- Asterisk
- 3CX
- warehouse tables
- CSV exports

## Step 4: Select channels and use cases

Do not start with everything.
Pick 3-5 use cases first.

Recommended initial use cases:

- `AHT reduction for calls`
- `reopen reduction for emails`
- `attachment-heavy email impact`
- `chatbot call deflection`
- `callback retry reduction`

## Step 5: Gather required data

Use `data-requirements-by-channel.md` to determine:

- required fields
- optional fields
- likely assumptions
- confidence level

If a field is missing:

- use assumptions only if explicitly allowed
- otherwise mark the metric unsupported

If you want to design a stricter THG-ready structure in parallel, also review:

- `docs/schemas/final-thg-data-schema-v0.1.md`
- the workbooks in `data/reference/`

Use them as reference material for factor, gas, and source structure.
They are not final company inventory data.

## Step 6: Map data into the canonical model

Use:

- `canonical-schema-v0.1.md`
- `adapter-mapping-guide.md`
- `connector-sdk-interface.md`

If the project needs a stricter accounting layer, map additionally into:

- `activity_record`
- `emission_factor`
- `gas_factor`
- `source_reference`
- `data_quality_record`

as described in:

- `final-thg-data-schema-v0.1.md`

Mapping rules:

- preserve original source identifiers
- normalize all durations to seconds
- use canonical enums
- document every non-trivial transformation

## Step 7: Define assumptions

Every deployment should create an `assumption_set`.

At minimum define:

- electricity grid factor
- network intensity
- device power defaults
- LLM energy per turn
- storage assumptions if used

If assumptions are unknown:

- start with documented defaults
- clearly label them

Where possible, distinguish between:

- operational assumptions for the CS model
- formal factor references for stricter THG modeling

## Step 8: Validate the dataset

Validation should check:

- required fields exist
- durations are non-negative
- timestamps are ordered
- case references are valid
- enums are valid
- assumptions are complete for chosen calculations

## Step 9: Run baseline calculations

Start with one baseline period:

- one month is ideal

Baseline outputs should include:

- total interactions by channel
- operational KPIs
- estimated CO2 KPIs
- unsupported metrics
- confidence summary

## Step 10: Review results

Questions to ask:

- which metrics are robust
- which metrics depend heavily on assumptions
- which data gaps prevent better accuracy
- which use cases show the highest improvement potential

## Typical deployment scenarios

## Scenario 1: Small support team with exports only

Approach:

- use CSV monthly metrics
- focus on `calls`, `emails`, `chatbot`
- report monthly

Expected outcome:

- fast adoption
- medium confidence

## Scenario 2: Enterprise call center

Approach:

- telephony or CCaaS data
- CRM case join
- queue and callback modeling

Expected outcome:

- stronger operational insights
- better CO2 defensibility

## Scenario 3: Digital-first support org

Approach:

- chatbot session logs
- ticketing exports
- attachment and reopen modeling

Expected outcome:

- strong automation and deflection analysis

## Minimum viable adoption checklist

- chosen channels are defined
- source systems are identified
- baseline period is chosen
- required fields are available
- assumptions are documented
- mapping is documented
- validation passes without blocking errors
- first baseline report is generated

## Common implementation mistakes

- trying to model every channel at once
- confusing case-level and interaction-level metrics
- using vague source fields without semantic review
- hiding assumptions inside connector logic
- claiming precision beyond the available data

## Recommended repository documents for implementers

- `README.md`
- `quickstart.md`
- `canonical-schema-v0.1.md`
- `adapter-mapping-guide.md`
- `connector-sdk-interface.md`
- `data-requirements-by-channel.md`
- `sample-dataset-v0.1.json`

## Recommended next artifacts

- `claims-and-disclaimers.md`
- `quickstart.md`
- `csv-template-calls.csv`
- `csv-template-emails.csv`
- `csv-template-chatbot.csv`
