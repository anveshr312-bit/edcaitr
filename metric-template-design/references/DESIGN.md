# metric-template DESIGN.md

> Auto-generated design system — reverse-engineered via static analysis by skillui.
> Frameworks: None detected
> Colors: 14 · Fonts: 3 · Components: 7
> Icon library: not detected · State: not detected
> Primary theme: dark · Dark mode toggle: no · Motion: expressive

## Visual Reference

**Match this design exactly** — study colors, fonts, spacing, and component shapes before writing any UI code.

![metric-template Homepage](../screenshots/homepage.png)

---

## 1. Visual Theme & Atmosphere

This is a **dark-themed** interface with a flat, warm visual language. Elevation is achieved through color and border shifts rather than shadows — a clean, industrial aesthetic. Typography pairs **satoshi** for display/headings with **manrope** for body text, creating clear visual hierarchy through type contrast. Spacing follows a **4px base grid** (compact density), with scale: 4, 8, 64, 80, 104px. The palette is predominantly monochromatic with **#e40014** as the single accent color — used sparingly for interactive elements and emphasis. Motion is expressive — spring physics, layout animations, and staggered reveals are part of the visual language.

---

## 2. Color Palette & Roles

| Token | Hex | Role | Use |
|---|---|---|---|
| theme-color | `#0d0d0d` | background | Page background, darkest surface |
| color-surface | `#1c1c1c` | surface | Card and panel backgrounds |
| tw-ring-offset-color | `#ffffff` | text-primary | Headings and body text |
| ring | `#454545` | text-muted | Captions, placeholders, secondary info |
| chart-3 | `#525252` | border | Dividers, card borders, outlines |
| destructive | `#e40014` | accent | CTAs, links, focus rings, active states |
| sidebar-accent | `#f5f5f5` | accent | CTAs, links, focus rings, active states |
| danger | `#ff9b8a` | danger | Error states, destructive actions |
| color-ink-mute | `#6e6e6e` | unknown | Palette color |
| color-black | `#000000` | unknown | Palette color |
| color-ink-soft | `#d4d4d4` | unknown | Palette color |
| chart-5 | `#262626` | unknown | Palette color |
| sidebar-border | `#e5e5e5` | unknown | Palette color |
| sidebar-ring | `#a1a1a1` | unknown | Palette color |

### CSS Variable Tokens

```css
--tw-border-style: solid;
--color-background: var(--background);
--color-foreground: var(--foreground);
--color-border: var(--border);
--background: #0d0d0d;
--foreground: #fcfcfc;
--card: #1c1c1c;
--card-foreground: #fcfcfc;
--popover: #131313;
--popover-foreground: #fcfcfc;
--primary: #fefff5;
--primary-foreground: #0d0d0d;
--secondary: #1c1c1c;
--secondary-foreground: #fcfcfc;
--muted: #1c1c1c;
--muted-foreground: #6e6e6e;
--accent: #212121;
--accent-foreground: #fcfcfc;
--destructive: #e40014;
--border: #212121;
```


---

## 3. Typography Rules

**Font Stack:**
- **manrope** — Heading 1, Heading 2, Heading 3
- **satoshi** — Body, Caption
- **SFMono-Regular** — Code

**Font Sources:**

```css
@font-face {
  font-family: "satoshi";
  src: url("fonts/satoshi-Regular.woff2") format("woff2");
  font-weight: 400;
}
@font-face {
  font-family: "satoshi";
  src: url("fonts/satoshi-700.woff2") format("woff2");
  font-weight: 700;
}
@font-face {
  font-family: "manrope";
  src: url("fonts/manrope-700.woff2") format("woff2");
  font-weight: 700;
}
@font-face {
  font-family: "inter";
  src: url("fonts/inter-Regular.woff2") format("woff2");
  font-weight: 400;
}
```

| Role | Font | Size | Weight |
|---|---|---|---|
| Heading 1 | manrope | 114px | 700 |
| Heading 2 | manrope | 91px | 700 |
| Heading 3 | manrope | 88px | 700 |
| Body | satoshi | 22px | 400 |
| Caption | satoshi | 16px | 400 |
| Code | SFMono-Regular | 14px | 400 |

**Typographic Rules:**
- Limit to 3 font families max per screen
- Use **manrope** for body/UI text, **satoshi** for display/headings
- Maintain consistent hierarchy: no more than 3-4 font sizes per screen
- Headings use bold (600-700), body uses regular (400)
- Line height: 1.5 for body text, 1.2 for headings
- Use color and opacity for secondary hierarchy, not additional font sizes


---

## 4. Component Stylings

### Layout (1)

**Footer** — `html`

### Navigation (1)

**Navigation** — `html`

### Data Input (2)

**Button** — `html`
- Animation: 

**Input** — `html`
- State: :focus, :placeholder

### Media (3)

**Image** — `html`

**Icon** — `html`

**Map/Canvas** — `html`



---

## 5. Layout Principles

- **Base spacing unit:** 4px
- **Spacing scale:** 4, 8, 64, 80, 104
- **Border radius:** 9px
- **Max content width:** 1280px

**Spacing as Meaning:**
| Spacing | Use |
|---|---|
| 4-8px | Tight: related items within a group |
| 12-16px | Medium: between groups |
| 24-32px | Wide: between sections |
| 48px+ | Vast: major section breaks |


---

## 6. Depth & Elevation

No box-shadow values detected. The design uses a **flat visual style** — elevation is conveyed through background color shifts and borders rather than shadows.

**Elevation Strategy:**
| Level | Technique | Use |
|---|---|---|
| 0 — Base | Background color | Page background |
| 1 — Raised | Lighter surface + subtle border | Cards, panels |
| 2 — Floating | Even lighter surface + stronger border | Dropdowns, popovers |
| 3 — Overlay | Backdrop + modal surface | Modals, dialogs |

**Z-Index Scale:** `2, 3, 7, 90, 100, 110, 120`


---

## 7. Animation & Motion

This project uses **expressive motion**. Animations are an integral part of the experience.

### CSS Animations

- `@keyframes fw-ticker-x`
- `@keyframes fw-ticker-y`
- `@keyframes spin`
- `@keyframes pulse`
- `@keyframes enter`
- `@keyframes exit`

### Animated Components

- **Button**: 

### Motion Guidelines

- Duration: 150-300ms for micro-interactions, 300-500ms for page transitions
- Easing: `ease-out` for enters, `ease-in` for exits
- Always respect `prefers-reduced-motion`


---

## 8. Do's and Don'ts

### Do's

- Use `#e40014` for interactive elements (buttons, links, focus rings)
- Use `#0d0d0d` as the primary page background
- Pair **manrope** (body) with **satoshi** (display) — these are the only allowed fonts
- Follow the **4px** spacing grid for all margins, padding, and gaps
- Use border and background shifts for elevation — not shadows
- Use border-radius from the scale: 9px
- Reuse existing components from Section 4 before creating new ones

### Don'ts

- Don't introduce colors outside this palette — extend the design tokens first
- Don't introduce additional font families beyond manrope and satoshi and SFMono-Regular
- Don't use arbitrary spacing values — stick to multiples of 4px
- Don't add box-shadow — this design system uses flat elevation
- Don't use gradients — the design uses solid colors only
- Don't use arbitrary border-radius values — pick from the defined scale
- Don't duplicate component patterns — check Section 4 first
- Don't use backdrop-blur or blur effects

### Anti-Patterns (detected from codebase)

- No box-shadow on any element
- No gradient backgrounds
- No blur or backdrop-blur effects
- No zebra striping on tables/lists


---

## 9. Responsive Behavior

| Name | Value | Source |
|---|---|---|
| sm | 40rem | css |
| md | 48rem | css |
| lg | 64rem | css |
| xl | 80rem | css |
| 2xl | 96rem | css |
| lg | 810px | css |
| 2xl | 1361px | css |

**Approach:** Use `@media (min-width: ...)` queries matching the breakpoints above.


---

## 10. Agent Prompt Guide

Use these as starting points when building new UI:

### Build a Card

```
Background: #1c1c1c
Border: 1px solid #525252
Radius: 9px
Padding: 8px
Font: manrope
No shadows — use borders and surface colors for depth.
```

### Build a Button

```
Primary: bg #e40014, text white
Ghost: bg transparent, border #525252
Padding: 8px 8px
Radius: 9px
Hover: opacity 0.9 or lighter shade
Focus: ring with #e40014
```

### Build a Page Layout

```
Background: #0d0d0d
Max-width: 1280px, centered
Grid: 4px base
Responsive: mobile-first, breakpoints from Section 9
```

### Build a Stats Card

```
Surface: #1c1c1c
Label: #454545 (muted, 12px, uppercase)
Value: #ffffff (primary, 24-32px, bold)
Status: use success/warning/danger from Section 2
```

### Build a Form

```
Input bg: #0d0d0d
Input border: 1px solid #525252
Focus: border-color #e40014
Label: #454545 12px
Spacing: 8px between fields
Radius: 9px
```

### General Component

```
1. Read DESIGN.md Sections 2-6 for tokens
2. Colors: only from palette
3. Font: manrope, type scale from Section 3
4. Spacing: 4px grid
5. Components: match patterns from Section 4
6. Elevation: flat, surface shifts
```
