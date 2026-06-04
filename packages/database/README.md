# Database

The first schema is documented in `schema.sql`.

Important invariants:

- `special schedule > rest day > regular schedule`
- overlapping schedule slots are allowed
- a slot must finish within the same calendar day
- schedule times use 15-minute increments
- capacity is released immediately after cancellation or refund
- unpaid capacity locks expire after 15 minutes
- customer-facing frozen-account errors stay intentionally generic
- review deletion is a soft delete
- all money and permission changes retain audit records
