# Contact Driver Taxonomy

## Purpose

This document defines how contact drivers should be modeled so that different companies can use their own service taxonomy while still enabling root-cause analysis.

The key challenge is:

- every company names and structures contact reasons differently

This project should therefore not hard-code one universal taxonomy.

It should support:

- company-specific labels
- normalized grouping
- preventability analysis
- root-cause reporting

## Design principle

Treat contact drivers as a flexible taxonomy with two layers:

1. `source taxonomy`
2. `normalized taxonomy`

This allows a company to keep its own language while still using the product consistently.

## Layer 1: Source taxonomy

This is the company's original structure from CRM, ticketing, or telephony systems.

Examples:

- `invoice_missing`
- `where_is_my_order`
- `password_reset`
- `cancel_membership`
- `refund_delay`

These labels may come from:

- case reason fields
- dispositions
- queue tags
- agent coding
- AI classification

## Layer 2: Normalized taxonomy

This is the product-side grouping used for reporting.

Examples:

- `billing`
- `shipping`
- `authentication`
- `returns`
- `technical_issue`
- `account_management`
- `product_question`

This is the level where cross-team and root-cause reporting becomes possible.

## Recommended taxonomy model

Use four fields, not just one:

- `driver_code`
- `driver_name`
- `driver_group`
- `driver_hierarchy`

### `driver_code`

Stable machine-readable id.

Example:

- `BILL_01`
- `SHIP_04`
- `AUTH_02`

### `driver_name`

Human-readable company label.

Example:

- `Invoice not received`
- `Where is my order`
- `Password reset`

### `driver_group`

Normalized reporting group.

Example:

- `billing`
- `shipping`
- `authentication`

### `driver_hierarchy`

Optional deeper hierarchy for organizations with complex service structures.

Recommended levels:

- `level_1`
- `level_2`
- `level_3`

Example:

- `level_1 = billing`
- `level_2 = invoicing`
- `level_3 = invoice_not_received`

## Why hierarchy matters

Different organizations need different reporting depth.

Examples:

### Simple organization

- `billing`
- `shipping`
- `returns`

### More complex organization

- `billing > invoicing > invoice_missing`
- `billing > payment > failed_charge`
- `shipping > tracking > where_is_my_order`
- `shipping > delivery_failure > address_issue`

The model should support both.

## Recommended classification attributes

Each driver should support additional analytical flags.

### Preventability

- `is_preventable`

This is one of the most valuable fields in the whole product.

It supports:

- avoidable demand analysis
- avoidable CO2 analysis
- operations strategy

### Root-cause type

- `is_policy_driven`
- `is_process_driven`
- `is_product_driven`
- `is_information_gap`
- `is_compliance_driven`
- `is_external_dependency`

These fields allow the dashboard to show not only contact reasons, but also what kind of organizational failure or dependency is behind them.

### Journey-stage classification

- `journey_stage`

Examples:

- `pre_purchase`
- `post_purchase`
- `delivery`
- `billing`
- `returns`
- `account_access`

This helps explain where the demand originates in the customer lifecycle.

## Recommended source-to-normalized mapping

The product should support a mapping table like this:

| Source value | Driver code | Driver name | Driver group | Level 1 | Level 2 | Preventable |
|---|---|---|---|---|---|---|
| `invoice_missing` | `BILL_01` | Invoice not received | `billing` | `billing` | `invoicing` | `true` |
| `duplicate_invoice` | `BILL_02` | Duplicate invoice | `billing` | `billing` | `invoicing` | `true` |
| `where_is_my_order` | `SHIP_01` | Where is my order | `shipping` | `shipping` | `tracking` | `true` |
| `password_reset` | `AUTH_01` | Password reset | `authentication` | `account_access` | `authentication` | `true` |
| `return_label_request` | `RET_01` | Return label request | `returns` | `returns` | `logistics` | `false` |

## How drivers should enter the model

There should be multiple assignment paths:

### 1. Source-system native

Best option when the source already has structured case reasons.

### 2. Agent tagging

Useful where frontline teams classify contact reasons manually.

### 3. Rule-based classification

Useful for mapping queue names, dispositions, or keywords.

### 4. AI classification

Useful when source taxonomies are weak or inconsistent.

AI should assign:

- `driver_name`
- `driver_group`
- optional confidence score

But the normalized structure should still be explicit and reviewable.

## Recommended confidence model for drivers

### High confidence

- native source field with stable meaning
- validated mapping table

### Medium confidence

- agent tagging
- rules based on queue, category, or disposition

### Low confidence

- inferred from text with limited validation

## Root-cause reporting views enabled by this structure

### 1. Driver group view

Examples:

- `billing`
- `shipping`
- `authentication`

Useful for executive and cross-team reporting.

### 2. Specific driver view

Examples:

- `invoice_not_received`
- `where_is_my_order`
- `password_reset`

Useful for improvement teams.

### 3. Preventable demand view

Examples:

- preventable vs non-preventable
- CO2 from preventable demand
- repeat contacts from preventable demand

### 4. Driver x channel view

Examples:

- `password_reset` mostly in `call`
- `where_is_my_order` mostly in `email`
- `invoice_missing` concentrated in `voice_bot handovers`

This is strategically important because it shows whether a contact reason is being handled in an unnecessarily expensive channel.

### 5. Driver x team view

Examples:

- billing team absorbs high preventable document contacts
- auth team absorbs high-friction login cases

## Recommended minimum taxonomy for MVP

Do not start too deep.

Recommended normalized groups:

- `billing`
- `shipping`
- `returns`
- `authentication`
- `technical_issue`
- `account_management`
- `product_question`
- `other`

Recommended fields:

- `driver_code`
- `driver_name`
- `driver_group`
- `is_preventable`

This is enough to make the dashboard useful.

## Recommended advanced taxonomy for later

Add:

- `driver_group_level_1`
- `driver_group_level_2`
- `journey_stage`
- root-cause-type flags
- AI confidence

## Common taxonomy mistakes

- using only free text with no normalization
- creating too many granular drivers too early
- mixing channel names and contact reasons
- mixing resolution type and contact reason
- treating every source field as equally trustworthy

## Practical rule

The product should allow every company to keep its own contact reason labels, but always require mapping into a normalized reporting structure.

That is the only way to make root-cause analysis stable.

## What this enables in the dashboard

With a good taxonomy, the dashboard can show:

- top driver groups
- top preventable drivers
- CO2 by driver group
- repeat contact rate by driver
- which teams and channels carry preventable load

That is the bridge from reporting to operational change.
