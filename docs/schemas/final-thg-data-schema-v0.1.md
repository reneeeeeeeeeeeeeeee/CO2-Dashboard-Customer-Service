# Final THG Data Schema v0.1

## Purpose

This schema extends the current customer-service CO2 model into a stricter greenhouse-gas data model for final reporting, auditability, and later alignment with GHG Protocol style accounting.

It is intended as:

- a target schema for high-confidence company deployment
- a bridge between operational customer-service data and formal emissions accounting
- a checklist for which data should be collected as primary data versus proxy data

This schema is meant to be instantiated as real tables or CSV datasets.
It is not only a documentation artifact.

For this project, treat the schema as a target structure for stricter reporting.
It can be populated from company activity data together with curated emission-factor, gas-factor, data-quality, and source-reference inputs.

## Design rule

Every calculated emissions value should be traceable to:

1. a reporting boundary
2. an activity record
3. an emission factor or gas-specific GWP rule
4. a data quality statement
5. a source reference

## Scope of use

This schema can cover:

- operational customer-service footprint
- Scope 1 direct emissions
- Scope 2 purchased electricity / heat / cooling / steam
- selected Scope 3 categories where needed

It should not force all companies to fill all fields.
Instead, it should distinguish between:

- `required for strict reporting`
- `recommended for high confidence`
- `optional for enrichment`

## Core principles

- separate `activity data` from `factor data`
- separate `gas quantities` from `co2e`
- separate `location-based` from `market-based` electricity logic
- store factor metadata explicitly
- store data quality explicitly
- support both customer-service use cases and broader THG accounting

## Canonical entities

- `reporting_boundary`
- `organization_site`
- `emission_source_category`
- `activity_record`
- `gas_factor`
- `emission_factor`
- `emission_calculation`
- `data_quality_record`
- `source_reference`

## 1. ReportingBoundary

Defines what is included in the inventory.

### Required fields

| Field | Type | Example |
|---|---|---|
| `reporting_boundary_id` | `id` | `rb_2026_cs_provider_de` |
| `organization_id` | `id` | `org_demo` |
| `boundary_name` | `string` | `Customer Service Provider Side Germany` |
| `inventory_purpose` | `string` | `operational_footprint` |
| `start_date` | `date` | `2026-01-01` |
| `end_date` | `date` | `2026-12-31` |
| `includes_scope_1` | `boolean` | `true` |
| `includes_scope_2` | `boolean` | `true` |
| `includes_scope_3` | `boolean` | `false` |

### Recommended fields

| Field | Type | Example |
|---|---|---|
| `organizational_boundary_method` | `string` | `operational_control` |
| `reporting_standard` | `string` | `ghg_protocol_corporate_standard` |
| `gwp_version` | `string` | `ipcc_ar6_100y` |
| `notes` | `string` | `Customer-side usage reported separately` |

## 2. OrganizationSite

Stores location-specific metadata needed for factor selection and audit trails.

### Required fields

| Field | Type | Example |
|---|---|---|
| `site_id` | `id` | `site_berlin_hq` |
| `organization_id` | `id` | `org_demo` |
| `site_name` | `string` | `Berlin Contact Center` |
| `country_code` | `string` | `DE` |
| `timezone` | `string` | `Europe/Berlin` |

### Recommended fields

| Field | Type | Example |
|---|---|---|
| `market` | `string` | `DE` |
| `grid_region` | `string` | `Germany national grid` |
| `leased_or_owned` | `string` | `leased` |

## 3. EmissionSourceCategory

Classifies records by accounting logic rather than by channel alone.

### Required fields

| Field | Type | Example |
|---|---|---|
| `source_category_id` | `id` | `scope2_purchased_electricity` |
| `scope` | `string` | `scope_2` |
| `category_name` | `string` | `Purchased electricity` |
| `calculation_method` | `string` | `activity_x_factor` |

### Suggested categories

- `scope1_stationary_combustion`
- `scope1_mobile_combustion`
- `scope1_fugitive_refrigerants`
- `scope1_process_emissions`
- `scope2_purchased_electricity`
- `scope2_purchased_heat`
- `scope2_purchased_cooling`
- `scope2_purchased_steam`
- `scope3_cloud_services`
- `scope3_purchased_hardware`
- `cs_operational_calls`
- `cs_operational_emails`
- `cs_operational_chatbot`
- `cs_operational_voice_bot`

## 4. ActivityRecord

This is the central fact table.

### Required fields

| Field | Type | Example |
|---|---|---|
| `activity_record_id` | `id` | `act_2026_0001` |
| `reporting_boundary_id` | `id` | `rb_2026_cs_provider_de` |
| `organization_id` | `id` | `org_demo` |
| `site_id` | `id` | `site_berlin_hq` |
| `source_category_id` | `id` | `scope2_purchased_electricity` |
| `period_start` | `date` | `2026-01-01` |
| `period_end` | `date` | `2026-01-31` |
| `activity_name` | `string` | `Purchased electricity for contact center floor` |
| `activity_value` | `number` | `125000` |
| `activity_unit` | `string` | `kwh` |
| `is_primary_data` | `boolean` | `true` |
| `source_reference_id` | `id` | `src_bill_utility_2026_01` |

### Recommended fields

| Field | Type | Example |
|---|---|---|
| `channel` | `string` | `call` |
| `team_id` | `string` | `team_voice_de` |
| `market` | `string` | `DE` |
| `supplier_name` | `string` | `Utility Co` |
| `meter_id` | `string` | `meter_cc_01` |
| `factor_selection_key` | `string` | `de_electricity_location_based_2026` |
| `evidence_reference` | `string` | `Invoice 2026-01 / meter export` |
| `notes` | `string` | `Shared building allocation based on floor area` |

### Optional CS-specific enrichment fields

| Field | Type | Example |
|---|---|---|
| `interaction_id` | `id` | `int_88421` |
| `case_id` | `id` | `case_50013` |
| `agent_id` | `id` | `agent_101` |
| `device_type` | `string` | `desktop` |
| `network_type` | `string` | `fixed` |
| `turn_count` | `number` | `6` |
| `data_volume_gb` | `number` | `0.004` |
| `duration_seconds` | `integer` | `420` |

## 5. GasFactor

Used where gas-specific accounting is required.

### Required fields

| Field | Type | Example |
|---|---|---|
| `gas_factor_id` | `id` | `gas_hfc134a_ar6_100y` |
| `gas_code` | `string` | `HFC-134a` |
| `gas_name` | `string` | `HFC-134a` |
| `chemical_formula` | `string` | `CH2FCF3` |
| `gwp_100` | `number` | `1530` |
| `gwp_version` | `string` | `ipcc_ar6_100y` |
| `source_reference_id` | `id` | `src_ipcc_ar6_gwp` |

### Notes

- use this table for direct emissions such as refrigerant losses
- do not use it to re-add CH4 or N2O where a final CO2e factor already includes them

## 6. EmissionFactor

Stores non-gas-specific factors such as electricity, fuels, heat, or proxy factors.

### Required fields

| Field | Type | Example |
|---|---|---|
| `emission_factor_id` | `id` | `ef_de_grid_lb_2026` |
| `factor_name` | `string` | `Germany electricity mix location-based` |
| `applies_to_source_category_id` | `id` | `scope2_purchased_electricity` |
| `factor_value` | `number` | `0.363` |
| `factor_unit` | `string` | `kg_co2e_per_kwh` |
| `factor_year` | `integer` | `2026` |
| `factor_region` | `string` | `DE` |
| `factor_method` | `string` | `location_based` |
| `source_reference_id` | `id` | `src_uba_grid_factor_2024` |

### Recommended fields

| Field | Type | Example |
|---|---|---|
| `includes_co2` | `boolean` | `true` |
| `includes_ch4` | `boolean` | `true` |
| `includes_n2o` | `boolean` | `true` |
| `is_co2e_aggregated_factor` | `boolean` | `true` |
| `geography_granularity` | `string` | `country` |
| `quality_rating` | `string` | `high` |
| `valid_from` | `date` | `2026-01-01` |
| `valid_to` | `date` | `2026-12-31` |

## 7. EmissionCalculation

Stores the output and traceability of a specific calculation.

### Required fields

| Field | Type | Example |
|---|---|---|
| `emission_calculation_id` | `id` | `calc_2026_0001` |
| `activity_record_id` | `id` | `act_2026_0001` |
| `calculation_method` | `string` | `activity_x_factor` |
| `co2e_kg` | `number` | `45375` |

### Recommended fields

| Field | Type | Example |
|---|---|---|
| `emission_factor_id` | `id` | `ef_de_grid_lb_2026` |
| `gas_factor_id` | `id` | `gas_hfc134a_ar6_100y` |
| `co2_kg` | `number` | `0` |
| `ch4_kg` | `number` | `0` |
| `n2o_kg` | `number` | `0` |
| `gas_quantity_kg` | `number` | `12.5` |
| `location_based_co2e_kg` | `number` | `45375` |
| `market_based_co2e_kg` | `number` | `1200` |
| `calculation_version` | `string` | `v0.1` |
| `calculation_timestamp` | `timestamp` | `2026-04-17T15:00:00Z` |

## 8. DataQualityRecord

Makes assumptions and uncertainty visible.

### Required fields

| Field | Type | Example |
|---|---|---|
| `data_quality_record_id` | `id` | `dq_2026_0001` |
| `activity_record_id` | `id` | `act_2026_0001` |
| `data_quality_rating` | `string` | `high` |
| `is_estimate` | `boolean` | `false` |
| `evidence_type` | `string` | `invoice_and_meter_data` |

### Recommended fields

| Field | Type | Example |
|---|---|---|
| `completeness_rating` | `string` | `high` |
| `temporal_fit_rating` | `string` | `high` |
| `method_fit_rating` | `string` | `high` |
| `review_owner` | `string` | `sustainability_team` |
| `review_date` | `date` | `2026-04-17` |
| `notes` | `string` | `Shared building allocation confirmed by facilities` |

## 9. SourceReference

Single source catalog for literature, factor publications, invoices, telemetry exports, and internal evidence.

### Required fields

| Field | Type | Example |
|---|---|---|
| `source_reference_id` | `id` | `src_ipcc_ar6_gwp` |
| `source_type` | `string` | `publication` |
| `publisher_or_owner` | `string` | `IPCC` |
| `title` | `string` | `Climate Change 2021: The Physical Science Basis` |
| `year` | `integer` | `2021` |
| `access_path` | `string` | `https://www.ipcc.ch/...` |

### Recommended fields

| Field | Type | Example |
|---|---|---|
| `language` | `string` | `English` |
| `geography` | `string` | `global` |
| `source_role` | `string` | `gwp_reference` |
| `notes` | `string` | `Used for AR6 GWP 100 values` |

## Strict data requirements by source type

### Purchased electricity

Must use:

- meter or utility consumption
- site and period
- location-based factor
- market-based factor if contractual reporting is needed
- explicit source metadata

### Stationary or mobile combustion

Must use:

- fuel type
- quantity
- unit
- factor source and year
- separate gas logic if not already aggregated to CO2e

### Fugitive refrigerants or process gases

Must use:

- actual gas identity
- emitted mass in kg or robust leakage calculation
- GWP version
- gas-specific source

### Customer-service operational channels

Should use in strict mode:

- direct electricity and platform telemetry first
- traffic or compute telemetry second
- device/runtime proxies only where no better primary data exists

## Minimal final table set for your project

If you want to keep implementation pragmatic, start with these five tables:

1. `activity_record`
2. `emission_factor`
3. `gas_factor`
4. `source_reference`
5. `data_quality_record`

That is enough to support:

- your current customer-service model
- future Scope 1 / Scope 2 extensions
- auditable source tracking
- gas-specific expansion later

## How this maps to workbook concepts

The reviewed workbooks contain concepts that can inform several important data layers:

1. Factor tables
For fuels, electricity, heat, and related categories.

2. Gas-specific GWP tables
For gas identities and `GWP 100 (AR6)` values.

3. Source and methodology references
For methodological references and source links.

Use these workbook concepts as design material for structuring stricter THG tables.
They do not replace company-specific activity data or a curated final source catalog.

### Suggested mapping

| Workbook concept | Target table |
|---|---|
| Factor tables | `emission_factor` |
| Gas-specific GWP tables | `gas_factor` |
| Source and methodology references | `source_reference` |
| Company scope and activity inputs | `activity_record` |
| Data quality assessments | `data_quality_record` |

## Example records

```json
{
  "activity_record_id": "act_2026_cc_power_01",
  "reporting_boundary_id": "rb_2026_cs_provider_de",
  "organization_id": "org_demo",
  "site_id": "site_berlin_hq",
  "source_category_id": "scope2_purchased_electricity",
  "period_start": "2026-01-01",
  "period_end": "2026-01-31",
  "activity_name": "Purchased electricity for contact center floor",
  "activity_value": 125000,
  "activity_unit": "kwh",
  "is_primary_data": true,
  "source_reference_id": "src_internal_utility_invoice_2026_01"
}
```

```json
{
  "emission_factor_id": "ef_de_grid_lb_reference",
  "factor_name": "Germany electricity mix location-based",
  "applies_to_source_category_id": "scope2_purchased_electricity",
  "factor_value": 0.363,
  "factor_unit": "kg_co2e_per_kwh",
  "factor_year": 2024,
  "factor_region": "DE",
  "factor_method": "location_based",
  "source_reference_id": "src_uba_grid_factor_2024",
  "is_co2e_aggregated_factor": true,
  "includes_co2": true,
  "includes_ch4": true,
  "includes_n2o": true
}
```

```json
{
  "gas_factor_id": "gas_hfc134a_ar6_100y",
  "gas_code": "HFC-134a",
  "gas_name": "HFC-134a",
  "chemical_formula": "CH2FCF3",
  "gwp_100": 1530,
  "gwp_version": "ipcc_ar6_100y",
  "source_reference_id": "src_ipcc_ar6_gwp"
}
```

## Implementation note

Your existing schema in `canonical-schema-v0.1.md` should remain the operational interaction model.
This document is best treated as a stricter emissions-accounting layer on top of it, not as a replacement.
