import { Component } from '@angular/core';

@Component({
  selector: 'app-social-links',
  templateUrl: './social-links.html',
  styleUrl: './social-links.css'
})
export class SocialLinks {
  links = [
    { label: 'Zillow',    url: 'https://www.zillow.com/profile/ericmikuska',            icon: 'assets/images/zillow.png'    },
    { label: 'Facebook',  url: 'https://www.facebook.com/ericmikuska.realtor',          icon: 'assets/images/facebook.png'  },
    { label: 'Instagram', url: 'https://www.instagram.com/ericmikuska',                 icon: 'assets/images/instagram.png' },
    { label: 'YouTube',   url: 'https://www.youtube.com/@redhatproperties',             icon: 'assets/images/youtube.png'   },
    { label: 'TikTok',    url: 'https://www.tiktok.com/@redhatproperties',              icon: 'assets/images/tiktok.png'    },
    { label: 'Nextdoor',  url: 'https://nextdoor.com/profile/01N46CmwYH4Q38JPh',       icon: 'assets/images/nextdoor.png'  },
    { label: 'LinkedIn',  url: 'https://www.linkedin.com/in/ericmikuska',               icon: 'assets/images/linkedin.png'  }
  ];
}
