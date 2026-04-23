const demoDefaults = {
  boundary: "interaction",
  assumptions: {
    grid_factor: 0.363,
    fixed_network: 0.29,
    mobile_network: 0.6,
    llm_kwh_per_turn: 0.0003,
    voice_traffic_gb_per_min: 0.00096,
    agent_device_power_w: 90,
    customer_device_power_w: 5,
    storage_kwh_per_gb_month: 0.002,
    email_backlog_penalty: 0.35,
    voice_resolution_overhead: 0.08,
    baseline_fixed_overhead_kg: 40
  },
  calls: {
    call_resolved: 102500,
    call_aht_min: 6.2,
    call_queue_min: 1.4,
    call_hold_min: 0.7,
    call_acw_min: 1.3,
    call_callback_retry_attempts: 2800,
    call_callback_retry_min: 2.0,
    call_customer_network: "mobile"
  },
  email: {
    email_sent: 420000,
    email_received: 450000,
    email_resolved: 310000,
    email_reopened_cases: 42000,
    email_handling_min: 3.8,
    email_customer_read_min: 1.0,
    email_simple_size_gb: 0.0001,
    email_attachment_total_gb: 860,
    email_storage_gb: 860,
    email_retention_months: 18,
    email_customer_network: "fixed"
  },
  chatbot: {
    chatbot_sessions: 300000,
    chatbot_resolved_sessions: 126000,
    chatbot_escalated_sessions: 138000,
    chatbot_abandoned_sessions: 36000,
    chatbot_avg_turns: 6.4,
    chatbot_session_min: 4.2,
    chatbot_deflected_calls: 24000,
    chatbot_deflected_emails: 51000
  },
  voice: {
    voice_sessions: 95000,
    voice_resolved_sessions: 36000,
    voice_transferred_sessions: 47000,
    voice_duration_min: 2.8,
    voice_retry_loops: 1.6,
    voice_retry_penalty_min: 0.4,
    voice_llm_turns: 3.2,
    voice_customer_network: "fixed"
  },
  cases_workforce: {
    fcr: 0.68,
    repeat_contact_rate: 0.11,
    transfer_rate: 0.07,
    escalation_rate: 0.04,
    active_agent_count: 210,
    scheduled_hours: 31200,
    productive_hours: 24850,
    call_team_agents: 74,
    email_team_agents: 86,
    chatbot_team_agents: 28,
    voice_team_agents: 22
  },
  root_causes: {
    top_contact_driver: "order_status_requests",
    billing_contacts: 182000,
    shipping_contacts: 164000,
    returns_contacts: 103000,
    authentication_contacts: 91000,
    billing_repeat_rate: 0.14,
    shipping_repeat_rate: 0.12,
    returns_repeat_rate: 0.09,
    authentication_repeat_rate: 0.17
  }
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function cloneDefaults() {
  return clone(demoDefaults);
}

function mergeState(base, incoming) {
  const output = clone(base);
  if (!incoming || typeof incoming !== "object") return output;

  for (const [key, value] of Object.entries(incoming)) {
    if (value && typeof value === "object" && !Array.isArray(value) && output[key] && typeof output[key] === "object" && !Array.isArray(output[key])) {
      output[key] = mergeState(output[key], value);
    } else {
      output[key] = value;
    }
  }
  return output;
}

function getNetworkIntensity(state, kind) {
  return kind === "mobile" ? state.assumptions.mobile_network : state.assumptions.fixed_network;
}

function customerEnabled(state) {
  return state.boundary === "interaction";
}

function toKwhFromWattsMinutes(watts, minutes) {
  return (watts / 1000) * (minutes / 60);
}

function round(value, digits = 3) {
  const factor = 10 ** digits;
  return Math.round((Number(value) || 0) * factor) / factor;
}

function confidenceFromBoundary(state) {
  return state.boundary === "interaction" ? "medium" : "medium_high";
}

function calculateCalls(state) {
  const a = state.assumptions;
  const c = state.calls;
  const callMinutes = c.call_aht_min + c.call_queue_min + c.call_hold_min;
  const agentMinutes = c.call_aht_min + c.call_acw_min;
  const providerNetworkKwh = a.fixed_network * a.voice_traffic_gb_per_min * callMinutes;
  const providerAgentKwh = toKwhFromWattsMinutes(a.agent_device_power_w, agentMinutes);
  const customerMinutes = customerEnabled(state) ? callMinutes : 0;
  const customerNetworkKwh = customerEnabled(state) ? getNetworkIntensity(state, c.call_customer_network) * a.voice_traffic_gb_per_min * customerMinutes : 0;
  const customerDeviceKwh = customerEnabled(state) ? toKwhFromWattsMinutes(a.customer_device_power_w, customerMinutes) : 0;
  const perCallKwh = providerNetworkKwh + providerAgentKwh + customerNetworkKwh + customerDeviceKwh;
  const perCallKg = perCallKwh * a.grid_factor;

  const queueKwhPerCall = (a.fixed_network * a.voice_traffic_gb_per_min * c.call_queue_min)
    + (customerEnabled(state) ? getNetworkIntensity(state, c.call_customer_network) * a.voice_traffic_gb_per_min * c.call_queue_min : 0)
    + (customerEnabled(state) ? toKwhFromWattsMinutes(a.customer_device_power_w, c.call_queue_min) : 0);

  const holdKwhPerCall = (a.fixed_network * a.voice_traffic_gb_per_min * c.call_hold_min)
    + (customerEnabled(state) ? getNetworkIntensity(state, c.call_customer_network) * a.voice_traffic_gb_per_min * c.call_hold_min : 0)
    + (customerEnabled(state) ? toKwhFromWattsMinutes(a.customer_device_power_w, c.call_hold_min) : 0);

  const retryKwh = c.call_callback_retry_attempts * (
    toKwhFromWattsMinutes(a.agent_device_power_w, c.call_callback_retry_min)
    + a.fixed_network * a.voice_traffic_gb_per_min * c.call_callback_retry_min
    + (customerEnabled(state) ? getNetworkIntensity(state, c.call_customer_network) * a.voice_traffic_gb_per_min * c.call_callback_retry_min : 0)
    + (customerEnabled(state) ? toKwhFromWattsMinutes(a.customer_device_power_w, c.call_callback_retry_min) : 0)
  );

  const retryKg = retryKwh * a.grid_factor;
  const totalKg = (c.call_resolved * perCallKg) + retryKg;
  const savedPerMinuteKwh = toKwhFromWattsMinutes(a.agent_device_power_w, 1) + (a.fixed_network * a.voice_traffic_gb_per_min);
  const ahtReductionMinutes = c.call_resolved * Math.max(c.call_aht_min - 5.2, 0);

  return {
    inbound_calls: c.call_resolved,
    resolved_calls: c.call_resolved,
    abandon_rate: 0,
    avg_handle_time_min: c.call_aht_min,
    avg_queue_time_min: c.call_queue_min,
    avg_hold_time_min: c.call_hold_min,
    after_call_work_min: c.call_acw_min,
    callback_requests: c.call_callback_retry_attempts,
    callback_success_rate: 0,
    callback_retry_attempts: c.call_callback_retry_attempts,
    transfer_rate: state.cases_workforce.transfer_rate,
    co2e_per_call_g: perCallKg * 1000,
    co2e_per_callback_retry_g: c.call_callback_retry_attempts ? (retryKg * 1000) / c.call_callback_retry_attempts : 0,
    co2e_from_queue_time_kg: queueKwhPerCall * c.call_resolved * a.grid_factor,
    co2e_from_hold_time_kg: holdKwhPerCall * c.call_resolved * a.grid_factor,
    co2e_from_callback_retries_kg: retryKg,
    co2e_avoided_by_aht_reduction_kg: ahtReductionMinutes * savedPerMinuteKwh * a.grid_factor,
    estimated_total_co2e_kg: totalKg,
    confidence_level: confidenceFromBoundary(state)
  };
}

function calculateEmail(state) {
  const a = state.assumptions;
  const e = state.email;
  const customerNetwork = getNetworkIntensity(state, e.email_customer_network);
  const providerPerEmailKwh = toKwhFromWattsMinutes(a.agent_device_power_w, e.email_handling_min) + (a.fixed_network * e.email_simple_size_gb);
  const customerPerEmailKwh = customerEnabled(state)
    ? toKwhFromWattsMinutes(a.customer_device_power_w, e.email_customer_read_min) + (customerNetwork * e.email_simple_size_gb)
    : 0;
  const perEmailKg = (providerPerEmailKwh + customerPerEmailKwh) * a.grid_factor;

  const reopenPerCaseKwh = toKwhFromWattsMinutes(a.agent_device_power_w, e.email_handling_min)
    + (customerEnabled(state) ? toKwhFromWattsMinutes(a.customer_device_power_w, e.email_customer_read_min) : 0)
    + (a.fixed_network * e.email_simple_size_gb)
    + (customerEnabled(state) ? customerNetwork * e.email_simple_size_gb : 0);

  const resolvedPerCaseKg = (toKwhFromWattsMinutes(a.agent_device_power_w, e.email_handling_min)
    + (a.fixed_network * e.email_simple_size_gb)
    + (customerEnabled(state) ? toKwhFromWattsMinutes(a.customer_device_power_w, e.email_customer_read_min) : 0)
    + (customerEnabled(state) ? customerNetwork * e.email_simple_size_gb : 0)) * a.grid_factor;
  const attachmentTransmissionKg = e.email_attachment_total_gb * a.fixed_network * a.grid_factor;
  const storageKg = e.email_storage_gb * e.email_retention_months * a.storage_kwh_per_gb_month * a.grid_factor;
  const reopenKg = e.email_reopened_cases * reopenPerCaseKwh * a.grid_factor;
  const unresolvedCases = Math.max(e.email_received - e.email_resolved, 0);
  const unresolvedBacklogKg = unresolvedCases * resolvedPerCaseKg * a.email_backlog_penalty;
  const totalKg = (e.email_sent * perEmailKg) + (e.email_resolved * resolvedPerCaseKg) + attachmentTransmissionKg + storageKg + reopenKg + unresolvedBacklogKg;

  return {
    emails_received: e.email_received,
    emails_sent: e.email_sent,
    resolved_email_cases: e.email_resolved,
    reopen_rate: e.email_resolved ? e.email_reopened_cases / e.email_resolved : 0,
    avg_email_handling_time_min: e.email_handling_min,
    attachment_rate: e.email_sent ? e.email_attachment_total_gb / (e.email_sent * Math.max(e.email_simple_size_gb, 0.0001)) : 0,
    attachment_total_gb: e.email_attachment_total_gb,
    co2e_per_email_g: perEmailKg * 1000,
    co2e_from_reopened_email_cases_kg: reopenKg,
    co2e_from_attachment_transmission_kg: attachmentTransmissionKg,
    co2e_from_attachment_storage_kg: storageKg,
    co2e_from_unresolved_backlog_kg: unresolvedBacklogKg,
    co2e_avoided_by_lower_email_volume_kg: Math.max((e.email_sent - e.email_resolved) * perEmailKg, 0),
    estimated_total_co2e_kg: totalKg,
    confidence_level: confidenceFromBoundary(state)
  };
}

function calculateChatbot(state, calls, email) {
  const a = state.assumptions;
  const c = state.chatbot;
  const customerSessionKwh = customerEnabled(state) ? toKwhFromWattsMinutes(a.customer_device_power_w, c.chatbot_session_min) : 0;
  const perSessionKg = (c.chatbot_avg_turns * a.llm_kwh_per_turn + customerSessionKwh) * a.grid_factor;
  const escalatedLoadKg = c.chatbot_escalated_sessions * ((calls.co2e_per_call_g / 1000) * 0.45 + (email.co2e_per_email_g / 1000) * 0.55);
  const abandonedLoadKg = c.chatbot_abandoned_sessions * perSessionKg * 0.5;
  const totalKg = (c.chatbot_sessions * perSessionKg) + escalatedLoadKg + abandonedLoadKg;
  const failedSessionsKg = (c.chatbot_escalated_sessions + c.chatbot_abandoned_sessions) * perSessionKg;
  const avoidedCallKg = c.chatbot_deflected_calls * (calls.co2e_per_call_g / 1000);
  const avoidedEmailKg = c.chatbot_deflected_emails * (email.co2e_per_email_g / 1000);
  const netAvoidedKg = avoidedCallKg + avoidedEmailKg - totalKg;

  return {
    chatbot_sessions: c.chatbot_sessions,
    chatbot_resolved_sessions: c.chatbot_resolved_sessions,
    chatbot_escalated_sessions: c.chatbot_escalated_sessions,
    chatbot_abandoned_sessions: c.chatbot_abandoned_sessions,
    bot_containment_rate: c.chatbot_sessions ? c.chatbot_resolved_sessions / c.chatbot_sessions : 0,
    avg_turns: c.chatbot_avg_turns,
    co2e_per_chatbot_session_g: perSessionKg * 1000,
    co2e_per_chatbot_resolution_g: c.chatbot_resolved_sessions ? (totalKg / c.chatbot_resolved_sessions) * 1000 : 0,
    co2e_added_by_failed_chatbot_sessions_kg: failedSessionsKg,
    co2e_added_by_escalated_sessions_kg: escalatedLoadKg,
    co2e_added_by_abandoned_sessions_kg: abandonedLoadKg,
    co2e_avoided_by_call_deflection_kg: avoidedCallKg,
    co2e_avoided_by_email_deflection_kg: avoidedEmailKg,
    net_avoided_co2e_kg: netAvoidedKg,
    estimated_total_co2e_kg: totalKg,
    confidence_level: confidenceFromBoundary(state)
  };
}

function calculateVoice(state, calls) {
  const a = state.assumptions;
  const v = state.voice;
  const customerNetwork = getNetworkIntensity(state, v.voice_customer_network);
  const sessionKwh = (a.fixed_network * a.voice_traffic_gb_per_min * v.voice_duration_min)
    + (customerEnabled(state) ? customerNetwork * a.voice_traffic_gb_per_min * v.voice_duration_min : 0)
    + (customerEnabled(state) ? toKwhFromWattsMinutes(a.customer_device_power_w, v.voice_duration_min) : 0)
    + (v.voice_llm_turns * a.llm_kwh_per_turn);
  const perSessionKg = sessionKwh * a.grid_factor;
  const retryLoopMinutes = v.voice_sessions * v.voice_retry_loops * v.voice_retry_penalty_min;
  const retryKwh = retryLoopMinutes * (
    a.fixed_network * a.voice_traffic_gb_per_min
    + (customerEnabled(state) ? customerNetwork * a.voice_traffic_gb_per_min : 0)
    + (customerEnabled(state) ? (a.customer_device_power_w / 1000 / 60) : 0)
  );
  const retryKg = retryKwh * a.grid_factor;
  const handoverKg = v.voice_transferred_sessions * (calls.co2e_per_call_g / 1000);
  const resolutionOverheadKg = v.voice_resolved_sessions * perSessionKg * a.voice_resolution_overhead;
  const totalKg = (v.voice_sessions * perSessionKg) + handoverKg + retryKg + resolutionOverheadKg;
  const avoidedKg = v.voice_resolved_sessions * ((calls.co2e_per_call_g / 1000) - perSessionKg);

  return {
    voice_bot_sessions: v.voice_sessions,
    voice_bot_resolved_sessions: v.voice_resolved_sessions,
    voice_bot_transfer_rate: v.voice_sessions ? v.voice_transferred_sessions / v.voice_sessions : 0,
    retry_loop_rate: v.voice_retry_loops,
    intent_failure_rate: v.voice_sessions ? (v.voice_sessions - v.voice_resolved_sessions) / v.voice_sessions : 0,
    co2e_per_voice_bot_session_g: perSessionKg * 1000,
    co2e_per_voice_bot_resolution_g: v.voice_resolved_sessions ? (totalKg / v.voice_resolved_sessions) * 1000 : 0,
    co2e_from_retry_loops_kg: retryKg,
    co2e_added_by_voice_to_agent_handover_kg: handoverKg,
    co2e_from_resolution_overhead_kg: resolutionOverheadKg,
    co2e_avoided_by_voice_bot_resolution_kg: avoidedKg,
    estimated_total_co2e_kg: totalKg,
    confidence_level: state.boundary === "interaction" ? "low_medium" : "medium"
  };
}

function calculateCases(state, executive, calls) {
  const cw = state.cases_workforce;
  const totalResolved = executive.resolved_cases_total;
  const frictionMultiplier = 1 + cw.transfer_rate + (cw.escalation_rate * 1.25);
  const casesCreated = cw.fcr ? (totalResolved * frictionMultiplier) / cw.fcr : (totalResolved * frictionMultiplier);
  const repeatKg = totalResolved * (cw.repeat_contact_rate + (cw.transfer_rate * 0.35) + (cw.escalation_rate * 0.5)) * (executive.co2e_per_resolution_g / 1000);

  return {
    cases_created: casesCreated,
    cases_closed: totalResolved,
    fcr: cw.fcr,
    repeat_contact_rate: cw.repeat_contact_rate,
    transfer_rate: cw.transfer_rate,
    escalation_rate: cw.escalation_rate,
    co2e_per_resolution_g: executive.co2e_per_resolution_g,
    co2e_from_repeat_contacts_kg: repeatKg,
    confidence_level: calls.confidence_level
  };
}

function calculateWorkforce(state, overview, executive) {
  const cw = state.cases_workforce;
  const occupancyRate = cw.scheduled_hours ? cw.productive_hours / cw.scheduled_hours : 0;
  const contactsTotal = overview.reduce((sum, item) => sum + item.contacts, 0);
  const workloadMultiplier = 1 + (cw.transfer_rate * 0.4) + (cw.escalation_rate * 0.6);
  const teams = [
    { team: "billing_team", channel: "call", active_agents: cw.call_team_agents, channelKg: overview.find((item) => item.channel === "call")?.estimated_co2e_kg || 0 },
    { team: "returns_team", channel: "email", active_agents: cw.email_team_agents, channelKg: overview.find((item) => item.channel === "email")?.estimated_co2e_kg || 0 },
    { team: "digital_service", channel: "chatbot", active_agents: cw.chatbot_team_agents, channelKg: overview.find((item) => item.channel === "chatbot")?.estimated_co2e_kg || 0 },
    { team: "auth_team", channel: "voice_bot", active_agents: cw.voice_team_agents, channelKg: overview.find((item) => item.channel === "voice_bot")?.estimated_co2e_kg || 0 }
  ].map((team) => ({
    team: team.team,
    channel: team.channel,
    active_agents: team.active_agents,
    occupancy_rate: occupancyRate,
    contacts_per_agent: team.active_agents ? (overview.find((item) => item.channel === team.channel)?.contacts || 0) / team.active_agents : 0,
    co2e_per_agent_kg: team.active_agents ? (team.channelKg * workloadMultiplier) / team.active_agents : 0,
    co2e_per_productive_hour_g: cw.productive_hours ? (team.channelKg * 1000) / (cw.productive_hours * Math.max(team.active_agents / Math.max(cw.active_agent_count, 1), 0.01)) : 0
  }));

  return {
    active_agent_count: cw.active_agent_count,
    scheduled_hours: cw.scheduled_hours,
    productive_hours: cw.productive_hours,
    occupancy_rate: occupancyRate,
    contacts_per_agent: cw.active_agent_count ? contactsTotal / cw.active_agent_count : 0,
    cases_per_agent: cw.active_agent_count ? executive.resolved_cases_total / cw.active_agent_count : 0,
    co2e_per_agent_kg: cw.active_agent_count ? (executive.total_estimated_co2e_kg * workloadMultiplier) / cw.active_agent_count : 0,
    co2e_per_productive_hour_g: cw.productive_hours ? (executive.total_estimated_co2e_kg * 1000) / cw.productive_hours : 0,
    confidence_level: "medium",
    teams
  };
}

function calculateRootCauses(state, executive, overview) {
  const r = state.root_causes;
  const groups = [
    { driver_group: "billing", contacts: r.billing_contacts, repeat_contact_rate: r.billing_repeat_rate, preventable: true, source_label: "invoice_missing", contact_driver: "invoice_not_received", level_1: "billing", level_2: "invoicing", team: "billing_team", primary_channel: "call", secondary_channel: "email" },
    { driver_group: "shipping", contacts: r.shipping_contacts, repeat_contact_rate: r.shipping_repeat_rate, preventable: true, source_label: "track_order", contact_driver: "where_is_my_order", level_1: "shipping", level_2: "tracking", team: "returns_team", primary_channel: "email", secondary_channel: "chatbot" },
    { driver_group: "returns", contacts: r.returns_contacts, repeat_contact_rate: r.returns_repeat_rate, preventable: false, source_label: "return_docs", contact_driver: "return_label_request", level_1: "returns", level_2: "documents", team: "returns_team", primary_channel: "email", secondary_channel: null },
    { driver_group: "authentication", contacts: r.authentication_contacts, repeat_contact_rate: r.authentication_repeat_rate, preventable: true, source_label: "reset_pw", contact_driver: "password_reset", level_1: "account_access", level_2: "authentication", team: "auth_team", primary_channel: "voice_bot", secondary_channel: "call" }
  ];

  const weightedTotal = groups.reduce((sum, group) => sum + (group.contacts * (1 + group.repeat_contact_rate)), 0) || 1;
  const channelMap = Object.fromEntries(overview.map((item) => [item.channel, item.estimated_co2e_kg]));
  const globalFcr = state.cases_workforce.fcr || 0.68;

  const driverGroups = groups.map((group) => {
    const share = (group.contacts * (1 + group.repeat_contact_rate)) / weightedTotal;
    const co2 = executive.total_estimated_co2e_kg * share;
    const resolved = group.contacts * globalFcr;
    return {
      driver_group: group.driver_group,
      contacts: group.contacts,
      resolved_cases: resolved,
      preventable: group.preventable,
      repeat_contact_rate: group.repeat_contact_rate,
      co2e_kg: co2,
      co2e_per_case_g: resolved ? (co2 * 1000) / resolved : 0
    };
  }).sort((a, b) => b.co2e_kg - a.co2e_kg);

  const topDrivers = groups.map((group) => {
    const match = driverGroups.find((item) => item.driver_group === group.driver_group);
    return {
      contact_driver: group.contact_driver,
      source_label: group.source_label,
      driver_group: group.driver_group,
      contacts: group.contacts,
      resolved_cases: match.resolved_cases,
      preventable: group.preventable,
      co2e_kg: match.co2e_kg,
      co2e_per_case_g: match.co2e_per_case_g
    };
  }).sort((a, b) => b.co2e_kg - a.co2e_kg);

  const taxonomyExamples = groups.slice(0, 3).map((group) => ({
    source_label: group.source_label,
    normalized_driver: group.contact_driver,
    driver_group: group.driver_group,
    level_1: group.level_1,
    level_2: group.level_2,
    preventable: group.preventable
  }));

  const driverGroupByChannel = groups.flatMap((group) => {
    const share = (group.contacts * (1 + group.repeat_contact_rate)) / weightedTotal;
    const rows = [];
    if (group.primary_channel && channelMap[group.primary_channel]) {
      rows.push({ driver_group: group.driver_group, channel: group.primary_channel, co2e_kg: channelMap[group.primary_channel] * share });
    }
    if (group.secondary_channel && channelMap[group.secondary_channel]) {
      const secondaryChannelWeight = 0.7;
      rows.push({ driver_group: group.driver_group, channel: group.secondary_channel, co2e_kg: channelMap[group.secondary_channel] * share * secondaryChannelWeight });
    }
    return rows;
  });

  const driverGroupByTeam = groups.map((group) => {
    const match = driverGroups.find((item) => item.driver_group === group.driver_group);
    return {
      driver_group: group.driver_group,
      team: group.team,
      co2e_kg: match.co2e_kg
    };
  });

  const topGroup = driverGroups[0];
  const preventableKg = driverGroups.filter((item) => item.preventable).reduce((sum, item) => sum + item.co2e_kg, 0);
  const totalContacts = groups.reduce((sum, item) => sum + item.contacts, 0) || 1;
  const preventableContacts = groups.filter((item) => item.preventable).reduce((sum, item) => sum + item.contacts, 0);

  return {
    top_contact_driver: r.top_contact_driver,
    top_driver_group: topGroup?.driver_group || "billing",
    preventable_contact_rate: preventableContacts / totalContacts,
    co2e_from_preventable_drivers_kg: preventableKg,
    highest_impact_driver_group: topGroup?.driver_group || "billing",
    confidence_level: "medium",
    driver_groups: driverGroups,
    top_drivers: topDrivers,
    taxonomy_examples: taxonomyExamples,
    driver_group_by_channel: driverGroupByChannel,
    driver_group_by_team: driverGroupByTeam
  };
}

function calculateBaselineComparison(state, executive, email, chatbot) {
  const baselineChatbotFailureOverhang = 0.25;
  const baselineTotal = executive.total_estimated_co2e_kg
    + (email.co2e_from_reopened_email_cases_kg * state.assumptions.email_backlog_penalty)
    + (chatbot.co2e_added_by_failed_chatbot_sessions_kg * baselineChatbotFailureOverhang)
    + state.assumptions.baseline_fixed_overhead_kg;

  return {
    baseline_period: "2026-01",
    baseline_total_estimated_co2e_kg: baselineTotal,
    baseline_aht_min: state.calls.call_aht_min + 0.9,
    baseline_reopen_rate: Math.min(email.reopen_rate + 0.025, 1),
    baseline_bot_containment_rate: Math.max(chatbot.bot_containment_rate - 0.15, 0),
    delta_total_estimated_co2e_kg: executive.total_estimated_co2e_kg - baselineTotal,
    delta_total_estimated_co2e_pct: baselineTotal ? (executive.total_estimated_co2e_kg - baselineTotal) / baselineTotal : 0,
    delta_aht_min: -0.9,
    delta_reopen_rate: -0.025,
    delta_bot_containment_rate: 0.15
  };
}

function calculateResults(state) {
  const calls = calculateCalls(state);
  const email = calculateEmail(state);
  const chatbot = calculateChatbot(state, calls, email);
  const voice = calculateVoice(state, calls);

  const overview = [
    { channel: "call", contacts: calls.inbound_calls, resolved_cases: calls.resolved_calls, estimated_co2e_kg: calls.estimated_total_co2e_kg, co2e_per_resolution_g: calls.co2e_per_call_g, confidence_level: calls.confidence_level },
    { channel: "email", contacts: email.emails_sent, resolved_cases: email.resolved_email_cases, estimated_co2e_kg: email.estimated_total_co2e_kg, co2e_per_resolution_g: email.co2e_per_email_g, confidence_level: email.confidence_level },
    { channel: "chatbot", contacts: chatbot.chatbot_sessions, resolved_cases: chatbot.chatbot_resolved_sessions, estimated_co2e_kg: chatbot.estimated_total_co2e_kg, co2e_per_resolution_g: chatbot.co2e_per_chatbot_resolution_g, confidence_level: chatbot.confidence_level },
    { channel: "voice_bot", contacts: voice.voice_bot_sessions, resolved_cases: voice.voice_bot_resolved_sessions, estimated_co2e_kg: voice.estimated_total_co2e_kg, co2e_per_resolution_g: voice.co2e_per_voice_bot_resolution_g, confidence_level: voice.confidence_level }
  ];

  const contactsTotal = overview.reduce((sum, item) => sum + item.contacts, 0);
  const resolvedCasesTotal = overview.reduce((sum, item) => sum + item.resolved_cases, 0);
  const totalKg = overview.reduce((sum, item) => sum + item.estimated_co2e_kg, 0);

  const executive = {
    contacts_total: contactsTotal,
    resolved_cases_total: resolvedCasesTotal,
    aht_min: state.calls.call_aht_min,
    fcr: state.cases_workforce.fcr,
    reopen_rate: email.reopen_rate,
    bot_containment_rate: chatbot.bot_containment_rate,
    total_estimated_co2e_kg: totalKg,
    co2e_per_resolution_g: resolvedCasesTotal ? (totalKg / resolvedCasesTotal) * 1000 : 0,
    avoided_co2e_vs_baseline_kg: chatbot.net_avoided_co2e_kg + voice.co2e_avoided_by_voice_bot_resolution_kg,
    confidence_level: "medium"
  };

  const cases = calculateCases(state, executive, calls);
  const workforce = calculateWorkforce(state, overview, executive);
  const rootCauses = calculateRootCauses(state, executive, overview);
  const baselineComparison = calculateBaselineComparison(state, executive, email, chatbot);
  const drivers = [
    { driver: "queue_time", channel: "call", estimated_co2e_kg: calls.co2e_from_queue_time_kg, type: "avoidable_load" },
    { driver: "reopened_email_cases", channel: "email", estimated_co2e_kg: email.co2e_from_reopened_email_cases_kg, type: "avoidable_load" },
    { driver: "attachment_transmission", channel: "email", estimated_co2e_kg: email.co2e_from_attachment_transmission_kg, type: "payload_load" },
    { driver: "chatbot_call_deflection", channel: "chatbot", estimated_co2e_kg: -chatbot.co2e_avoided_by_call_deflection_kg, type: "avoided_load" },
    { driver: "voice_bot_handover", channel: "voice_bot", estimated_co2e_kg: voice.co2e_added_by_voice_to_agent_handover_kg, type: "automation_failure_load" }
  ];

  return {
    metadata: {
      organization_id: "org_v2_demo",
      period_start: "2026-04-01",
      period_end: "2026-04-30",
      assumption_set_id: "v2_interactive_defaults",
      reporting_boundary: state.boundary === "interaction" ? "provider_plus_customer_interaction" : "provider_side_operational",
      schema_version: "v0.2-demo",
      notes: "Live calculator output from demo-calculator-v2.html. baseline_comparison is simulated from current-period inputs plus configurable offsets — not a verified before/after measurement. Root cause groups are fixed to four demo categories (billing, shipping, returns, authentication)."
    },
    executive: Object.fromEntries(Object.entries(executive).map(([key, value]) => [key, typeof value === "number" ? round(value) : value])),
    overview_by_channel: overview.map((item) => Object.fromEntries(Object.entries(item).map(([key, value]) => [key, typeof value === "number" ? round(value) : value]))),
    calls: Object.fromEntries(Object.entries(calls).map(([key, value]) => [key, typeof value === "number" ? round(value) : value])),
    email: Object.fromEntries(Object.entries(email).map(([key, value]) => [key, typeof value === "number" ? round(value) : value])),
    chatbot: Object.fromEntries(Object.entries(chatbot).map(([key, value]) => [key, typeof value === "number" ? round(value) : value])),
    voice_bot: Object.fromEntries(Object.entries(voice).map(([key, value]) => [key, typeof value === "number" ? round(value) : value])),
    cases: Object.fromEntries(Object.entries(cases).map(([key, value]) => [key, typeof value === "number" ? round(value) : value])),
    workforce: {
      ...Object.fromEntries(Object.entries(workforce).filter(([key]) => key !== "teams").map(([key, value]) => [key, typeof value === "number" ? round(value) : value])),
      teams: workforce.teams.map((team) => Object.fromEntries(Object.entries(team).map(([key, value]) => [key, typeof value === "number" ? round(value) : value])))
    },
    root_causes: {
      ...Object.fromEntries(Object.entries(rootCauses).filter(([key]) => !["driver_groups", "top_drivers", "taxonomy_examples", "driver_group_by_channel", "driver_group_by_team"].includes(key)).map(([key, value]) => [key, typeof value === "number" ? round(value) : value])),
      driver_groups: rootCauses.driver_groups.map((item) => Object.fromEntries(Object.entries(item).map(([key, value]) => [key, typeof value === "number" ? round(value) : value]))),
      top_drivers: rootCauses.top_drivers.map((item) => Object.fromEntries(Object.entries(item).map(([key, value]) => [key, typeof value === "number" ? round(value) : value]))),
      taxonomy_examples: rootCauses.taxonomy_examples,
      driver_group_by_channel: rootCauses.driver_group_by_channel.map((item) => Object.fromEntries(Object.entries(item).map(([key, value]) => [key, typeof value === "number" ? round(value) : value]))),
      driver_group_by_team: rootCauses.driver_group_by_team.map((item) => Object.fromEntries(Object.entries(item).map(([key, value]) => [key, typeof value === "number" ? round(value) : value])))
    },
    drivers: drivers.map((item) => Object.fromEntries(Object.entries(item).map(([key, value]) => [key, typeof value === "number" ? round(value) : value]))),
    baseline_comparison: Object.fromEntries(Object.entries(baselineComparison).map(([key, value]) => [key, typeof value === "number" ? round(value) : value])),
    methodology_flags: {
      customer_side_assumptions_used: customerEnabled(state),
      storage_assumptions_used: state.assumptions.storage_kwh_per_gb_month > 0,
      llm_energy_assumptions_used: state.assumptions.llm_kwh_per_turn > 0,
      aggregated_metrics_used: true,
      event_level_data_used: false
    }
  };
}

window.DemoCalculatorV2 = {
  demoDefaults,
  cloneDefaults,
  mergeState,
  calculateResults
};
