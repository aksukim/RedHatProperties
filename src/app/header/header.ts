import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Nav } from '../nav/nav';

@Component({
  selector: 'app-header',
  imports: [RouterLink, Nav],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {}
