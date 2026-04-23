const fs = require("fs");
const path = require("path");

const repoRoot = process.cwd();
const htmlPath = path.join(repoRoot, "demo", "demo-calculator-v2.html");
const reportPath = path.join(repoRoot, "reports", "calculator-tests", "calculator-fuzz-report.json");

function loadCalculatorApi() {
  const html = fs.readFileSync(htmlPath, "utf8");
  const start = html.indexOf("(function () {");
  const end = html.indexOf("const { calculateResults, cloneDefaults, mergeState } = window.DemoCalculatorV2;");
  if (start === -1 || end === -1) throw new Error("Calculator script block not found");
  const script = html.slice(start, end);
  const window = {};
  global.window = window;
  eval(script);
  return window.DemoCalculatorV2;
}

function mulberry32(seed) {
  return function rand() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function between(rand, min, max) {
  return min + (max - min) * rand();
}

function intBetween(rand, min, max) {
  return Math.round(between(rand, min, max));
}

function pick(rand, values) {
  return values[Math.floor(rand() * values.length)];
}

function buildRandomState(api, rand) {
  const s = api.cloneDefaults();

  s.boundary = pick(rand, ["provider", "interaction"]);
  s.assumptions.grid_factor = between(rand, 0.05, 0.95);
  s.assumptions.fixed_network = between(rand, 0.03, 1.2);
  s.assumptions.mobile_network = between(rand, 0.05, 2.2);
  s.assumptions.llm_kwh_per_turn = between(rand, 0.00001, 0.004);
  s.assumptions.voice_traffic_gb_per_min = between(rand, 0.0002, 0.006);
  s.assumptions.agent_device_power_w = between(rand, 20, 220);
  s.assumptions.customer_device_power_w = between(rand, 2, 30);
  s.assumptions.storage_kwh_per_gb_month = between(rand, 0.0001, 0.02);

  s.calls.call_resolved = intBetween(rand, 0, 3000000);
  s.calls.call_aht_min = between(rand, 0.5, 25);
  s.calls.call_queue_min = between(rand, 0, 12);
  s.calls.call_hold_min = between(rand, 0, 8);
  s.calls.call_acw_min = between(rand, 0, 8);
  s.calls.call_callback_retry_attempts = intBetween(rand, 0, 400000);
  s.calls.call_callback_retry_min = between(rand, 0, 6);
  s.calls.call_customer_network = pick(rand, ["fixed", "mobile"]);

  s.email.email_received = intBetween(rand, 0, 3000000);
  s.email.email_sent = intBetween(rand, 0, 2500000);
  s.email.email_resolved = intBetween(rand, 0, s.email.email_received);
  s.email.email_reopened_cases = intBetween(rand, 0, s.email.email_resolved);
  s.email.email_handling_min = between(rand, 0.2, 15);
  s.email.email_customer_read_min = between(rand, 0.1, 10);
  s.email.email_simple_size_gb = between(rand, 0.00001, 0.005);
  s.email.email_attachment_total_gb = between(rand, 0, 30000);
  s.email.email_storage_gb = between(rand, 0, 40000);
  s.email.email_retention_months = intBetween(rand, 0, 48);
  s.email.email_customer_network = pick(rand, ["fixed", "mobile"]);

  s.chatbot.chatbot_sessions = intBetween(rand, 0, 2000000);
  s.chatbot.chatbot_resolved_sessions = intBetween(rand, 0, s.chatbot.chatbot_sessions);
  const remainingChatbot = Math.max(0, s.chatbot.chatbot_sessions - s.chatbot.chatbot_resolved_sessions);
  s.chatbot.chatbot_escalated_sessions = intBetween(rand, 0, remainingChatbot);
  s.chatbot.chatbot_abandoned_sessions = intBetween(rand, 0, Math.max(0, remainingChatbot - s.chatbot.chatbot_escalated_sessions));
  s.chatbot.chatbot_avg_turns = between(rand, 0.5, 20);
  s.chatbot.chatbot_session_min = between(rand, 0.2, 15);
  s.chatbot.chatbot_deflected_calls = intBetween(rand, 0, s.chatbot.chatbot_resolved_sessions);
  s.chatbot.chatbot_deflected_emails = intBetween(rand, 0, s.chatbot.chatbot_resolved_sessions * 2);

  s.voice.voice_sessions = intBetween(rand, 0, 800000);
  s.voice.voice_resolved_sessions = intBetween(rand, 0, s.voice.voice_sessions);
  s.voice.voice_transferred_sessions = intBetween(rand, 0, s.voice.voice_sessions);
  s.voice.voice_duration_min = between(rand, 0.2, 12);
  s.voice.voice_retry_loops = between(rand, 0, 6);
  s.voice.voice_retry_penalty_min = between(rand, 0, 3);
  s.voice.voice_llm_turns = between(rand, 0, 12);
  s.voice.voice_customer_network = pick(rand, ["fixed", "mobile"]);

  s.cases_workforce.fcr = between(rand, 0.2, 0.98);
  s.cases_workforce.repeat_contact_rate = between(rand, 0, 0.6);
  s.cases_workforce.transfer_rate = between(rand, 0, 0.4);
  s.cases_workforce.escalation_rate = between(rand, 0, 0.35);
  s.cases_workforce.active_agent_count = intBetween(rand, 1, 1200);
  s.cases_workforce.scheduled_hours = intBetween(rand, 1, 120000);
  s.cases_workforce.productive_hours = intBetween(rand, 0, s.cases_workforce.scheduled_hours);
  const totalAgents = s.cases_workforce.active_agent_count;
  let remainingAgents = totalAgents;
  s.cases_workforce.call_team_agents = intBetween(rand, 0, remainingAgents);
  remainingAgents -= s.cases_workforce.call_team_agents;
  s.cases_workforce.email_team_agents = intBetween(rand, 0, remainingAgents);
  remainingAgents -= s.cases_workforce.email_team_agents;
  s.cases_workforce.chatbot_team_agents = intBetween(rand, 0, remainingAgents);
  remainingAgents -= s.cases_workforce.chatbot_team_agents;
  s.cases_workforce.voice_team_agents = intBetween(rand, 0, remainingAgents);

  s.root_causes.top_contact_driver = pick(rand, ["billing_issue", "order_status", "return_label", "password_reset"]);
  s.root_causes.billing_contacts = intBetween(rand, 0, 500000);
  s.root_causes.shipping_contacts = intBetween(rand, 0, 500000);
  s.root_causes.returns_contacts = intBetween(rand, 0, 500000);
  s.root_causes.authentication_contacts = intBetween(rand, 0, 500000);
  s.root_causes.billing_repeat_rate = between(rand, 0, 0.5);
  s.root_causes.shipping_repeat_rate = between(rand, 0, 0.5);
  s.root_causes.returns_repeat_rate = between(rand, 0, 0.5);
  s.root_causes.authentication_repeat_rate = between(rand, 0, 0.5);

  return s;
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

function findRedFlags(state, result) {
  const flags = [];
  const nonFinite = flattenNumbers(result).filter((item) => !Number.isFinite(item.value));
  nonFinite.forEach((item) => flags.push(`non-finite output at ${item.path}`));

  if (result.workforce.occupancy_rate > 1) flags.push("occupancy_rate exceeds 100%");
  if (result.email.reopen_rate > 1) flags.push("email reopen_rate exceeds 100%");
  if (result.chatbot.bot_containment_rate > 1) flags.push("chatbot containment exceeds 100%");
  if (result.voice_bot.voice_bot_transfer_rate > 1) flags.push("voice transfer rate exceeds 100%");
  if (result.root_causes.preventable_contact_rate > 1) flags.push("preventable_contact_rate exceeds 100%");

  if (state.chatbot.chatbot_resolved_sessions + state.chatbot.chatbot_escalated_sessions + state.chatbot.chatbot_abandoned_sessions > state.chatbot.chatbot_sessions) {
    flags.push("chatbot outcome counts exceed sessions");
  }
  if (state.email.email_reopened_cases > state.email.email_resolved) {
    flags.push("reopened email cases exceed resolved email cases");
  }
  if (state.cases_workforce.productive_hours > state.cases_workforce.scheduled_hours) {
    flags.push("productive hours exceed scheduled hours");
  }
  if (state.cases_workforce.call_team_agents + state.cases_workforce.email_team_agents + state.cases_workforce.chatbot_team_agents + state.cases_workforce.voice_team_agents > state.cases_workforce.active_agent_count) {
    flags.push("team agents exceed active agents");
  }

  if (result.calls.co2e_per_call_g < 0 || result.email.co2e_per_email_g < 0 || result.chatbot.co2e_per_chatbot_session_g < 0 || result.voice_bot.co2e_per_voice_bot_session_g < 0) {
    flags.push("negative direct channel intensity");
  }
  if (result.cases.cases_created < result.cases.cases_closed) {
    flags.push("cases_created lower than cases_closed");
  }
  if (result.workforce.co2e_per_agent_kg < 0 || result.workforce.co2e_per_productive_hour_g < 0) {
    flags.push("negative workforce intensity");
  }
  if (result.root_causes.driver_groups.some((item) => item.co2e_kg < 0 || item.co2e_per_case_g < 0)) {
    flags.push("negative root-cause intensity");
  }

  return flags;
}

function summarize(state, result) {
  return {
    total_kg: result.executive.total_estimated_co2e_kg,
    per_resolution_g: result.executive.co2e_per_resolution_g,
    calls_kg: result.calls.estimated_total_co2e_kg,
    email_kg: result.email.estimated_total_co2e_kg,
    chatbot_kg: result.chatbot.estimated_total_co2e_kg,
    voice_kg: result.voice_bot.estimated_total_co2e_kg,
    cases_created: result.cases.cases_created,
    occupancy_rate: result.workforce.occupancy_rate,
    preventable_rate: result.root_causes.preventable_contact_rate,
    state_excerpt: {
      call_resolved: state.calls.call_resolved,
      email_resolved: state.email.email_resolved,
      chatbot_sessions: state.chatbot.chatbot_sessions,
      voice_sessions: state.voice.voice_sessions,
      active_agents: state.cases_workforce.active_agent_count
    }
  };
}

function main() {
  const api = loadCalculatorApi();
  const rand = mulberry32(20260417);
  const runs = 1000;
  const flagged = [];

  for (let i = 0; i < runs; i += 1) {
    const state = buildRandomState(api, rand);
    const result = api.calculateResults(state);
    const flags = findRedFlags(state, result);
    if (flags.length > 0) {
      flagged.push({
        run: i + 1,
        flags,
        summary: summarize(state, result)
      });
    }
  }

  const report = {
    generated_at: new Date().toISOString(),
    runs,
    flagged_count: flagged.length,
    flagged_runs: flagged.slice(0, 100)
  };

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`Fuzz report written: ${reportPath}`);
  console.log(`Runs: ${runs}`);
  console.log(`Flagged runs: ${flagged.length}`);
  flagged.slice(0, 20).forEach((item) => console.log(`  - run ${item.run}: ${item.flags.join("; ")}`));
}

main();
