const fs = require("fs");
const path = require("path");

const repoRoot = process.cwd();
const htmlPath = path.join(repoRoot, "demo", "demo-calculator-v2.html");
const srcPath = path.join(repoRoot, "src", "demo-calculator-v2.js");
const reportPath = path.join(repoRoot, "reports", "calculator-tests", "calculator-parity-report.json");

function loadHtmlApi() {
  const html = fs.readFileSync(htmlPath, "utf8");
  const start = html.indexOf("(function () {");
  const end = html.indexOf("const { calculateResults, cloneDefaults, mergeState } = window.DemoCalculatorV2;");
  if (start === -1 || end === -1) throw new Error("Calculator script block not found in HTML");
  const script = html.slice(start, end);
  const win = {};
  global.window = win;
  eval(script); // eslint-disable-line no-eval
  if (!win.DemoCalculatorV2) throw new Error("DemoCalculatorV2 not exposed after eval");
  return win.DemoCalculatorV2;
}

function loadSrcApi() {
  const savedWindow = global.window;
  global.window = {};
  require(srcPath);
  const api = global.window.DemoCalculatorV2;
  global.window = savedWindow;
  if (!api) throw new Error("DemoCalculatorV2 not exposed from src/");
  return api;
}

function round3(value) {
  return Math.round((Number(value) || 0) * 1000) / 1000;
}

const CHECKED_PATHS = [
  ["executive", "total_estimated_co2e_kg"],
  ["calls", "estimated_total_co2e_kg"],
  ["calls", "co2e_per_call_g"],
  ["calls", "co2e_per_callback_retry_g"],
  ["calls", "co2e_from_queue_time_kg"],
  ["calls", "co2e_from_callback_retries_kg"],
  ["email", "estimated_total_co2e_kg"],
  ["email", "co2e_per_email_g"],
  ["email", "co2e_from_reopened_email_cases_kg"],
  ["email", "co2e_from_unresolved_backlog_kg"],
  ["chatbot", "estimated_total_co2e_kg"],
  ["chatbot", "co2e_per_chatbot_session_g"],
  ["chatbot", "co2e_added_by_escalated_sessions_kg"],
  ["chatbot", "co2e_added_by_abandoned_sessions_kg"],
  ["chatbot", "net_avoided_co2e_kg"],
  ["voice_bot", "estimated_total_co2e_kg"],
  ["voice_bot", "co2e_per_voice_bot_session_g"],
  ["voice_bot", "co2e_from_retry_loops_kg"],
  ["voice_bot", "co2e_added_by_voice_to_agent_handover_kg"],
  ["voice_bot", "co2e_from_resolution_overhead_kg"]
];

function main() {
  const htmlApi = loadHtmlApi();
  const srcApi = loadSrcApi();

  const defaults = htmlApi.cloneDefaults();
  const htmlResult = htmlApi.calculateResults(defaults);
  const srcResult = srcApi.calculateResults(srcApi.cloneDefaults());

  const checks = [];
  let passed = 0;
  let failed = 0;

  for (const [section, field] of CHECKED_PATHS) {
    const htmlVal = round3(htmlResult[section]?.[field]);
    const srcVal = round3(srcResult[section]?.[field]);
    const ok = htmlVal === srcVal;
    checks.push({ section, field, html: htmlVal, src: srcVal, match: ok });
    if (ok) passed += 1;
    else failed += 1;
  }

  const report = {
    generated: new Date().toISOString(),
    source_files: { html: htmlPath, src: srcPath },
    summary: { checked: checks.length, passed, failed },
    checks
  };

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  checks.forEach(({ section, field, html, src, match }) => {
    const status = match ? "PASS" : "FAIL";
    const detail = match ? "" : `  html=${html}  src=${src}`;
    console.log(`  [${status}] ${section}.${field}${detail}`);
  });

  console.log(`\nParity: ${passed}/${checks.length} fields match`);
  console.log(`Report written: ${reportPath}`);

  if (failed > 0) {
    console.error(`\n${failed} parity failure(s) — src/ and HTML are out of sync`);
    process.exit(1);
  }
}

main();
