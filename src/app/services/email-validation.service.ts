import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map, catchError } from 'rxjs';

/**
 * Email Validation Service
 * Provides multi-tier email validation including:
 * - Syntax validation
 * - Disposable email domain detection
 * - Shannon entropy check for garbage text
 */
@Injectable({
  providedIn: 'root'
})
export class EmailValidationService {

  // Common disposable email domains - this list should be refreshed periodically
  private readonly quickBlocklist = [
    'mailinator.com',
    '10minutemail.com',
    'yopmail.com',
    'guerrillamail.com',
    'tempmail.com',
    'throwaway.email',
    'getnada.com',
    'maildrop.cc',
    'fakeinbox.com',
    'trashmail.com',
    'dispostable.com',
    'temp-mail.org',
    'mohmal.com',
    'sharklasers.com'
  ];

  private disposableDomains: Set<string> = new Set(this.quickBlocklist);
  private blocklistLoaded = false;

  constructor(private http: HttpClient) {
    this.loadDisposableDomainsBlocklist();
  }

  /**
   * Load the comprehensive disposable domains list from GitHub
   * This runs asynchronously on service initialization
   */
  private loadDisposableDomainsBlocklist(): void {
    const url = 'https://raw.githubusercontent.com/disposable-email-domains/disposable-email-domains/master/disposable_email_blocklist.conf';

    this.http.get(url, { responseType: 'text' })
      .pipe(
        catchError(() => {
          console.warn('Failed to load disposable email blocklist, using local list only');
          return of('');
        })
      )
      .subscribe(response => {
        if (response) {
          const domains = response.split('\n')
            .map(line => line.trim().toLowerCase())
            .filter(line => line && !line.startsWith('#'));

          domains.forEach(domain => this.disposableDomains.add(domain));
          this.blocklistLoaded = true;
          console.log(`Loaded ${this.disposableDomains.size} disposable email domains`);
        }
      });
  }

  /**
   * Check if an email is disposable/temporary
   */
  isDisposable(email: string): boolean {
    if (!email || !email.includes('@')) {
      return false;
    }

    const domain = email.split('@')[1]?.trim().toLowerCase();
    return domain ? this.disposableDomains.has(domain) : false;
  }

  /**
   * Validate email syntax using standard pattern
   */
  isValidSyntax(email: string): boolean {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  }

  /**
   * Check for common typo-squatted domains
   */
  hasTypoSquattedDomain(email: string): boolean {
    if (!email || !email.includes('@')) {
      return false;
    }

    const domain = email.split('@')[1]?.trim().toLowerCase();

    const commonTypos: { [key: string]: string[] } = {
      'gmail.com': ['gmaill.com', 'gmial.com', 'gnail.com', 'gmai.com'],
      'yahoo.com': ['yahooo.com', 'yaho.com', 'yhoo.com'],
      'outlook.com': ['outlok.com', 'outloook.com', 'outlooks.com'],
      'hotmail.com': ['hotmial.com', 'hotmaill.com', 'hotmal.com']
    };

    for (const typos of Object.values(commonTypos)) {
      if (typos.includes(domain)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Comprehensive email validation
   * Returns an object with validation results
   */
  validateEmail(email: string): EmailValidationResult {
    const result: EmailValidationResult = {
      isValid: true,
      errors: []
    };

    // Check syntax
    if (!this.isValidSyntax(email)) {
      result.isValid = false;
      result.errors.push('Invalid email format');
      return result;
    }

    // Check for disposable domains
    if (this.isDisposable(email)) {
      result.isValid = false;
      result.errors.push('Temporary or disposable email addresses are not allowed');
      return result;
    }

    // Check for typo-squatted domains
    if (this.hasTypoSquattedDomain(email)) {
      result.isValid = false;
      result.errors.push('This email domain appears to be misspelled. Please check and try again.');
      return result;
    }

    return result;
  }

  /**
   * Check if text appears to be garbage/bot-generated
   * Uses Shannon Entropy and character ratio analysis
   */
  isGarbageText(input: string, entropyThreshold: number = 4.5): boolean {
    if (!input || input.trim().length === 0) {
      return true;
    }

    const trimmed = input.trim();

    // Check if the message contains an absurd ratio of numbers/symbols to normal letters
    const letterCount = (trimmed.match(/[a-zA-Z]/g) || []).length;
    if (letterCount < (trimmed.length * 0.4)) {
      return true; // Over 60% symbols/numbers
    }

    // Shannon Entropy calculation to catch completely random keyboard mashes
    const frequencies = new Map<string, number>();
    for (const char of trimmed) {
      frequencies.set(char, (frequencies.get(char) || 0) + 1);
    }

    let entropy = 0;
    for (const freq of frequencies.values()) {
      const p = freq / trimmed.length;
      entropy -= p * Math.log2(p);
    }

    return entropy > entropyThreshold; // High entropy usually means randomized bot text
  }
}

export interface EmailValidationResult {
  isValid: boolean;
  errors: string[];
}
