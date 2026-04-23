# Calculator Test Summary

Generated: 2026-04-23T16:27:04.441Z

## Overall Status

- HTML vs src parity checks: 20 tested, 0 failed
- Single-field regression checks: 66 tested, 0 unchanged
- Pairwise field checks: 285 tested, 0 unchanged
- Logic checks: 31 tested, 0 failed
- Edge-case checks: 6 tested, 0 failed
- Monotonic checks: 6 tested, 0 failed
- Scenario checks: 16 tested, 2 failed
- Core combination checks: 587 tested, 0 flagged
- Fuzz runs: 1000 tested, 0 flagged

## Interpretation

- The extracted src reference matches the inline HTML calculator on the checked outputs.
- All single fields and all tested field pairs currently affect the calculation output.
- The directional logic checks passed for the tested emissions drivers and efficiency metrics.
- The edge-case and monotonic sweeps passed.
- The realistic multi-field scenarios passed.
- The core 3-field, 4-field, and 5-field combination sweep across the main sections passed.
- Only intentionally invalid scenario inputs should fail, because they represent impossible operational states.

## Invalid Scenario Findings

- invalid.impossible_chatbot_mix: chatbot resolved + escalated + abandoned exceeds chatbot.sessions
- invalid.impossible_workforce_hours_and_staffing: workforce.productive_hours exceeds workforce.scheduled_hours; team agent totals exceed active_agent_count

## Scenario Warnings

- invalid.impossible_workforce_hours_and_staffing: workforce.occupancy_rate exceeds 100%

## Source Reports

- `calculator-parity-report.json`
- `calculator-field-regression-report.json`
- `calculator-scenario-report.json`
- `calculator-core-combinations-report.json`
- `calculator-fuzz-report.json`

## Caveat

- This test pack gives strong evidence of consistency and plausibility for the tested combinations, but it is not a formal proof for every possible input combination.
