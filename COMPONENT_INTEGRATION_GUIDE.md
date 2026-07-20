# Component Integration Guide

Quick reference for adding the new components to your existing pages.

## 🎯 Three Ways to Add Contact/Inquiry Features

### Option 1: KW Redirect (Recommended for Now)

**Use when**: You want to go live TODAY with zero backend

**Steps**:

1. Import the component in your page:
```typescript
import { KwRedirect } from '../kw-redirect/kw-redirect';

@Component({
  selector: 'app-your-page',
  imports: [KwRedirect, /* other imports */],
  // ...
})
```

2. Add to your template:
```html
<app-kw-redirect [mlsNumber]="'123456'"></app-kw-redirect>
```

3. Done! That's it. No backend needed.

---

### Option 2: Property Inquiry Form

**Use when**: You have a backend API ready (Phase 2)

**Steps**:

1. Import the component:
```typescript
import { PropertyInquiry } from '../property-inquiry/property-inquiry';

@Component({
  imports: [PropertyInquiry, /* other imports */],
  // ...
})
```

2. Add to your template:
```html
<app-property-inquiry 
  [mlsNumber]="property.mlsNumber"
  [propertyAddress]="property.fullAddress">
</app-property-inquiry>
```

3. Set up backend API endpoint (see FORM_PROTECTION_README.md)

---

### Option 3: Use Enhanced Contact Form

**Use when**: You want a general contact page

**Already done!** Your `/contact` page is enhanced automatically.

Just send users to `/contact` route.

---

## 📋 Real Examples

### Example 1: Add to Black Forest Page

**File**: `src/app/black-forest/black-forest.ts`

```typescript
import { Component } from '@angular/core';
import { Nav } from '../nav/nav';
import { Footer } from '../footer/footer';
import { KwRedirect } from '../kw-redirect/kw-redirect'; // ← Add this

@Component({
  selector: 'app-black-forest',
  imports: [Nav, Footer, KwRedirect], // ← Add KwRedirect
  templateUrl: './black-forest.html',
  styleUrl: './black-forest.css'
})
export class BlackForest {
  // Your existing code
}
```

**File**: `src/app/black-forest/black-forest.html`

```html
<!-- Your existing content -->

<section class="contact-section">
  <h2>Interested in Black Forest Properties?</h2>
  <app-kw-redirect></app-kw-redirect>
</section>

<!-- Rest of your content -->
```

---

### Example 2: Add to a Property Detail Page

Let's say you create a new property detail page:

**File**: `src/app/property-detail/property-detail.ts`

```typescript
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Nav } from '../nav/nav';
import { Footer } from '../footer/footer';
import { PropertyInquiry } from '../property-inquiry/property-inquiry';

@Component({
  selector: 'app-property-detail',
  standalone: true,
  imports: [CommonModule, Nav, Footer, PropertyInquiry],
  templateUrl: './property-detail.html',
  styleUrl: './property-detail.css'
})
export class PropertyDetail implements OnInit {
  mlsNumber: string = '';
  property: any = {};

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    // Get MLS number from route
    this.mlsNumber = this.route.snapshot.paramMap.get('mlsNumber') || '';

    // Load property details (from API or static data)
    this.loadPropertyDetails();
  }

  loadPropertyDetails(): void {
    // In real app, call your MLS API
    this.property = {
      mlsNumber: this.mlsNumber,
      address: '123 Pine Valley Rd, Black Forest, CO',
      price: 750000,
      beds: 4,
      baths: 3,
      sqft: 3200
    };
  }
}
```

**File**: `src/app/property-detail/property-detail.html`

```html
<main class="page">
  <app-nav />

  <section class="property-hero">
    <h1>{{ property.address }}</h1>
    <div class="price">${{ property.price | number }}</div>

    <!-- Property photos, details, etc. -->
  </section>

  <section class="property-details">
    <h2>Property Details</h2>
    <div class="stats">
      <span>{{ property.beds }} Beds</span>
      <span>{{ property.baths }} Baths</span>
      <span>{{ property.sqft | number }} sqft</span>
    </div>
  </section>

  <!-- Add the inquiry form -->
  <section class="inquiry-section">
    <h2>Interested in This Property?</h2>
    <app-property-inquiry 
      [mlsNumber]="property.mlsNumber"
      [propertyAddress]="property.address">
    </app-property-inquiry>
  </section>

  <app-footer />
</main>
```

**Add route** in `src/app/app.routes.ts`:

```typescript
import { PropertyDetail } from './property-detail/property-detail';

export const routes: Routes = [
  // ... existing routes
  { path: 'property/:mlsNumber', component: PropertyDetail }
];
```

---

### Example 3: Add to Terra Ridge Page

**File**: `src/app/terra-ridge/terra-ridge.ts`

```typescript
import { Component } from '@angular/core';
import { Nav } from '../nav/nav';
import { Footer } from '../footer/footer';
import { KwRedirect } from '../kw-redirect/kw-redirect'; // ← Add

@Component({
  selector: 'app-terra-ridge',
  imports: [Nav, Footer, KwRedirect], // ← Add
  templateUrl: './terra-ridge.html',
  styleUrl: './terra-ridge.css'
})
export class TerraRidge {
  // Specific MLS number for this development
  developmentMls = '789012';
}
```

**File**: `src/app/terra-ridge/terra-ridge.html`

```html
<!-- Your existing Terra Ridge content -->

<section class="cta-section">
  <h2>Schedule a Tour of Terra Ridge</h2>
  <p>Experience this amazing community in person</p>
  <app-kw-redirect [mlsNumber]="developmentMls"></app-kw-redirect>
</section>

<!-- Rest of content -->
```

---

## 🎨 Styling Integration

### Matching Your Site's Look

All components use CSS variables for easy customization.

**Create a global override** in `src/styles.css`:

```css
/* Override form component colors to match your brand */
app-property-inquiry,
app-kw-redirect {
  --primary-color: #c41e3a;
  --success-color: #2c5f2d;
  --accent-color: #f4a460;
  --text-color: #333;
  --border-radius: 8px;
}
```

### Or Override in Component CSS

**File**: `src/app/black-forest/black-forest.css`

```css
/* Make the KW Redirect component match Black Forest theme */
app-kw-redirect .btn-primary {
  background: #2c5f2d; /* Use forest green instead of red */
}

app-kw-redirect .btn-secondary {
  background: #8b4513; /* Use brown for secondary */
}
```

---

## 🚀 Quick Start Steps

### Fastest Path to Production

1. **Choose one page** to add a form (e.g., Black Forest)

2. **Import KwRedirect**:
   ```typescript
   import { KwRedirect } from '../kw-redirect/kw-redirect';
   ```

3. **Add to imports array**:
   ```typescript
   imports: [Nav, Footer, KwRedirect]
   ```

4. **Add to template**:
   ```html
   <app-kw-redirect></app-kw-redirect>
   ```

5. **Update your KW URL** in `kw-redirect.ts`:
   ```typescript
   private baseKwUrl = 'https://www.kw.com/agent/YOUR-NAME';
   ```

6. **Test locally**:
   ```bash
   npm start
   ```

7. **Deploy**!

---

## 💡 Common Patterns

### Pattern 1: Multiple Inquiry Points

Add forms at multiple spots on the same page:

```html
<!-- Top of page - quick CTA -->
<section class="hero">
  <h1>Black Forest Luxury Homes</h1>
  <app-kw-redirect></app-kw-redirect>
</section>

<!-- Middle of page - after property showcase -->
<section class="featured-properties">
  <!-- Property cards -->
</section>
<div class="inquiry-cta">
  <h3>See something you like?</h3>
  <app-kw-redirect></app-kw-redirect>
</div>

<!-- Bottom of page - final CTA -->
<section class="contact-footer">
  <app-kw-redirect></app-kw-redirect>
</section>
```

### Pattern 2: Conditional Display

Show form only to certain users:

```typescript
export class PropertyPage {
  showContactForm = false;

  userShowedInterest(): void {
    // User scrolled, clicked something, etc.
    this.showContactForm = true;
  }
}
```

```html
@if (showContactForm) {
  <app-property-inquiry 
    [mlsNumber]="property.mlsNumber"
    [propertyAddress]="property.address">
  </app-property-inquiry>
}
```

### Pattern 3: Modal/Popup

Show form in a modal:

```html
<button (click)="showModal = true">Contact About This Property</button>

@if (showModal) {
  <div class="modal-overlay" (click)="showModal = false">
    <div class="modal-content" (click)="$event.stopPropagation()">
      <button class="close-btn" (click)="showModal = false">×</button>
      <app-property-inquiry 
        [mlsNumber]="property.mlsNumber"
        [propertyAddress]="property.address">
      </app-property-inquiry>
    </div>
  </div>
}
```

```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  z-index: 1;
}
```

---

## 🔧 Troubleshooting

### Component Not Showing

**Problem**: Added component but nothing appears

**Solution**:
1. Check you imported it: `import { KwRedirect } from '../kw-redirect/kw-redirect';`
2. Check you added to imports array: `imports: [KwRedirect]`
3. Check browser console for errors
4. Verify component selector: `<app-kw-redirect></app-kw-redirect>`

### Styling Looks Wrong

**Problem**: Component doesn't match your site style

**Solution**:
1. Add CSS overrides in your page's CSS file
2. Or create global overrides in `src/styles.css`
3. Check that your page's CSS isn't conflicting

### Form Not Submitting

**Problem**: Submit button stays disabled

**Solution**:
1. Fill all required fields
2. Check browser console for validation errors
3. Make sure email is valid (not disposable)
4. Ensure message has at least 3 words (Property Inquiry) or 5 words (Contact)

---

## ✅ Deployment Checklist

Before deploying with new components:

- [ ] Imported component in TypeScript file
- [ ] Added to imports array
- [ ] Added component tag to HTML template
- [ ] Updated KW URL in `kw-redirect.ts`
- [ ] Tested locally (`npm start`)
- [ ] Checked on mobile browser
- [ ] Tested form submission
- [ ] Verified email validation works
- [ ] Built production bundle (`npm run build`)
- [ ] No TypeScript errors
- [ ] Deployed to hosting

---

## 📞 Need Help?

1. **Check demo page**: http://localhost:4200/form-demo
2. **Review README**: `FORM_PROTECTION_README.md`
3. **Quick reference**: `QUICK_START.md`
4. **This guide**: For integration examples

---

**Pro Tip**: Start with one simple integration (like adding KW Redirect to Black Forest page), test it thoroughly, then expand to other pages.

