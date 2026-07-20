import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PropertyInquiry } from '../property-inquiry/property-inquiry';
import { KwRedirect } from '../kw-redirect/kw-redirect';
import { Header } from '../header/header';
import { Footer } from '../footer/footer';

/**
 * Demo page showing all form protection features
 * This can be used as a template for property detail pages
 */
@Component({
  selector: 'app-form-demo',
  standalone: true,
  imports: [CommonModule, PropertyInquiry, KwRedirect, Header, Footer],
  templateUrl: './form-demo.html',
  styleUrl: './form-demo.css'
})
export class FormDemo {
  // Example property data - in production, this would come from MLS API
  property = {
    mlsNumber: '123456',
    address: '123 Pine Valley Road, Black Forest, CO 80908',
    price: 750000,
    beds: 4,
    baths: 3,
    sqft: 3200,
    acres: 5.5,
    image: 'assets/images/BF1.jpg'
  };

  showInquiryForm = false;
  showKwRedirect = false;

  toggleInquiryForm(): void {
    this.showInquiryForm = !this.showInquiryForm;
    if (this.showInquiryForm) {
      this.showKwRedirect = false;
    }
  }

  toggleKwRedirect(): void {
    this.showKwRedirect = !this.showKwRedirect;
    if (this.showKwRedirect) {
      this.showInquiryForm = false;
    }
  }
}
