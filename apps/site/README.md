# Vox marketing website

The landing page for **[vox.uts.qa](https://vox.uts.qa)** — a bilingual
(English + Arabic) marketing site built with **Next.js 15 (App Router)** and
TypeScript.

## Run it

```sh
cd apps/site
npm install
npm run dev          # → http://localhost:3000  (redirects to /en)
```

```sh
npm run build        # production build (static per-locale pages)
npm run start        # serve the production build
```

> This app is standalone (its own `package.json` / `node_modules`) and is **not**
> part of the repo's pnpm workspace, so `npm` here won't touch the other apps.

## Routes

- `/` → redirects to `/en` (see `middleware.ts`).
- `/en` and `/ar` are **separate, statically-generated, fully indexable** routes
  (`generateStaticParams` → `['en','ar']`, `dynamicParams = false`).
- Per-locale `<html lang dir>` (Arabic renders `dir="rtl"`), per-locale
  `<title>` / description / OpenGraph via `generateMetadata`, `hreflang`
  alternates between en/ar (+ `x-default`), plus `app/sitemap.ts` and
  `app/robots.ts`.

```
app/
  [lang]/
    layout.tsx     # <html lang dir>, fonts, theme, header/footer, metadata + hreflang
    page.tsx       # the one-page site (assembles the sections)
  icon.svg         # favicon (the П mark)
  robots.ts        # /robots.txt
  sitemap.ts       # /sitemap.xml
  globals.css      # design tokens (light + dark) + all component styles
  fonts.ts         # next/font: Inter (Latin) + IBM Plex Sans Arabic
components/
  header, footer, logo, theme-toggle, theme-script, lang-switch, icons
  sections/        # hero, two-ways, host, calls, e2e, developers, cta
  mockups/         # CSS/SVG app window, host panel, call grid
dictionaries/
  en.ts            # English copy (source of truth for the content shape)
  ar.ts            # Arabic copy — typed as `Dictionary`, so it must stay in sync
lib/
  i18n.ts          # locales, getDictionary, dir()
  links.ts         # canonical external links
middleware.ts      # / → /en
```

## Theme

Default **light**, with a **soft dark** theme (slate/near-navy, not pure black).
Implemented with CSS variables and a `.dark` class on `<html>`. An inline script
(`components/theme-script.tsx`, first child of `<body>`) applies the stored choice
before paint, so there's **no flash of the wrong theme**. The choice is persisted
in `localStorage` (`vox-theme`); with no stored choice the site defaults to
light. `color-scheme` is set so native controls match the active theme.

## Fonts

Loaded with `next/font/google` (self-hosted at build time, no layout shift):

- **Inter** — Latin UI font, used everywhere.
- **IBM Plex Sans Arabic** — applied on the `/ar` route via
  `html[lang="ar"]` in `globals.css`.

## RTL

Arabic is a first-class layout: the stylesheet uses **CSS logical properties**
(`padding-inline`, `margin-inline`, `inset-inline`, `border-start-*`, etc.)
throughout, so spacing, chat bubbles, and diagrams mirror correctly under
`dir="rtl"`.

## Editing content

All copy lives in `dictionaries/en.ts` and `dictionaries/ar.ts`. `en.ts` defines
the `Dictionary` type; `ar.ts` is typed against it, so if you add a key to one you
must add it to the other or the build fails — the two locales can't drift.

## Deploy

`npm run build` produces a standard Next.js server build. Deploy to any Node host
or a platform that runs Next (e.g. Vercel), then point `vox.uts.qa` at it. The
root-path redirect uses middleware, so a plain static-file host is not sufficient
on its own; use a Next-aware runtime.

## Brand

`components/logo.tsx` / `public/logo.svg` / `app/icon.svg` are the Vox mark:
a voice waveform — five rounded bars rising and falling like speech, slot, in white on a blue squircle. Primary accent: blue `#4f8cff` (buttons use a
higher-contrast `#2563eb`).
