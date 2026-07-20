import { Component, OnInit } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Header } from '../header/header';
import { Footer } from '../footer/footer';
import { AddressValidationService } from '../services/address-validation.service';

@Component({
  selector: 'app-terra-ridge',
  imports: [RouterLink, ReactiveFormsModule, Header, Footer],
  templateUrl: './terra-ridge.html',
  styleUrl: './terra-ridge.css'
})
export class TerraRidge implements OnInit {
  form: FormGroup;
  alertMessage = '';
  addressError = '';
  isValidatingAddress = false;
  fromBlackForest = false;

  readonly usStates = [
    { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' },
    { code: 'AZ', name: 'Arizona' }, { code: 'AR', name: 'Arkansas' },
    { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
    { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' },
    { code: 'DC', name: 'District of Columbia' }, { code: 'FL', name: 'Florida' },
    { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' },
    { code: 'ID', name: 'Idaho' }, { code: 'IL', name: 'Illinois' },
    { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
    { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' },
    { code: 'LA', name: 'Louisiana' }, { code: 'ME', name: 'Maine' },
    { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
    { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' },
    { code: 'MS', name: 'Mississippi' }, { code: 'MO', name: 'Missouri' },
    { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
    { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' },
    { code: 'NJ', name: 'New Jersey' }, { code: 'NM', name: 'New Mexico' },
    { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
    { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' },
    { code: 'OK', name: 'Oklahoma' }, { code: 'OR', name: 'Oregon' },
    { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
    { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' },
    { code: 'TN', name: 'Tennessee' }, { code: 'TX', name: 'Texas' },
    { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
    { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' },
    { code: 'WV', name: 'West Virginia' }, { code: 'WI', name: 'Wisconsin' },
    { code: 'WY', name: 'Wyoming' },
    // Territories
    { code: 'AS', name: 'American Samoa' }, { code: 'GU', name: 'Guam' },
    { code: 'MP', name: 'Northern Mariana Islands' },
    { code: 'PR', name: 'Puerto Rico' }, { code: 'VI', name: 'U.S. Virgin Islands' }
  ];

  private endpoint = 'https://formspree.io/f/mojgjqep';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    private addressValidation: AddressValidationService
  ) {
    this.form = this.fb.group({
      name:          ['', Validators.required],
      streetAddress: ['', Validators.required],
      city:          ['', Validators.required],
      state:         ['', Validators.required],
      zip:           ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],
      email:         ['', [Validators.required, Validators.email]],
      phone:         [''],
      message:       ['']
    });
  }

  ngOnInit(): void {
    this.fromBlackForest = this.route.snapshot.queryParamMap.get('from') === 'black-forest';
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isValidatingAddress = true;
    this.addressError = '';

    const { streetAddress, city, state, zip } = this.form.value;

    this.addressValidation.validateAddress(streetAddress, city, state, zip).subscribe({
      next: result => {
        this.isValidatingAddress = false;
        if (!result.isValid) {
          this.addressError = result.message;
          return;
        }
        this.submitToEndpoint();
      },
      error: () => {
        // Fail open — do not block the lead if the API is down
        this.isValidatingAddress = false;
        this.submitToEndpoint();
      }
    });
  }

  private submitToEndpoint() {
    const { name, email, phone, message, streetAddress, city, state, zip } = this.form.value;
    const emailSubject = 'Terra Ridge Property Inquiry';
    const body: Record<string, string> = {
      name, email, message,
      'Street Address': streetAddress,
      city, state, zip,
      _replyto: email,
      _subject: emailSubject,
      subject:  emailSubject,
      ...(phone?.trim() && { phone })
    };
    this.http.post(this.endpoint, body, { responseType: 'text' }).subscribe({
      next: (response) => {
        console.log('Formspree success:', response);
        this.router.navigate(['/thank-you']);
      },
      error: (err) => {
        console.error('Formspree error:', err.status, err.message, err);
        this.alertMessage = `Something went wrong (status ${err.status}). Please try again.`;
      }
    });
  }
}
