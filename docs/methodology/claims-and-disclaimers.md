# Claims and Disclaimers

## Purpose

This document defines what the repository can credibly claim and what it should explicitly avoid claiming.

It is intended for:

- repository maintainers
- demo builders
- implementers
- contributors

It helps keep the project:

- methodologically defensible
- transparent
- non-misleading

## Core positioning statement

This project estimates the operational CO2 impact of customer service activities using service data, configurable assumptions, and documented conversion logic.

It does not directly measure physical emissions in real time.

## Safe claims

These claims are generally safe if the methodology is used as documented.

### Product-level claims

- `This project provides a framework for estimating customer service CO2 impact.`
- `It combines standard customer service reporting with an estimated CO2 layer.`
- `It supports calls, email, chatbots, voice bots, and related service workflows.`
- `It enables baseline comparisons and scenario analysis.`
- `It can be used with CSV exports, warehouse data, or event-level integrations.`

### Methodology claims

- `The calculations are activity-based.`
- `CO2 estimates are derived from operational inputs, energy assumptions, and electricity carbon factors.`
- `Metric quality depends on source data quality and available assumptions.`
- `Confidence levels can be assigned to calculations based on the underlying data.`

### Operational claims

- `The model can highlight which service workflows are likely driving avoidable digital emissions.`
- `It can show how queue time, repeat contacts, reopened emails, and failed automation journeys contribute to impact.`
- `It can help compare the estimated impact of different service channels.`

## Claims that need qualification

These statements are acceptable only if they include context.

- `This dashboard shows CO2 impact.`

Better:

- `This dashboard shows estimated operational CO2 impact based on available service data and assumptions.`

- `Chatbots reduce CO2.`

Better:

- `Chatbots may reduce estimated CO2 impact when they resolve issues faster or replace more resource-intensive service channels.`

- `Lower call times reduce emissions.`

Better:

- `Lower call times can reduce estimated operational emissions by reducing device, network, and service-system usage.`

- `Attachments are bad for the environment.`

Better:

- `Large attachments can materially increase estimated transmission and storage-related impact.`

## Claims to avoid

These should not be stated unless the project evolves far beyond the current methodology.

- `This measures exact CO2 emissions.`
- `This is a certified carbon accounting system.`
- `This is suitable for formal financial or regulatory emissions reporting without additional review.`
- `This provides scientifically exact emissions per email, per call, or per chatbot session.`
- `This replaces a corporate greenhouse gas inventory.`
- `This proves one channel is always greener than another in every context.`

## Required terminology

Prefer these terms:

- `estimated CO2 impact`
- `estimated operational CO2e`
- `activity-based estimate`
- `assumption-based estimate`
- `baseline comparison`
- `confidence level`

Avoid these terms unless specifically justified:

- `actual emissions`
- `real-time physical emissions`
- `precise emissions`
- `certified footprint`

## Boundary disclaimer

The repository should always be clear about boundary choices.

Recommended wording:

`Estimates depend on the selected reporting boundary. Deployments may report provider-side operational impact only, or may include customer-side interaction assumptions where configured.`

## Assumption disclaimer

Recommended wording:

`Some calculations rely on configurable assumptions such as electricity carbon intensity, device power, network energy intensity, storage factors, and AI energy per turn. Results should be interpreted in the context of those assumptions.`

## Data quality disclaimer

Recommended wording:

`Metric confidence depends on the quality and granularity of the source data. Event-level records generally support stronger estimates than aggregated exports.`

## AI and chatbot disclaimer

Recommended wording:

`AI- and bot-related estimates depend on model class, turn counts, session design, and configured energy assumptions. Different bot implementations may have materially different impact profiles.`

## Comparative claim guidance

Comparisons are useful, but should be framed carefully.

Safe comparison examples:

- `Estimated CO2e per resolved call is higher than estimated CO2e per resolved chatbot session in this deployment.`
- `Queue time contributed more estimated CO2 impact than hold time in the selected period.`
- `Attachment-heavy email workflows had higher estimated impact than simple email workflows in this dataset.`

Risky comparison examples:

- `Calls are worse than emails.`
- `Voice bots are always greener than human support.`
- `This company reduced real emissions by exactly 18%.`

## Recommended confidence labels

The UI and docs should classify metrics using confidence levels.

### High confidence

- based mostly on measured operational records
- limited use of assumptions
- strong channel semantics

### Medium confidence

- mix of measured records and documented assumptions
- some inferred customer-side or infrastructure values

### Low confidence

- aggregated-only source data
- major use of fallback assumptions
- incomplete source semantics

## Suggested UI disclaimer

Short version for dashboard footer:

`CO2 metrics shown here are estimated operational impact values derived from service data and documented assumptions.`

Longer version for methodology page:

`This dashboard presents activity-based estimates of operational CO2 impact. Values are derived from available customer service data, configurable energy assumptions, and electricity carbon factors. Results are not direct physical measurements and should be interpreted with the stated confidence level and reporting boundary.`

## Suggested README disclaimer

`This project provides an open framework for estimating the operational CO2 impact of customer service workflows. It is intended for operational analytics, benchmarking, and improvement analysis. It is not a certified emissions accounting platform and should not be used as a standalone basis for formal regulatory or financial carbon reporting.`

## Suggested demo disclaimer

`The demo dashboard uses sample data and illustrative assumptions to show how customer service KPIs can be linked to estimated CO2 impact. Numbers in the demo are examples, not validated emissions figures for any real organization.`

## Contributor guidance

Contributors should:

- document new assumptions
- avoid overstated claims in connectors and docs
- report known data-quality limitations
- distinguish measured values from estimated values

Contributors should not:

- hard-code unsupported emissions factors without documentation
- market estimates as exact measurements
- hide assumptions inside opaque logic

## Short “about” statement

Recommended short project description:

`Open-source framework for estimating customer service CO2 impact from operational data.`

## Recommended next artifacts

- `sample-output-metrics.json`
- `README.md`
- `quickstart.md`
