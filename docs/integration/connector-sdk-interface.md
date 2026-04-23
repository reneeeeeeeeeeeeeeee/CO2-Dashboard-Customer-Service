# Connector SDK Interface

## Purpose

This document defines the connector contract for importing external customer service data into the canonical model.

A connector should be able to:

- extract source data
- map it into canonical entities
- validate the mapping
- publish normalized output
- report limitations and confidence

The connector SDK is the integration boundary between source systems and the core engine.

## Connector design goals

- `simple` enough for community contributors
- `strict` enough for reliable normalization
- `transparent` enough for auditability
- `extensible` enough for different source systems

## Connector categories

Supported connector styles:

- `api`
- `csv`
- `warehouse`
- `webhook`
- `manual`

## Connector lifecycle

Each connector follows this sequence:

1. `describe`
2. `configure`
3. `extract`
4. `map`
5. `validate`
6. `publish`
7. `report`

## Minimum connector interface

```ts
export interface Connector<TConfig = unknown, TRawRecord = unknown> {
  describe(): ConnectorDescriptor;
  configure(config: TConfig): Promise<void> | void;
  testConnection?(): Promise<ConnectionTestResult>;
  extract(context: ExtractContext): AsyncIterable<TRawRecord> | Promise<TRawRecord[]>;
  map(record: TRawRecord, context: MappingContext): Promise<MappedRecordBatch> | MappedRecordBatch;
  validate?(batch: MappedRecordBatch, context: ValidationContext): Promise<ValidationResult[]> | ValidationResult[];
  publish(batch: MappedRecordBatch, context: PublishContext): Promise<PublishResult>;
  report?(context: ReportContext): Promise<ConnectorRunReport> | ConnectorRunReport;
}
```

## Core SDK types

### `ConnectorDescriptor`

Describes what the connector supports.

```ts
export interface ConnectorDescriptor {
  connector_id: string;
  name: string;
  version: string;
  category: "api" | "csv" | "warehouse" | "webhook" | "manual";
  supported_entities: string[];
  supported_channels: string[];
  event_level_supported: boolean;
  aggregated_metrics_supported: boolean;
  requires_credentials: boolean;
  sync_modes: Array<"full" | "incremental" | "manual">;
  documentation_url?: string;
  limitations?: string[];
}
```

### `ExtractContext`

```ts
export interface ExtractContext {
  organization_id: string;
  connector_run_id: string;
  start_date?: string;
  end_date?: string;
  full_sync?: boolean;
  cursor?: string;
  assumptions_id?: string;
}
```

### `MappingContext`

```ts
export interface MappingContext {
  organization_id: string;
  connector_run_id: string;
  schema_version: string;
  assumptions_id?: string;
  mapping_profile_id?: string;
}
```

### `ValidationContext`

```ts
export interface ValidationContext {
  organization_id: string;
  connector_run_id: string;
  schema_version: string;
  strict_mode?: boolean;
}
```

### `PublishContext`

```ts
export interface PublishContext {
  organization_id: string;
  connector_run_id: string;
  destination: "jsonl" | "db" | "api";
}
```

### `ReportContext`

```ts
export interface ReportContext {
  organization_id: string;
  connector_run_id: string;
}
```

## Mapped output shape

Each `map()` call should return a canonical batch.

```ts
export interface MappedRecordBatch {
  organizations?: unknown[];
  assumption_sets?: unknown[];
  cases?: unknown[];
  interactions?: unknown[];
  call_interactions?: unknown[];
  email_interactions?: unknown[];
  chat_sessions?: unknown[];
  bot_sessions?: unknown[];
  voice_bot_sessions?: unknown[];
  attachments?: unknown[];
  callbacks?: unknown[];
  transfers?: unknown[];
  escalations?: unknown[];
  agent_activities?: unknown[];
  knowledge_usage?: unknown[];
  aggregated_metrics?: unknown[];
  manifests?: MappingManifestEntry[];
}
```

In implementation, these should use the canonical TypeScript types.

## Mapping manifest entry

Each connector should emit provenance metadata.

```ts
export interface MappingManifestEntry {
  source_system: string;
  source_entity: string;
  source_field: string;
  target_entity: string;
  target_field: string;
  transformation?: string;
  confidence: "high" | "medium" | "low";
  notes?: string;
}
```

## Validation model

### `ValidationResult`

```ts
export interface ValidationResult {
  level: "error" | "warning" | "info";
  code: string;
  entity?: string;
  record_id?: string;
  field?: string;
  message: string;
}
```

Typical validation codes:

- `missing_required_field`
- `invalid_enum_value`
- `negative_duration`
- `invalid_timestamp_order`
- `unknown_case_reference`
- `unsupported_channel`
- `low_confidence_mapping`

## Publish model

### `PublishResult`

```ts
export interface PublishResult {
  success: boolean;
  records_written: number;
  entities_written: Record<string, number>;
  destination: string;
}
```

## Run reporting

### `ConnectorRunReport`

```ts
export interface ConnectorRunReport {
  connector_run_id: string;
  connector_id: string;
  started_at: string;
  finished_at: string;
  source_records_read: number;
  mapped_records_written: number;
  validation_errors: number;
  validation_warnings: number;
  unsupported_fields: string[];
  unsupported_metrics: string[];
  confidence_summary: {
    high: number;
    medium: number;
    low: number;
  };
}
```

## Configuration model

Connector config should be connector-specific, but generally follows:

```ts
export interface BaseConnectorConfig {
  organization_id: string;
  source_system_name: string;
  mapping_profile_id?: string;
  assumptions_id?: string;
}
```

### API connector config example

```ts
export interface ApiConnectorConfig extends BaseConnectorConfig {
  base_url: string;
  auth_type: "token" | "oauth2" | "basic";
  access_token?: string;
  client_id?: string;
  client_secret?: string;
}
```

### CSV connector config example

```ts
export interface CsvConnectorConfig extends BaseConnectorConfig {
  file_paths: string[];
  delimiter?: "," | ";" | "\t";
  entity_type: string;
  has_header?: boolean;
}
```

## Connector behavior requirements

### 1. Idempotency

Connectors should support repeat runs without duplicating canonical records if source records did not change.

Recommended strategies:

- retain `external_*_id`
- deterministic canonical id generation
- upsert semantics in publish step

### 2. Partial support is allowed

A connector does not need to support every entity.

Example:

- a telephony connector may emit `call_interactions`, `callbacks`, `transfers`
- a ticketing connector may emit `cases`, `email_interactions`, `aggregated_metrics`

But it must declare its limitations in `describe()`.

### 3. Confidence reporting is mandatory

Every connector should classify mappings:

- `high`
- `medium`
- `low`

Especially when source semantics are ambiguous.

### 4. Missing data must not be fabricated

If the source does not provide a value:

- omit it
- or mark the metric unsupported

Never fake:

- customer read time
- customer device type
- attachment retention
- bot turn counts

unless they clearly come from assumptions outside connector mapping.

## Reference helper functions

The SDK should expose utilities:

```ts
export function toSeconds(value: number, unit: "seconds" | "minutes" | "hours"): number;
export function safeEnum<T extends string>(value: string, allowed: readonly T[]): T | undefined;
export function buildCanonicalId(prefix: string, parts: string[]): string;
export function validateRequiredFields(record: Record<string, unknown>, fields: string[]): ValidationResult[];
```

## Recommended folder structure for a connector

```text
/connectors/zendesk
  /src
    descriptor.ts
    config.ts
    extract.ts
    map.ts
    validate.ts
    publish.ts
    report.ts
    index.ts
  /fixtures
  /tests
  README.md
```

## Example: CSV monthly email metrics connector

### Source columns

- `month`
- `team`
- `emails_received`
- `emails_sent`
- `reopened_cases`
- `attachments_sent`
- `attachment_total_gb`

### Output

- one `aggregated_metrics` record per row

### Mapping sketch

```ts
function mapCsvRow(row: Record<string, string>): MappedRecordBatch {
  return {
    aggregated_metrics: [
      {
        record_id: `agg_${row.month}_${row.team}_email`,
        organization_id: "org_demo",
        period_start: `${row.month}-01`,
        period_end: `${row.month}-30`,
        channel: "email",
        team_id: row.team,
        contacts: Number(row.emails_received),
        reopened_cases: Number(row.reopened_cases),
        attachments_sent: Number(row.attachments_sent),
        attachment_total_gb: Number(row.attachment_total_gb)
      }
    ]
  };
}
```

## Example: Genesys call connector

Should typically output:

- `call_interactions`
- `callbacks`
- `transfers`

And optionally:

- `aggregated_metrics`

if event reconstruction is incomplete.

## Adapter maturity levels

Recommended maturity labels:

- `experimental`
- `beta`
- `stable`

### Experimental

- basic extraction works
- limited validation
- known semantic gaps

### Beta

- entity support is usable
- validation and reporting exist
- mapping manifest exists

### Stable

- tested on real deployments
- documented limitations
- sample dataset included
- confidence reporting complete

## Recommended next artifacts

- `connector-sdk-types.ts`
- `csv-template-calls.csv`
- `csv-template-emails.csv`
- `sample-mapping-manifest.json`
- `reference-csv-connector.ts`
