import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Header } from '../header/header';
import { Footer } from '../footer/footer';
import { ListingsService, Listing, SoldListing } from '../services/listings.service';

export type { Listing, SoldListing };
const LISTINGS_CACHE_KEY = 'rhplListingsData';

@Component({
  selector: 'app-browse-listings',
  imports: [RouterLink, FormsModule, DecimalPipe, Header, Footer],
  templateUrl: './browse-listings.html',
  styleUrl: './browse-listings.css'
})
export class BrowseListings implements OnInit, AfterViewInit {

  readonly equestrianIdxUrl: SafeResourceUrl;
  myListings: Listing[] = [];
  recentlySold: SoldListing[] = [];
  showSearch = false;

  constructor(
    private sanitizer: DomSanitizer,
    private el: ElementRef,
    private listingsService: ListingsService,
    private cdr: ChangeDetectorRef
  ) {
    this.equestrianIdxUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      'https://ppmls.mlsmatrix.com/Matrix/public/IDX.aspx?idx=aefb30e'
    );
  }

  loadError = false;
  loaded = false;

  ngOnInit(): void {
    const cached = this.loadFromLocal();
    if (cached) {
      this.myListings = cached.active;
      this.recentlySold = cached.sold;
      this.loaded = true;
      this.cdr.detectChanges();
    }

    fetch('/api/listings')
      .then(r => r.ok ? r.json() : Promise.reject())
      .catch(() => cached ? Promise.resolve(cached) : fetch('assets/data/listings.json').then(r => r.json()))
      .then(data => {
        this.myListings = (data?.active ?? []) as Listing[];
        this.recentlySold = (data?.sold ?? []) as SoldListing[];
        this.loaded = true;
        this.saveToLocal();
        this.cdr.detectChanges();
      })
      .catch(() => {
        this.loadError = true;
        this.loaded = true;
        this.cdr.detectChanges();
      });
  }

  ngAfterViewInit(): void {
    const scrollEl = this.el.nativeElement.querySelector('.listings-scroll');
    if (scrollEl) scrollEl.scrollTop = 0;
  }

  formatPrice(price: number): string {
    if (!price) return 'Call for Price';
    return '$' + price.toLocaleString();
  }

  /** Ensures image paths are absolute so CSS background-image resolves correctly on any route. */
  imgUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('/') || path.startsWith('http') || path.startsWith('data:')) return path;
    return '/' + path;
  }

  private loadFromLocal(): { active: Listing[]; sold: SoldListing[] } | null {
    try {
      const raw = localStorage.getItem(LISTINGS_CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { active?: Listing[]; sold?: SoldListing[] };
      return {
        active: Array.isArray(parsed.active) ? parsed.active : [],
        sold: Array.isArray(parsed.sold) ? parsed.sold : []
      };
    } catch {
      return null;
    }
  }

  private saveToLocal(): void {
    localStorage.setItem(LISTINGS_CACHE_KEY, JSON.stringify({
      active: this.myListings,
      sold: this.recentlySold
    }));
  }
}

