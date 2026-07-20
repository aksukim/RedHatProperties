import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

/**
 * Cloudflare Turnstile Service
 * Provides invisible CAPTCHA verification to prevent bot submissions
 */
@Injectable({
  providedIn: 'root'
})
export class TurnstileService {

  // This should be set via environment configuration
  private readonly siteKey = 'YOUR_CLOUDFLARE_TURNSTILE_SITE_KEY'; // Replace with your actual site key
  private scriptLoaded = false;

  constructor(private http: HttpClient) {}

  /**
   * Load the Cloudflare Turnstile script
   * Call this in your component's ngOnInit or when form is rendered
   */
  loadScript(): Promise<void> {
    if (this.scriptLoaded) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      script.defer = true;

      script.onload = () => {
        this.scriptLoaded = true;
        resolve();
      };

      script.onerror = () => {
        reject(new Error('Failed to load Cloudflare Turnstile script'));
      };

      document.head.appendChild(script);
    });
  }

  /**
   * Render the Turnstile widget
   * @param elementId - The ID of the HTML element where the widget will be rendered
   * @param callback - Function to call when verification is complete
   */
  render(elementId: string, callback: (token: string) => void): void {
    if (typeof (window as any).turnstile === 'undefined') {
      console.error('Turnstile script not loaded');
      return;
    }

    (window as any).turnstile.render(`#${elementId}`, {
      sitekey: this.siteKey,
      callback: callback,
      theme: 'light', // or 'dark'
      size: 'normal' // or 'compact'
    });
  }

  /**
   * Verify the Turnstile token on your backend
   * This is a placeholder - you'll need to implement the actual backend endpoint
   */
  verifyToken(token: string): Observable<boolean> {
    // In production, this should call your C# backend API
    // Example: POST to /api/verify-captcha with the token

    // For now, return a mock response
    console.log('Verifying Turnstile token:', token);
    return of(true);

    // Actual implementation would look like:
    // return this.http.post<{ success: boolean }>('/api/verify-captcha', { token })
    //   .pipe(
    //     map(response => response.success),
    //     catchError(error => {
    //       console.error('Captcha verification failed:', error);
    //       return of(false);
    //     })
    //   );
  }

  getSiteKey(): string {
    return this.siteKey;
  }
}
