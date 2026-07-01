# Pochta marketing site

The landing page for **[pochta.uts.qa](https://pochta.uts.qa)**. Plain static HTML —
`index.html` + `assets/` (the logo). **No build step, no dependencies.**

## Brand

`assets/logo.svg` is the Pochta mark: the Cyrillic **П** (the first letter of *почта*)
drawn as a post-office doorway with a mail slot, in white on a postal-red squircle. It
scales from favicon to hero and is reused as the web app's favicon
(`apps/web/public/favicon.svg`). Brand color: `#E11D48` (postal red).

## Preview locally

```sh
cd apps/site
python3 -m http.server 8080     # → http://localhost:8080
# or just open index.html in a browser
```

## Deploy to pochta.uts.qa

It's a static folder — serve `apps/site/` from anything, then point the DNS record
`pochta.uts.qa` at it. A few options:

**Caddy** (auto-HTTPS, one file):

```
# Caddyfile
pochta.uts.qa {
    root * /var/www/pochta-site
    file_server
}
```

**Nginx:**

```nginx
server {
    server_name pochta.uts.qa;
    root /var/www/pochta-site;
    index index.html;
}
```

**Static hosts** (Netlify / Cloudflare Pages / GitHub Pages): publish this directory,
set the custom domain to `pochta.uts.qa`.

DNS: add an `A`/`AAAA` record (or `CNAME` for a PaaS host) for `pochta` under `uts.qa`
pointing at the server, and issue a TLS cert for the hostname.
