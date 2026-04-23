export type Channel =
  | "call"
  | "email"
  | "chat_human"
  | "chatbot"
  | "voice_bot"
  | "self_service"
  | "social"
  | "sms"
  | "messaging"
  | "portal"
  | "other";

export type Direction = "inbound" | "outbound" | "internal";

export type Status = "open" | "pending" | "resolved" | "closed" | "cancelled";

export type NetworkType = "fixed" | "mobile" | "unknown";

export type DeviceType = "smartphone" | "laptop" | "desktop" | "tablet" | "unknown";

export type BotType = "rule_based" | "llm" | "hybrid";

export type HandoverTarget = "human_agent" | "email" | "call" | "voice_bot" | "self_service" | "none";

export type ActivityType =
  | "case_research"
  | "documentation"
  | "after_call_work"
  | "quality_review"
  | "translation"
  | "knowledge_lookup"
  | "manual_followup"
  | "agent_assist_review"
  | "other";

export type FailedReason =
  | "no_answer"
  | "busy"
  | "voicemail"
  | "wrong_number"
  | "technical_failure"
  | "customer_unavailable"
  | "unknown";

export interface Organization {
  organization_id: string;
  name: string;
  country: string;
  timezone: string;
  default_grid_factor_kg_per_kwh?: number;
  default_language?: string;
  industry?: string;
}

export interface AssumptionSet {
  assumption_set_id: string;
  effective_from: string;
  grid_factor_kg_per_kwh: number;
  fixed_network_kwh_per_gb: number;
  mobile_network_kwh_per_gb: number;
  llm_kwh_per_turn: number;
  voice_traffic_gb_per_min: number;
  agent_laptop_power_w?: number;
  agent_desktop_power_w?: number;
  customer_smartphone_power_w?: number;
  customer_laptop_power_w?: number;
  storage_kwh_per_gb_month?: number;
  confidence_level?: string;
  source_reference?: string;
}

export interface Case {
  case_id: string;
  organization_id: string;
  created_at: string;
  status: Status;
  channel_origin: Channel;
  external_case_id?: string;
  closed_at?: string;
  issue_type?: string;
  priority?: string;
  customer_segment?: string;
  team_id?: string;
  queue_id?: string;
  market?: string;
  language?: string;
  first_contact_resolved?: boolean;
  is_reopened?: boolean;
  is_escalated?: boolean;
  is_transferred?: boolean;
  is_duplicate_case?: boolean;
  is_automation_assisted?: boolean;
  is_bot_resolved?: boolean;
  is_voice_bot_resolved?: boolean;
}

export interface Interaction {
  interaction_id: string;
  organization_id: string;
  case_id: string;
  channel: Channel;
  direction: Direction;
  started_at: string;
  external_interaction_id?: string;
  ended_at?: string;
  duration_seconds?: number;
  customer_id?: string;
  agent_id?: string;
  team_id?: string;
  queue_id?: string;
  resolved?: boolean;
  handover_occurred?: boolean;
  repeat_contact?: boolean;
}

export interface CallInteraction extends Interaction {
  channel: "call";
  talk_time_seconds: number;
  queue_time_seconds?: number;
  hold_time_seconds?: number;
  after_call_work_seconds?: number;
  abandoned?: boolean;
  callback_requested?: boolean;
  callback_scheduled?: boolean;
  callback_attempt_number?: number;
  callback_success?: boolean;
  voicemail_left?: boolean;
  transfer_count?: number;
  conference_call?: boolean;
  auth_time_seconds?: number;
  customer_network_type?: NetworkType;
  customer_device_type?: DeviceType;
}

export interface EmailInteraction extends Interaction {
  channel: "email";
  agent_handling_seconds: number;
  message_count_in_thread?: number;
  is_reopen_message?: boolean;
  is_duplicate_message?: boolean;
  reply_time_seconds?: number;
  customer_read_estimate_seconds?: number;
  cc_count?: number;
  bcc_count?: number;
  forward_count?: number;
  has_attachment?: boolean;
  attachment_count?: number;
  attachment_total_gb?: number;
  storage_gb?: number;
  retention_months?: number;
  delivery_failure?: boolean;
  resent?: boolean;
}

export interface ChatSession extends Interaction {
  channel: "chat_human";
  duration_seconds: number;
  message_count?: number;
  avg_response_time_seconds?: number;
  agent_handling_seconds?: number;
  customer_wait_seconds?: number;
  transfer_count?: number;
  escalated?: boolean;
  resolved?: boolean;
  attachment_total_gb?: number;
}

export interface BotSession {
  bot_session_id: string;
  organization_id: string;
  case_id: string;
  channel: "chatbot" | "messaging";
  bot_type: BotType;
  started_at: string;
  duration_seconds: number;
  turn_count: number;
  resolved: boolean;
  bot_version?: string;
  model_class?: string;
  customer_messages?: number;
  bot_messages?: number;
  llm_turn_count?: number;
  retrieval_requests?: number;
  tool_calls?: number;
  attachment_upload_gb?: number;
  authenticated?: boolean;
  escalated_to_human?: boolean;
  handover_target?: HandoverTarget;
  repeat_bot_session?: boolean;
  drop_off?: boolean;
  deflected_channel?: Channel;
}

export interface VoiceBotSession {
  voice_bot_session_id: string;
  organization_id: string;
  case_id: string;
  started_at: string;
  duration_seconds: number;
  resolved: boolean;
  asr_seconds?: number;
  tts_seconds?: number;
  ivr_path_depth?: number;
  retry_loop_count?: number;
  intent_recognition_failure?: boolean;
  authentication_attempts?: number;
  authentication_failure?: boolean;
  transferred_to_agent?: boolean;
  callback_scheduled?: boolean;
  llm_enabled?: boolean;
  llm_turn_count?: number;
}

export interface Attachment {
  attachment_id: string;
  case_id: string;
  channel: Channel;
  size_gb: number;
  interaction_id?: string;
  file_type?: string;
  uploaded_at?: string;
  download_count?: number;
  stored_months?: number;
}

export interface Callback {
  callback_id: string;
  case_id: string;
  requested_at: string;
  scheduled_at?: string;
  attempt_count?: number;
  successful?: boolean;
  failed_reason?: FailedReason;
  total_callback_seconds?: number;
  followup_required?: boolean;
}

export interface Transfer {
  transfer_id: string;
  case_id: string;
  from_team: string;
  to_team: string;
  interaction_id?: string;
  reason?: string;
  warm_transfer?: boolean;
  handover_seconds?: number;
}

export interface Escalation {
  escalation_id: string;
  case_id: string;
  level_from: string;
  level_to: string;
  created_at: string;
  reason?: string;
  resolved_at?: string;
}

export interface AgentActivity {
  activity_id: string;
  agent_id: string;
  activity_type: ActivityType;
  duration_seconds: number;
  case_id?: string;
  interaction_id?: string;
  system_count?: number;
  ai_assist_used?: boolean;
  notes_created?: number;
}

export interface KnowledgeUsage {
  knowledge_usage_id: string;
  source_type: string;
  case_id?: string;
  session_id?: string;
  search_count?: number;
  article_views?: number;
  article_resolved?: boolean;
  failed_search?: boolean;
  escalated_after_search?: boolean;
}

export interface AggregatedMetrics {
  record_id: string;
  organization_id: string;
  period_start: string;
  period_end: string;
  channel: Channel;
  team_id?: string;
  queue_id?: string;
  market?: string;
  country?: string;
  contacts?: number;
  resolved_cases?: number;
  avg_handle_time_seconds?: number;
  avg_queue_time_seconds?: number;
  avg_hold_time_seconds?: number;
  reopened_cases?: number;
  attachments_sent?: number;
  attachment_total_gb?: number;
  bot_resolved_sessions?: number;
  bot_escalated_sessions?: number;
  voice_bot_resolved_sessions?: number;
  callback_retry_attempts?: number;
}

export interface CanonicalDataset {
  organizations?: Organization[];
  assumption_sets?: AssumptionSet[];
  cases?: Case[];
  interactions?: Interaction[];
  call_interactions?: CallInteraction[];
  email_interactions?: EmailInteraction[];
  chat_sessions?: ChatSession[];
  bot_sessions?: BotSession[];
  voice_bot_sessions?: VoiceBotSession[];
  attachments?: Attachment[];
  callbacks?: Callback[];
  transfers?: Transfer[];
  escalations?: Escalation[];
  agent_activities?: AgentActivity[];
  knowledge_usage?: KnowledgeUsage[];
  aggregated_metrics?: AggregatedMetrics[];
}
