# Calculator CS Manual Checklist

This checklist is for a customer service, operations, or product person who wants to validate that the calculator behaves plausibly in the browser.

Reference target:

- [demo-calculator-v2.html](../../demo/demo-calculator-v2.html)

## Scope

This checklist is intentionally short and high-signal.
It does not replace the scripted validation in `scripts/calculator-tests`.

## Before You Start

- open the calculator in a browser
- click `Load Demo Defaults`
- note the initial `Estimated total CO2e`
- switch once between `Provider-side` and `Provider + customer` to confirm the boundary toggle reacts

## Priority 1: Global Smoke Checks

- Click `Load Demo Defaults` and confirm the page shows non-zero results.
- Click `Clear All` and confirm totals drop to zero or near-zero and the UI does not break.
- Click `Load Demo Defaults` again and confirm the same baseline is restored.
- Export input JSON and output JSON once and confirm files are generated.
- Click `Calculate All` and confirm the summary and section cards update without errors.

## Priority 2: Boundary Checks

- With demo defaults loaded, compare `Provider-side` against `Provider + customer`.
- Confirm call and email totals do not become smaller when the broader boundary is selected.
- Confirm the boundary pill and summary copy update correctly.

## Priority 3: Calls

- Increase `Resolved Calls` and confirm `Total Calls CO2e` rises.
- Increase `Avg Handle Time`, `Queue Time`, and `Hold Time` one by one and confirm the relevant output increases.
- Set `Resolved Calls` to `0`, keep callback retries above `0`, and click `Calculate`.
- Confirm the summary switches to the callback-retry view instead of showing broken call metrics.

## Priority 4: Email

- Raise `Emails Received` well above `Emails Resolved` and confirm `Backlog CO2e` rises.
- Raise `Reopened Cases` and confirm `Reopen CO2e` rises.
- Raise `Attachment Transfer`, `Stored Email Or Attachment`, and `Retention Months` and confirm storage-related output rises.
- Try `Reopened Cases > Resolved Emails` and confirm the result is visibly questionable or treated as invalid in a future guardrail flow.

## Priority 5: Chatbot

- Raise `Sessions` and confirm `Total Chatbot CO2e` rises.
- Raise `Avg Turns` and confirm `CO2e / Session` rises.
- Raise `Resolved Sessions` and confirm `Containment` rises.
- Enter an impossible mix where `resolved + escalated + abandoned > sessions` and confirm the calculator still renders, but note this as an invalid operational input.

## Priority 6: Voice Bot

- Raise `Voice Sessions` and confirm `Total Voice CO2e` rises.
- Raise `Retry Loops` and `Retry Penalty Min` and confirm retry CO2e rises.
- Raise `Transferred Sessions` and confirm transfer-related voice impact rises.
- Try `Transferred Sessions > Sessions` and note whether the UI prevents it or merely calculates it.

## Priority 7: Cases And Workforce

- Raise `Repeat Contact Rate` and `Escalation Rate` and confirm `Repeat Contact CO2e` rises.
- Raise `Active Agent Count` and confirm `CO2e / Agent` falls.
- Raise `Productive Hours` while keeping staffing fixed and confirm `CO2e / productive hour` behavior stays plausible.
- Try `Productive Hours > Scheduled Hours` and confirm this is treated as an invalid operational state.
- Try team totals above active agents and confirm this is treated as an invalid operational state.

## Priority 8: Root Causes

- Raise `Billing Contacts` and confirm the billing group impact rises.
- Raise one repeat rate sharply and confirm the top driver or preventable-demand metrics shift.
- Confirm the top group changes when a different driver clearly dominates.

## Good Manual Scenario Set

Run these six scenarios end to end:

1. low-friction baseline
2. calls friction month
3. email backlog month
4. high-containment chatbot month
5. voice retry and transfer month
6. understaffed high-friction month

## What To Flag

Flag the result if you see any of these:

- a higher load input reduces the related total without a good reason
- a ratio goes above `100%`
- a CO2e component becomes negative unexpectedly
- the top driver does not change after a large driver-group change
- the summary card shows the wrong section focus
- boundary switching does not change boundary-sensitive results

