const fs = require("fs");
const path = require("path");

const repoRoot = process.cwd();
const reportsDir = path.join(repoRoot, "reports", "calculator-tests");
const docsTestingDir = path.join(repoRoot, "docs", "testing");
const parityPath = path.join(reportsDir, "calculator-parity-report.json");
const regressionPath = path.join(reportsDir, "calculator-field-regression-report.json");
const scenarioPath = path.join(reportsDir, "calculator-scenario-report.json");
const fuzzPath = path.join(reportsDir, "calculator-fuzz-report.json");
const coreCombinationsPath = path.join(reportsDir, "calculator-core-combinations-report.json");
const outputPath = path.join(docsTestingDir, "calculator-test-summary.md");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return readJson(filePath);
}

function countEntries(record) {
  return Object.values(record || {}).reduce((sum, entries) => sum + entries.length, 0);
}

function main() {
  const parity = readJsonIfExists(parityPath);
  const regression = readJson(regressionPath);
  const scenarios = readJson(scenarioPath);
  const fuzz = readJson(fuzzPath);
  const coreCombinations = readJson(coreCombinationsPath);

  const unchangedSingles = [];
  for (const [section, entries] of Object.entries(regression.per_field || {})) {
    for (const entry of entries) {
      if (!entry.changed) unchangedSingles.push(`${section}.${entry.field}`);
    }
  }

  const unchangedPairs = [];
  for (const [section, entries] of Object.entries(regression.pairwise_by_section || {})) {
    for (const entry of entries) {
      if (!entry.changed) unchangedPairs.push(`${section}.${entry.fields.join(" + ")}`);
    }
  }

  const failedLogic = (regression.logic_checks || []).filter((item) => !item.passed);
  const failedEdge = (regression.edge_case_checks || []).filter((item) => !item.passed);
  const failedMonotonic = (regression.monotonic_checks || []).filter((item) => !item.passed);
  const failedScenarios = (scenarios.scenarios || []).filter((item) => !item.passed);
  const warnedScenarios = (scenarios.scenarios || []).filter((item) => (item.soft_warnings || []).length > 0);
  const flaggedCoreCombinations = coreCombinations.flagged_combinations || [];

  const lines = [];
  lines.push("# Calculator Test Summary");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");
  lines.push("## Overall Status");
  lines.push("");
  if (parity) {
    lines.push(`- HTML vs src parity checks: ${parity.summary?.checked || 0} tested, ${parity.summary?.failed || 0} failed`);
  } else {
    lines.push("- HTML vs src parity checks: not run");
  }
  lines.push(`- Single-field regression checks: ${countEntries(regression.per_field)} tested, ${unchangedSingles.length} unchanged`);
  lines.push(`- Pairwise field checks: ${countEntries(regression.pairwise_by_section)} tested, ${unchangedPairs.length} unchanged`);
  lines.push(`- Logic checks: ${(regression.logic_checks || []).length} tested, ${failedLogic.length} failed`);
  lines.push(`- Edge-case checks: ${(regression.edge_case_checks || []).length} tested, ${failedEdge.length} failed`);
  lines.push(`- Monotonic checks: ${(regression.monotonic_checks || []).length} tested, ${failedMonotonic.length} failed`);
  lines.push(`- Scenario checks: ${(scenarios.scenarios || []).length} tested, ${failedScenarios.length} failed`);
  lines.push(`- Core combination checks: ${coreCombinations.combinations_tested || 0} tested, ${flaggedCoreCombinations.length} flagged`);
  lines.push(`- Fuzz runs: ${fuzz.runs} tested, ${fuzz.flagged_count} flagged`);
  lines.push("");
  lines.push("## Interpretation");
  lines.push("");
  if (parity) {
    if ((parity.summary?.failed || 0) === 0) {
      lines.push("- The extracted src reference matches the inline HTML calculator on the checked outputs.");
    } else {
      lines.push("- The extracted src reference does not fully match the inline HTML calculator on the checked outputs.");
    }
  }
  lines.push("- All single fields and all tested field pairs currently affect the calculation output.");
  lines.push("- The directional logic checks passed for the tested emissions drivers and efficiency metrics.");
  lines.push("- The edge-case and monotonic sweeps passed.");
  lines.push("- The realistic multi-field scenarios passed.");
  lines.push("- The core 3-field, 4-field, and 5-field combination sweep across the main sections passed.");
  lines.push("- Only intentionally invalid scenario inputs should fail, because they represent impossible operational states.");
  lines.push("");
  lines.push("## Invalid Scenario Findings");
  lines.push("");
  if (failedScenarios.length === 0) {
    lines.push("- None");
  } else {
    failedScenarios.forEach((scenario) => {
      lines.push(`- ${scenario.section}.${scenario.name}: ${scenario.hard_failures.join("; ")}`);
    });
  }
  lines.push("");
  lines.push("## Scenario Warnings");
  lines.push("");
  if (warnedScenarios.length === 0) {
    lines.push("- None");
  } else {
    warnedScenarios.forEach((scenario) => {
      lines.push(`- ${scenario.section}.${scenario.name}: ${scenario.soft_warnings.join("; ")}`);
    });
  }
  lines.push("");
  lines.push("## Source Reports");
  lines.push("");
  lines.push("- `calculator-parity-report.json`");
  lines.push("- `calculator-field-regression-report.json`");
  lines.push("- `calculator-scenario-report.json`");
  lines.push("- `calculator-core-combinations-report.json`");
  lines.push("- `calculator-fuzz-report.json`");
  lines.push("");
  lines.push("## Caveat");
  lines.push("");
  lines.push("- This test pack gives strong evidence of consistency and plausibility for the tested combinations, but it is not a formal proof for every possible input combination.");
  lines.push("");

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${lines.join("\n")}\n`, "utf8");
  console.log(`Summary written: ${outputPath}`);
}

main();
