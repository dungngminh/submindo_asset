# Submindo Asset
## Used for Submindo

This is the asset for Submindo project:
- public/
- type.json — subscription type catalog (`icon`, optional `dark_icon` for dark UI)
- icons/ — `{slug}.webp` logos (~256px); dark variants as `{slug}-dark.webp`
- template.json # Subscription plan templates (per-tier prices, multi-currency)
- docs/ # All the docs of Submindo

### type.json fields

| Field | Required | Notes |
|---|---|---|
| `id` | yes | SCREAMING_SNAKE |
| `name`, `color`, `icon`, `category`, `is_popular` | yes | `icon` = light/default slug |
| `dark_icon` | no | slug for dark-mode logo when light art is black/unreadable on dark UI |

Bump `version` on every `type.json` change so clients re-sync.