import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Header } from '../header/header';
import { Footer } from '../footer/footer';
import { fakeEmailValidator, typoSquatValidator, garbageTextValidator, minWordCountValidator } from '../validators/email-validators';
import { EmailValidationService } from '../services/email-validation.service';

@Component({
  selector: 'app-contact',
  imports: [ReactiveFormsModule, RouterLink, Header, Footer],
  templateUrl: './contact.html',
  styleUrl: './contact.css'
})
export class Contact implements OnInit {
  form: FormGroup;
  alertMessage = '';
  isSubmitting = false;

  private readonly FORMSPREE_URL = 'https://formspree.io/f/mojgjqep';

  constructor(
    private fb: FormBuilder,
    private emailValidationService: EmailValidationService,
    private http: HttpClient,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      name:    ['', [Validators.required, Validators.minLength(2)]],
      email:   ['', [
        Validators.required,
        Validators.email
      ]],
      phone:   ['', [Validators.pattern(/^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/)]],
      subject: ['', Validators.required],
      message: ['', [
        Validators.required,
        garbageTextValidator(0.4),
        minWordCountValidator(5)
      ]],
      // Hidden honeypot field for bot detection
      honeypot: ['']
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['subject']) this.form.patchValue({ subject: params['subject'] });
      if (params['message']) this.form.patchValue({ message: params['message'] });
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.alertMessage = '⚠️ Please correct the errors above before sending.';
      return;
    }

    // Check honeypot - if filled, silently succeed to fool bots
    const honeypot = this.form.get('honeypot')?.value;
    if (honeypot && honeypot.trim().length > 0) {
      console.warn('Honeypot triggered - likely bot submission');
      this.alertMessage = '✅ Thank you! I will be in touch shortly.';
      this.form.reset();
      return;
    }

    // Additional server-side style validation on the client
    const email = this.form.get('email')?.value;
    const rawMessage = this.form.get('message')?.value;

    // Check for garbage text in message
    if (this.emailValidationService.isGarbageText(rawMessage)) {
      this.alertMessage = '❌ Please enter a valid message with readable text.';
      return;
    }

    // Validate email — flag suspicious but still send
    const emailValidation = this.emailValidationService.validateEmail(email);
    const flagged = !emailValidation.isValid;

    this.isSubmitting = true;

    const { honeypot: _h, subject: subjectCode, name, email: senderEmail, phone, message } = this.form.value;
    const subjectLabels: Record<string, string> = {
      'home-value':     'Free Home Value Analysis',
      'buying':         'Buying a Property',
      'selling':        'Selling a Property',
      'horse-property': 'Horse / Equestrian Property',
      'relocation':     'Military / PCS Relocation',
      'investment':     'Investment Property',
      'other':          'General Question'
    };
    const baseSubject = subjectLabels[subjectCode] ?? subjectCode;
    const emailSubject = flagged ? `[SUSPICIOUS] ${baseSubject}` : baseSubject;
    const flagReason = flagged
      ? `⚠️ SUSPICIOUS EMAIL DETECTED: ${emailValidation.errors.join('; ')}`
      : null;
    const body: Record<string, string> = {
      name:           name,
      email:          senderEmail,
      'Inquiry Type': baseSubject,
      message:        message,
      _replyto:       senderEmail,
      _subject:       emailSubject,
      subject:        emailSubject,
      ...(phone?.trim()  && { phone }),
      ...(flagReason     && { '⚠️ Email Flag': flagReason })
    };

    this.http.post(this.FORMSPREE_URL, body, { responseType: 'text' }).subscribe({
      next: (response) => {
        console.log('Formspree success:', response);
        this.alertMessage = '✅ Thank you! I will be in touch shortly.';
        this.form.reset();
        this.isSubmitting = false;
      },
      error: (err) => {
        console.error('Formspree error:', err.status, err.message, err);
        this.alertMessage = `❌ Submission failed (status ${err.status}). Please try again or email us directly.`;
        this.isSubmitting = false;
      }
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.form.get(fieldName);

    if (!control || !control.errors || !control.touched) {
      return '';
    }

    if (control.errors['required']) {
      return 'This field is required';
    }
    if (control.errors['email']) {
      return 'Please enter a valid email address';
    }
    if (control.errors['fakeEmail']) {
      return 'Temporary email addresses are not allowed';
    }
    if (control.errors['typoSquat']) {
      return control.errors['message'] || 'Please check your email domain';
    }
    if (control.errors['garbageText']) {
      return 'Please enter valid, readable text';
    }
    if (control.errors['minWordCount']) {
      return `Please enter at least ${control.errors['requiredCount']} words`;
    }
    if (control.errors['pattern']) {
      return 'Please enter a valid phone number';
    }
    if (control.errors['minlength']) {
      return 'Name must be at least 2 characters';
    }

    return 'Invalid input';
  }
}
