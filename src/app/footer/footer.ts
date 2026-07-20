import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SocialLinks } from '../social-links/social-links';

@Component({
  selector: 'app-footer',
  imports: [SocialLinks, RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class Footer {}
