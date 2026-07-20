# Red Hat Properties — Angular Site

Eric Mikuska · Keller Williams Partners · Colorado Springs / Black Forest / Front Range

---

## Project Structure

```
!RHPL/
├── red-hat-properties-angular/   ← This Angular app (frontend)
└── red-hat-properties-api/       ← C# ASP.NET Core API (backend)
    └── listings-data.json        ← Live listing data written by the API
```

---

## Running Locally

Two servers must be running simultaneously:

### 1. Angular Dev Server
```
cd red-hat-properties-angular
ng serve
```
Opens at `http://localhost:4200` (may use a different port if 4200 is taken).

### 2. C# API
```
cd red-hat-properties-api
dotnet run
```
Runs at `http://localhost:5000`. The Angular dev server proxies all `/api/*` requests to this port via `proxy.conf.json`.

---

## Pages

| URL | Description |
|-----|-------------|
| `/` | Home / Agent Hub |
| `/browse-listings` | Active listings, recently sold, equestrian search |
| `/contact` | Contact form (Formspree) |
| `/black-forest` | Black Forest community page |
| `/terra-ridge` | Terra Ridge community page |
| `/admin` | Listings manager (PIN protected) |

---

## Admin Page (`/admin`)

The hidden link is in the footer of every page (invisible — click at the very bottom).

### What it does
- Add, edit, and delete active listings and sold properties
- Upload property photos directly to the server
- Save all changes to the API (no manual file replacement)

### Workflow
1. Go to `/admin`, enter PIN
2. Click **Edit** on a listing (or **+ Add Active Listing**)
3. Fill in fields, pick a photo — photo uploads immediately
4. Click **Save Listing**
5. Click **Save & Download JSON** → saves to server

### Dev notes
- Picking a new photo triggers a hot reload (Angular watches `src/assets/images/`)
- Auth persists via `localStorage` — you only need the PIN once per browser
- In production (deployed), no hot reload occurs

---

## Data Flow

```
Admin saves → POST /api/listings → listings-data.json  (API source of truth)
Browse Listings loads → GET /api/listings → reads listings-data.json
```

The static `src/assets/data/listings.json` is a fallback used when the API is unreachable.

---

## Listing Data Files

| File | Purpose |
|------|---------|
| `src/assets/data/listings.json` | Static fallback (used when API is down) |
| `../listings-data.json` | Live data written by the API |
| `src/assets/data/rhpl-listings.csv` | Human-editable spreadsheet format |

See [src/assets/data/README.md](src/assets/data/README.md) for CSV column reference.

---

## Tech Stack

- **Frontend**: Angular 17+ (standalone components, esbuild)
- **Backend**: ASP.NET Core 10 (Kestrel, minimal API)
- **Contact form**: Formspree
- **Hosting plan**: Spare laptop + Cloudflare Tunnel (pending ISP/setup)

---

## Building for Production

```
ng build
```

Output goes to `dist/red-hat-properties-angular/browser/`. Copy contents to `red-hat-properties-api/wwwroot/` for the API to serve them.

In production, update `red-hat-properties-api/appsettings.json`:
- `ListingsJsonPath` → `wwwroot/assets/data/listings.json`
- `ImagesPath` → `wwwroot/assets/images`
- `CorsOrigins` → your domain (e.g. `https://redhatproperties.com`)

---

## Cloudflare Tunnel (Public Deployment)

Cloudflare Tunnel makes the site publicly accessible with **zero code changes** to either project. It is purely infrastructure — a background Windows service on the spare laptop.

### How it fits

```
Internet
    │
    ▼
Cloudflare Edge (free)
  · Terminates HTTPS/SSL
  · Routes redhatproperties.com traffic
    │
    │  (encrypted tunnel — outbound from your laptop)
    ▼
cloudflared.exe  ← Windows service on the spare laptop
  · Tiny background agent, no project files
  · Install once: winget install Cloudflare.cloudflared
    │
    ▼
red-hat-properties-api (dotnet publish / dotnet run)
  · Listens on port 5000
  · Serves Angular built files from wwwroot/
  · Handles all /api/* requests
```

### Where things live

| Component | Location | Purpose |
|-----------|----------|---------|
| Angular app | `red-hat-properties-angular/` | Your code |
| C# API | `red-hat-properties-api/` | Your code |
| cloudflared | Windows system service | Infrastructure only — no project files |
| Cloudflare config | Cloudflare dashboard (web UI) | Maps domain → tunnel → port 5000 |

### One-time production setup
1. `ng build` → copy output to `red-hat-properties-api/wwwroot/`
2. `dotnet run` → starts serving everything on port 5000
3. `cloudflared` routes public traffic to port 5000
4. Done — current code, unchanged, is live at `redhatproperties.com`

---

## Fallback — KW Page When Laptop is Down

Once Cloudflare manages the domain, the old GoDaddy redirect stops working. A **Cloudflare Worker** replaces it with a smarter fallback: if the laptop is unreachable, visitors are automatically redirected to `ericmikuska.kw.com`.

### Worker script

In the Cloudflare dashboard → **Workers & Pages** → **Create Worker** → paste this → **Deploy**:

```javascript
export default {
  async fetch(request, env) {
    try {
      const response = await fetch(request, { cf: { timeout: 8 } });
      if (response.status === 502 || response.status === 503) {
        return Response.redirect('https://ericmikuska.kw.com', 302);
      }
      return response;
    } catch {
      return Response.redirect('https://ericmikuska.kw.com', 302);
    }
  }
}
```

### Route the Worker to your domain

In Cloudflare dashboard → **Workers & Pages** → **Routes** → add:
```
redhatproperties.com/*
```
and
```
www.redhatproperties.com/*
```

### Result

| Laptop status | What visitors see |
|---|---|
| ✅ Running | Your Red Hat Properties site |
| ❌ Down / restarting | Automatically redirected to `ericmikuska.kw.com` |




To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
