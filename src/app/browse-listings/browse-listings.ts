import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Header } from '../header/header';
import { Footer } from '../footer/footer';
import { ListingsService, Listing, SoldListing } from '../services/listings.service';

export type { Listing, SoldListing };

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
  buyerClosings: SoldListing[] = [];
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
    fetch('/api/listings')
      .then(r => r.ok ? r.json() : Promise.reject())
      .catch(() => fetch('assets/data/listings.json').then(r => r.json()))
      .then(data => {
        this.myListings = (data?.active ?? []).map((item: Listing) => ({
          ...item,
          status: item.status ?? 'active'
        })) as Listing[];
        this.recentlySold = (data?.sold ?? []) as SoldListing[];
        this.buyerClosings = (data?.bought ?? []) as SoldListing[];
        this.loaded = true;
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

  listingStatusLabel(status: Listing['status'] | undefined): string {
    if (status === 'under_contract') return 'Under Contract';
    if (status === 'pending') return 'Pending';
    return 'Active';
  }

  listingStatusClass(status: Listing['status'] | undefined): string {
    if (status === 'under_contract') return 'tag-status-under-contract';
    if (status === 'pending') return 'tag-status-pending';
    return 'tag-status-active';
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

}

