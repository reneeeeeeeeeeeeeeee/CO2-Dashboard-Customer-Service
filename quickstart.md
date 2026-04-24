# Quickstart

## Goal

This quickstart helps you understand the repository and test the model with the lowest possible setup effort.

The fastest path is:

1. inspect the V2 calculator
2. inspect the static demo output
3. inspect the schema
4. map your own exports later

## 1. Open the demo

Open:

- [demo-dashboard.html](./demo/demo-dashboard.html)
- [demo-calculator-v2.html](./demo/demo-calculator-v2.html)

These two demos serve different roles.

- `V2` (`demo-calculator-v2.html`) is the interactive calculator. Use it if you want to test live assumptions and see calculated output change in real time.
- `V1` (`demo-dashboard.html`) is the static reference dashboard. Use it if you want to review the product framing and KPI output structure.

If you are a developer and want to understand how `V2` works technically, do not stop at the HTML demo.
Start with:

- [src/demo-calculator-v2.js](./src/demo-calculator-v2.js) for the calculation core
- [demo/demo-calculator-v2.html](./demo/demo-calculator-v2.html) for the current self-contained demo shell
- [scripts/calculator-tests/](./scripts/calculator-tests/) for the validation approach and current HTML-vs-`src/` coupling

## 2. Review the sample output metrics

Open:

- [sample-output-metrics.json](./data/demo/sample-output-metrics.json)

This file is the pre-calculated output used by the static dashboard demo (`V1`).
It is useful if you want to inspect the output shape without using the live calculator.

It shows the kind of output the model is expected to produce for:

- overview
- channels
- root causes
- workforce
- methodology

## 3. Review the core model

Open:

- [canonical-schema-v0.1.md](./docs/schemas/canonical-schema-v0.1.md)
- [typescript-types-v0.1.ts](./docs/schemas/typescript-types-v0.1.ts)

These define the canonical customer service data model.

## 4. Review the CO2 approach

Open:

- [customer-service-co2-model.md](./docs/methodology/customer-service-co2-model.md)
- [claims-and-disclaimers.md](./docs/methodology/claims-and-disclaimers.md)

This explains:

- how estimates are derived
- what assumptions are used
- how claims should be phrased

## 5. Review the stricter THG extension

If you want to understand how the repository can evolve from an operational CS model into a stricter greenhouse-gas data structure, open:

- [final-thg-data-schema-v0.1.md](./docs/schemas/final-thg-data-schema-v0.1.md)

Use this document when you want to distinguish between:

- operational activity data
- emission factors
- gas-specific GWP data
- source references
- calculated emissions

## 6. Review the reference workbook material

If you want to inspect the factor logic and source context behind the stricter THG layer, review:

- [carbon_footprint_ict_quellen.xlsx](./data/reference/carbon_footprint_ict_quellen.xlsx)
- [carbon_footprint_ict_sources_en.xlsx](./data/reference/carbon_footprint_ict_sources_en.xlsx)
- [final-thg-data-schema-v0.1.md](./docs/schemas/final-thg-data-schema-v0.1.md)

These files are useful as reference material and design input.
They are not yet a complete company inventory.

## 7. Choose an adoption path

### Easiest path

Use CSV exports.

The current CSV templates are intentionally focused on the recommended first implementation scope:

- `calls`
- `email`
- `chatbot`
- normalized `contact_driver_group`

`voice_bot`, richer `workforce`, and more detailed `root causes` should usually be added after the first channel mapping is stable.

See:

- [data-requirements-by-channel.md](./docs/integration/data-requirements-by-channel.md)

### More advanced path

Use event-level or warehouse data.

See:

- [adapter-mapping-guide.md](./docs/integration/adapter-mapping-guide.md)
- [connector-sdk-interface.md](./docs/integration/connector-sdk-interface.md)

## 8. Start with a small scope

Recommended first scope:

- `calls`
- `email`
- `chatbot`
- normalized `contact_driver_group`

This is enough to test the most important product logic.
Add `voice_bot`, `workforce`, and deeper root-cause modeling later.

## 9. Use the implementation docs

For practical rollout guidance, read:

- [implementation-guide.md](./docs/integration/implementation-guide.md)
- [workforce-operating-model.md](./docs/architecture/workforce-operating-model.md)
- [contact-driver-taxonomy.md](./docs/methodology/contact-driver-taxonomy.md)

## 10. Validate the calculator

If you want to test the demo more systematically, use:

- [calculator-test-matrix.md](./docs/testing/calculator-test-matrix.md)
- [calculator-cs-manual-checklist.md](./docs/testing/calculator-cs-manual-checklist.md)

If you have Node.js available, you can also run:

- `npm run test:calculator:all`

For demo exploration:

- `V2` is best for live assumption testing

## Recommended first questions

When testing the project, ask:

- which contact drivers create the most preventable load
- which channels are operationally expensive
- whether automation creates net savings
- whether staffing intensity changes the picture

## What to do next

After the quick review:

1. export a small sample from your service tools
2. compare your fields to the channel requirements
3. map them into the canonical structure
4. decide whether you only need the operational CS model or also the stricter THG structure
5. apply an assumption set
6. generate your first baseline
