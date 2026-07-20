import { Routes } from '@angular/router';
import { Home } from './home/home';
import { BlackForest } from './black-forest/black-forest';
import { TerraRidge } from './terra-ridge/terra-ridge';
import { ThankYou } from './thank-you/thank-you';
import { BrowseListings } from './browse-listings/browse-listings';
import { Contact } from './contact/contact';
import { FormDemo } from './form-demo/form-demo';
import { Admin } from './admin/admin';

export const routes: Routes = [
  { path: '',                component: Home           },
  { path: 'black-forest',    component: BlackForest     },
  { path: 'terra-ridge',     component: TerraRidge      },
  { path: 'thank-you',       component: ThankYou        },
  { path: 'browse-listings', component: BrowseListings  },
  { path: 'contact',         component: Contact         },
  { path: 'form-demo',       component: FormDemo        },
  { path: 'admin',           component: Admin           }
];
