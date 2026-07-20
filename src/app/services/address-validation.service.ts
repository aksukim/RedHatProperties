import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface AddressValidationResult {
  isValid: boolean;
  message: string;
  matchedAddress?: string;
}

/**
 * US Address Validation Service
 * Uses the free US Census Bureau Geocoding API (no API key required).
 * Covers all 50 states and Washington DC.
 * US territories (PR, GU, VI, AS, MP) are validated by ZIP format only
 * due to limited Census API territory coverage.
 *
 * Fails open: if the API is unreachable, the submission is allowed through
 * to preserve lead capture — bot filtering is handled upstream by honeypot
 * and email validation.
 */
@Injectable({
  providedIn: 'root'
})
export class AddressValidationService {

  private readonly censusApiUrl =
    'https://geocoding.geo.census.gov/geocoder/locations/onelineaddress';

  // These states/territories bypass the Census API and use ZIP-format-only validation
  private readonly territoryStates = new Set(['PR', 'GU', 'VI', 'AS', 'MP']);

  // Valid ZIP code ranges for US territories
  private readonly territoryZipRanges: { state: string; min: number; max: number }[] = [
    { state: 'PR', min: 600,   max: 988   }, // 006xx–009xx
    { state: 'VI', min: 801,   max: 851   }, // 008xx
    { state: 'GU', min: 96910, max: 96932 },
    { state: 'AS', min: 96799, max: 96799 },
    { state: 'MP', min: 96950, max: 96952 }
  ];

  constructor(private http: HttpClient) {}

  /**
   * Validate a structured US address.
   * @returns Observable that emits whether the address is valid and an error message if not.
   */
  validateAddress(
    street: string,
    city: string,
    state: string,
    zip: string
  ): Observable<AddressValidationResult> {

    const stateUpper = (state || '').trim().toUpperCase();

    // Territories: skip Census API, validate ZIP format only
    if (this.territoryStates.has(stateUpper)) {
      return of(this.validateTerritoryZip(stateUpper, zip));
    }

    // Basic format guard before hitting the API
    if (!zip || !/^\d{5}$/.test(zip.trim())) {
      return of({ isValid: false, message: 'Please enter a valid 5-digit ZIP code.' });
    }

    const address = `${street.trim()}, ${city.trim()}, ${stateUpper} ${zip.trim()}`;

    const params = new HttpParams()
      .set('address', address)
      .set('benchmark', '2020')
      .set('format', 'json');

    return this.http.get<any>(this.censusApiUrl, { params }).pipe(
      map(response => {
        const matches = response?.result?.addressMatches;
        if (Array.isArray(matches) && matches.length > 0) {
          return {
            isValid: true,
            message: '',
            matchedAddress: matches[0].matchedAddress as string
          };
        }
        return {
          isValid: false,
          message: 'Address not found. Please double-check the street, city, state, and ZIP.'
        };
      }),
      catchError(() =>
        // API unreachable — fail open to preserve lead capture
        of({ isValid: true, message: '', matchedAddress: undefined })
      )
    );
  }

  private validateTerritoryZip(state: string, zip: string): AddressValidationResult {
    if (!zip || !/^\d{5}$/.test(zip.trim())) {
      return { isValid: false, message: 'Please enter a valid 5-digit ZIP code.' };
    }
    const numeric = parseInt(zip, 10);
    const range = this.territoryZipRanges.find(r => r.state === state);
    if (range) {
      // For 3-digit prefix ranges (PR, VI) compare the first 3 digits
      const comparator = numeric > 99999 ? numeric : Math.floor(numeric / 100);
      const inRange = state === 'GU' || state === 'AS' || state === 'MP'
        ? numeric >= range.min && numeric <= range.max
        : comparator >= range.min && comparator <= range.max;
      if (!inRange) {
        return { isValid: false, message: `ZIP code does not match ${state} territory range.` };
      }
    }
    return { isValid: true, message: '', matchedAddress: undefined };
  }
}
