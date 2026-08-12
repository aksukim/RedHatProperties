import { Routes } from '@angular/router';
import { Home } from './home/home';
import { AboutMe } from './about-me/about-me';
import { BlackForest } from './black-forest/black-forest';
import { TerraRidge } from './terra-ridge/terra-ridge';
import { ThankYou } from './thank-you/thank-you';
import { BrowseListings } from './browse-listings/browse-listings';
import { Contact } from './contact/contact';
import { FormDemo } from './form-demo/form-demo';
import { Admin } from './admin/admin';
import { CustomerReviews } from './customer-reviews/customer-reviews';

export const routes: Routes = [
  { path: '',                component: Home           },
  { path: 'about-me',        component: AboutMe         },
  { path: 'black-forest',    component: BlackForest     },
  { path: 'terra-ridge',     component: TerraRidge      },
  { path: 'thank-you',       component: ThankYou        },
  { path: 'browse-listings', component: BrowseListings  },
  { path: 'customer-reviews', component: CustomerReviews },
  { path: 'contact',         component: Contact         },
  { path: 'form-demo',       component: FormDemo        },
  { path: 'admin',           component: Admin           }
];
