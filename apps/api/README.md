# API

The backend API owns booking, capacity, payment and refund state.

## Initial Responsibilities

- customer and manager mini-program login
- groups, activities, tags and localized content
- regular schedules, rest days and special schedules
- 15-minute unpaid capacity locks
- WeChat Pay order creation, callback handling and refunds
- automatic order completion after an activity ends
- customer wallet ledger
- role and group-scoped authorization
- spreadsheet export jobs

Payment callbacks must be idempotent. Capacity updates must run inside database
transactions so that two customers cannot buy the same final seat.

