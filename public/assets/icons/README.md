# Icons

CryptoFolio uses **Lucide** for UI iconography (nav, actions) and **Unicode glyphs** for inline data markers.

## Lucide (CDN)

Loaded at runtime — we do not ship the SVG files to disk.

```html
<script src="https://unpkg.com/lucide@0.460.0/dist/umd/lucide.min.js"></script>
<script>lucide.createIcons();</script>
```

Or via React-style import in the UI kits:

```jsx
<Icon name="refresh-cw" size={16} />
```

### Icons used in the kits

| Name              | Where                                               |
|-------------------|-----------------------------------------------------|
| `refresh-cw`      | Dashboard refresh button                            |
| `settings`        | Dashboard settings toggle                           |
| `plus`            | Add asset / add wallet                              |
| `pencil`          | Edit address, rename wallet                         |
| `trash-2`         | Remove asset, delete wallet book entry              |
| `copy`            | Copy address                                        |
| `external-link`   | "View on Etherscan" / "View on Solscan"             |
| `check`           | Active / saved confirmation                         |
| `x`               | Close modal, clear input, dismiss banner            |
| `chevron-down`    | Select / dropdown                                   |
| `chevron-right`   | Nav indicator, row expand                           |
| `arrow-up-right`  | "Up" delta marker (used alongside ▲)                |
| `arrow-down-right`| "Down" delta marker                                 |
| `alert-triangle`  | Warning banner (replaces ⚠️ emoji)                   |
| `info`            | Info banner (replaces ℹ️ emoji)                      |
| `eye` / `eye-off` | Show/hide private balance toggle                    |
| `search`          | Filter assets / wallets                             |
| `wallet`          | Wallet page marker                                  |
| `layers`          | Integrated page marker                              |
| `bar-chart-3`     | Dashboard page marker                               |
| `coins`           | Portfolio page marker                               |

**Stroke width: `1.75`. Color: `currentColor`. Default size: `16` (chrome) or `20` (page headers).**

## Unicode glyphs (no asset needed)

These inherit text color and scale with the surrounding type. We use these for inline data, not for navigation.

| Glyph | Meaning            | Example                  |
|-------|--------------------|--------------------------|
| `▲`   | up / positive      | `▲ 2.34%`                |
| `▼`   | down / negative    | `▼ 1.08%`                |
| `Ξ`   | Ether unit         | `0.4218 Ξ`               |
| `◎`   | Solana unit        | `12.0 ◎`                 |
| `✓`   | confirmed / active | `✓ Active`               |
| `✕`   | dismiss / clear    | `[ ✕ Clear ]`            |
| `·`   | bullet separator   | `ETH + USDT · FIFO`      |
| `—`   | em-dash divider    | `— Active Wallets`       |

## Crypto coin marks

For UI-kit demos we ship monochrome SVG stand-ins in `assets/coin-marks/`. In the real app, prefer the `image` URL returned by CoinGecko's `/coins/markets` endpoint.

## Substitution flag

The original codebase has **no icon library at all** — it relies entirely on Unicode + emoji. Bringing in Lucide is our own design call to lift the quality of the chrome (nav, buttons, banners) without breaking the minimalist tone. If you prefer a different set (Heroicons, Phosphor, Tabler), it's a single swap.
