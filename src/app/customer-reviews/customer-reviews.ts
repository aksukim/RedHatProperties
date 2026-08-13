import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Header } from '../header/header';
import { Footer } from '../footer/footer';

interface Review {
  _id: string;
  name: string;
  rating: number;
  comment: string;
  createdAt: string;
}

@Component({
  selector: 'app-customer-reviews',
  imports: [RouterLink, FormsModule, Header, Footer],
  templateUrl: './customer-reviews.html',
  styleUrl: './customer-reviews.css'
})
export class CustomerReviews implements OnInit {
  reviews: Review[] = [];
  loaded = false;

  // Submission form
  formName = '';
  formRating = 5;
  formComment = '';
  submitMessage = '';
  submitting = false;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    fetch('/api/reviews')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: Review[]) => {
        this.reviews = data;
        this.loaded = true;
        this.cdr.detectChanges();
      })
      .catch(() => {
        this.loaded = true;
        this.cdr.detectChanges();
      });
  }

  stars(n: number): string {
    return '★'.repeat(n) + '☆'.repeat(5 - n);
  }

  submitReview(): void {
    if (!this.formName.trim() || !this.formComment.trim()) {
      this.submitMessage = '⚠️ Please fill in your name and comment.';
      this.cdr.detectChanges();
      return;
    }
    this.submitting = true;
    this.submitMessage = '';
    fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: this.formName, rating: this.formRating, comment: this.formComment })
    })
    .then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e.error)))
    .then(() => {
      this.submitMessage = '✅ Thank you! Your review has been submitted and will appear after approval.';
      this.formName = '';
      this.formRating = 5;
      this.formComment = '';
      this.submitting = false;
      this.cdr.detectChanges();
    })
    .catch((err: string) => {
      this.submitMessage = `❌ ${err || 'Submission failed. Please try again.'}`;
      this.submitting = false;
      this.cdr.detectChanges();
    });
  }
}
