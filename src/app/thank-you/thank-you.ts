import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Header } from '../header/header';
import { Footer } from '../footer/footer';

@Component({
  selector: 'app-thank-you',
  imports: [RouterLink, Header, Footer],
  templateUrl: './thank-you.html',
  styleUrl: './thank-you.css'
})
export class ThankYou {
  @Input() title        = 'Thank You!';
  @Input() message      = 'Your request has been received.';
  @Input() nextSteps: string[] = [];
  @Input() returnLabel  = 'Return to Agent Hub';
  @Input() returnRoute  = '/';
}
