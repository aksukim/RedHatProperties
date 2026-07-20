import { Component, Input, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { fakeEmailValidator, typoSquatValidator, garbageTextValidator, minWordCountValidator } from '../validators/email-validators';
import { EmailValidationService } from '../services/email-validation.service';

/**
 * Property Inquiry Component
 * Dual-function form for "Get In Touch" and "Request a Tour"
 * Includes comprehensive spam protection and validation
 */
@Component({
  selector: 'app-property-inquiry',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './property-inquiry.html',
  styleUrl: './property-inquiry.css'
})
export class PropertyInquiry implements OnInit {

  @Input() mlsNumber: string = '';
  @Input() propertyAddress: string = '';

  inquiryForm!: FormGroup;
  currentIntent: 'touch' | 'tour' = 'touch';
  isSubmitting = false;
  submitSuccess = false;
  submitError = '';

  private readonly FORMSPREE_URL = 'https://formspree.io/f/xdaqaoga';

  constructor(private fb: FormBuilder, private http: HttpClient, private emailValidationService: EmailValidationService) {}

  ngOnInit(): void {
    this.inquiryForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [
        Validators.required,
        Validators.email
      ]],
      phone: ['', [Validators.pattern(/^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/)]],
      message: ['I am interested in this property...', [
        Validators.required,
        garbageTextValidator(0.4),
        minWordCountValidator(3)
      ]],
      mlsNumber: [this.mlsNumber, Validators.required],
      propertyAddress: [this.propertyAddress],
      intent: ['touch', Validators.required],

      // Dynamic Tour Fields - validators set conditionally
      tourDate: [''],
      tourTime: [''],

      // Hidden Security Anti-Bot Honeypot
      // Real users won't see this field; bots will fill it
      midNameVerification: ['']
    });
  }

  /**
   * Set the form intent and adjust validators accordingly
   */
  setIntent(intent: 'touch' | 'tour'): void {
    this.currentIntent = intent;
    this.inquiryForm.patchValue({ intent: intent });

    const dateCtrl = this.inquiryForm.get('tourDate');
    const timeCtrl = this.inquiryForm.get('tourTime');

    if (intent === 'tour') {
      dateCtrl?.setValidators([Validators.required]);
      timeCtrl?.setValidators([Validators.required]);
    } else {
      dateCtrl?.clearValidators();
      timeCtrl?.clearValidators();
    }

    dateCtrl?.updateValueAndValidity();
    timeCtrl?.updateValueAndValidity();
  }

  /**
   * Get error message for a specific form field
   */
  getErrorMessage(fieldName: string): string {
    const control = this.inquiryForm.get(fieldName);

    if (!control || !control.errors || !control.touched) {
      return '';
    }

    if (control.errors['required']) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }

    if (control.errors['email']) {
      return 'Please enter a valid email address';
    }

    if (control.errors['fakeEmail']) {
      return 'Temporary or disposable email addresses are not allowed';
    }

    if (control.errors['typoSquat']) {
      return control.errors['message'] || 'Please check your email domain';
    }

    if (control.errors['garbageText']) {
      return 'Please enter a valid message with readable text';
    }

    if (control.errors['minWordCount']) {
      return `Please enter at least ${control.errors['requiredCount']} words`;
    }

    if (control.errors['pattern']) {
      return 'Please enter a valid phone number';
    }

    if (control.errors['minlength']) {
      return `Minimum length is ${control.errors['minlength'].requiredLength} characters`;
    }

    return 'Invalid input';
  }

  /**
   * Get friendly label for field name
   */
  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      'fullName': 'Full name',
      'email': 'Email address',
      'phone': 'Phone number',
      'message': 'Message',
      'tourDate': 'Tour date',
      'tourTime': 'Tour time'
    };

    return labels[fieldName] || fieldName;
  }

  /**
   * Check if honeypot was triggered (bot detection)
   */
  private isHoneypotTriggered(): boolean {
    const honeypot = this.inquiryForm.get('midNameVerification')?.value;
    return honeypot && honeypot.trim().length > 0;
  }

  /**
   * Submit the form
   */
  onSubmit(): void {
    if (this.inquiryForm.invalid) {
      this.inquiryForm.markAllAsTouched();
      this.submitError = '⚠️ Please correct the errors above before sending.';
      return;
    }

    // Check honeypot - if triggered, silently fail to fool bots
    if (this.isHoneypotTriggered()) {
      console.warn('Honeypot triggered - likely a bot submission');
      this.submitSuccess = true;
      this.inquiryForm.reset();
      return;
    }

    this.isSubmitting = true;
    this.submitError = '';

    // Get form data
    const { midNameVerification: _h, intent: intentCode, fullName, email: senderEmail, phone, message, ...rest } = this.inquiryForm.value;
    const intentLabels: Record<string, string> = {
      'touch': 'Property Inquiry - Get In Touch',
      'tour':  'Property Inquiry - Request a Tour'
    };
    const emailSubject = intentLabels[intentCode] ?? 'Property Inquiry from RHP Website';

    const emailValidation = this.emailValidationService.validateEmail(senderEmail);
    const flagged = !emailValidation.isValid;
    const flagReason = flagged
      ? `⚠️ SUSPICIOUS EMAIL DETECTED: ${emailValidation.errors.join('; ')}`
      : null;
    const finalSubject = flagged ? `[SUSPICIOUS] ${emailSubject}` : emailSubject;

    const body: Record<string, string> = {
      name:     fullName,
      email:    senderEmail,
      intent:   intentLabels[intentCode] ?? intentCode,
      message:  message,
      _replyto: senderEmail,
      _subject: finalSubject,
      subject:  finalSubject,
      ...rest,
      ...(phone?.trim()  && { phone }),
      ...(flagReason     && { '⚠️ Email Flag': flagReason })
    };

    this.http.post(this.FORMSPREE_URL, body, { responseType: 'text' }).subscribe({
      next: (response) => {
        console.log('Formspree success:', response);
        this.isSubmitting = false;
        this.submitSuccess = true;
        this.inquiryForm.reset();

        setTimeout(() => {
          this.submitSuccess = false;
          this.currentIntent = 'touch';
        }, 5000);
      },
      error: (err) => {
        console.error('Formspree error:', err.status, err.message, err);
        this.isSubmitting = false;
        this.submitError = `Failed to submit (status ${err.status}). Please try again or contact us directly.`;
      }
    });
  }

  /**
   * Get minimum date for tour scheduling (today)
   */
  getMinDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }
}
