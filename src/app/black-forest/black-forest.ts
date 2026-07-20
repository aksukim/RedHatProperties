import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Header } from '../header/header';
import { Footer } from '../footer/footer';

@Component({
  selector: 'app-black-forest',
  imports: [RouterLink, Header, Footer],
  templateUrl: './black-forest.html',
  styleUrl: './black-forest.css'
})
export class BlackForest {}
