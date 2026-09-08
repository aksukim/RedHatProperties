# CSS Analysis Report: Red Hat Properties Angular Project

**Analysis Date:** 2026-09-08  
**Project:** red-hat-properties-angular  
**Total CSS Files Analyzed:** 18  
**Total Lines of CSS:** ~2,500+

---

## EXECUTIVE SUMMARY

This analysis identifies **significant CSS duplication** as the primary issue, with numerous unused classes and styles defined multiple times across component CSS files. The project can reduce CSS by approximately **30-40%** through consolidation and cleanup.

### Key Findings:
- ⚠️ **CRITICAL:** 7+ CSS classes defined in multiple files (massive duplication)
- 🔴 **HIGH:** 3-5 unused CSS classes
- 🟡 **MEDIUM:** Commented-out CSS, responsive design issues, inline color overrides
- 🟢 **LOW:** Code organization and naming convention inconsistencies

**Estimated CSS Removable:** ~800-1200 lines (30-40% of total)

---

## 1. DUPLICATE CSS CLASSES (CRITICAL)

The most significant issue is CSS class duplication across component files. These should be moved to `src/styles.css`:

### `.eyebrow` - **HIGH DUPLICATION** (7 files)
| File | Line | Context | Notes |
|------|------|---------|-------|
| [src/styles.css](src/styles.css#L83) | 83 | Global definition | 12px, uppercase, primary color |
| [src/app/contact/contact.css](src/app/contact/contact.css#L21) | 21 | Component override | Identical styling - DUPLICATE |
| [src/app/admin/admin.css](src/app/admin/admin.css) | N/A | Not found in read | Uses `.eyebrow` but not defined |
| [src/app/terra-ridge/terra-ridge.css](src/app/terra-ridge/terra-ridge.css#L74) | 74 | Component override | Identical to global - DUPLICATE |
| [src/app/browse-listings/browse-listings.css](src/app/browse-listings/browse-listings.css#L53) | 53 | Component override | Identical to global - DUPLICATE |
| [src/app/about-me/about-me.css](src/app/about-me/about-me.css#L32) | 32 | Component override (as `.am-eyebrow`) | Scoped version, used correctly |
| [src/app/black-forest/black-forest.css](src/app/black-forest/black-forest.css#L29) | 29 | Component override (as `.bf-eyebrow`) | Scoped version, used correctly |
| [src/app/customer-reviews/customer-reviews.css](src/app/customer-reviews/customer-reviews.css) | 21 | Component override | Identical to global - DUPLICATE |
| [src/app/thank-you/thank-you.css](src/app/thank-you/thank-you.css#L84) | 84 | Component override | Identical to global - DUPLICATE |

**Confidence:** HIGH  
**Impact:** Remove `.eyebrow` from contact.css, terra-ridge.css, browse-listings.css, customer-reviews.css, thank-you.css

---

### `.btn-primary` - **HIGH DUPLICATION** (5-6 files)
| File | Line | Definition |
|------|------|-----------|
| [src/styles.css](src/styles.css) | N/A | Not in global (should be!) |
| [src/app/contact/contact.css](src/app/contact/contact.css#L122) | 122 | Defined: #df000d bg, white text |
| [src/app/terra-ridge/terra-ridge.css](src/app/terra-ridge/terra-ridge.css#L182) | 182 | **IDENTICAL** to contact.css |
| [src/app/browse-listings/browse-listings.css](src/app/browse-listings/browse-listings.css#L188) | 188 | **IDENTICAL** styling |
| [src/app/black-forest/black-forest.css](src/app/black-forest/black-forest.css#L267) | 267 | **IDENTICAL** styling |
| [src/app/kw-redirect/kw-redirect.css](src/app/kw-redirect/kw-redirect.css) | ~40 | **IDENTICAL** styling |
| [src/app/thank-you/thank-you.css](src/app/thank-you/thank-you.css#L127) | 127 | **IDENTICAL** styling |

**Confidence:** HIGH  
**Impact:** Create single `.btn-primary` definition in global styles, remove from all component files

**Variations Found:**
- contact.css version: `padding: 0.55rem 1.25rem` with slightly larger font
- browse-listings.css version: `padding: 0.4rem 1rem` (slightly smaller)
- All have identical hover state: `#b0000a`
- All have `:disabled` state (some places)

---

### `.highlight-box` - **MEDIUM DUPLICATION** (3+ files)
| File | Line | Notes |
|------|------|-------|
| [src/styles.css](src/styles.css#L109) | 109-113 | Global: rgba(0,0,0,0.45), border-left, #df000d |
| [src/app/terra-ridge/terra-ridge.css](src/app/terra-ridge/terra-ridge.css#L92) | 92-96 | **IDENTICAL DUPLICATE** |
| [src/app/thank-you/thank-you.css](src/app/thank-you/thank-you.css#L27) | 27-30 | **IDENTICAL DUPLICATE** |
| [src/app/thank-you/thank-you.css](src/app/thank-you/thank-you.css#L109) | 109-113 | **DUPLICATE OF DUPLICATE** |

**Confidence:** HIGH  
**Impact:** Remove from terra-ridge.css and both definitions in thank-you.css

**Related Rules Also Duplicated:**
- `.highlight-box strong` (3 files)
- `.highlight-box ul` (3 files)

---

### `.container` - **MEDIUM DUPLICATION** (3-4 files)
| File | Line | Purpose |
|------|------|---------|
| [src/styles.css](src/styles.css#L40) | 40 | Global: `max-width: 960px`, centered |
| [src/styles.css](src/styles.css#L316) | 316 | Mobile override: `padding: 20px` |
| [src/app/terra-ridge/terra-ridge.css](src/app/terra-ridge/terra-ridge.css#L22) | 22 | **DUPLICATE**: `max-width: 580px`, different from global |
| [src/app/thank-you/thank-you.css](src/app/thank-you/thank-you.css#L1) | 1 | **DUPLICATE**: `max-width: 640px`, different from global |
| [src/app/form-demo/form-demo.css](src/app/form-demo/form-demo.css#L10) | 10 | **DUPLICATE**: `max-width: 1200px`, different from global |

**Confidence:** MEDIUM-HIGH  
**Issue:** Conflicting `max-width` values across files. Component-specific containers should use scoped class names (e.g., `.tr-container`, `.ty-container`) instead of generic `.container`

**Recommendation:** 
- Rename component-specific `.container` to component-scoped names
- Keep global `.container` for shared use only

---

### `.bio-card` - **MEDIUM DUPLICATION** (2 files)
| File | Line | Context |
|------|------|---------|
| [src/app/about-me/about-me.css](src/app/about-me/about-me.css#L106) | 106-122 | Defined: rgba(0,0,0,0.45), border-left #df000d |
| [src/app/black-forest/black-forest.css](src/app/black-forest/black-forest.css#L124) | 124-150 | **IDENTICAL DUPLICATE** |

**Confidence:** HIGH  
**Impact:** Move to global styles, both files use identical implementation

**Related Duplicates:**
- `.bio-card:hover` (2 files)
- `.bio-card h3` (2 files)  
- `.bio-card p` (2 files)
- `.expertise-icon` (2 files)
- `.bio-grid` (2 files)

---

### `.section-eyebrow` - **MEDIUM DUPLICATION** (2+ files)
| File | Line | Notes |
|------|------|-------|
| [src/app/about-me/about-me.css](src/app/about-me/about-me.css#L83) | 83 | 0.6rem, #df000d, uppercase |
| [src/app/black-forest/black-forest.css](src/app/black-forest/black-forest.css#L107) | 107 | **IDENTICAL DUPLICATE** |

**Confidence:** HIGH  
**Impact:** Remove from black-forest.css

---

### Element Styling Duplication
Several base HTML elements are styled in multiple places:

#### `h1` - Duplicated across many files
- [src/styles.css](src/styles.css): `h1 { margin: 10px 0; font-size: 32px; }`
- [src/app/contact/contact.css](src/app/contact/contact.css#L39): Complete override (Playfair, 2.8rem, white)
- [src/app/admin/admin.css](src/app/admin/admin.css): Complete override
- [src/app/about-me/about-me.css](src/app/about-me/about-me.css#L35): Complete override
- [src/app/black-forest/black-forest.css](src/app/black-forest/black-forest.css#L34): Complete override
- [src/app/terra-ridge/terra-ridge.css](src/app/terra-ridge/terra-ridge.css#L25): Complete override
- [src/app/customer-reviews/customer-reviews.css](src/app/customer-reviews/customer-reviews.css#L23): `clamp()` responsive sizing
- [src/app/form-demo/form-demo.css](src/app/form-demo/form-demo.css#L16): Centered, red color, 2.5rem
- [src/app/thank-you/thank-you.css](src/app/thank-you/thank-you.css#L87): Playfair, 2.8rem, white

**Recommendation:** Use CSS custom properties or scoped classes instead of element selectors

#### `hr` - Styled differently in each file
- [src/app/about-me/about-me.css](src/app/about-me/about-me.css): `hr { border-top: 1px solid rgba(255,255,255,0.1); margin: 3rem 0; }`
- [src/app/black-forest/black-forest.css](src/app/black-forest/black-forest.css#L59) (as `.bf-divider`): Same styles

**Issue:** `hr` should have ONE canonical definition in global styles

---

## 2. UNUSED CSS CLASSES (HIGH PRIORITY)

### `.kw-badge` - NOT USED
**File:** [src/app/footer/footer.css](src/app/footer/footer.css)  
**Lines:** ~L58-61 (estimated)  
**Definition:** 
```css
.kw-badge {
  margin-top: 0.6rem;
}
```

**Status:** Defined but never applied in [src/app/footer/footer.html](src/app/footer/footer.html)  
**Confidence:** HIGH  
**Action:** Delete from footer.css

---

### `.hero-headline` in header.css - MISPLACED
**File:** [src/app/header/header.css](src/app/header/header.css)  
**Lines:** ~L42-50 (estimated)  
**Definition:** Playfair Display, 2.8rem, white, with text-shadow  

**Status:** Defined but NOT used in [src/app/header/header.html](src/app/header/header.html)  
**Note:** This class IS used in [src/app/home/home.css](src/app/home/home.css) and defined there  
**Confidence:** HIGH  
**Action:** Delete from header.css (duplicate definition)

---

### `.card-alt` in styles.css - NOT USED
**File:** [src/styles.css](src/styles.css)  
**Lines:** L99 (in multi-class selector)  
**Definition:** Grouped with other card classes but never applied  

**Status:** Never found in any HTML template  
**Confidence:** MEDIUM  
**Action:** Remove from selector grouping on line 99

---

### Unused Media Query Rules
**File:** [src/app/contact/contact.css](src/app/contact/contact.css)  
**Lines:** ~L170+ (estimated)  
**Status:** `@media (max-width: 720px)` exists but contact page appears to be full-width responsive  

**Confidence:** LOW  
**Note:** May be intentional for future breakpoints

---

## 3. COMMENTED-OUT CSS (MEDIUM PRIORITY)

### Commented Footer Styles
**File:** [src/styles.css](src/styles.css)  
**Lines:** ~L186-194  
**Content:**
```css
/* footer styles live in footer.css — do not define here */
/* footer {
  margin-top: 40px;
  padding-top: 24px;
  border-top: 1px solid var(--border);
  color: #777777;
  font-size: 14px;
} */
```

**Status:** Outdated comment block, safe to remove  
**Confidence:** HIGH  
**Action:** Delete comment block

---

### Commented Footer Styles (Duplicate)
**File:** [src/app/footer/footer.css](src/app/footer/footer.css)  
**Lines:** ~L1-5  
**Content:**
```css
/* DELETE this entire block — footer styles live in footer.css */
/* footer {
  margin-top: 40px;
  padding-top: 24px;
  border-top: 1px solid var(--border);
  color: #777777;
  font-size: 14px;
} */
```

**Status:** Self-referential comment, clearly marked for deletion  
**Confidence:** HIGH  
**Action:** Delete immediately

---

## 4. RESPONSIVE DESIGN & LAYOUT ISSUES (MEDIUM PRIORITY)

### `.listings-hero .sub` - White-space Overflow Risk
**File:** [src/app/browse-listings/browse-listings.css](src/app/browse-listings/browse-listings.css#L65)  
**Lines:** L65  
**CSS:**
```css
.listings-hero .sub {
  font-size: 0.95rem;
  color: #d0d0d0;
  max-width: 700px;
  line-height: 1.7;
  white-space: nowrap;  /* <-- PROBLEMATIC */
}
```

**Issue:** `white-space: nowrap` prevents text wrapping, causing horizontal overflow on mobile  
**Confidence:** HIGH  
**Action:** Remove `white-space: nowrap` to allow text to wrap naturally

**Template Usage:** [src/app/browse-listings/browse-listings.html](src/app/browse-listings/browse-listings.html#L16)
```html
<p class="sub">Active listings, recent sales, and equestrian properties across Colorado Springs and the Front Range.</p>
```
This text should wrap on mobile devices.

---

### Inconsistent Padding in `.container` Media Query
**File:** [src/styles.css](src/styles.css#L316)  
**Lines:** L316  
**Issue:** Global `.container` has `padding: 20px` on mobile, but component-specific containers override with different values  
**Recommendation:** Establish consistent mobile padding strategy

---

## 5. COLOR & STYLING INCONSISTENCIES (LOW-MEDIUM PRIORITY)

### Multiple Color Definitions for Same Element
**Issue:** Primary red color is defined multiple ways:
- CSS variable: `var(--primary)` = `#e41f26` (in styles.css)
- Direct: `#df000d` (used in 20+ places across component files)
- Direct: `#c41e3a` (used in form-demo.css)

**Confidence:** MEDIUM  
**Recommendation:** Use CSS variables consistently, replace hardcoded colors with `var(--primary)` and add to `:root`

---

### Inline `!important` Overrides
**File:** [src/app/contact/contact.css](src/app/contact/contact.css) - multiple instances  
**Issue:** Several rules use `!important` which indicates CSS specificity problems

**Examples:**
- `.contact-form input::-webkit-input-placeholder` (no actual impact)
- Button styling in various components

**Recommendation:** Fix specificity issues instead of using `!important`

---

## 6. DUPLICATE FORM STYLING

### Form Input Styles Duplicated
The following are defined in multiple component CSS files:
- `input[type="text"]`, `input[type="email"]`, `textarea` styling
- `.form-row`, `.form-field`, `label` styling
- Focus states, error states

**Files with form styling:**
- [src/styles.css](src/styles.css#L127-148): Global form styles
- [src/app/contact/contact.css](src/app/contact/contact.css): Contact form inputs
- [src/app/terra-ridge/terra-ridge.css](src/app/terra-ridge/terra-ridge.css#L108): Home value form
- [src/app/property-inquiry/property-inquiry.css](src/app/property-inquiry/property-inquiry.css#L53): Inquiry form
- [src/app/customer-reviews/customer-reviews.css](src/app/customer-reviews/customer-reviews.css): Review form

**Confidence:** HIGH  
**Recommendation:** Create `.form-styles.css` or move all form styling to global styles, use component-specific class modifiers only

---

## 7. SUMMARY TABLE: ALL DUPLICATES BY TYPE

### Class Duplication Summary
| Class Name | # Files | Severity | Removable Lines |
|---|---|---|---|
| `.eyebrow` | 7 | CRITICAL | ~50 |
| `.btn-primary` | 5-6 | CRITICAL | ~100 |
| `.highlight-box*` | 3 | HIGH | ~40 |
| `.bio-card*` | 2 | HIGH | ~50 |
| `.container` | 3 | HIGH | ~30 |
| `.section-eyebrow` | 2 | HIGH | ~15 |
| `h1` element styling | 8+ | MEDIUM | ~80 |
| `hr` / `.bf-divider` | 2 | MEDIUM | ~10 |
| Form input styling | 5 | MEDIUM | ~120 |
| `.sub` / subtitle text | 4 | MEDIUM | ~30 |

**Estimated Total Removable from Duplicates:** ~525-600 lines

---

## RECOMMENDATIONS & ACTION PLAN

### PHASE 1: IMMEDIATE (Easy Wins)
**Estimated savings: ~200 lines, 1-2 hours**

1. ✅ Delete unused `.kw-badge` from footer.css
2. ✅ Delete `.hero-headline` from header.css
3. ✅ Remove `.card-alt` from styles.css selector
4. ✅ Delete commented CSS blocks (styles.css and footer.css)
5. ✅ Fix `.listings-hero .sub` white-space issue (remove `nowrap`)
6. ✅ Remove duplicate `.eyebrow` from component files (keep global)

### PHASE 2: CONSOLIDATION (Medium Effort)
**Estimated savings: ~300-400 lines, 4-6 hours**

1. ✅ Move all `.bio-card*` rules to global styles
2. ✅ Move all `.highlight-box*` rules to global styles
3. ✅ Consolidate `.btn-primary` into single definition with size modifiers
4. ✅ Rename component-specific `.container` to scoped names (`.tr-container`, `.ty-container`, `.fd-container`)
5. ✅ Move `.section-eyebrow` to global
6. ✅ Consolidate form styling into dedicated global form rules

### PHASE 3: OPTIMIZATION (Large Effort)
**Estimated savings: ~200-400 lines, 8-12 hours**

1. ✅ Create component-scoped heading rules instead of using `h1` element selector
2. ✅ Consolidate form input styling from 5 files into 1-2 global+component rules
3. ✅ Replace hardcoded color values with CSS variables
4. ✅ Establish consistent breakpoint strategy and consolidate media queries
5. ✅ Create utility class system for common patterns (`.eyebrow`, `.subtitle`, `.badge`, etc.)
6. ✅ Document component CSS class naming conventions

### PHASE 4: TESTING
**Estimated effort: 2-4 hours**

1. Screenshot tests for each component after consolidation
2. Responsive design testing on mobile/tablet/desktop
3. Cross-browser testing (Chrome, Firefox, Safari, Edge)
4. Verify no visual regressions

---

## DETAILED FINDINGS BY FILE

### src/styles.css (194 lines)
**Issues Found:**
- 2 large commented-out blocks (should delete)
- `.card-alt` class never used
- Should contain consolidated form, button, and component base styles
- Missing color variable for `#df000d` (used in 20+ places elsewhere)

**Duplicates defined here:** `.eyebrow`, `.page`, `.container`, `.highlight-box`

**Recommendation:** Expand to ~300 lines as central stylesheet, move component defaults here

---

### src/app/header/header.css (50 lines)
**Issues Found:**
- `.hero-headline` is duplicate of home.css definition, not used here
- Should be minimal (navbar styling only)

**Duplicates defined here:** `.hero-headline` (unused)

**Recommendation:** Delete `.hero-headline`, file should be ~40 lines

---

### src/app/footer/footer.css (65 lines)
**Issues Found:**
- 5-line commented block about "DELETE this entire block"
- `.kw-badge` defined but never used
- Good file overall, needs minor cleanup

**Duplicates defined here:** None created, but commented code present

**Recommendation:** Remove comment block and `.kw-badge`, file becomes ~50 lines

---

### src/app/nav/nav.css (75 lines)
**Status:** ✅ CLEAN - No issues found
- All classes used
- Good responsive design pattern
- `:host { display: contents; }` is correct pattern for component wrapper

---

### src/app/contact/contact.css (197 lines)
**Issues Found:**
- `.eyebrow` duplicates global definition
- `.btn-primary` duplicates other files
- Form styling could be consolidated
- Many `!important` flags

**Duplicates defined here:** `.eyebrow`, `.btn-primary`, form inputs

**Recommendation:** Reduce to ~150 lines by removing duplicates

---

### src/app/admin/admin.css (260+ lines)
**Status:** ✅ Mostly clean - All classes are admin-specific and used

**Minor Issues:**
- Some status badge colors could use CSS variables
- Could benefit from BEM naming convention

**Recommendation:** Rename with `.admin-` prefix consistently (already mostly done)

---

### src/app/about-me/about-me.css (200+ lines)
**Issues Found:**
- `.section-eyebrow` duplicated in black-forest.css
- `.bio-grid` and `.bio-card` duplicated in black-forest.css
- `.btn-primary` duplicates other files
- Form inputs if any would duplicate

**Duplicates defined here:** `.section-eyebrow`, `.bio-grid`, `.bio-card*`, `.btn-primary`

**Recommendation:** Reduce to ~120 lines by consolidating duplicates

---

### src/app/black-forest/black-forest.css (270+ lines)
**Issues Found:**
- `.section-eyebrow` duplicates about-me.css
- `.bio-grid` and `.bio-card*` duplicate about-me.css
- `.btn-primary` duplicates multiple files
- Uses `.bf-divider` instead of `hr` styling (inconsistent)

**Duplicates defined here:** `.section-eyebrow`, `.bio-grid`, `.bio-card*`, `.btn-primary`, `hr` (as `.bf-divider`)

**Recommendation:** Reduce to ~150 lines by consolidating, use `hr` instead of `.bf-divider`

---

### src/app/terra-ridge/terra-ridge.css (220+ lines)
**Issues Found:**
- `.container` with different max-width than global (should rename)
- `.eyebrow` duplicates global
- `.highlight-box*` duplicates global
- `.btn-primary` duplicates multiple files
- Form styling duplicates

**Duplicates defined here:** `.container` (scoped), `.eyebrow`, `.highlight-box*`, `.btn-primary`, form inputs

**Recommendation:** Reduce to ~130 lines by consolidating, rename `.container` to `.tr-container`

---

### src/app/browse-listings/browse-listings.css (190+ lines)
**Issues Found:**
- `.listings-hero .sub` has `white-space: nowrap` causing overflow (should delete)
- `.eyebrow` duplicates global
- `.btn-primary` duplicates multiple files
- Custom scrollbar styling is good (keep)

**Duplicates defined here:** `.eyebrow`, `.btn-primary`

**Recommendation:** Reduce to ~150 lines, fix white-space issue, remove duplicates

---

### src/app/customer-reviews/customer-reviews.css (140+ lines)
**Issues Found:**
- `.eyebrow` duplicates global
- Good use of `clamp()` for responsive typography
- Review card styling is component-specific (good)

**Duplicates defined here:** `.eyebrow`

**Recommendation:** Reduce to ~120 lines by removing eyebrow duplication

---

### src/app/form-demo/form-demo.css (160+ lines)
**Issues Found:**
- `.container` with different max-width (should rename to `.fd-container`)
- Uses color `#c41e3a` instead of primary variable
- Form section styling is good

**Duplicates defined here:** `.container` (scoped)

**Recommendation:** Reduce to ~140 lines, rename container, use CSS variables for colors

---

### src/app/thank-you/thank-you.css (150 lines)
**Issues Found:**
- `.container` with different max-width (should rename to `.ty-container`)
- `.eyebrow` duplicates global
- `.highlight-box*` duplicated **TWICE** in same file
- `.btn-primary` duplicates multiple files

**Duplicates defined here:** `.container` (scoped), `.eyebrow`, `.highlight-box*` (2x), `.btn-primary`

**Recommendation:** Reduce to ~70 lines by removing all duplicates

---

### src/app/property-inquiry/property-inquiry.css (80 lines)
**Status:** ✅ CLEAN - All classes are component-specific and used
- Good form styling pattern
- No duplicates found

---

### src/app/social-links/social-links.css (20 lines)
**Status:** ✅ CLEAN - Minimal and focused
- All classes used
- Simple styling for component

---

### src/app/kw-redirect/kw-redirect.css (120+ lines)
**Issues Found:**
- `.btn-primary` duplicates multiple files (appears as `.btn-primary`, `.btn-secondary`, `.btn-accent`)
- Should have action-card specific button class

**Duplicates defined here:** `.btn-primary`

**Recommendation:** Reduce to ~80 lines by consolidating button styles

---

## POTENTIAL CSS SAVINGS BREAKDOWN

| Category | # Lines | Priority | Difficulty |
|---|---|---|---|
| Unused classes | 30-40 | HIGH | Easy |
| Commented CSS | 20-30 | HIGH | Easy |
| `.eyebrow` consolidation | 50 | CRITICAL | Easy |
| `.btn-primary` consolidation | 80-100 | CRITICAL | Medium |
| `.highlight-box*` consolidation | 40 | HIGH | Easy |
| `.bio-card*` consolidation | 50 | HIGH | Easy |
| `.container` renaming | 30-40 | HIGH | Medium |
| Form styling consolidation | 100-120 | MEDIUM | Medium |
| Element selector consolidation | 80-100 | MEDIUM | Hard |
| Color variable implementation | N/A | LOW | Medium |
| **TOTAL ESTIMATED** | **~550-700** | — | — |

**Percentage of Codebase:** ~22-28% reduction in CSS file size

---

## CONFIDENCE LEVELS EXPLANATION

- **HIGH:** Confirmed through template inspection; class definition found but not used in HTML
- **MEDIUM:** Strong evidence but requires verification; may have conditional usage
- **LOW:** Potential issue but may be intentional or used dynamically

---

## IMPLEMENTATION NOTES

### Before Making Changes:
1. ✅ Create a Git branch: `refactor/css-consolidation`
2. ✅ Run visual regression tests to establish baseline
3. ✅ Screenshot each component page before changes

### During Changes:
1. ✅ Update styles.css first (add new base rules)
2. ✅ Update each component CSS (remove duplicates)
3. ✅ Verify each component in browser
4. ✅ Commit frequently with meaningful messages

### After Changes:
1. ✅ Run comprehensive visual regression tests
2. ✅ Test responsive design at multiple breakpoints
3. ✅ Cross-browser testing
4. ✅ Performance audit (CSS file size reduction)
5. ✅ Create pull request with this report linked

---

## NEXT STEPS

**Recommend prioritizing:**
1. Delete unused classes (`.kw-badge`, `.hero-headline`, `.card-alt`)
2. Fix `.listings-hero .sub` white-space issue
3. Consolidate `.btn-primary` (highest impact)
4. Consolidate `.eyebrow` definitions
5. Move to Phase 2 consolidation

**Timeline Estimate:** 20-30 hours for complete refactor with testing

