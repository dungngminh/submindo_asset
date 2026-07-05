# Changelog

Traces every version bump of `type.json` / `template.json` and changes to `icons/`.
Convention: any data change bumps the file's `version` (monotonically increasing int) and adds an entry here.

## 2026-07-05

### type.json v5 (70 → 85 services)

Added 15 services:
- ENTERTAINMENT: YouTube Music, Peacock, Apple Arcade, TIDAL, Deezer
- CLOUD: Apple One
- SOCIAL_MEDIA: Patreon, X Premium, Telegram Premium, Snapchat+
- AI: Cursor
- PRODUCTIVITY: Raycast Pro, Setapp
- UTILITIES: Proton Unlimited, Surfshark

### template.json v4 (90 → 115 plans)

Added plans (USD anchor; other currencies to be filled in later) for: Claude (Pro/Max),
Perplexity Pro, Midjourney (Basic/Standard/Pro), Grok (SuperGrok), YouTube Music, Peacock,
Apple Arcade, Apple One, TIDAL, Deezer, X Premium (Basic/Premium/Premium+), Telegram Premium,
Snapchat+, Cursor (Pro/Ultra), Raycast Pro, Setapp, Proton Unlimited, Surfshark.

No templates for: DeepSeek, Kimi, Kilo Code (no fixed subscription pricing), Patreon
(creator-dependent pricing).

### icons/ (new — 85 files)

Remote logos for the app/web following the `icons/{slug}.webp` convention (slug = the `icon`
field, ~256px). App fallback chain: bundled → emoji → remote → first letter (see
`docs/features/remote-type-icons.md` in the app repo).
- 63 logos exported from existing app/web assets
- 22 newly downloaded (7 AI services live since v4 + 15 new services) — sourced from Google
  faviconV2 / Wikimedia
- `gemini.webp` replaced with the current official logo (aurora sparkle, June 2025); the old
  one was the Bard-era star

## Before 2026-07-05 (recorded retroactively)

- type.json v4: added 7 AI services (Claude, Perplexity Pro, Midjourney, Grok, DeepSeek, Kimi, Kilo Code)
- type.json v3 / template.json v3: baseline of 63 services, 90 plans, 12 currencies
