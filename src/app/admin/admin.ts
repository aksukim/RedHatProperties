import { Component, NgZone, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ListingsData, Listing, SoldListing } from '../services/listings.models';

// NOTE: Client-side PIN only — move to server-side auth when backend is added.
// Change this value before deploying.
const ADMIN_PIN = '7751';

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
  data: ListingsData = { active: [], sold: [], bought: [] };
  activeTab: 'active' | 'sold' | 'bought' | 'reviews' = 'active';
  pendingReviews: { _id: string; name: string; title?: string; email?: string; emailConsent?: boolean; rating: number; comment: string; status: string }[] = [];

  // ── Edit state ────────────────────────────────────────────
  mode: 'list' | 'edit' = 'list';
  editingType: 'active' | 'sold' | 'bought' = 'active';
  editingIndex: number | null = null;

  activeForm: Listing = this.blankActive();
  soldForm: SoldListing = this.blankSold();
  boughtForm: SoldListing = this.blankBought();

  // ── Image ─────────────────────────────────────────────────
  imagePreview: string | null = null;
  pendingImageName = '';

  saveMessage = '';

  // ── Inline delete confirmation ────────────────────────────
  confirmDeleteListingKey: string | null = null;  // 'active-0', 'sold-2' etc
  confirmDeleteReviewId: string | null = null;

  constructor(private ngZone: NgZone, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    fetch('/api/listings')
      .then(r => r.ok ? r.json() : Promise.reject())
      .catch(() => fetch('assets/data/listings.json').then(r => r.json()))
      .then((data: ListingsData) => {
        this.data = this.normalizeData(data);
        this.cdr.detectChanges();
      })
      .catch(() => {
        this.data = { active: [], sold: [], bought: [] };
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
  startAdd(type: 'active' | 'sold' | 'bought'): void {
    this.editingType = type;
    this.editingIndex = null;
    this.activeForm = this.blankActive();
    this.soldForm = this.blankSold();
    this.boughtForm = this.blankBought();
    this.imagePreview = null;
    this.pendingImageName = '';
    this.mode = 'edit';
  }

  startEdit(type: 'active' | 'sold' | 'bought', index: number): void {
    this.editingType = type;
    this.editingIndex = index;
    if (type === 'active') {
      this.activeForm = { ...this.data.active[index] };
      this.imagePreview = this.data.active[index].image || null;
    } else if (type === 'sold') {
      this.soldForm = { ...this.data.sold[index] };
      this.imagePreview = this.data.sold[index].image || null;
    } else {
      this.boughtForm = { ...this.data.bought[index] };
      this.imagePreview = this.data.bought[index].image || null;
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
    const form = this.editingType === 'active'
      ? this.activeForm
      : this.editingType === 'sold'
        ? this.soldForm
        : this.boughtForm;
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
        else if (this.editingType === 'sold') this.data.sold[this.editingIndex].image = res.path;
        else this.data.bought[this.editingIndex].image = res.path;
      }
      fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Key': ADMIN_PIN },
        body: JSON.stringify(this.data)
      }).catch(() => {});
    })
    .catch((err: unknown) => {
      this.saveMessage = `⚠️ API unreachable — copy "${file.name}" to src/assets/images/ manually.`;
      setTimeout(() => this.saveMessage = '', 8000);
    });
  }

  // ── Save / Delete ─────────────────────────────────────────
  saveEntry(): void {
    let destinationTab: 'active' | 'sold' | 'bought' = this.editingType;

    if (this.editingType === 'active') {
      const entry = { ...this.activeForm };
      entry.status = entry.status ?? 'active';
      if (entry.status === 'sold') {
        this.moveActiveToSold(entry);
        destinationTab = 'sold';
      } else {
        if (this.editingIndex === null) {
          entry.id = `active-${Date.now()}`;
          entry.tags = [this.activeTagFromStatus(entry.status)];
          this.data.active.push(entry);
        } else {
          entry.tags = [this.activeTagFromStatus(entry.status)];
          this.data.active[this.editingIndex] = entry;
        }
      }
    } else if (this.editingType === 'sold') {
      const entry = { ...this.soldForm };
      if (this.editingIndex === null) {
        entry.id = `sold-${Date.now()}`;
        entry.status = 'sold';
        entry.tags = ['Sold'];
        this.data.sold.push(entry);
      } else {
        entry.status = 'sold';
        entry.tags = ['Sold'];
        this.data.sold[this.editingIndex] = entry;
      }
    } else {
      const entry = { ...this.boughtForm };
      if (this.editingIndex === null) {
        entry.id = `bought-${Date.now()}`;
        entry.status = 'sold';
        entry.tags = ['Bought with Eric'];
        this.data.bought.push(entry);
      } else {
        entry.status = 'sold';
        entry.tags = ['Bought with Eric'];
        this.data.bought[this.editingIndex] = entry;
      }
    }

    this.mode = 'list';
    this.activeTab = destinationTab;
    this.persistListings('✅ Listing saved.', '⚠️ Saved locally — API unreachable. Re-open Admin when API is back.');
  }

  deleteEntry(type: 'active' | 'sold' | 'bought', index: number): void {
    const key = `${type}-${index}`;
    if (this.confirmDeleteListingKey !== key) {
      this.confirmDeleteListingKey = key;
      this.cdr.detectChanges();
      return;
    }
    this.confirmDeleteListingKey = null;
    if (type === 'active') {
      this.data.active.splice(index, 1);
    } else if (type === 'sold') {
      this.data.sold.splice(index, 1);
    } else {
      this.data.bought.splice(index, 1);
    }
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

  // ── Helpers ───────────────────────────────────────────────
  private blankActive(): Listing {
    return {
      id: '', address: '', price: 0, beds: 0, baths: 0,
      sqft: 0, acres: 0, description: '', image: '',
      tags: ['Active Listing'], status: 'active', mlsNumber: '', zillowUrl: ''
    };
  }

  private blankSold(): SoldListing {
    return {
      id: '', address: '', price: 0, beds: 0, baths: 0,
      sqft: 0, acres: 0, description: '', image: '',
      tags: ['Sold'], status: 'sold', mlsNumber: '', zillowUrl: '',
      soldPrice: 0, soldDate: ''
    };
  }

  private blankBought(): SoldListing {
    return {
      id: '', address: '', price: 0, beds: 0, baths: 0,
      sqft: 0, acres: 0, description: '', image: '',
      tags: ['Bought with Eric'], status: 'sold', mlsNumber: '', zillowUrl: '',
      soldPrice: 0, soldDate: ''
    };
  }

  private normalizeData(data: ListingsData): ListingsData {
    const active = (data?.active ?? []).map(item => ({
      ...item,
      status: this.defaultActiveStatus(item.status),
      tags: item.tags?.length ? item.tags : [this.activeTagFromStatus(this.defaultActiveStatus(item.status))]
    }));

    const sold = (data?.sold ?? []).map(item => ({
      ...item,
      status: 'sold' as const,
      tags: item.tags?.length ? item.tags : ['Sold']
    }));

    const bought = (data?.bought ?? []).map(item => ({
      ...item,
      status: 'sold' as const,
      tags: item.tags?.length ? item.tags : ['Bought with Eric']
    }));

    return { active, sold, bought };
  }

  private defaultActiveStatus(status: Listing['status'] | undefined): Listing['status'] {
    if (status === 'under_contract' || status === 'pending') return status;
    if (status === 'sold') return 'sold';
    return 'active';
  }

  private activeTagFromStatus(status: Listing['status']): string {
    if (status === 'under_contract') return 'Under Contract';
    if (status === 'pending') return 'Pending';
    return 'Active Listing';
  }

  statusLabel(status: Listing['status'] | undefined): string {
    if (status === 'under_contract') return 'Under Contract';
    if (status === 'pending') return 'Pending';
    if (status === 'sold') return 'Sold';
    return 'Active';
  }

  statusClass(status: Listing['status'] | undefined): string {
    if (status === 'under_contract') return 'listing-status-under-contract';
    if (status === 'pending') return 'listing-status-pending';
    if (status === 'sold') return 'listing-status-sold';
    return 'listing-status-active';
  }

  private moveActiveToSold(entry: Listing): void {
    const soldEntry: SoldListing = {
      ...entry,
      id: entry.id || `sold-${Date.now()}`,
      status: 'sold',
      tags: ['Sold'],
      soldPrice: entry.price || 0,
      soldDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    };

    if (this.editingIndex === null) {
      this.data.sold.push(soldEntry);
      return;
    }

    this.data.active.splice(this.editingIndex, 1);
    this.data.sold.push(soldEntry);
  }

  private persistListings(successMessage: string, failMessage: string): void {
    this.saveMessage = '⏳ Saving…';
    this.cdr.detectChanges();
    fetch('/api/listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Key': ADMIN_PIN },
      body: JSON.stringify(this.data)
    })
    .then(r => r.ok ? r.json() : Promise.reject(r.status))
    .then(() => {
      this.saveMessage = successMessage;
      this.cdr.detectChanges();
      setTimeout(() => { this.saveMessage = ''; this.cdr.detectChanges(); }, 4000);
    })
    .catch(() => {
      this.saveMessage = failMessage;
      this.cdr.detectChanges();
      setTimeout(() => { this.saveMessage = ''; this.cdr.detectChanges(); }, 7000);
    });
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

  // ── Reviews ───────────────────────────────────────────────
  loadPendingReviews(): void {
    this.activeTab = 'reviews';
    fetch('/api/reviews/all', { headers: { 'X-Admin-Key': ADMIN_PIN } })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        this.pendingReviews = data;
        this.cdr.detectChanges();
      })
      .catch(() => {
        this.pendingReviews = [];
        this.cdr.detectChanges();
      });
  }

  reviewStars(n: number): string {
    return '★'.repeat(n) + '☆'.repeat(5 - n);
  }

  emailPrefix(email: string | undefined): string {
    if (!email) return '';
    return email.split('@')[0];
  }

  approveReview(id: string): void {
    fetch(`/api/reviews/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Key': ADMIN_PIN },
      body: JSON.stringify({ status: 'approved' })
    }).then(() => {
      const r = this.pendingReviews.find(r => r._id === id);
      if (r) (r as any).status = 'approved';
      this.saveMessage = '✅ Review approved.';
      this.cdr.detectChanges();
      setTimeout(() => { this.saveMessage = ''; this.cdr.detectChanges(); }, 3000);
    });
  }

  rejectReview(id: string): void {
    fetch(`/api/reviews/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Key': ADMIN_PIN },
      body: JSON.stringify({ status: 'rejected' })
    }).then(() => {
      const r = this.pendingReviews.find(r => r._id === id);
      if (r) (r as any).status = 'rejected';
      this.saveMessage = '🗑 Review rejected.';
      this.cdr.detectChanges();
      setTimeout(() => { this.saveMessage = ''; this.cdr.detectChanges(); }, 3000);
    });
  }

  deleteReview(id: string, name: string): void {
    if (this.confirmDeleteReviewId !== id) {
      this.confirmDeleteReviewId = id;
      this.cdr.detectChanges();
      return;
    }
    this.confirmDeleteReviewId = null;
    fetch(`/api/reviews/${id}`, {
      method: 'DELETE',
      headers: { 'X-Admin-Key': ADMIN_PIN }
    }).then(() => {
      this.pendingReviews = this.pendingReviews.filter(r => r._id !== id);
      this.saveMessage = '🗑 Review deleted.';
      this.cdr.detectChanges();
      setTimeout(() => { this.saveMessage = ''; this.cdr.detectChanges(); }, 3000);
    });
  }

}
