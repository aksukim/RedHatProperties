import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * KW Redirect Component
 * Provides smooth redirection to Keller Williams portal for lead capture
 * This is the Phase 1 solution to avoid building complex backend infrastructure
 */
@Component({
  selector: 'app-kw-redirect',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kw-redirect.html',
  styleUrl: './kw-redirect.css'
})
export class KwRedirect implements OnInit {

  // MLS number can be passed from parent component (e.g., property detail page)
  @Input() mlsNumber: string = '';

  // Your Keller Williams agent profile URL
  private baseKwUrl = 'https://www.kw.com/agent/eric-mikuska'; // Replace with your actual KW URL

  isRedirecting = false;

  ngOnInit(): void {
    // Component initialization
  }

  /**
   * Redirect user to KW portal based on action type
   * @param actionType - Type of action: 'touch', 'tour', or 'valuation'
   */
  redirectToKw(actionType: 'touch' | 'tour' | 'valuation'): void {
    this.isRedirecting = true;

    let targetUrl = this.baseKwUrl;

    // Direct the user dynamically depending on what button they clicked
    if (actionType === 'valuation') {
      targetUrl += '/home-valuation';
    } else if (actionType === 'tour' && this.mlsNumber) {
      // Append the listing MLS number if your KW setup supports direct deep linking
      targetUrl += `/property/MLS-${this.mlsNumber}`;
    }

    // Give them a brief moment to read the UI state, then open the new tab
    setTimeout(() => {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
      this.isRedirecting = false;
    }, 1200);
  }

  /**
   * Direct email contact option
   */
  sendEmail(): void {
    const email = 'emikuska@RedHatProperties.com';
    const subject = 'Property Inquiry from Red Hat Properties Website';
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
  }

  /**
   * Direct phone call option
   */
  makeCall(): void {
    window.location.href = 'tel:7192466309';
  }
}
