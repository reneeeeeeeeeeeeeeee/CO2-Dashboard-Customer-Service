const fs = require("fs");
const path = require("path");

const repoRoot = process.cwd();
const htmlPath = path.join(repoRoot, "demo", "demo-calculator-v2.html");
const reportPath = path.join(repoRoot, "reports", "calculator-tests", "calculator-field-regression-report.json");

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
  if (!window.DemoCalculatorV2) {
    throw new Error("DemoCalculatorV2 API not found after evaluating script");
  }
  return window.DemoCalculatorV2;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getByPath(obj, dottedPath) {
  return dottedPath.split(".").reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

function setByPath(obj, dottedPath, value) {
  const parts = dottedPath.split(".");
  let cursor = obj;
  for (let i = 0; i < parts.length - 1; i += 1) {
    cursor = cursor[parts[i]];
  }
  cursor[parts[parts.length - 1]] = value;
}

function flattenLeaves(value, currentPath = "", out = {}) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      flattenLeaves(item, `${currentPath}[${index}]`, out);
    });
    return out;
  }

  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, nested]) => {
      flattenLeaves(nested, currentPath ? `${currentPath}.${key}` : key, out);
    });
    return out;
  }

  out[currentPath] = value;
  return out;
}

function collectDiffs(baseResult, nextResult) {
  const baseFlat = flattenLeaves(baseResult);
  const nextFlat = flattenLeaves(nextResult);
  const allPaths = new Set([...Object.keys(baseFlat), ...Object.keys(nextFlat)]);
  const diffs = [];

  for (const key of allPaths) {
    const before = baseFlat[key];
    const after = nextFlat[key];
    if (before === after) continue;
    diffs.push({ path: key, before, after });
  }

  return diffs;
}

function mutateValue(value, fieldName) {
  if (typeof value === "number") {
    if (fieldName.includes("rate") || fieldName === "fcr") {
      return Math.max(0, Math.min(1, value >= 0.8 ? value - 0.15 : value + 0.15));
    }
    if (value === 0) return 1;
    if (value < 1) return Number((value * 1.5).toFixed(4));
    if (Number.isInteger(value)) return value + Math.max(1, Math.round(value * 0.35));
    return Number((value * 1.5).toFixed(3));
  }

  if (typeof value === "string") {
    if (value === "fixed") return "mobile";
    if (value === "mobile") return "fixed";
    if (value === "interaction") return "provider";
    if (value === "provider") return "interaction";
    return `${value}_variant`;
  }

  return value;
}

function summarizeTopDiffs(diffs, limit = 8) {
  return diffs
    .filter((item) => typeof item.before !== "object" && typeof item.after !== "object")
    .slice(0, limit);
}

function evaluateLogicChecks(api) {
  const checks = [];

  function addCheck(name, mutate, predicate, details) {
    const baseState = api.cloneDefaults();
    const nextState = api.cloneDefaults();
    const baseResult = api.calculateResults(baseState);
    mutate(nextState);
    const nextResult = api.calculateResults(nextState);
    checks.push({
      name,
      passed: Boolean(predicate(baseResult, nextResult)),
      details: details(baseResult, nextResult)
    });
  }

  addCheck(
    "assumptions.grid_factor_should_increase_total_footprint",
    (state) => { state.assumptions.grid_factor *= 1.4; },
    (base, next) => next.executive.total_estimated_co2e_kg > base.executive.total_estimated_co2e_kg,
    (base, next) => ({
      before_total_kg: base.executive.total_estimated_co2e_kg,
      after_total_kg: next.executive.total_estimated_co2e_kg
    })
  );

  addCheck(
    "assumptions.llm_energy_should_increase_chatbot_and_voice",
    (state) => { state.assumptions.llm_kwh_per_turn *= 2; },
    (base, next) => next.chatbot.estimated_total_co2e_kg > base.chatbot.estimated_total_co2e_kg
      && next.voice_bot.estimated_total_co2e_kg > base.voice_bot.estimated_total_co2e_kg,
    (base, next) => ({
      before_chatbot_kg: base.chatbot.estimated_total_co2e_kg,
      after_chatbot_kg: next.chatbot.estimated_total_co2e_kg,
      before_voice_kg: base.voice_bot.estimated_total_co2e_kg,
      after_voice_kg: next.voice_bot.estimated_total_co2e_kg
    })
  );

  addCheck(
    "assumptions.voice_traffic_should_increase_calls_and_voice",
    (state) => { state.assumptions.voice_traffic_gb_per_min *= 1.8; },
    (base, next) => next.calls.estimated_total_co2e_kg > base.calls.estimated_total_co2e_kg
      && next.voice_bot.estimated_total_co2e_kg > base.voice_bot.estimated_total_co2e_kg,
    (base, next) => ({
      before_calls_kg: base.calls.estimated_total_co2e_kg,
      after_calls_kg: next.calls.estimated_total_co2e_kg,
      before_voice_kg: base.voice_bot.estimated_total_co2e_kg,
      after_voice_kg: next.voice_bot.estimated_total_co2e_kg
    })
  );

  addCheck(
    "assumptions.storage_factor_should_increase_email_storage_component",
    (state) => { state.assumptions.storage_kwh_per_gb_month *= 2; },
    (base, next) => next.email.co2e_from_attachment_storage_kg > base.email.co2e_from_attachment_storage_kg,
    (base, next) => ({
      before_storage_kg: base.email.co2e_from_attachment_storage_kg,
      after_storage_kg: next.email.co2e_from_attachment_storage_kg
    })
  );

  addCheck(
    "chatbot.resolved_sessions_should_not_reduce_total_chatbot_co2",
    (state) => { state.chatbot.chatbot_resolved_sessions += 50000; },
    (base, next) => next.chatbot.estimated_total_co2e_kg >= base.chatbot.estimated_total_co2e_kg,
    (base, next) => ({
      before_total_kg: base.chatbot.estimated_total_co2e_kg,
      after_total_kg: next.chatbot.estimated_total_co2e_kg,
      before_per_resolution_g: base.chatbot.co2e_per_chatbot_resolution_g,
      after_per_resolution_g: next.chatbot.co2e_per_chatbot_resolution_g
    })
  );

  addCheck(
    "chatbot.resolved_sessions_should_improve_containment",
    (state) => { state.chatbot.chatbot_resolved_sessions += 50000; },
    (base, next) => next.chatbot.bot_containment_rate > base.chatbot.bot_containment_rate,
    (base, next) => ({
      before_containment: base.chatbot.bot_containment_rate,
      after_containment: next.chatbot.bot_containment_rate
    })
  );

  addCheck(
    "calls.callback_retries_should_increase_call_total",
    (state) => {
      state.calls.call_callback_retry_attempts += 5000;
      state.calls.call_callback_retry_min += 2;
    },
    (base, next) => next.calls.estimated_total_co2e_kg > base.calls.estimated_total_co2e_kg,
    (base, next) => ({
      before_total_kg: base.calls.estimated_total_co2e_kg,
      after_total_kg: next.calls.estimated_total_co2e_kg
    })
  );

  addCheck(
    "calls.handle_time_should_increase_call_total",
    (state) => { state.calls.call_aht_min += 3; },
    (base, next) => next.calls.estimated_total_co2e_kg > base.calls.estimated_total_co2e_kg,
    (base, next) => ({
      before_total_kg: base.calls.estimated_total_co2e_kg,
      after_total_kg: next.calls.estimated_total_co2e_kg
    })
  );

  addCheck(
    "calls.queue_time_should_increase_queue_component",
    (state) => { state.calls.call_queue_min += 2; },
    (base, next) => next.calls.co2e_from_queue_time_kg > base.calls.co2e_from_queue_time_kg,
    (base, next) => ({
      before_queue_kg: base.calls.co2e_from_queue_time_kg,
      after_queue_kg: next.calls.co2e_from_queue_time_kg
    })
  );

  addCheck(
    "calls.hold_time_should_increase_hold_component",
    (state) => { state.calls.call_hold_min += 1.5; },
    (base, next) => next.calls.co2e_from_hold_time_kg > base.calls.co2e_from_hold_time_kg,
    (base, next) => ({
      before_hold_kg: base.calls.co2e_from_hold_time_kg,
      after_hold_kg: next.calls.co2e_from_hold_time_kg
    })
  );

  addCheck(
    "email.reopened_cases_should_increase_email_total",
    (state) => { state.email.email_reopened_cases += 50000; },
    (base, next) => next.email.estimated_total_co2e_kg > base.email.estimated_total_co2e_kg,
    (base, next) => ({
      before_total_kg: base.email.estimated_total_co2e_kg,
      after_total_kg: next.email.estimated_total_co2e_kg
    })
  );

  addCheck(
    "email.handling_time_should_increase_email_total",
    (state) => { state.email.email_handling_min += 4; },
    (base, next) => next.email.estimated_total_co2e_kg > base.email.estimated_total_co2e_kg,
    (base, next) => ({
      before_total_kg: base.email.estimated_total_co2e_kg,
      after_total_kg: next.email.estimated_total_co2e_kg
    })
  );

  addCheck(
    "email.resolved_cases_should_increase_email_total",
    (state) => { state.email.email_resolved += 80000; },
    (base, next) => next.email.estimated_total_co2e_kg > base.email.estimated_total_co2e_kg,
    (base, next) => ({
      before_total_kg: base.email.estimated_total_co2e_kg,
      after_total_kg: next.email.estimated_total_co2e_kg
    })
  );

  addCheck(
    "email.storage_volume_should_increase_storage_component",
    (state) => { state.email.email_storage_gb *= 2; },
    (base, next) => next.email.co2e_from_attachment_storage_kg > base.email.co2e_from_attachment_storage_kg,
    (base, next) => ({
      before_storage_kg: base.email.co2e_from_attachment_storage_kg,
      after_storage_kg: next.email.co2e_from_attachment_storage_kg
    })
  );

  addCheck(
    "chatbot.sessions_should_increase_total_chatbot_co2",
    (state) => { state.chatbot.chatbot_sessions += 100000; },
    (base, next) => next.chatbot.estimated_total_co2e_kg > base.chatbot.estimated_total_co2e_kg,
    (base, next) => ({
      before_total_kg: base.chatbot.estimated_total_co2e_kg,
      after_total_kg: next.chatbot.estimated_total_co2e_kg
    })
  );

  addCheck(
    "chatbot.avg_turns_should_increase_per_session_co2",
    (state) => { state.chatbot.chatbot_avg_turns += 4; },
    (base, next) => next.chatbot.co2e_per_chatbot_session_g > base.chatbot.co2e_per_chatbot_session_g,
    (base, next) => ({
      before_per_session_g: base.chatbot.co2e_per_chatbot_session_g,
      after_per_session_g: next.chatbot.co2e_per_chatbot_session_g
    })
  );

  addCheck(
    "chatbot.escalated_sessions_should_increase_total_chatbot_co2",
    (state) => { state.chatbot.chatbot_escalated_sessions += 70000; },
    (base, next) => next.chatbot.estimated_total_co2e_kg > base.chatbot.estimated_total_co2e_kg,
    (base, next) => ({
      before_total_kg: base.chatbot.estimated_total_co2e_kg,
      after_total_kg: next.chatbot.estimated_total_co2e_kg
    })
  );

  addCheck(
    "chatbot.abandoned_sessions_should_increase_total_chatbot_co2",
    (state) => { state.chatbot.chatbot_abandoned_sessions += 50000; },
    (base, next) => next.chatbot.estimated_total_co2e_kg > base.chatbot.estimated_total_co2e_kg,
    (base, next) => ({
      before_total_kg: base.chatbot.estimated_total_co2e_kg,
      after_total_kg: next.chatbot.estimated_total_co2e_kg
    })
  );

  addCheck(
    "voice.sessions_should_increase_voice_total",
    (state) => { state.voice.voice_sessions += 60000; },
    (base, next) => next.voice_bot.estimated_total_co2e_kg > base.voice_bot.estimated_total_co2e_kg,
    (base, next) => ({
      before_total_kg: base.voice_bot.estimated_total_co2e_kg,
      after_total_kg: next.voice_bot.estimated_total_co2e_kg
    })
  );

  addCheck(
    "voice.duration_should_increase_voice_total",
    (state) => { state.voice.voice_duration_min += 2; },
    (base, next) => next.voice_bot.estimated_total_co2e_kg > base.voice_bot.estimated_total_co2e_kg,
    (base, next) => ({
      before_total_kg: base.voice_bot.estimated_total_co2e_kg,
      after_total_kg: next.voice_bot.estimated_total_co2e_kg
    })
  );

  addCheck(
    "voice.llm_turns_should_increase_voice_total",
    (state) => { state.voice.voice_llm_turns += 5; },
    (base, next) => next.voice_bot.estimated_total_co2e_kg > base.voice_bot.estimated_total_co2e_kg,
    (base, next) => ({
      before_total_kg: base.voice_bot.estimated_total_co2e_kg,
      after_total_kg: next.voice_bot.estimated_total_co2e_kg
    })
  );

  addCheck(
    "voice.transfers_should_increase_handover_component",
    (state) => { state.voice.voice_transferred_sessions += 30000; },
    (base, next) => next.voice_bot.co2e_added_by_voice_to_agent_handover_kg > base.voice_bot.co2e_added_by_voice_to_agent_handover_kg,
    (base, next) => ({
      before_handover_kg: base.voice_bot.co2e_added_by_voice_to_agent_handover_kg,
      after_handover_kg: next.voice_bot.co2e_added_by_voice_to_agent_handover_kg
    })
  );

  addCheck(
    "voice.retry_loops_should_increase_voice_total",
    (state) => {
      state.voice.voice_retry_loops += 2;
      state.voice.voice_retry_penalty_min += 0.6;
    },
    (base, next) => next.voice_bot.estimated_total_co2e_kg > base.voice_bot.estimated_total_co2e_kg,
    (base, next) => ({
      before_total_kg: base.voice_bot.estimated_total_co2e_kg,
      after_total_kg: next.voice_bot.estimated_total_co2e_kg
    })
  );

  addCheck(
    "workforce.active_agents_should_reduce_co2_per_agent",
    (state) => { state.cases_workforce.active_agent_count += 80; },
    (base, next) => next.workforce.co2e_per_agent_kg < base.workforce.co2e_per_agent_kg,
    (base, next) => ({
      before_per_agent_kg: base.workforce.co2e_per_agent_kg,
      after_per_agent_kg: next.workforce.co2e_per_agent_kg
    })
  );

  addCheck(
    "workforce.productive_hours_should_reduce_co2_per_productive_hour",
    (state) => { state.cases_workforce.productive_hours += 8000; },
    (base, next) => next.workforce.co2e_per_productive_hour_g < base.workforce.co2e_per_productive_hour_g,
    (base, next) => ({
      before_per_hour_g: base.workforce.co2e_per_productive_hour_g,
      after_per_hour_g: next.workforce.co2e_per_productive_hour_g
    })
  );

  addCheck(
    "workforce.transfer_rate_should_increase_cases_created",
    (state) => { state.cases_workforce.transfer_rate += 0.12; },
    (base, next) => next.cases.cases_created > base.cases.cases_created,
    (base, next) => ({
      before_cases_created: base.cases.cases_created,
      after_cases_created: next.cases.cases_created
    })
  );

  addCheck(
    "workforce.escalation_rate_should_increase_repeat_contact_co2",
    (state) => { state.cases_workforce.escalation_rate += 0.12; },
    (base, next) => next.cases.co2e_from_repeat_contacts_kg > base.cases.co2e_from_repeat_contacts_kg,
    (base, next) => ({
      before_repeat_kg: base.cases.co2e_from_repeat_contacts_kg,
      after_repeat_kg: next.cases.co2e_from_repeat_contacts_kg
    })
  );

  addCheck(
    "workforce.fcr_should_reduce_cases_created_when_improved",
    (state) => { state.cases_workforce.fcr = Math.min(0.95, state.cases_workforce.fcr + 0.12); },
    (base, next) => next.cases.cases_created < base.cases.cases_created,
    (base, next) => ({
      before_cases_created: base.cases.cases_created,
      after_cases_created: next.cases.cases_created
    })
  );

  addCheck(
    "root_causes.more_billing_contacts_should_increase_billing_group_co2",
    (state) => { state.root_causes.billing_contacts += 120000; },
    (base, next) => {
      const before = base.root_causes.driver_groups.find((item) => item.driver_group === "billing");
      const after = next.root_causes.driver_groups.find((item) => item.driver_group === "billing");
      return after.co2e_kg > before.co2e_kg;
    },
    (base, next) => {
      const before = base.root_causes.driver_groups.find((item) => item.driver_group === "billing");
      const after = next.root_causes.driver_groups.find((item) => item.driver_group === "billing");
      return {
        before_billing_kg: before.co2e_kg,
        after_billing_kg: after.co2e_kg
      };
    }
  );

  addCheck(
    "root_causes.more_non_preventable_returns_should_reduce_preventable_rate",
    (state) => { state.root_causes.returns_contacts += 150000; },
    (base, next) => next.root_causes.preventable_contact_rate < base.root_causes.preventable_contact_rate,
    (base, next) => ({
      before_rate: base.root_causes.preventable_contact_rate,
      after_rate: next.root_causes.preventable_contact_rate
    })
  );

  addCheck(
    "root_causes.higher_billing_repeat_rate_should_increase_billing_case_intensity",
    (state) => { state.root_causes.billing_repeat_rate = Math.min(0.95, state.root_causes.billing_repeat_rate + 0.2); },
    (base, next) => {
      const before = base.root_causes.driver_groups.find((item) => item.driver_group === "billing");
      const after = next.root_causes.driver_groups.find((item) => item.driver_group === "billing");
      return after.co2e_per_case_g > before.co2e_per_case_g;
    },
    (base, next) => {
      const before = base.root_causes.driver_groups.find((item) => item.driver_group === "billing");
      const after = next.root_causes.driver_groups.find((item) => item.driver_group === "billing");
      return {
        before_per_case_g: before.co2e_per_case_g,
        after_per_case_g: after.co2e_per_case_g
      };
    }
  );

  return checks;
}

function evaluateEdgeCaseChecks(api) {
  const checks = [];

  function addCheck(name, mutate, predicate, details) {
    const state = api.cloneDefaults();
    mutate(state);
    const result = api.calculateResults(state);
    checks.push({
      name,
      passed: Boolean(predicate(result)),
      details: details(result)
    });
  }

  function finiteLeaves(value, prefix = "", out = []) {
    if (Array.isArray(value)) {
      value.forEach((item, index) => finiteLeaves(item, `${prefix}[${index}]`, out));
      return out;
    }
    if (value && typeof value === "object") {
      Object.entries(value).forEach(([key, nested]) => finiteLeaves(nested, prefix ? `${prefix}.${key}` : key, out));
      return out;
    }
    if (typeof value === "number" && !Number.isFinite(value)) out.push(prefix);
    return out;
  }

  addCheck(
    "edge.zero_workforce_agents_should_not_produce_non_finite_values",
    (state) => {
      state.cases_workforce.active_agent_count = 0;
      state.cases_workforce.call_team_agents = 0;
      state.cases_workforce.email_team_agents = 0;
      state.cases_workforce.chatbot_team_agents = 0;
      state.cases_workforce.voice_team_agents = 0;
    },
    (result) => finiteLeaves(result).length === 0,
    (result) => ({ non_finite_paths: finiteLeaves(result) })
  );

  addCheck(
    "edge.zero_productive_hours_should_not_produce_non_finite_values",
    (state) => {
      state.cases_workforce.productive_hours = 0;
      state.cases_workforce.scheduled_hours = 0;
    },
    (result) => finiteLeaves(result).length === 0,
    (result) => ({ non_finite_paths: finiteLeaves(result) })
  );

  addCheck(
    "edge.zero_chatbot_resolved_should_not_break_resolution_metrics",
    (state) => { state.chatbot.chatbot_resolved_sessions = 0; },
    (result) => Number.isFinite(result.chatbot.co2e_per_chatbot_resolution_g),
    (result) => ({ co2e_per_chatbot_resolution_g: result.chatbot.co2e_per_chatbot_resolution_g })
  );

  addCheck(
    "edge.zero_voice_resolved_should_not_break_resolution_metrics",
    (state) => { state.voice.voice_resolved_sessions = 0; },
    (result) => Number.isFinite(result.voice_bot.co2e_per_voice_bot_resolution_g),
    (result) => ({ co2e_per_voice_bot_resolution_g: result.voice_bot.co2e_per_voice_bot_resolution_g })
  );

  addCheck(
    "edge.zero_email_resolved_should_not_break_reopen_rate",
    (state) => { state.email.email_resolved = 0; },
    (result) => Number.isFinite(result.email.reopen_rate),
    (result) => ({ reopen_rate: result.email.reopen_rate })
  );

  addCheck(
    "edge_zero_channel_inputs_should_zero_channel_totals",
    (state) => {
      state.calls.call_resolved = 0;
      state.calls.call_callback_retry_attempts = 0;
      state.calls.call_callback_retry_min = 0;
      state.email.email_sent = 0;
      state.email.email_received = 0;
      state.email.email_resolved = 0;
      state.email.email_reopened_cases = 0;
      state.email.email_attachment_total_gb = 0;
      state.email.email_storage_gb = 0;
      state.chatbot.chatbot_sessions = 0;
      state.chatbot.chatbot_resolved_sessions = 0;
      state.chatbot.chatbot_escalated_sessions = 0;
      state.chatbot.chatbot_abandoned_sessions = 0;
      state.chatbot.chatbot_deflected_calls = 0;
      state.chatbot.chatbot_deflected_emails = 0;
      state.voice.voice_sessions = 0;
      state.voice.voice_resolved_sessions = 0;
      state.voice.voice_transferred_sessions = 0;
      state.voice.voice_retry_loops = 0;
    },
    (result) => result.executive.total_estimated_co2e_kg === 0,
    (result) => ({ total_estimated_co2e_kg: result.executive.total_estimated_co2e_kg })
  );

  return checks;
}

function evaluateMonotonicChecks(api) {
  const checks = [];

  function addSeriesCheck(name, buildStates, accessor, direction, metricLabel = "custom") {
    const values = buildStates().map((state) => accessor(api.calculateResults(state)));
    let passed = true;
    for (let i = 1; i < values.length; i += 1) {
      if (direction === "increasing" && !(values[i] >= values[i - 1])) passed = false;
      if (direction === "decreasing" && !(values[i] <= values[i - 1])) passed = false;
    }
    checks.push({
      name,
      passed,
      details: { metric_path: metricLabel, direction, values }
    });
  }

  addSeriesCheck(
    "mono.calls.handle_time_should_monotonically_increase_call_total",
    () => [0, 2, 4].map((delta) => {
      const state = api.cloneDefaults();
      state.calls.call_aht_min += delta;
      return state;
    }),
    (result) => result.calls.estimated_total_co2e_kg,
    "increasing",
    "calls.estimated_total_co2e_kg"
  );

  addSeriesCheck(
    "mono.email.handling_time_should_monotonically_increase_email_total",
    () => [0, 2, 4].map((delta) => {
      const state = api.cloneDefaults();
      state.email.email_handling_min += delta;
      return state;
    }),
    (result) => result.email.estimated_total_co2e_kg,
    "increasing",
    "email.estimated_total_co2e_kg"
  );

  addSeriesCheck(
    "mono.chatbot.avg_turns_should_monotonically_increase_chatbot_session_co2",
    () => [0, 2, 4].map((delta) => {
      const state = api.cloneDefaults();
      state.chatbot.chatbot_avg_turns += delta;
      return state;
    }),
    (result) => result.chatbot.co2e_per_chatbot_session_g,
    "increasing",
    "chatbot.co2e_per_chatbot_session_g"
  );

  addSeriesCheck(
    "mono.voice.retry_loops_should_monotonically_increase_retry_component",
    () => [0, 1, 2].map((delta) => {
      const state = api.cloneDefaults();
      state.voice.voice_retry_loops += delta;
      return state;
    }),
    (result) => result.voice_bot.co2e_from_retry_loops_kg,
    "increasing",
    "voice_bot.co2e_from_retry_loops_kg"
  );

  addSeriesCheck(
    "mono.workforce.active_agents_should_monotonically_reduce_co2_per_agent",
    () => [0, 40, 80].map((delta) => {
      const state = api.cloneDefaults();
      state.cases_workforce.active_agent_count += delta;
      return state;
    }),
    (result) => result.workforce.co2e_per_agent_kg,
    "decreasing",
    "workforce.co2e_per_agent_kg"
  );

  addSeriesCheck(
    "mono.root.billing_contacts_should_monotonically_increase_billing_group_co2",
    () => [0, 60000, 120000].map((delta) => {
      const state = api.cloneDefaults();
      state.root_causes.billing_contacts += delta;
      return state;
    }),
    (result) => result.root_causes.driver_groups.find((item) => item.driver_group === "billing")?.co2e_kg ?? NaN,
    "increasing",
    "root_causes.driver_groups[billing].co2e_kg"
  );

  return checks;
}

function main() {
  const api = loadCalculatorApi();
  const defaults = api.cloneDefaults();
  const baseResult = api.calculateResults(defaults);

  const sections = Object.fromEntries(
    Object.entries(defaults).filter(([key, value]) => value && typeof value === "object" && !Array.isArray(value))
  );

  const report = {
    generated_at: new Date().toISOString(),
    source_file: "demo-calculator-v2.html",
    baseline: {
      total_estimated_co2e_kg: baseResult.executive.total_estimated_co2e_kg,
      resolved_cases_total: baseResult.executive.resolved_cases_total
    },
    per_field: {},
    pairwise_by_section: {},
    logic_checks: [],
    edge_case_checks: [],
    monotonic_checks: []
  };

  for (const [section, fields] of Object.entries(sections)) {
    report.per_field[section] = [];
    const fieldNames = Object.keys(fields);

    for (const fieldName of fieldNames) {
      const state = api.cloneDefaults();
      const fieldPath = `${section}.${fieldName}`;
      const beforeValue = getByPath(state, fieldPath);
      const afterValue = mutateValue(beforeValue, fieldName);
      setByPath(state, fieldPath, afterValue);
      const nextResult = api.calculateResults(state);
      const diffs = collectDiffs(baseResult, nextResult);

      report.per_field[section].push({
        field: fieldName,
        before_value: beforeValue,
        after_value: afterValue,
        changed: diffs.length > 0,
        diff_count: diffs.length,
        top_diffs: summarizeTopDiffs(diffs)
      });
    }

    report.pairwise_by_section[section] = [];
    for (let i = 0; i < fieldNames.length; i += 1) {
      for (let j = i + 1; j < fieldNames.length; j += 1) {
        const first = fieldNames[i];
        const second = fieldNames[j];
        const state = api.cloneDefaults();

        const firstPath = `${section}.${first}`;
        const secondPath = `${section}.${second}`;
        setByPath(state, firstPath, mutateValue(getByPath(state, firstPath), first));
        setByPath(state, secondPath, mutateValue(getByPath(state, secondPath), second));

        const nextResult = api.calculateResults(state);
        const diffs = collectDiffs(baseResult, nextResult);

        report.pairwise_by_section[section].push({
          fields: [first, second],
          changed: diffs.length > 0,
          diff_count: diffs.length,
          top_diffs: summarizeTopDiffs(diffs, 5)
        });
      }
    }
  }

  report.logic_checks = evaluateLogicChecks(api);
  report.edge_case_checks = evaluateEdgeCaseChecks(api);
  report.monotonic_checks = evaluateMonotonicChecks(api);

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  const unchangedFields = [];
  const unchangedPairs = [];

  for (const [section, entries] of Object.entries(report.per_field)) {
    for (const entry of entries) {
      if (!entry.changed) unchangedFields.push(`${section}.${entry.field}`);
    }
  }

  for (const [section, entries] of Object.entries(report.pairwise_by_section)) {
    for (const entry of entries) {
      if (!entry.changed) unchangedPairs.push(`${section}.${entry.fields.join(" + ")}`);
    }
  }

  console.log(`Report written: ${reportPath}`);
  console.log(`Unchanged single fields: ${unchangedFields.length}`);
  unchangedFields.slice(0, 40).forEach((item) => console.log(`  - ${item}`));
  if (unchangedFields.length > 40) {
    console.log(`  ... ${unchangedFields.length - 40} more`);
  }
  console.log(`Unchanged field pairs: ${unchangedPairs.length}`);
  unchangedPairs.slice(0, 40).forEach((item) => console.log(`  - ${item}`));
  if (unchangedPairs.length > 40) {
    console.log(`  ... ${unchangedPairs.length - 40} more`);
  }
  const failedLogicChecks = report.logic_checks.filter((item) => !item.passed);
  const failedEdgeChecks = report.edge_case_checks.filter((item) => !item.passed);
  const failedMonotonicChecks = report.monotonic_checks.filter((item) => !item.passed);
  console.log(`Failed logic checks: ${failedLogicChecks.length}`);
  failedLogicChecks.forEach((item) => console.log(`  - ${item.name}`));
  console.log(`Failed edge checks: ${failedEdgeChecks.length}`);
  failedEdgeChecks.forEach((item) => console.log(`  - ${item.name}`));
  console.log(`Failed monotonic checks: ${failedMonotonicChecks.length}`);
  failedMonotonicChecks.forEach((item) => console.log(`  - ${item.name}`));
}

main();
