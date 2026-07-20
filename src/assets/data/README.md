# RHPL Listings Data

## Files in this folder

| File | Purpose |
|------|---------|
| `listings.json` | Static fallback — used when the C# API is unreachable |
| `rhpl-listings.csv` | Human-editable spreadsheet format for bulk updates |

The **live data** is at `!RHPL/listings-data.json` (written by the C# API).

---

## How to Update Listings

### Option A — Admin Page (recommended)
1. Go to `/admin` in the browser (PIN: **7751**)
2. Add, edit, or delete listings using the form
3. Pick a photo — it uploads directly to `src/assets/images/`
4. Click **Save Listing** to apply changes in memory
5. Click **Save & Download JSON** — data is saved to the server automatically

### Option B — Edit CSV in Excel/Sheets
1. Open `rhpl-listings.csv` in Excel or Google Sheets
2. Add or edit rows
3. Go to `/admin` → **Import CSV** → select the file
4. Click **Save & Download JSON**

### Option C — Edit JSON directly
Open `!RHPL/listings-data.json` and edit the values directly. The site reads from this file via the API.

---

## CSV Column Reference

| Column | Required | Notes |
|--------|----------|-------|
| `type` | Yes | `active` or `sold` |
| `address` | Yes | Quote if it contains commas |
| `price` | Yes | Numbers only, no `$`. Use `0` for "Call for Price" |
| `beds` | | Number |
| `baths` | | Number (0.5 increments OK) |
| `sqft` | | Number |
| `acres` | | Decimal (e.g. `0.16`) |
| `description` | | Quote if it contains commas |
| `mlsNumber` | | MLS listing number |
| `zillowUrl` | | Full Zillow URL |
| `image` | | Filename only, e.g. `SaunterHouse.webp` — must exist in `src/assets/images/` |
| `soldPrice` | Sold only | Numbers only |
| `soldDate` | Sold only | e.g. `May 14, 2025` |

---

## Adding a Property Photo
1. Drop the image file into `src/assets/images/`
2. Supported formats: `.jpg`, `.jpeg`, `.png`, `.webp`
3. Reference it in the `image` column using just the filename (e.g. `SaunterHouse.webp`)

Or use the Admin page photo picker — it uploads directly to the server.

