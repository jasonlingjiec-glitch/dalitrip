# Dali Trip Activity Booking MVP

This is the formal project workspace for the activity booking system.

## Applications

- `apps/customer-miniapp`: customer WeChat mini-program
- `apps/manager-miniapp`: manager WeChat mini-program
- `apps/admin-web`: browser-based administration console
- `apps/api`: backend API and scheduled jobs

## Shared Packages

- `packages/config`: public application identifiers and shared constants
- `packages/database`: database schema and domain notes

## Infrastructure

- API server: Tencent Cloud Lighthouse, Guangzhou
- Asset storage: Tencent COS private bucket in `ap-guangzhou`
- Public domain: `dalitripapp.cn`
- Planned API domain: `api.dalitripapp.cn`
- Planned admin domain: `admin.dalitripapp.cn`

## Safety

Do not commit or send secrets in chat. Keep the following values only in the
deployment environment:

- mini-program AppSecret values
- WeChat Pay API v3 key
- merchant certificate private key
- COS SecretId and SecretKey
- database password

Copy `.env.example` to a private environment file only when deployment begins.

## MVP Delivery Order

1. Activity groups, activities, tags, images and schedules
2. Customer activity browsing and booking
3. Order capacity lock, payment callback and automatic release
4. Refund calculation and cancellation
5. Manager mini-program and group permissions
6. Homepage and topic page editor
7. Export center and production deployment

