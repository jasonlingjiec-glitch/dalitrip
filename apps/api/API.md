# Local API Reference

Run:

```bash
npm run api:start
```

The local service starts on `http://localhost:3000`.

## Health

- `GET /health`

## Groups

- `GET /api/groups`
- `POST /api/groups`

## Tags

- `GET /api/tags?locale=zh-CN`
- `POST /api/tags`

## Activities

- `GET /api/activities?locale=zh-CN&tagIds=tag-hiking,tag-beginner`
- `GET /api/activities/:activityId`
- `POST /api/activities`
- `PATCH /api/activities/:activityId`
- `PATCH /api/activities/:activityId/schedule-pause`

Multiple `tagIds` use AND semantics: selecting more tags narrows results.

## Schedules

- `GET /api/activities/:activityId/schedule-rules`
- `POST /api/activities/:activityId/schedule-rules`
- `POST /api/activities/:activityId/regular-schedule-rules`
- `PATCH /api/schedule-rules/:ruleId`
- `DELETE /api/schedule-rules/:ruleId`
- `GET /api/activities/:activityId/slots`
- `POST /api/activities/:activityId/slots`

Overlapping slots are intentionally allowed. A slot must finish on the same
calendar day. Times use 15-minute increments. Each weekly rule or special slot
contains one or more specification-price rows, such as `成人 ¥268` and
`儿童 ¥168`. Capacity belongs to the time period and is shared by its
specifications.

## Orders

- `GET /api/orders?customerId=:customerId&groupId=:groupId&status=:status`
- `GET /api/orders/:orderId`
- `POST /api/orders`
- `PATCH /api/orders/:orderId/confirm-payment`
- `PATCH /api/orders/:orderId/cancel`

Creating an order locks capacity for 15 minutes. Confirming payment keeps the
capacity. Cancelling or allowing the lock to expire releases capacity
immediately. `POST /api/orders` accepts a `priceOptionId`; the selected
specification determines the unit price and final amount.
