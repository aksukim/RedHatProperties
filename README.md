# Red Hat Properties — Technical Reference

Eric Mikuska · Keller Williams Partners · Colorado Springs / Black Forest / Front Range

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Repository Structure](#3-repository-structure)
4. [Local Development](#4-local-development)
5. [Production Server Setup](#5-production-server-setup)
6. [Deployment — Code Update](#6-deployment--code-update)
7. [IP Change Recovery (Power Outage)](#7-ip-change-recovery-power-outage)
8. [Node API Server](#8-node-api-server)
9. [MongoDB Atlas](#9-mongodb-atlas)
10. [Cloudflare Configuration](#10-cloudflare-configuration)
11. [Admin — Site Manager](#11-admin--site-manager)
12. [Data Flow](#12-data-flow)

---

## 1. Project Overview

Angular 22 single-page application serving as a real estate marketing and listing management site. The Angular frontend is served statically by IIS. A Node.js/Express backend handles API calls (listings, reviews, image uploads) and persists data to MongoDB Atlas. Cloudflare sits in front for DNS, HTTPS, and API proxying.

Live site: **https://www.redhatproperties.com**

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Angular 22, TypeScript |
| Backend API | Node.js + Express (server.js) |
| Database | MongoDB Atlas (free M0 tier) |
| Web Server | IIS 10 (Windows 11 Home) |
| DNS / Proxy | Cloudflare |
| API Proxy | Cloudflare Worker |
| Process Manager | PM2 (via npx pm2) |
| Domain | redhatproperties.com |

---

## 3. Repository Structure

```
/
├── server.js               Node/Express API server
├── .env                    Environment secrets (NOT committed to git)
├── angular.json            Angular build config
├── package.json            npm scripts and dependencies
├── proxy.conf.json         Dev proxy: /api to localhost:8080
├── src/
│   ├── app/
│   │   ├── admin/          Site Manager (PIN-protected)
│   │   ├── browse-listings/
│   │   ├── customer-reviews/
│   │   ├── contact/        Formspree-backed contact form
│   │   ├── home/
│   │   ├── about-me/
│   │   ├── black-forest/
│   │   ├── terra-ridge/
│   │   └── services/
│   ├── assets/
│   │   ├── images/         All listing and site images
│   │   └── data/
│   │       └── listings.json   Static fallback (used if API is down)
│   └── web.config          IIS rewrite rules (copied to dist on build)
└── dist/                   Build output (gitignored, copy to wwwroot)
```

---

## 4. Local Development

### Prerequisites
- Node.js (LTS)
- npm

### Setup
```powershell
git clone https://github.com/aksukim/RedHatProperties
cd RedHatProperties
npm install
```

### Create .env
```
MONGODB_URI=mongodb+srv://emikuska_db_user:<password>@cluster0.tfmdp5c.mongodb.net/?retryWrites=true&w=majority
DB_NAME=redhatproperties
ADMIN_KEY=7751
PORT=8080
# Leave IMAGES_DIR blank on dev laptop
```

NOTE: MongoDB is blocked on the Progressive corporate network. Use a phone hotspot to test locally.

### Run (two terminals)
```powershell
# Terminal 1
npm run server

# Terminal 2
npm start
```

Site at: http://localhost:4200

---

## 5. Production Server Setup

- OS: Windows 11 Home
- Local IP: 192.168.1.37 (DHCP reserved in router)
- Public IP: 140.235.41.187
- Site folder: C:\inetpub\wwwroot\RedHat\
- Repo folder: C:\Users\mrmik\Documents\WebsiteProjects\RedHatProperties\
- Router admin: http://192.168.1.1 (Netgear Nighthawk MR70)

### Router port forwarding
| External Port | Internal IP | Internal Port | Purpose |
|---|---|---|---|
| 80 | 192.168.1.37 | 80 | HTTP |
| 443 | 192.168.1.37 | 443 | HTTPS / IIS |
| 8080 | 192.168.1.37 | 8080 | Node API |

### PM2 auto-start
Startup batch file at:
C:\Users\mrmik\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\rhpl-api.bat

Contents:
```
cd C:\Users\mrmik\Documents\WebsiteProjects\RedHatProperties
npx pm2 resurrect
```

Run `npx pm2 save` after any PM2 changes.

---

## 6. Deployment — Code Update

Run on the production server after any code change:

```powershell
cd C:\Users\mrmik\Documents\WebsiteProjects\RedHatProperties
git pull
npm install
npm run build
npx pm2 restart rhpl-api
Copy-Item "dist\red-hat-properties-angular\browser\*" "C:\inetpub\wwwroot\RedHat\" -Recurse -Force
```

Then hard refresh browser (Ctrl+F5) or test in incognito.

---

## 7. IP Change Recovery (Power Outage)

### Step 1 — Check public IP
```powershell
(Invoke-WebRequest -Uri "https://api.ipify.org").Content
```
Expected: 140.235.41.187. If different, update Steps 3 and 4.

### Step 2 — Check local IP
```powershell
(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like "192.168.*" }).IPAddress
```
Expected: 192.168.1.37. If different, update router port forwarding (Step 5).

### Step 3 — Update Cloudflare DNS (if public IP changed)
1. Cloudflare > redhatproperties.com > DNS
2. Edit 'www' A record > new IP (orange cloud ON)
3. Edit 'api' A record > new IP (grey cloud OFF)

### Step 4 — Update Cloudflare Worker (if public IP changed)
Usually handled by DNS update above. Worker uses api.redhatproperties.com hostname.
If still failing: Cloudflare > Workers > rhpl-api-proxy > Edit code > verify targetUrl.

### Step 5 — Update router port forwarding (if local IP changed)
1. http://192.168.1.1 > Advanced > Port Forwarding
2. Update rules for ports 80, 443, 8080 to new local IP

### Step 6 — Restart services
```powershell
npx pm2 restart rhpl-api
iisreset
```

### Step 7 — Verify
```powershell
Invoke-RestMethod http://localhost:8080/api/listings
Invoke-RestMethod https://www.redhatproperties.com/api/listings
```

Wait 2-5 minutes for DNS propagation if Cloudflare DNS was updated.

---

## 8. Node API Server

File: server.js | Port: 8080 | Managed by: PM2

### Routes
| Method | Route | Auth | Purpose |
|---|---|---|---|
| GET | /api/listings | None | Get active + sold listings |
| POST | /api/listings | X-Admin-Key | Save listings |
| POST | /api/listings/image | X-Admin-Key | Upload image |
| GET | /api/reviews | None | Get approved reviews |
| GET | /api/reviews/all | X-Admin-Key | Get all reviews |
| POST | /api/reviews | None | Submit review (pending) |
| PATCH | /api/reviews/:id | X-Admin-Key | Approve or reject review |
| DELETE | /api/reviews/:id | X-Admin-Key | Delete review |

Admin key: set in .env as ADMIN_KEY. Must match ADMIN_PIN in admin.ts. Value: 7751.

### PM2 commands
```powershell
npx pm2 status
npx pm2 restart rhpl-api
npx pm2 logs rhpl-api --nostream
npx pm2 stop rhpl-api
npx pm2 start server.js --name rhpl-api
npx pm2 save
```

---

## 9. MongoDB Atlas

- Cluster: Cluster0 (M0 free), AWS
- Database: redhatproperties
- Collections: listings, reviews
- Host: cluster0.tfmdp5c.mongodb.net
- User: emikuska_db_user
- Network Access: 0.0.0.0/0

### listings collection
Single document (_id: "main") with active[] and sold[] arrays.

### reviews collection
One document per review. Fields: name, firstName, lastName, title, email, emailConsent, rating, comment, status (pending/approved/rejected), createdAt.

---

## 10. Cloudflare Configuration

Zone: redhatproperties.com | SSL: Flexible

### DNS Records
| Type | Name | Value | Proxy |
|---|---|---|---|
| A | www | 140.235.41.187 | Orange (proxied) |
| A | api | 140.235.41.187 | Grey (DNS only) |

IMPORTANT: api record must be grey cloud (DNS only). Orange cloud causes error 1003.

### Worker: rhpl-api-proxy
Routes: `www.redhatproperties.com/api/*` and `redhatproperties.com/api/*`

```javascript
export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      const targetUrl = `http://api.redhatproperties.com:8080${url.pathname}${url.search}`;
      return fetch(new Request(targetUrl, {
        method: request.method,
        headers: request.headers,
        body: ['GET', 'HEAD'].includes(request.method) ? null : request.body,
        redirect: 'follow'
      }));
    }
    return fetch(request);
  }
};
```

### Worker: rhpl-failover
Routes: `www.redhatproperties.com/*` and `redhatproperties.com/*`

Catches all requests. Attempts to reach the origin server with a 5-second timeout. If the origin is down or returns a 5xx error, redirects visitors to the KW fallback page instead of showing a Cloudflare error.

```javascript
export default {
  async fetch(request) {
    const FALLBACK_URL = 'https://ericmikuska.kw.com';
    try {
      const url = new URL(request.url);
      const originUrl = `http://140.235.41.187${url.pathname}${url.search}`;
      const response = await fetch(originUrl, {
        signal: AbortSignal.timeout(5000)
      });
      if (response.status >= 500) {
        return Response.redirect(FALLBACK_URL, 302);
      }
      return response;
    } catch (err) {
      return Response.redirect(FALLBACK_URL, 302);
    }
  }
};
```

**Route priority:** rhpl-api-proxy routes (`/api/*`) are more specific and take precedence over rhpl-failover (`/*`). Both bare domain and www routes must exist for each Worker or requests to the uncovered domain will bypass the Worker entirely.

---

## 11. Admin — Site Manager

URL: https://www.redhatproperties.com/admin
PIN: 7751

### Features
- Active Listings — add, edit, delete (two-step confirm)
- Sold Listings — add, edit, delete (two-step confirm)
- Reviews — approve/reject/delete (two-step confirm), shows email prefix and consent flag

### Image uploads
Saved to IMAGES_DIR on server: C:\inetpub\wwwroot\RedHat\assets\images

---

## 12. Data Flow

```
Browser
  |
  |-- Static assets (HTML/JS/CSS/images)
  |     Cloudflare --> IIS --> C:\inetpub\wwwroot\RedHat\
  |
  |-- /api/* requests
        Cloudflare Worker --> Node port 8080 --> MongoDB Atlas
```

Fallback: if /api/listings is unreachable, Angular falls back to assets/data/listings.json.

---

*Last updated: August 2026*
