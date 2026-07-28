import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Header } from '../header/header';
import { Footer } from '../footer/footer';

@Component({
  selector: 'app-about-me',
  imports: [RouterLink, Header, Footer],
  templateUrl: './about-me.html',
  styleUrl: './about-me.css'
})
export class AboutMe {}
