# ASTRA — Architecture & Module Specifications

## Overview

ASTRA (Smart Farmer Procurement Coordination Platform) is architected as a modular, decoupled platform designed for high-throughput, capacity-aware agricultural procurement coordination.

The system decouples operational workflows (Farmer Registration, Scheduling, Live Physical Queues, Weighment, Quality Grading, Disbursal Tracking) into isolated modules coordinated via PostgreSQL for audit records and Redis for volatile/real-time state.

## System Topography

```
[ Next.js Web Client ] (apps/web)
       │
       │ HTTP / WebSocket (/events)
       ▼
[ NestJS Backend Core ] (apps/api)
  ├── Auth & RBAC (Roles: FARMER, CHECK_IN, WEIGHMENT, QUALITY, PROCUREMENT, PAYMENT, GOVT_ADMIN)
  ├── Modular Domain Controllers & Services
  ├── External Adapters (NotificationProvider, GovernmentIntegrationProvider)
  │
  ├── [ PostgreSQL ] (via Prisma) ── Permanent records (Farmers, Transactions, Audit)
  │
  └── [ Redis ] ──────────────────── Ephemeral state (Queue order, OTP limits, ETAs)
```

## Module Directory Index

The backend application (`apps/api/src/modules`) comprises 15 domain modules:

| Module | Scope / Responsibility |
| :--- | :--- |
| `auth` | Session and token lifecycle, role-based access control (RBAC). |
| `farmer` | Farmer identity profiles and verification attributes. |
| `registration` | Onboarding documentation, landholding and bank details linkage. |
| `centre` | Procurement centres, physical intake counters, and daily quotas. |
| `booking` | Future-date procurement reservations and token issuance. |
| `scheduling` | Dynamic capacity-aware slotting and arrival window allocation. |
| `queue` | Real-time queue ordering, token sequencing, and live ETA calculations. |
| `checkin` | Physical entry gate token verification and arrival timestamping. |
| `weighment` | Weighbridge gross and tare logging, net crop computation. |
| `quality` | Moisture testing, crop grading (FAQ / Non-FAQ), and defect scoring. |
| `procurement` | Purchase finalization against statutory MSP prices and quotas. |
| `payment` | Disbursal batching, DBT coordination, and settlement confirmation. |
| `notification` | Multi-channel messaging (SMS, IVR, USSD) via provider adapters. |
| `government` | Regulatory reporting and statutory procurement data feeds. |
| `admin` | System parameters, procurement season calendar, and audit trails. |

## External Integration Adapters

ASTRA isolates third-party vendor APIs behind explicit TypeScript interfaces:
1. `NotificationProvider`: Contract for transactional SMS, automated voice IVR, and USSD interactions.
2. `GovernmentIntegrationProvider`: Contract for official state portal quota verification and statutory settlement receipts.
