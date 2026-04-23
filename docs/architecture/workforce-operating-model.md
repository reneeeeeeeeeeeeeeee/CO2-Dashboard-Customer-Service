# Workforce Operating Model

## Purpose

This document defines how workforce structure should be modeled in the project.

The goal is not only to measure channel activity.
The goal is to understand how staffing structure, channel allocation, and contact drivers interact.

This model supports questions such as:

- which teams carry the highest impact
- whether impact is driven by volume, queue design, or workforce mix
- whether preventable contact drivers are landing in expensive channels
- whether blended teams distribute work efficiently

## Design principle

Do not model workforce as:

- `one agent = one channel`

That is too simplistic for real customer service operations.

Instead, model workforce across:

1. `organization structure`
2. `channel allocation`
3. `time and productivity`
4. `contact-driver fit`

## Layer 1: Organization structure

This layer describes where service work sits organizationally.

### Recommended entities

- `Agent`
- `Team`
- `Queue`
- `SkillGroup`
- `Location`

### Practical meaning

#### `Agent`

An individual worker.
This should be optional in the MVP because some companies will not want or be able to expose person-level data.

#### `Team`

The primary management unit.
This should be a first-class reporting dimension.

Examples:

- `billing_team`
- `returns_team`
- `technical_support`
- `digital_service`

#### `Queue`

The routing and workload unit.

Examples:

- `billing_queue`
- `voice_auth_queue`
- `priority_email_queue`

#### `SkillGroup`

Used when agents are trained for certain issue types rather than channels only.

Examples:

- `billing_specialists`
- `returns_processing`
- `authentication_support`

## Layer 2: Channel allocation

This layer describes how capacity is distributed across channels.

This is critical because real support teams are often blended.

### Recommended entity

`AgentChannelAllocation`

### Core fields

- `allocation_id`
- `period_start`
- `period_end`
- `agent_id` or `team_id`
- `channel`
- `allocation_percent`
- `primary_channel`

### Why this matters

Examples:

- one team may work `70% call` and `30% email`
- another may be `chatbot escalation + email`
- a digital team may own `chatbot` but still receive spillover cases

Without channel allocation, the model will over-simplify staffing and CO2 interpretation.

## Layer 3: Time and productivity

This layer describes how workforce time is used.

### Recommended entity

`AgentCapacityPeriod`

This can be modeled at:

- agent level
- or team level for simpler adoption

### Core fields

- `capacity_period_id`
- `period_start`
- `period_end`
- `agent_id` or `team_id`
- `scheduled_hours`
- `productive_hours`
- `occupancy_rate`
- `shrinkage_rate`
- `training_hours`
- `meeting_hours`
- `documentation_hours`
- `available_idle_hours`
- `avg_system_count`
- `device_type`
- `work_mode`

### Why this matters

This is the layer that separates:

- high demand
- low productivity
- structurally expensive workflows

It allows metrics such as:

- `contacts per agent`
- `cases per agent`
- `CO2e per productive hour`
- `CO2e per staffed hour`

## Layer 4: Contact-driver fit

This layer connects service demand to workforce structure.

### Recommended entity

`TeamDriverProfile`

### Core fields

- `team_driver_profile_id`
- `period_start`
- `period_end`
- `team_id`
- `queue_id`
- `contact_driver_group`
- `contacts`
- `resolved_cases`
- `repeat_contact_rate`
- `preventable_contact_rate`
- `estimated_co2e_kg`

### Why this matters

This is what makes the product more than a channel dashboard.

It allows questions such as:

- which team absorbs the most preventable demand
- which driver group creates the most CO2 in premium channels
- where policy or process failures are overloading staffing

## Recommended minimum operating model for MVP

Do not start with full per-agent modeling.

Start with team- and queue-level reporting.

### Minimum entities

- `Team`
- `Queue`
- `AgentBase` or team-level capacity period
- `contact_driver_group`
- `channel`

### Minimum fields

- `team_id`
- `queue_id`
- `channel`
- `active_agent_count`
- `scheduled_hours`
- `productive_hours`
- `occupancy_rate`
- `contacts`
- `resolved_cases`
- `contact_driver_group`
- `estimated_co2e_kg`

### This already enables

- `CO2e per agent`
- `CO2e per productive hour`
- `contacts per agent`
- `cases per agent`
- `driver-group CO2 by team`
- `which teams process preventable contact`

## Blended-agent logic

Many service organizations use blended agents.

Examples:

- morning on `calls`, afternoon on `email`
- `voice + callback`
- `chat + escalation handling`

Do not force a single permanent channel assignment.

Preferred logic:

- allocate by reporting period
- express allocation as a percentage

Example:

- `team_a`
- `period = 2026-04`
- `call = 0.60`
- `email = 0.25`
- `chat_human = 0.15`

This allows:

- more realistic workforce CO2 attribution
- better channel economics

## Recommended reporting views

### Workforce summary

Shows:

- active agents
- scheduled hours
- productive hours
- occupancy
- contacts per agent
- CO2e per agent
- CO2e per productive hour

### Team intensity view

Shows:

- team
- channel mix
- driver mix
- CO2e intensity

### Driver-to-team view

Shows:

- contact driver group
- top handling team
- channel used
- repeat contact rate
- CO2e by team and driver

## Root-cause interpretation logic

This model should support three interpretations:

### 1. Demand-driven impact

The team is carbon-intensive because it receives a lot of legitimate demand.

### 2. Process-driven impact

The team is carbon-intensive because of reopens, retries, transfers, queue time, or failed automation.

### 3. Misrouted or preventable impact

The team is carbon-intensive because avoidable contact drivers are landing in expensive channels or specialist teams.

## Privacy recommendation

Do not make person-level workforce tracking mandatory.

Default to:

- team-level
- queue-level
- period-level

Agent-level data should be:

- optional
- documented
- privacy-aware

## Recommended next schema additions

Potential future entities:

- `agent`
- `team`
- `queue`
- `skill_group`
- `agent_channel_allocation`
- `agent_capacity_period`
- `team_driver_profile`

For the current version, team-level implementation is enough.

## What this changes in the product

With this operating model, the product can answer:

- `Which teams are operationally and environmentally most expensive?`
- `Which driver groups are creating avoidable staffing load?`
- `Are we overusing high-cost channels for preventable issues?`
- `Where should we fix demand instead of optimizing handling?`

That is much stronger than:

- `calls produce more CO2 than emails`
