const fs = require("fs");
const path = require("path");

const repoRoot = process.cwd();
const htmlPath = path.join(repoRoot, "demo", "demo-calculator-v2.html");
const reportPath = path.join(repoRoot, "reports", "calculator-tests", "calculator-scenario-report.json");

function loadCalculatorApi() {
  const html = fs.readFileSync(htmlPath, "utf8");
  const start = html.indexOf("(function () {");
  const end = html.indexOf("const { calculateResults, cloneDefaults, mergeState } = window.DemoCalculatorV2;");
  if (start === -1 || end === -1) {
    throw new Error("Could not locate calculator script block in demo-calculator-v2.html");
  }
  const script = html.slice(start, end);
  const window = {};
  global.window = window;
  eval(script);
  return window.DemoCalculatorV2;
}

function setByPath(obj, dottedPath, value) {
  const parts = dottedPath.split(".");
  let cursor = obj;
  for (let i = 0; i < parts.length - 1; i += 1) cursor = cursor[parts[i]];
  cursor[parts[parts.length - 1]] = value;
}

function flattenNumbers(value, prefix = "", out = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => flattenNumbers(item, `${prefix}[${index}]`, out));
    return out;
  }
  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, nested]) => flattenNumbers(nested, prefix ? `${prefix}.${key}` : key, out));
    return out;
  }
  if (typeof value === "number") out.push({ path: prefix, value });
  return out;
}

function checkFinite(result) {
  return flattenNumbers(result).filter((item) => !Number.isFinite(item.value));
}

function checkUnexpectedNegatives(result) {
  const allowedNegativePrefixes = [
    "chatbot.net_avoided_co2e_kg",
    "drivers",
    "executive.avoided_co2e_vs_baseline_kg",
    "baseline_comparison.delta_total_estimated_co2e_kg",
    "baseline_comparison.delta_total_estimated_co2e_pct",
    "baseline_comparison.delta_aht_min",
    "baseline_comparison.delta_reopen_rate",
    "baseline_comparison.delta_bot_containment_rate"
  ];
  return flattenNumbers(result).filter((item) => {
    if (item.value >= 0) return false;
    return !allowedNegativePrefixes.some((prefix) => item.path.startsWith(prefix));
  });
}

function buildScenarioSummary(result) {
  return {
    total_kg: result.executive.total_estimated_co2e_kg,
    per_resolution_g: result.executive.co2e_per_resolution_g,
    calls_kg: result.calls.estimated_total_co2e_kg,
    email_kg: result.email.estimated_total_co2e_kg,
    chatbot_kg: result.chatbot.estimated_total_co2e_kg,
    voice_kg: result.voice_bot.estimated_total_co2e_kg,
    cases_created: result.cases.cases_created,
    co2e_per_agent_kg: result.workforce.co2e_per_agent_kg,
    preventable_rate: result.root_causes.preventable_contact_rate
  };
}

function evaluateInputConsistency(state) {
  const issues = [];

  if (state.chatbot.chatbot_resolved_sessions > state.chatbot.chatbot_sessions) {
    issues.push("chatbot.resolved_sessions exceeds chatbot.sessions");
  }
  if (state.chatbot.chatbot_escalated_sessions + state.chatbot.chatbot_abandoned_sessions + state.chatbot.chatbot_resolved_sessions > state.chatbot.chatbot_sessions) {
    issues.push("chatbot resolved + escalated + abandoned exceeds chatbot.sessions");
  }
  if (state.voice.voice_resolved_sessions > state.voice.voice_sessions) {
    issues.push("voice.resolved_sessions exceeds voice.sessions");
  }
  if (state.voice.voice_transferred_sessions > state.voice.voice_sessions) {
    issues.push("voice.transferred_sessions exceeds voice.sessions");
  }
  if (state.email.email_reopened_cases > state.email.email_resolved) {
    issues.push("email.reopened_cases exceeds email.resolved");
  }
  if (state.cases_workforce.productive_hours > state.cases_workforce.scheduled_hours) {
    issues.push("workforce.productive_hours exceeds workforce.scheduled_hours");
  }
  if (state.cases_workforce.call_team_agents + state.cases_workforce.email_team_agents + state.cases_workforce.chatbot_team_agents + state.cases_workforce.voice_team_agents > state.cases_workforce.active_agent_count) {
    issues.push("team agent totals exceed active_agent_count");
  }

  return issues;
}

function scenarioDefinitions() {
  return [
    {
      section: "assumptions",
      name: "low_energy",
      apply(state) {
        state.assumptions.grid_factor = 0.08;
        state.assumptions.fixed_network = 0.08;
        state.assumptions.mobile_network = 0.12;
        state.assumptions.llm_kwh_per_turn = 0.00005;
        state.assumptions.voice_traffic_gb_per_min = 0.0005;
      }
    },
    {
      section: "assumptions",
      name: "extreme_energy",
      apply(state) {
        state.assumptions.grid_factor = 0.9;
        state.assumptions.fixed_network = 1.2;
        state.assumptions.mobile_network = 2.1;
        state.assumptions.llm_kwh_per_turn = 0.003;
        state.assumptions.voice_traffic_gb_per_min = 0.005;
      }
    },
    {
      section: "calls",
      name: "low_volume_fast_ops",
      apply(state) {
        state.calls.call_resolved = 2000;
        state.calls.call_aht_min = 3.2;
        state.calls.call_queue_min = 0.2;
        state.calls.call_hold_min = 0.1;
        state.calls.call_acw_min = 0.5;
        state.calls.call_callback_retry_attempts = 20;
        state.calls.call_callback_retry_min = 0.4;
      }
    },
    {
      section: "calls",
      name: "extreme_volume_high_friction",
      apply(state) {
        state.calls.call_resolved = 2500000;
        state.calls.call_aht_min = 18;
        state.calls.call_queue_min = 7;
        state.calls.call_hold_min = 3.5;
        state.calls.call_acw_min = 4;
        state.calls.call_callback_retry_attempts = 400000;
        state.calls.call_callback_retry_min = 5;
      }
    },
    {
      section: "email",
      name: "lean_email_flow",
      apply(state) {
        state.email.email_sent = 12000;
        state.email.email_received = 13000;
        state.email.email_resolved = 11800;
        state.email.email_reopened_cases = 150;
        state.email.email_handling_min = 1.8;
        state.email.email_attachment_total_gb = 4;
        state.email.email_storage_gb = 4;
      }
    },
    {
      section: "email",
      name: "attachment_heavy_backlog",
      apply(state) {
        state.email.email_sent = 1800000;
        state.email.email_received = 2200000;
        state.email.email_resolved = 1200000;
        state.email.email_reopened_cases = 300000;
        state.email.email_handling_min = 11;
        state.email.email_attachment_total_gb = 18000;
        state.email.email_storage_gb = 22000;
        state.email.email_retention_months = 36;
      }
    },
    {
      section: "chatbot",
      name: "high_containment",
      apply(state) {
        state.chatbot.chatbot_sessions = 500000;
        state.chatbot.chatbot_resolved_sessions = 420000;
        state.chatbot.chatbot_escalated_sessions = 50000;
        state.chatbot.chatbot_abandoned_sessions = 30000;
        state.chatbot.chatbot_avg_turns = 4;
        state.chatbot.chatbot_session_min = 2.5;
      }
    },
    {
      section: "chatbot",
      name: "extreme_failure_mix",
      apply(state) {
        state.chatbot.chatbot_sessions = 1200000;
        state.chatbot.chatbot_resolved_sessions = 120000;
        state.chatbot.chatbot_escalated_sessions = 700000;
        state.chatbot.chatbot_abandoned_sessions = 350000;
        state.chatbot.chatbot_avg_turns = 14;
        state.chatbot.chatbot_session_min = 9;
      }
    },
    {
      section: "voice",
      name: "efficient_voicebot",
      apply(state) {
        state.voice.voice_sessions = 50000;
        state.voice.voice_resolved_sessions = 30000;
        state.voice.voice_transferred_sessions = 12000;
        state.voice.voice_duration_min = 1.6;
        state.voice.voice_retry_loops = 0.3;
        state.voice.voice_retry_penalty_min = 0.1;
        state.voice.voice_llm_turns = 1.5;
      }
    },
    {
      section: "voice",
      name: "extreme_retry_handover",
      apply(state) {
        state.voice.voice_sessions = 450000;
        state.voice.voice_resolved_sessions = 60000;
        state.voice.voice_transferred_sessions = 260000;
        state.voice.voice_duration_min = 8;
        state.voice.voice_retry_loops = 4.5;
        state.voice.voice_retry_penalty_min = 1.8;
        state.voice.voice_llm_turns = 9;
      }
    },
    {
      section: "cases_workforce",
      name: "well_staffed_low_friction",
      apply(state) {
        state.cases_workforce.fcr = 0.88;
        state.cases_workforce.repeat_contact_rate = 0.03;
        state.cases_workforce.transfer_rate = 0.02;
        state.cases_workforce.escalation_rate = 0.01;
        state.cases_workforce.active_agent_count = 420;
        state.cases_workforce.scheduled_hours = 50000;
        state.cases_workforce.productive_hours = 39000;
        state.cases_workforce.call_team_agents = 120;
        state.cases_workforce.email_team_agents = 150;
        state.cases_workforce.chatbot_team_agents = 80;
        state.cases_workforce.voice_team_agents = 50;
      }
    },
    {
      section: "cases_workforce",
      name: "understaffed_high_friction",
      apply(state) {
        state.cases_workforce.fcr = 0.42;
        state.cases_workforce.repeat_contact_rate = 0.32;
        state.cases_workforce.transfer_rate = 0.22;
        state.cases_workforce.escalation_rate = 0.18;
        state.cases_workforce.active_agent_count = 80;
        state.cases_workforce.scheduled_hours = 14000;
        state.cases_workforce.productive_hours = 13000;
        state.cases_workforce.call_team_agents = 25;
        state.cases_workforce.email_team_agents = 25;
        state.cases_workforce.chatbot_team_agents = 15;
        state.cases_workforce.voice_team_agents = 10;
      }
    },
    {
      section: "root_causes",
      name: "mostly_preventable_demand",
      apply(state) {
        state.root_causes.billing_contacts = 250000;
        state.root_causes.shipping_contacts = 220000;
        state.root_causes.returns_contacts = 20000;
        state.root_causes.authentication_contacts = 180000;
        state.root_causes.billing_repeat_rate = 0.24;
        state.root_causes.shipping_repeat_rate = 0.2;
        state.root_causes.returns_repeat_rate = 0.04;
        state.root_causes.authentication_repeat_rate = 0.22;
      }
    },
    {
      section: "root_causes",
      name: "returns_heavy_non_preventable",
      apply(state) {
        state.root_causes.billing_contacts = 30000;
        state.root_causes.shipping_contacts = 45000;
        state.root_causes.returns_contacts = 320000;
        state.root_causes.authentication_contacts = 18000;
        state.root_causes.billing_repeat_rate = 0.08;
        state.root_causes.shipping_repeat_rate = 0.06;
        state.root_causes.returns_repeat_rate = 0.25;
        state.root_causes.authentication_repeat_rate = 0.09;
      }
    },
    {
      section: "invalid",
      name: "impossible_chatbot_mix",
      apply(state) {
        state.chatbot.chatbot_sessions = 1000;
        state.chatbot.chatbot_resolved_sessions = 700;
        state.chatbot.chatbot_escalated_sessions = 400;
        state.chatbot.chatbot_abandoned_sessions = 200;
      }
    },
    {
      section: "invalid",
      name: "impossible_workforce_hours_and_staffing",
      apply(state) {
        state.cases_workforce.active_agent_count = 50;
        state.cases_workforce.call_team_agents = 30;
        state.cases_workforce.email_team_agents = 25;
        state.cases_workforce.chatbot_team_agents = 20;
        state.cases_workforce.voice_team_agents = 15;
        state.cases_workforce.scheduled_hours = 1000;
        state.cases_workforce.productive_hours = 1500;
      }
    }
  ];
}

function evaluateScenario(state, result) {
  const finiteIssues = checkFinite(result).map((item) => `non-finite output at ${item.path}`);
  const negativeIssues = checkUnexpectedNegatives(result).map((item) => `unexpected negative output at ${item.path}`);
  const inputIssues = evaluateInputConsistency(state);
  const softWarnings = [];

  if (result.calls.co2e_per_call_g > 5000) softWarnings.push("calls.co2e_per_call_g is extremely high");
  if (result.email.co2e_per_email_g > 2000) softWarnings.push("email.co2e_per_email_g is extremely high");
  if (result.chatbot.co2e_per_chatbot_session_g > 500) softWarnings.push("chatbot.co2e_per_chatbot_session_g is extremely high");
  if (result.voice_bot.co2e_per_voice_bot_session_g > 5000) softWarnings.push("voice_bot.co2e_per_voice_bot_session_g is extremely high");
  if (result.workforce.occupancy_rate > 1) softWarnings.push("workforce.occupancy_rate exceeds 100%");
  if (result.email.reopen_rate > 1) softWarnings.push("email.reopen_rate exceeds 100%");
  if (result.chatbot.bot_containment_rate > 1) softWarnings.push("chatbot.bot_containment_rate exceeds 100%");
  if (result.voice_bot.voice_bot_transfer_rate > 1) softWarnings.push("voice_bot.voice_bot_transfer_rate exceeds 100%");
  if (result.root_causes.preventable_contact_rate > 1) softWarnings.push("root_causes.preventable_contact_rate exceeds 100%");

  return {
    hard_failures: [...finiteIssues, ...negativeIssues, ...inputIssues],
    soft_warnings: softWarnings,
    summary: buildScenarioSummary(result)
  };
}

function main() {
  const api = loadCalculatorApi();
  const baseline = api.calculateResults(api.cloneDefaults());
  const scenarios = scenarioDefinitions();

  const report = {
    generated_at: new Date().toISOString(),
    source_file: "demo-calculator-v2.html",
    baseline: buildScenarioSummary(baseline),
    scenarios: []
  };

  for (const scenario of scenarios) {
    const state = api.cloneDefaults();
    scenario.apply(state);
    const result = api.calculateResults(state);
    const evaluation = evaluateScenario(state, result);
    report.scenarios.push({
      section: scenario.section,
      name: scenario.name,
      passed: evaluation.hard_failures.length === 0,
      hard_failures: evaluation.hard_failures,
      soft_warnings: evaluation.soft_warnings,
      summary: evaluation.summary
    });
  }

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  const failed = report.scenarios.filter((item) => !item.passed);
  const warned = report.scenarios.filter((item) => item.soft_warnings.length > 0);
  console.log(`Scenario report written: ${reportPath}`);
  console.log(`Failed scenarios: ${failed.length}`);
  failed.forEach((item) => console.log(`  - ${item.section}.${item.name}`));
  console.log(`Scenario warnings: ${warned.length}`);
  warned.slice(0, 20).forEach((item) => console.log(`  - ${item.section}.${item.name}: ${item.soft_warnings.join("; ")}`));
}

main();
