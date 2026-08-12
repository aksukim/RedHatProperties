import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Header } from '../header/header';
import { Footer } from '../footer/footer';

@Component({
  selector: 'app-customer-reviews',
  imports: [RouterLink, Header, Footer],
  templateUrl: './customer-reviews.html',
  styleUrl: './customer-reviews.css'
})
export class CustomerReviews {}
