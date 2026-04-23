# Assumptions And Evidence

## Purpose

This page separates the model assumptions into three categories:

- `well supported`
- `plausible for demo and MVP use`
- `assumptions that should be replaced or calibrated for real company deployment`

This helps users understand which defaults are strong reference values and which ones are only starting points.

## Traffic Light Guide

### Green: Well supported

These values are directly tied to established public references or straightforward technical derivations.

### Yellow: Plausible defaults

These are usable for a demo or first internal prototype, but they are not universal truths and should be calibrated where possible.

### Red: Replace before serious company use

These values are either weakly evidenced, highly context-dependent, or too simplified for decision-grade deployment.

## Assumption Review

| Assumption | Demo Value | Rating | Why |
|---|---:|---|---|
| Germany electricity factor | `0.363 kg CO2e / kWh` | Green | Consistent with Umweltbundesamt reporting for German electricity mix 2024 |
| U.S. electricity factor | `0.394 kg CO2e / kWh` | Green | Reasonable EPA / eGRID-based national average reference |
| Voice traffic | `0.00096 GB / min` | Green | Direct technical derivation from `128 kbps` combined traffic |
| LLM energy per turn | `0.0003 kWh` | Yellow | Useful public estimate, but not provider-measured operational truth |
| Fixed network energy intensity | `0.29 kWh / GB` | Yellow | Literature-backed directionally, but highly dependent on method and time horizon |
| Mobile network energy intensity | `0.60 kWh / GB` | Yellow | Same limitation as fixed network; should not be treated as universally exact |
| Agent laptop power | `40 W` | Yellow | Plausible active-use assumption, but workplace setup varies |
| Agent desktop + monitor power | `90 W` | Yellow | Plausible, but hardware, monitors, and office setup differ materially |
| Customer smartphone power | `5 W` | Yellow | Practical modeling assumption, not a universal measured customer value |
| Customer laptop power | `30 W` | Yellow | Practical modeling assumption, but highly device-dependent |
| Storage factor | `0.002 kWh / GB / month` | Red | Very rough placeholder unless a customer has actual storage platform evidence |

## Green Assumptions

### 1. Electricity carbon factors

These are the strongest values in the model because they are direct emissions conversion factors.

Current demo defaults:

- Germany: `0.363 kg CO2e / kWh`
- U.S.: `0.394 kg CO2e / kWh`

Interpretation:

- these values convert energy into CO2
- they should still be localized by market or region if possible
- they are stronger than generic grams-per-email claims

### 2. Voice traffic conversion

The demo assumes:

- `128 kbps` combined voice traffic

That is converted into:

- `0.00096 GB / min`

This is not a CO2 factor by itself.
It is a technical bridge from call minutes to data volume.

## Yellow Assumptions

### 1. Network energy intensity

Current demo defaults:

- fixed network: `0.29 kWh / GB`
- mobile network: `0.60 kWh / GB`

Why yellow:

- they are directionally grounded in literature
- but network energy intensity is method-sensitive
- published values vary by year, network scope, accounting boundary, and technology generation

Use them for:

- demo logic
- benchmarking structure
- first internal prototyping

Do not use them as:

- universal truth
- long-term fixed corporate assumptions

### 2. LLM energy per turn

Current demo default:

- `0.0003 kWh` per turn

Why yellow:

- it is a reasonable public estimate for a short GPT-4o-like interaction
- but real energy depends on provider, model, prompt size, completion size, tool usage, and infrastructure

Use it for:

- early scenario modeling
- bot versus human comparisons

Replace or calibrate it when:

- a company has a clear AI usage profile
- a provider offers better telemetry or cost-to-compute proxies

### 3. Device power assumptions

Current demo defaults:

- agent laptop: `40 W`
- agent desktop + monitor: `90 W`
- customer smartphone: `5 W`
- customer laptop: `30 W`

Why yellow:

- they are realistic enough for a reference model
- but hardware fleet, brightness, battery state, docking, multiple screens, and power settings differ

These values are useful as:

- operational placeholders
- relative comparison assumptions

They are weak as:

- exact enterprise energy measurements

## Red Assumptions

### 1. Storage factor

Current demo default:

- `0.002 kWh / GB / month`

Why red:

- storage architecture differs materially across cloud providers and retention setups
- the demo value is best treated as a placeholder
- this should be replaced when a company has actual storage platform evidence or internal sustainability data

If storage is not material or measurable:

- it is better to exclude it than to overstate confidence

## What This Means For Company Deployment

The demo values are suitable for:

- product storytelling
- internal prototyping
- methodology discussion
- structure-first benchmarking

Before a company treats the outputs as operationally reliable, it should adapt:

- electricity factor by geography or cloud region
- device assumptions by workplace and customer context
- network assumptions by channel and traffic reality
- AI assumptions by model usage pattern
- storage assumptions by actual infrastructure

## Recommended Deployment Rule

Use the traffic light as follows:

- `Green`: keep unless a more specific company value exists
- `Yellow`: keep temporarily, but plan calibration
- `Red`: replace before serious internal rollout

## Reference Orientation

The strongest external anchors used in the project are:

- Umweltbundesamt for German electricity factors
- EPA / eGRID-based U.S. electricity references
- public literature for network intensity ranges
- public AI energy estimates for LLM usage

These references support the model structure.
They do not make all defaults equally strong.
