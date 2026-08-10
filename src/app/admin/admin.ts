import { Component, NgZone, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ListingsService, ListingsData, Listing, SoldListing } from '../services/listings.service';

// NOTE: Client-side PIN only — move to server-side auth when backend is added.
// Change this value before deploying.
const ADMIN_PIN = '7751';
const LISTINGS_CACHE_KEY = 'rhplListingsData';

@Component({
  selector: 'app-admin',
  imports: [FormsModule, RouterLink],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class Admin implements OnInit {

  // ── Auth ──────────────────────────────────────────────────
  isAuthenticated = localStorage.getItem('adminAuth') === 'true';
  pinInput = '';
  pinError = '';

  // ── Data ──────────────────────────────────────────────────
  data: ListingsData = { active: [], sold: [] };
  activeTab: 'active' | 'sold' = 'active';

  // ── Edit state ────────────────────────────────────────────
  mode: 'list' | 'edit' = 'list';
  editingType: 'active' | 'sold' = 'active';
  editingIndex: number | null = null;

  activeForm: Listing = this.blankActive();
  soldForm: SoldListing = this.blankSold();

  // ── Image ─────────────────────────────────────────────────
  imagePreview: string | null = null;
  pendingImageName = '';

  saveMessage = '';

  constructor(private listingsService: ListingsService, private ngZone: NgZone, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    const cached = this.loadFromLocal();
    if (cached) {
      this.data = cached;
      this.cdr.detectChanges();
    }

    fetch('/api/listings')
      .then(r => r.ok ? r.json() : Promise.reject())
      .catch(() => cached ? Promise.resolve(cached) : fetch('assets/data/listings.json').then(r => r.json()))
      .then((data: ListingsData) => {
        this.data = {
          active: data?.active ?? [],
          sold: data?.sold ?? []
        };
        this.saveToLocal();
        this.cdr.detectChanges();
      })
      .catch(() => {
        this.data = { active: [], sold: [] };
        this.cdr.detectChanges();
      });
  }

  // ── Auth ──────────────────────────────────────────────────
  checkPin(): void {
    if (this.pinInput === ADMIN_PIN) {
      this.isAuthenticated = true;
      localStorage.setItem('adminAuth', 'true');
      this.pinError = '';
    } else {
      this.pinError = 'Incorrect PIN. Please try again.';
      this.pinInput = '';
    }
  }

  // ── Navigation ────────────────────────────────────────────
  startAdd(type: 'active' | 'sold'): void {
    this.editingType = type;
    this.editingIndex = null;
    this.activeForm = this.blankActive();
    this.soldForm = this.blankSold();
    this.imagePreview = null;
    this.pendingImageName = '';
    this.mode = 'edit';
  }

  startEdit(type: 'active' | 'sold', index: number): void {
    this.editingType = type;
    this.editingIndex = index;
    if (type === 'active') {
      this.activeForm = { ...this.data.active[index] };
      this.imagePreview = this.data.active[index].image || null;
    } else {
      this.soldForm = { ...this.data.sold[index] };
      this.imagePreview = this.data.sold[index].image || null;
    }
    this.pendingImageName = '';
    this.mode = 'edit';
  }

  cancelEdit(): void {
    this.mode = 'list';
    this.imagePreview = null;
    this.pendingImageName = '';
  }

  // ── Image picker ──────────────────────────────────────────
  onImagePicked(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.pendingImageName = file.name;
    const form = this.editingType === 'active' ? this.activeForm : this.soldForm;
    form.image = `assets/images/${file.name}`;

    // Preview locally
    const reader = new FileReader();
    reader.onload = e => this.ngZone.run(() => this.imagePreview = e.target?.result as string);
    reader.readAsDataURL(file);

    // Upload to server via native fetch
    const formData = new FormData();
    formData.append('file', file);
    fetch('/api/listings/image', {
      method: 'POST',
      headers: { 'X-Admin-Key': ADMIN_PIN },
      body: formData
    })
    .then(r => r.ok ? r.json() : r.text().then(t => Promise.reject(`HTTP ${r.status}: ${t}`)))
    .then((res: { filename: string; path: string }) => {
      form.image = res.path;
      this.saveMessage = `✅ Image "${res.filename}" uploaded.`;
      setTimeout(() => this.saveMessage = '', 5000);
      // Auto-save listing data to API so image path persists through hot reload
      if (this.editingIndex !== null) {
        if (this.editingType === 'active') this.data.active[this.editingIndex].image = res.path;
        else this.data.sold[this.editingIndex].image = res.path;
      }
      fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Key': ADMIN_PIN },
        body: JSON.stringify(this.data)
      }).catch(() => {});
      this.saveToLocal();
    })
    .catch((err: unknown) => {
      this.saveMessage = `⚠️ API unreachable — copy "${file.name}" to src/assets/images/ manually.`;
      setTimeout(() => this.saveMessage = '', 8000);
    });
  }

  // ── Save / Delete ─────────────────────────────────────────
  saveEntry(): void {
    if (this.editingType === 'active') {
      const entry = { ...this.activeForm };
      if (this.editingIndex === null) {
        entry.id = `active-${Date.now()}`;
        entry.tags = ['Active Listing'];
        this.data.active.push(entry);
      } else {
        this.data.active[this.editingIndex] = entry;
      }
    } else {
      const entry = { ...this.soldForm };
      if (this.editingIndex === null) {
        entry.id = `sold-${Date.now()}`;
        entry.tags = ['Sold'];
        this.data.sold.push(entry);
      } else {
        this.data.sold[this.editingIndex] = entry;
      }
    }
    this.mode = 'list';
    this.activeTab = this.editingType;
    this.saveToLocal();
  }

  deleteEntry(type: 'active' | 'sold', index: number): void {
    const label = type === 'active'
      ? this.data.active[index].address
      : this.data.sold[index].address;
    if (!confirm(`Delete listing at "${label}"?`)) return;
    if (type === 'active') {
      this.data.active.splice(index, 1);
    } else {
      this.data.sold.splice(index, 1);
    }
    this.saveToLocal();
    // Persist the deletion immediately so other pages see the change
    this.saveMessage = '⏳ Saving…';
    this.cdr.detectChanges();
    fetch('/api/listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Key': ADMIN_PIN },
      body: JSON.stringify(this.data)
    })
    .then(r => r.ok ? r.json() : Promise.reject(r.status))
    .then(() => {
      this.saveMessage = '✅ Listing deleted and saved.';
      this.cdr.detectChanges();
      setTimeout(() => { this.saveMessage = ''; this.cdr.detectChanges(); }, 4000);
    })
    .catch(() => {
      this.saveMessage = '⚠️ Deleted locally — click "Save & Download JSON" to persist (API unreachable).';
      this.cdr.detectChanges();
      setTimeout(() => { this.saveMessage = ''; this.cdr.detectChanges(); }, 8000);
    });
  }

  // ── Download JSON ─────────────────────────────────────────
  // ── Save JSON (updates the site's data source) ───────────
  exportCsv(): void {
    if (this.data.active.length === 0 && this.data.sold.length === 0) {
      this.saveMessage = '⚠️ Data not loaded yet — wait a moment and try again.';
      setTimeout(() => this.saveMessage = '', 5000);
      return;
    }
    this.saveMessage = '⏳ Saving to server…';
    fetch('/api/listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Key': ADMIN_PIN },
      body: JSON.stringify(this.data)
    })
    .then(r => r.ok ? r.json() : Promise.reject(r.status))
    .then(() => this.ngZone.run(() => {
      this.saveMessage = '✅ Listings saved to server!';
      setTimeout(() => this.saveMessage = '', 6000);
    }))
    .catch(() => this.ngZone.run(() => {
      this.listingsService.downloadJson(this.data);
      this.saveMessage = '⚠️ API unreachable — listings.json downloaded. Replace src/assets/data/listings.json manually.';
      setTimeout(() => this.saveMessage = '', 10000);
    }));
  }

  // ── Import CSV ────────────────────────────────────────────
  importCsv(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      this.ngZone.run(() => {
        try {
          const text = e.target?.result as string;
          if (!text?.trim()) { this.saveMessage = '❌ File is empty.'; return; }
          const data = this.listingsService.parseCsvToListings(text);
          if (data.active.length === 0 && data.sold.length === 0) {
            this.saveMessage = '❌ No listings found. Check your CSV has a "type" column with "active"/"sold" values.';
            return;
          }
          this.data = data;
          this.saveToLocal();
          this.saveMessage = `✅ Imported ${data.active.length} active + ${data.sold.length} sold. Click "Save CSV" to download the updated file.`;
        } catch (err) {
          this.saveMessage = `❌ Import failed: ${err}`;
        }
        setTimeout(() => this.saveMessage = '', 10000);
        input.value = '';
      });
    };
    reader.onerror = () => this.ngZone.run(() => { this.saveMessage = '❌ Could not read the file.'; });
    reader.readAsText(file);
  }

  // ── Helpers ───────────────────────────────────────────────
  private blankActive(): Listing {
    return {
      id: '', address: '', price: 0, beds: 0, baths: 0,
      sqft: 0, acres: 0, description: '', image: '',
      tags: ['Active Listing'], mlsNumber: '', zillowUrl: ''
    };
  }

  private blankSold(): SoldListing {
    return {
      id: '', address: '', price: 0, beds: 0, baths: 0,
      sqft: 0, acres: 0, description: '', image: '',
      tags: ['Sold'], mlsNumber: '', zillowUrl: '',
      soldPrice: 0, soldDate: ''
    };
  }

  formatPrice(price: number): string {
    if (!price) return 'Call for Price';
    return '$' + price.toLocaleString();
  }

  /** Ensures image paths are absolute so CSS background-image resolves correctly on any route. */
  imgUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    if (path.startsWith('/')) return path;
    return this.appBasePath() + path;
  }

  private appBasePath(): string {
    const pathname = window.location.pathname;
    const lastSlash = pathname.lastIndexOf('/');
    return lastSlash >= 0 ? pathname.slice(0, lastSlash + 1) : '/';
  }

  private loadFromLocal(): ListingsData | null {
    try {
      const raw = localStorage.getItem(LISTINGS_CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<ListingsData>;
      return {
        active: Array.isArray(parsed.active) ? parsed.active as Listing[] : [],
        sold: Array.isArray(parsed.sold) ? parsed.sold as SoldListing[] : []
      };
    } catch {
      return null;
    }
  }

  private saveToLocal(): void {
    localStorage.setItem(LISTINGS_CACHE_KEY, JSON.stringify(this.data));
  }
}
