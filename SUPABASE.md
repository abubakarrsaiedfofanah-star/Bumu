# BUMU Supabase Setup

This project is now Supabase-ready at the database level.

## Run The SQL

Open Supabase Dashboard -> SQL Editor, then run:

```sql
supabase/migrations/0001_agent_portal_schema.sql
```

Or with Supabase CLI:

```powershell
supabase db push
```

## Important Tables

- `agents`: unique agent IDs and profile data.
- `rider_identities`: one real rider/person across all old and new contracts.
- `rider_contracts`: one bike/debt contract. This stores `assigned_agent_id`, `registered_by_agent_id`, `contract_id`, and old contract links.
- `payments`: payment records tied to a contract.
- `repair_debt_requests`: agent-captured repair debt requests, pending finance/admin approval.
- `duplicate_registration_attempts`: blocked duplicate attempts.
- `id_scan_logs`, `chassis_checks`, `agent_visits`, `payment_promises`, `evidence_logs`, `risk_notes`: agent proof and anti-cheat timeline records.

## Core Rule

The database enforces:

```text
One rider identity cannot have two active unpaid contracts.
```

This is handled by the partial unique index:

```sql
one_active_unpaid_contract_per_rider
```

So even if an agent tries to force a duplicate active contract, Supabase rejects it.

## Portal Boundaries

Agent portal:
- Creates and views its own assigned contracts.
- Captures visits, evidence, promises, ID scans, repair requests, and risk notes.
- Can see linked contract summaries needed to stop cheating.

Admin portal:
- Can see all agents, all riders, all contracts, duplicate attempts, and audit logs.

Finance portal:
- Can see contracts, balances, payments, commissions, and repair debt requests.
- Should approve/reject repair debt requests and update real balances after approval.

Customer portal:
- Can show the rider identity plus all linked contracts using `rider_identity_id`.

## Auth Role Metadata

For staff accounts, set Supabase Auth `app_metadata.portal_role` to:

- `admin`
- `finance`

Agents default to `agent`.
