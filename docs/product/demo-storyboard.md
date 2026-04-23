# Demo Storyboard

## Purpose

This document defines what the demo should prove and how a viewer should move through it.

The goal is to prevent the dashboard from becoming a collection of interesting screens without a clear product narrative.

## Primary demo objective

The demo should prove:

`Customer service operations can be measured as a normal performance system, with an additional CO2 layer that reveals inefficiency, staffing intensity, and root causes behind avoidable demand.`

## What the demo is not trying to prove

The demo is not trying to prove:

- exact carbon accounting
- universal emissions factors
- every possible service workflow at once

It should stay focused on:

- operational visibility
- root-cause intelligence
- explainable CO2 estimation

## Main product story

The product story should be:

1. `Service leaders already manage volume, quality, and efficiency`
2. `This system adds estimated CO2 impact to those same workflows`
3. `The real value is not only channel comparison`
4. `The real value is identifying avoidable demand and structurally expensive handling patterns`

## Top user questions the demo should answer

### 1. What is driving our customer service CO2 impact?

The answer should be visible immediately.

### 2. Which channels are operationally and environmentally expensive?

This should be visible in the first operational layer.

### 3. Which teams or staffing structures are carrying the most load?

This should be visible in the workforce layer.

### 4. Which contact reasons are preventable and creating unnecessary demand?

This should be visible in the root-cause layer.

## Recommended information hierarchy

### Level 1: Executive summary

Visible immediately on `Overview`.

Should answer:

- total estimated CO2e
- biggest avoidable load
- strongest automation win
- strongest preventable demand signal

### Level 2: Operational channels

Visible in:

- `Calls`
- `Email`
- `Chatbot`
- `Voice Bot`

Should answer:

- where the load sits
- what causes inefficiency
- where improvement reduces both cost and impact

### Level 3: Structural interpretation

Visible in:

- `Workforce`
- `Root Causes`
- `Methodology`

Should answer:

- whether impact is driven by staffing structure
- whether impact is driven by preventable contact demand
- how trustworthy the estimate is

## Hero metrics

These should be the main metrics the demo leads with.

- `Total Estimated CO2e`
- `CO2e per Resolution`
- `AHT`
- `FCR`
- `Reopen Rate`
- `Bot Containment`
- `CO2e per Agent`
- `Preventable Contact Rate`

## Supporting metrics

These should appear one layer below hero metrics.

- `Queue Time`
- `Hold Time`
- `Attachment CO2e`
- `Retry Loop Rate`
- `CO2e per Productive Hour`
- `Top Driver Group`
- `CO2e from Reopened Cases`
- `CO2e from Callback Retries`

## Detail metrics

These should support drilldown, not dominate the first read.

- `ASR/TTS-related impact`
- `storage-specific assumptions`
- `driver_group by team`
- `driver_group by channel`
- `taxonomy mapping examples`

## Core demo use cases

The demo should make these use cases easy to see:

### Use case 1: Lower AHT reduces impact

Proof point:

- calls are high-intensity
- lower AHT reduces per-call impact

### Use case 2: Lower reopen rate reduces email load

Proof point:

- reopen loops create avoidable email-related CO2

### Use case 3: Chatbot deflection can reduce load

Proof point:

- automation creates a cost
- but successful deflection lowers total impact

### Use case 4: Preventable demand is the biggest strategic lever

Proof point:

- root-cause groups explain where avoidable contact volume originates

### Use case 5: Workforce structure matters

Proof point:

- high-impact teams are not always the highest-volume teams

## Recommended click path

The demo should support a simple narrative path:

### Step 1: Start on Overview

Goal:

- understand total impact
- see key opportunities

### Step 2: Open Calls or Email

Goal:

- see how channel inefficiency creates impact

### Step 3: Open Workforce

Goal:

- see whether staffing structure amplifies impact

### Step 4: Open Root Causes

Goal:

- see why the contacts exist in the first place

### Step 5: Open Methodology

Goal:

- understand assumptions and confidence

## Recommended visual emphasis before the next demo pass

Before more UI work, the demo should clearly emphasize:

### Must feel primary

- total impact
- avoidable load
- preventable demand
- workforce intensity

### Must feel secondary

- low-level methodological detail
- edge-case channel metrics
- deep taxonomy examples

## What a viewer should remember after the demo

The single takeaway should be:

`This is not just a greener dashboard for service KPIs. It is a system for seeing where customer service demand, staffing, and contact causes create avoidable digital load.`

## Next decisions before another dashboard pass

Before another major UI adjustment, decide:

1. is `root cause` or `channel performance` the main product wedge?
2. is `workforce` a core tab or an advanced tab?
3. which 3 hero insights must always be visible without clicking?
4. do we want the overview to feel more executive or more operational?
