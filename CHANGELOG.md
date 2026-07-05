# Changelog

Trace các lần bump version của `type.json` / `template.json` và thay đổi `icons/`.
Quy ước: mỗi lần sửa data phải bump `version` (int, tăng dần) của file tương ứng và thêm mục ở đây.

## 2026-07-05

### type.json v5 (70 → 85 services)

Thêm 15 service:
- ENTERTAINMENT: YouTube Music, Peacock, Apple Arcade, TIDAL, Deezer
- CLOUD: Apple One
- SOCIAL_MEDIA: Patreon, X Premium, Telegram Premium, Snapchat+
- AI: Cursor
- PRODUCTIVITY: Raycast Pro, Setapp
- UTILITIES: Proton Unlimited, Surfshark

### template.json v4 (90 → 115 plans)

Thêm plan (USD anchor, currency khác bổ sung sau) cho: Claude (Pro/Max), Perplexity Pro,
Midjourney (Basic/Standard/Pro), Grok (SuperGrok), YouTube Music, Peacock, Apple Arcade,
Apple One, TIDAL, Deezer, X Premium (Basic/Premium/Premium+), Telegram Premium, Snapchat+,
Cursor (Pro/Ultra), Raycast Pro, Setapp, Proton Unlimited, Surfshark.

Không có template: DeepSeek, Kimi, Kilo Code (không có giá sub cố định), Patreon (giá theo creator).

### icons/ (mới — 85 file)

Logo remote cho app/web theo convention `icons/{slug}.webp` (slug = field `icon`, ~256px).
App fallback: bundle → emoji → remote → chữ cái (xem `docs/features/remote-type-icons.md` bên app repo).
- 63 logo export từ assets sẵn có của app/web
- 22 logo tải mới (7 AI đã live từ v4 + 15 service mới) — nguồn Google faviconV2 / Wikimedia
- `gemini.webp` thay bằng logo official hiện tại (aurora sparkle, 06/2025); bản cũ là Bard-era

## Trước 2026-07-05 (ghi lại cho đủ)

- type.json v4: thêm 7 service AI (Claude, Perplexity Pro, Midjourney, Grok, DeepSeek, Kimi, Kilo Code)
- type.json v3 / template.json v3: baseline 63 services, 90 plans, 12 currencies
