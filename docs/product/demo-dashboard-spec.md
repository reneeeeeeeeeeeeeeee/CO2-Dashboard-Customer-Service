# Demo Dashboard Spec

## Purpose

This document defines the first demo dashboard for the repository.

The demo dashboard should prove three things:

1. this is a normal customer service reporting product
2. CO2 impact can be layered onto familiar service KPIs
3. the canonical model can support multiple channels and service cases

It is a reference dashboard, not the only possible UI.

## Demo goals

The demo should help a user understand:

- what data goes in
- what KPIs come out
- how operational changes influence estimated CO2 impact
- where the numbers come from

## Core design principle

The dashboard must feel like a `customer service performance dashboard first`.

CO2 is a second analytical layer.
It should not dominate the screen visually at the expense of operational clarity.

## Demo audience

Primary audience:

- operations managers
- customer service leads
- sustainability teams
- analytics teams
- engineers evaluating the repo

## Demo structure

Recommended navigation:

1. `Overview`
2. `Calls`
3. `Email`
4. `Chatbot`
5. `Voice Bot`
6. `Cases`
7. `Workforce`
8. `Root Causes`
9. `Methodology`

## 1. Overview page

This page should answer:

- how the service operation performed
- what the estimated CO2 impact was
- what main drivers increased or reduced impact

### Hero KPI cards

Top row:

- `Contacts`
- `Resolved Cases`
- `AHT`
- `FCR`
- `Reopen Rate`
- `Bot Containment`
- `Total Estimated CO2e`
- `CO2e per Resolution`

### Change indicators

Each KPI card should support:

- current value
- delta vs baseline
- delta vs previous period

Examples:

- `AHT: 6.2 min`
- `down 12% vs baseline`

- `Total Estimated CO2e: 1,240 kg`
- `down 9% vs baseline`

### Main charts

#### Chart A: Contact volume by channel

Type:

- stacked bar or area chart

Series:

- calls
- email
- chatbot
- voice bot

#### Chart B: Estimated CO2e by channel

Type:

- stacked bar

Series:

- calls
- email
- chatbot
- voice bot

Purpose:

Shows that contact volume and carbon impact are related but not identical.

#### Chart C: Operational efficiency vs CO2 impact

Type:

- dual-axis line

Series:

- AHT
- CO2e per call

Purpose:

Makes the operating model legible.

### Insight panel

A short text panel should summarize:

- biggest CO2 driver
- biggest operational inefficiency
- biggest savings opportunity

Example:

- `Queue time added 14% of call-related CO2e`
- `Reopened email cases added 32 kg CO2e this month`
- `Chatbot call deflection avoided 180 kg CO2e`

## 2. Calls page

This page should show classic contact-center reporting plus CO2 drivers.

### KPI cards

- `Inbound Calls`
- `Resolved Calls`
- `Abandon Rate`
- `AHT`
- `Average Queue Time`
- `Average Hold Time`
- `Callback Success Rate`
- `CO2e per Call`
- `CO2e from Queue Time`
- `CO2e from Callback Retries`

### Charts

#### Chart A: Call journey breakdown

Type:

- stacked bar or waterfall

Segments:

- queue time
- talk time
- hold time
- after call work

Purpose:

Shows where call-related carbon impact comes from.

#### Chart B: Queue time vs CO2e

Type:

- scatter or line chart

Purpose:

Shows how operational friction drives extra CO2.

#### Chart C: Callback performance

Type:

- funnel

Stages:

- callback requested
- callback attempted
- callback successful
- callback retried

Associated CO2 labels:

- estimated CO2 from retries

### Table

Dimension options:

- queue
- team
- market

Columns:

- calls
- AHT
- queue time
- abandon rate
- callback retries
- CO2e per call
- total call CO2e

## 3. Email page

This page should demonstrate that email emissions are driven by handling, reopen loops, and attachments.

### KPI cards

- `Emails Received`
- `Emails Sent`
- `Resolved Email Cases`
- `Reopen Rate`
- `Average Handling Time`
- `Attachment Rate`
- `CO2e per Email`
- `CO2e from Reopened Cases`
- `CO2e from Attachments`
- `CO2e from Storage`

### Charts

#### Chart A: Email volume vs reopen rate

Type:

- combo chart

Purpose:

Shows that more volume is not the only issue; quality matters.

#### Chart B: Attachment impact breakdown

Type:

- stacked bar

Segments:

- transmission
- storage

#### Chart C: Reopen impact

Type:

- waterfall

Components:

- baseline email handling
- reopened handling
- duplicate thread cost

### Table

Columns:

- team
- email cases
- reopen rate
- avg replies per case
- attachment volume
- CO2e per email
- total email CO2e

## 4. Chatbot page

This page should show automation value in both operational and carbon terms.

### KPI cards

- `Chatbot Sessions`
- `Resolved by Bot`
- `Escalated to Human`
- `Containment Rate`
- `Average Turns`
- `CO2e per Bot Session`
- `CO2e per Bot Resolution`
- `Avoided CO2e by Call Deflection`
- `Avoided CO2e by Email Deflection`

### Charts

#### Chart A: Bot session outcomes

Type:

- donut or funnel

Segments:

- resolved
- escalated
- abandoned

#### Chart B: Bot turns vs resolution

Type:

- scatter or grouped distribution

Purpose:

Shows whether long bot journeys reduce value.

#### Chart C: Net impact of bot automation

Type:

- waterfall

Components:

- bot session CO2
- escalated session CO2
- avoided call CO2
- avoided email CO2
- net avoided CO2

### Table

Columns:

- bot version
- sessions
- containment
- avg turns
- escalations
- CO2e per session
- avoided CO2e

## 5. Voice Bot page

This page should emphasize retry loops and handovers.

### KPI cards

- `Voice Bot Sessions`
- `Resolved by Voice Bot`
- `Transferred to Agent`
- `Retry Loop Rate`
- `Intent Failure Rate`
- `CO2e per Voice Session`
- `CO2e from Retry Loops`
- `CO2e added by Handover`
- `Avoided CO2e by Voice Resolution`

### Charts

#### Chart A: Voice bot outcome funnel

Stages:

- session started
- authentication completed
- resolved
- transferred
- abandoned

#### Chart B: Retry loops

Type:

- histogram

Purpose:

Shows inefficient automated voice flows.

#### Chart C: Voice bot vs human call comparison

Type:

- side-by-side bar chart

Bars:

- estimated CO2e per resolved voice bot session
- estimated CO2e per resolved human call

## 6. Cases page

This page is channel-neutral and focuses on service quality.

### KPI cards

- `Cases Created`
- `Cases Closed`
- `FCR`
- `Repeat Contact Rate`
- `Transfer Rate`
- `Escalation Rate`
- `CO2e per Resolution`
- `CO2e from Repeat Contacts`

### Charts

#### Chart A: Case outcomes by issue type

Type:

- stacked bar

Segments:

- first-contact resolved
- reopened
- escalated
- transferred

#### Chart B: CO2e by issue type

Type:

- bar chart

Purpose:

Highlights which case types create the most avoidable load.

## 7. Methodology page

## 7. Workforce page

This page should connect service performance to staffing structure.

### KPI cards

- `Active Agents`
- `Scheduled Hours`
- `Productive Hours`
- `Occupancy Rate`
- `Contacts per Agent`
- `Cases per Agent`
- `CO2e per Agent`
- `CO2e per Productive Hour`

### Charts

#### Chart A: Channel load vs staffing

Type:

- grouped bar chart

Series:

- contacts
- active agents
- CO2e by channel

#### Chart B: CO2e per productive hour

Type:

- bar chart by team or queue

Purpose:

Shows whether carbon intensity is driven by process inefficiency or staffing mix.

### Table

Columns:

- team
- channel
- active agents
- occupancy
- contacts per agent
- CO2e per agent
- CO2e per productive hour

## 8. Root Causes page

This page should explain why contacts exist, not just which channel handled them.

### KPI cards

- `Top Contact Driver`
- `Top Driver Group`
- `Preventable Contact Rate`
- `CO2e from Preventable Drivers`
- `CO2e per Driver Case`
- `Highest-Impact Driver Group`

### Charts

#### Chart A: Contacts by driver group

Type:

- bar chart

Purpose:

Shows where service demand originates.

#### Chart B: CO2e by driver group

Type:

- bar or treemap

Purpose:

Shows which business causes generate the most digital load.

#### Chart C: Preventable vs non-preventable load

Type:

- stacked bar

Purpose:

Makes avoidable demand visible.

### Table

Columns:

- contact driver
- driver group
- contacts
- resolved cases
- preventable
- repeat contact rate
- CO2e by driver
- CO2e per case

This page is central for:

- root-cause analysis
- service design improvement
- showing that the product is not just a channel dashboard

## 9. Methodology page

This page is critical for trust.

It should explain:

- what is measured
- what is assumed
- confidence levels
- boundaries
- source-backed defaults

### Sections

- `System boundary`
- `Data sources`
- `Assumptions in use`
- `Metric confidence`
- `Formulas`

### Important UI elements

- visible assumption set id
- confidence labels on key metrics
- notes where customer-side data is estimated

## Demo dataset coverage

The dashboard should use the sample dataset to show at least:

- one call with queue, hold, transfer
- one email case with reopen and attachments
- one chatbot session that resolves and deflects a call
- one voice bot session with retry loops and human handover
- one callback object
- one transfer object
- one escalation object
- aggregated monthly metrics for trend views

## Drilldown behavior

The demo should support at least basic drilldown:

### From KPI card to detail view

Examples:

- click `CO2e from Queue Time`
- open call detail with queue-related records

- click `CO2e from Reopened Cases`
- open email cases marked as reopened

### From chart to filtered table

Examples:

- click `billing_team`
- filter calls and cases to billing records

## Baseline and comparison model

The dashboard should support:

- current period
- previous period
- baseline period

Minimum comparison labels:

- `vs previous`
- `vs baseline`

## Demo visual direction

The reference dashboard should feel:

- operational
- analytic
- trustworthy
- not overly “greenwashed”

Visual priorities:

- clean KPI cards
- strong use of tables and trend charts
- restrained CO2 highlighting
- methodology visible but not intrusive

## Minimum build scope for a first demo

If only one dashboard version is built first, the minimum should include:

### Required pages

- `Overview`
- `Calls`
- `Email`
- `Chatbot`
- `Methodology`

### Required widgets

- top KPI cards
- channel volume chart
- channel CO2 chart
- one driver breakdown chart per page
- one filtered detail table per page

## Recommended next artifacts

- `sample-output-metrics.json`
- `claims-and-disclaimers.md`
- `dashboard-component-list.md`
- final `README.md`
