const fs = require("fs");
const path = require("path");

const repoRoot = process.cwd();
const htmlPath = path.join(repoRoot, "demo", "demo-calculator-v2.html");
const reportPath = path.join(repoRoot, "reports", "calculator-tests", "calculator-core-combinations-report.json");

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

function getByPath(obj, dottedPath) {
  return dottedPath.split(".").reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

function setByPath(obj, dottedPath, value) {
  const parts = dottedPath.split(".");
  let cursor = obj;
  for (let i = 0; i < parts.length - 1; i += 1) cursor = cursor[parts[i]];
  cursor[parts[parts.length - 1]] = value;
}

function combinations(values, choose) {
  const out = [];
  function walk(start, acc) {
    if (acc.length === choose) {
      out.push([...acc]);
      return;
    }
    for (let i = start; i < values.length; i += 1) {
      acc.push(values[i]);
      walk(i + 1, acc);
      acc.pop();
    }
  }
  walk(0, []);
  return out;
}

function mutateValue(value, fieldName) {
  if (typeof value === "number") {
    if (fieldName.includes("rate") || fieldName === "fcr") {
      return Math.max(0, Math.min(1, value >= 0.8 ? value - 0.15 : value + 0.15));
    }
    if (value === 0) return 1;
    if (value < 1) return Number((value * 1.6).toFixed(4));
    if (Number.isInteger(value)) return value + Math.max(1, Math.round(value * 0.5));
    return Number((value * 1.6).toFixed(3));
  }
  if (typeof value === "string") {
    if (value === "fixed") return "mobile";
    if (value === "mobile") return "fixed";
    return value;
  }
  return value;
}

function normalizeState(section, state) {
  if (section === "chatbot") {
    if (state.chatbot.chatbot_resolved_sessions > state.chatbot.chatbot_sessions) {
      state.chatbot.chatbot_resolved_sessions = state.chatbot.chatbot_sessions;
    }
    const remainingAfterResolved = Math.max(0, state.chatbot.chatbot_sessions - state.chatbot.chatbot_resolved_sessions);
    if (state.chatbot.chatbot_escalated_sessions > remainingAfterResolved) {
      state.chatbot.chatbot_escalated_sessions = remainingAfterResolved;
    }
    const remainingAfterEscalated = Math.max(0, state.chatbot.chatbot_sessions - state.chatbot.chatbot_resolved_sessions - state.chatbot.chatbot_escalated_sessions);
    if (state.chatbot.chatbot_abandoned_sessions > remainingAfterEscalated) {
      state.chatbot.chatbot_abandoned_sessions = remainingAfterEscalated;
    }
  }

  if (section === "cases_workforce") {
    if (state.cases_workforce.productive_hours > state.cases_workforce.scheduled_hours) {
      state.cases_workforce.productive_hours = state.cases_workforce.scheduled_hours;
    }
    const maxAgents = state.cases_workforce.active_agent_count;
    let totalTeamAgents = state.cases_workforce.call_team_agents
      + state.cases_workforce.email_team_agents
      + state.cases_workforce.chatbot_team_agents
      + state.cases_workforce.voice_team_agents;
    if (totalTeamAgents > maxAgents && totalTeamAgents > 0) {
      const scale = maxAgents / totalTeamAgents;
      state.cases_workforce.call_team_agents = Math.floor(state.cases_workforce.call_team_agents * scale);
      state.cases_workforce.email_team_agents = Math.floor(state.cases_workforce.email_team_agents * scale);
      state.cases_workforce.chatbot_team_agents = Math.floor(state.cases_workforce.chatbot_team_agents * scale);
      state.cases_workforce.voice_team_agents = Math.floor(state.cases_workforce.voice_team_agents * scale);
      totalTeamAgents = state.cases_workforce.call_team_agents
        + state.cases_workforce.email_team_agents
        + state.cases_workforce.chatbot_team_agents
        + state.cases_workforce.voice_team_agents;
      while (totalTeamAgents < maxAgents) {
        state.cases_workforce.call_team_agents += 1;
        totalTeamAgents += 1;
        if (totalTeamAgents >= maxAgents) break;
      }
    }
  }

  if (section === "email") {
    if (state.email.email_resolved > state.email.email_received) {
      state.email.email_resolved = state.email.email_received;
    }
    if (state.email.email_reopened_cases > state.email.email_resolved) {
      state.email.email_reopened_cases = state.email.email_resolved;
    }
  }

  if (section === "voice") {
    if (state.voice.voice_resolved_sessions > state.voice.voice_sessions) {
      state.voice.voice_resolved_sessions = state.voice.voice_sessions;
    }
    if (state.voice.voice_transferred_sessions > state.voice.voice_sessions) {
      state.voice.voice_transferred_sessions = state.voice.voice_sessions;
    }
  }
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

function collectFlags(section, state, result) {
  const flags = [];
  const nonFinite = flattenNumbers(result).filter((item) => !Number.isFinite(item.value));
  nonFinite.forEach((item) => flags.push(`non-finite output at ${item.path}`));

  if (section === "calls") {
    if (result.calls.estimated_total_co2e_kg < result.calls.co2e_from_callback_retries_kg) flags.push("call total lower than callback retry component");
    if (result.calls.co2e_from_queue_time_kg > result.calls.estimated_total_co2e_kg && result.calls.resolved_calls > 0) flags.push("queue component exceeds call total");
  }

  if (section === "email") {
    if (result.email.reopen_rate > 1) flags.push("email reopen rate exceeds 100%");
    if (result.email.co2e_from_unresolved_backlog_kg < 0) flags.push("negative email backlog component");
    if (state.email.email_received >= state.email.email_resolved && result.email.co2e_from_unresolved_backlog_kg < 0) flags.push("backlog component invalid for received >= resolved");
  }

  if (section === "chatbot") {
    if (result.chatbot.bot_containment_rate > 1) flags.push("chatbot containment exceeds 100%");
    if (state.chatbot.chatbot_resolved_sessions + state.chatbot.chatbot_escalated_sessions + state.chatbot.chatbot_abandoned_sessions > state.chatbot.chatbot_sessions) flags.push("chatbot outcomes exceed sessions");
  }

  if (section === "voice") {
    if (result.voice_bot.voice_bot_transfer_rate > 1) flags.push("voice transfer rate exceeds 100%");
    if (result.voice_bot.co2e_from_retry_loops_kg < 0) flags.push("negative retry loop component");
  }

  if (section === "cases_workforce") {
    if (result.workforce.occupancy_rate > 1) flags.push("occupancy exceeds 100%");
    if (result.cases.cases_created < result.cases.cases_closed) flags.push("cases created lower than cases closed");
  }

  if (section === "root_causes") {
    if (result.root_causes.preventable_contact_rate > 1) flags.push("preventable rate exceeds 100%");
    if (result.root_causes.driver_groups.some((item) => item.co2e_kg < 0)) flags.push("negative root-cause group CO2");
  }

  return flags;
}

function summarize(baseResult, nextResult, section) {
  const sectionKey = section === "voice" ? "voice_bot" : section;
  const base = baseResult[sectionKey] || {};
  const next = nextResult[sectionKey] || {};
  return {
    executive_total_before_kg: baseResult.executive.total_estimated_co2e_kg,
    executive_total_after_kg: nextResult.executive.total_estimated_co2e_kg,
    section_total_before_kg: base.estimated_total_co2e_kg ?? null,
    section_total_after_kg: next.estimated_total_co2e_kg ?? null
  };
}

function main() {
  const api = loadCalculatorApi();
  const baseState = api.cloneDefaults();
  const baseResult = api.calculateResults(baseState);

  const sections = {
    calls: ["calls.call_resolved", "calls.call_aht_min", "calls.call_queue_min", "calls.call_hold_min", "calls.call_acw_min", "calls.call_callback_retry_attempts", "calls.call_callback_retry_min"],
    email: ["email.email_sent", "email.email_received", "email.email_resolved", "email.email_reopened_cases", "email.email_handling_min", "email.email_attachment_total_gb", "email.email_storage_gb"],
    chatbot: ["chatbot.chatbot_sessions", "chatbot.chatbot_resolved_sessions", "chatbot.chatbot_escalated_sessions", "chatbot.chatbot_abandoned_sessions", "chatbot.chatbot_avg_turns", "chatbot.chatbot_session_min"],
    voice: ["voice.voice_sessions", "voice.voice_resolved_sessions", "voice.voice_transferred_sessions", "voice.voice_duration_min", "voice.voice_retry_loops", "voice.voice_retry_penalty_min", "voice.voice_llm_turns"],
    cases_workforce: ["cases_workforce.fcr", "cases_workforce.repeat_contact_rate", "cases_workforce.transfer_rate", "cases_workforce.escalation_rate", "cases_workforce.active_agent_count", "cases_workforce.scheduled_hours", "cases_workforce.productive_hours"],
    root_causes: ["root_causes.billing_contacts", "root_causes.shipping_contacts", "root_causes.returns_contacts", "root_causes.authentication_contacts", "root_causes.billing_repeat_rate", "root_causes.shipping_repeat_rate", "root_causes.returns_repeat_rate", "root_causes.authentication_repeat_rate"]
  };

  const report = {
    generated_at: new Date().toISOString(),
    source_file: "demo-calculator-v2.html",
    combinations_tested: 0,
    flagged_combinations: []
  };

  for (const [section, fields] of Object.entries(sections)) {
    const picks = [
      ...combinations(fields, 3),
      ...combinations(fields, 4),
      ...(fields.length >= 5 ? combinations(fields, 5) : [])
    ];

    for (const combo of picks) {
      report.combinations_tested += 1;
      const state = api.cloneDefaults();
      for (const fieldPath of combo) {
        const current = getByPath(state, fieldPath);
        const fieldName = fieldPath.split(".").pop();
        setByPath(state, fieldPath, mutateValue(current, fieldName));
      }
      normalizeState(section, state);
      const result = api.calculateResults(state);
      const flags = collectFlags(section, state, result);
      if (flags.length > 0) {
        report.flagged_combinations.push({
          section,
          fields: combo,
          flags,
          summary: summarize(baseResult, result, section)
        });
      }
    }
  }

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`Core combination report written: ${reportPath}`);
  console.log(`Combinations tested: ${report.combinations_tested}`);
  console.log(`Flagged combinations: ${report.flagged_combinations.length}`);
  report.flagged_combinations.slice(0, 25).forEach((item) => {
    console.log(`  - ${item.section}: ${item.fields.join(", ")} => ${item.flags.join("; ")}`);
  });
}

main();
