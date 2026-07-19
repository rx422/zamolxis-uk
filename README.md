# zamolxis.uk — Homelab Dashboard

A minimal, static dashboard for self-hosted homelab services. Built for GitHub Pages — no build tools, no dependencies, just HTML, CSS, and JS.

## Features

- **Local / Tailscale toggle** — switch between `.local` and `.zamolxis.uk` URLs
- **Service logos** — fetched from [dashboard-icons](https://github.com/walkxcode/dashboard-icons) CDN, with initial-letter fallback
- **Search filter** — press `/` to focus, `Esc` to clear
- **Responsive** — works on desktop, tablet, and phone
- **Categorized** — services grouped into Media, Productivity, Infrastructure, AI
- **Static** — ready for GitHub Pages as-is

## Structure

```
├── index.html          Main page
├── css/
│   └── style.css       Design tokens, layout, components
├── js/
│   └── app.js          Service data, rendering, mode switch, search
└── README.md
```

## Adding a service

Edit `js/app.js` → the `SERVICES` array:

```js
{ name: 'MyApp', slug: 'myapp', icon: 'myapp', category: 'infra' }
```

- `slug` — subdomain used in URLs (`myapp.local` / `myapp.zamolxis.uk`)
- `icon` — filename on the [dashboard-icons CDN](https://github.com/walkxcode/dashboard-icons/tree/main/png) (without `.png`)
- `category` — one of `media`, `prod`, `infra`, `ai`

If an app isn't on the icon CDN, use `selfIcon: true` instead of `icon` to fetch its own `/favicon.svg` directly (tried on both the `.local` and `.zamolxis.uk` hosts, falling back to initials if neither responds):

```js
{ name: 'MyApp', slug: 'myapp', selfIcon: true, category: 'infra' }
```

## Deployment

1. Push to `github.com/rx422/zamolxis-uk`.
2. In the repo, go to **Settings → Pages** and set **Source** to the `main` branch (`/root`).
3. This repo includes a `CNAME` file pointing to `zamolxis.uk`. At your DNS provider, add:
   - An `ALIAS`/`ANAME` record (or `A` records to GitHub's Pages IPs: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`) for the apex domain `zamolxis.uk`.
   - Optionally a `CNAME` record for `www` → `rx422.github.io`.
4. Back in **Settings → Pages**, set the custom domain to `zamolxis.uk` and enable **Enforce HTTPS** once the certificate is issued.

## License

MIT
