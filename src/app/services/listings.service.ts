import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface Listing {
  id: string;
  address: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  acres: number;
  description: string;
  image: string;
  tags: string[];
  mlsNumber?: string;
  zillowUrl?: string;
}

export interface SoldListing extends Listing {
  soldPrice: number;
  soldDate: string;
}

export interface ListingsData {
  active: Listing[];
  sold: SoldListing[];
}

@Injectable({ providedIn: 'root' })
export class ListingsService {
  // ── Runtime source: src/assets/data/listings.json ────────
  // Edit rhpl-listings.csv in Excel, import in /admin, save JSON to update.
  private readonly dataUrl = 'assets/data/listings.json';

  // ── API base URL — empty = same origin (proxied through ng serve in dev) ──
  private readonly apiUrl = '';

  constructor(private http: HttpClient) {}

  getListings(): Observable<ListingsData> {
    return this.http.get<ListingsData>(this.dataUrl).pipe(
      catchError(err => {
        console.error('Failed to load listings:', err);
        return of({ active: [], sold: [] });
      })
    );
  }

  // ── Parse CSV text → ListingsData ─────────────────────────
  parseCsvToListings(text: string): ListingsData {
    const rows = this.parseCsv(text);
    if (rows.length < 2) return { active: [], sold: [] };

    const header = rows[0].map(h => h.toLowerCase().replace(/[^a-z]/g, ''));
    const col    = (name: string) => header.indexOf(name);
    const get    = (r: string[], name: string) => { const i = col(name); return i >= 0 ? (r[i] ?? '') : ''; };
    const num    = (r: string[], name: string) => parseFloat(get(r, name)) || 0;

    const typeIdx = col('type');
    if (typeIdx === -1) return { active: [], sold: [] };

    const active: Listing[] = [];
    const sold: SoldListing[] = [];

    for (let i = 1; i < rows.length; i++) {
      const r    = rows[i];
      const type = (r[typeIdx] ?? '').toLowerCase().trim();
      if (!type) continue;
      const imgFile = get(r, 'image');
      const base: Listing = {
        id:          `${type}-${i}`,
        address:     get(r, 'address'),
        price:       num(r, 'price'),
        beds:        num(r, 'beds'),
        baths:       num(r, 'baths'),
        sqft:        num(r, 'sqft'),
        acres:       num(r, 'acres'),
        description: get(r, 'description'),
        mlsNumber:   get(r, 'mlsnumber') || get(r, 'mls'),
        zillowUrl:   get(r, 'zillowurl') || get(r, 'zillow'),
        image:       imgFile ? `assets/images/${imgFile}` : '',
        tags:        type === 'active' ? ['Active Listing'] : ['Sold']
      };
      if (type === 'sold') {
        sold.push({ ...base, soldPrice: num(r, 'soldprice'), soldDate: get(r, 'solddate') });
      } else {
        active.push(base);
      }
    }
    return { active, sold };
  }

  // ── Download listings as CSV ───────────────────────────────
  downloadCsv(data: ListingsData): void {
    const header = 'type,address,price,beds,baths,sqft,acres,description,mlsNumber,zillowUrl,image,soldPrice,soldDate';
    const esc = (v: string | number) => {
      const s = String(v ?? '');
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = [
      ...data.active.map(l =>
        ['active', l.address, l.price, l.beds, l.baths, l.sqft, l.acres, l.description,
         l.mlsNumber ?? '', l.zillowUrl ?? '', l.image.replace('assets/images/', ''), '', ''].map(esc).join(',')
      ),
      ...data.sold.map(l =>
        ['sold', l.address, l.price, l.beds, l.baths, l.sqft, l.acres, l.description,
         l.mlsNumber ?? '', l.zillowUrl ?? '', l.image.replace('assets/images/', ''), l.soldPrice, l.soldDate].map(esc).join(',')
      )
    ];
    this.triggerDownload([header, ...rows].join('\n'), 'rhpl-listings.csv', 'text/csv');
  }

  // ── CSV row parser (handles quoted fields) ─────────────────
  parseCsv(text: string): string[][] {
    const rows: string[][] = [];
    for (const line of text.split(/\r?\n/)) {
      if (!line.trim()) continue;
      const fields: string[] = [];
      let cur = '', inQ = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
          else { inQ = !inQ; }
        } else if (ch === ',' && !inQ) {
          fields.push(cur.trim()); cur = '';
        } else { cur += ch; }
      }
      fields.push(cur.trim());
      rows.push(fields);
    }
    return rows;
  }

  private triggerDownload(content: string, filename: string, mime: string): void {
    const blob = new Blob([content], { type: mime });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  // ── Save listings to server via API ───────────────────────
  saveListings(data: ListingsData, adminKey: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/api/listings`,
      JSON.stringify(data),
      { headers: { 'Content-Type': 'application/json', 'X-Admin-Key': adminKey } }
    );
  }

  // ── Upload image to server via API ────────────────────────
  uploadImage(file: File, adminKey: string): Observable<{ filename: string; path: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ filename: string; path: string }>(
      `${this.apiUrl}/api/listings/image`,
      formData,
      { headers: { 'X-Admin-Key': adminKey } }
    );
  }

  // ── Kept for fallback / migration ─────────────────────────
  downloadJson(data: ListingsData): void {
    this.triggerDownload(JSON.stringify(data, null, 2), 'listings.json', 'application/json');
  }
}

