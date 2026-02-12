## 4. Frontend Design System & Guidelines (ProsDispatch)

## 1. Design Principles
### Core Principles
- **Clarity**: Interfaces are designed for high-contrast visibility and direct action.
- **Consistency**: "Dispatch Voice" and "Anti-Generic" aesthetic applied uniformly.
- **Efficiency**: "No training seminars" required; intuitive flows.
- **Accessibility**: High contrast ratios and clear focus states.

## 2. Design Tokens

### Color Palette

#### Primary Colors
*Based on HSL(17, 100%, 55%)*
- `--color-primary-50`: #FFF1EC
- `--color-primary-100`: #FFE4DB
- `--color-primary-200`: #FFC5B3
- `--color-primary-300`: #FFA68A
- `--color-primary-400`: #FF8761
- `--color-primary-500`: #FF5C1B  /* Main Brand Orange */
- `--color-primary-600`: #FF451A
- `--color-primary-700`: #CC2E00
- `--color-primary-800`: #A32400
- `--color-primary-900`: #7A1B00

#### Neutral Colors
*Based on Slate/Zinc (Cool Grays)*
- `--color-neutral-50`: #F8FAFC
- `--color-neutral-100`: #F1F5F9
- `--color-neutral-200`: #E2E8F0
- `--color-neutral-300`: #CBD5E1
- `--color-neutral-400`: #94A3B8
- `--color-neutral-500`: #64748B
- `--color-neutral-600`: #475569
- `--color-neutral-700`: #334155
- `--color-neutral-800`: #1E293B
- `--color-neutral-900`: #0F172A

#### Semantic Colors
- **Success**: `#16A34A` (HSL 142 76% 36%)
- **Warning**: `#F59E0B` (Amber-500)
- **Error/Destructive**: `#EF4444` (HSL 0 84% 60%)
- **Info**: `#3B82F6` (Blue-500)
- **Safety Orange**: `#FF5C1B`

### Typography

#### Font Families
- `--font-sans`: 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'
- `--font-display`: '"Playfair Display"', 'Georgia', 'serif'
- `--font-mono`: 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'

#### Font Sizes
- `--text-xs`: 0.75rem (12px)
- `--text-sm`: 0.875rem (14px)
- `--text-base`: 1rem (16px)
- `--text-lg`: 1.125rem (18px)
- `--text-xl`: 1.25rem (20px)
- `--text-2xl`: 1.5rem (24px)
- `--text-3xl`: 1.875rem (30px)
- `--text-4xl`: 2.25rem (36px)

#### Font Weights
- `--font-normal`: 400
- `--font-medium`: 500
- `--font-semibold`: 600
- `--font-bold`: 700

### Spacing Scale
*Standard Tailwind Scale*
- `--spacing-0`: 0px
- `--spacing-1`: 0.25rem (4px)
- `--spacing-2`: 0.5rem (8px)
- `--spacing-4`: 1rem (16px)
- `--spacing-6`: 1.5rem (24px)
- `--spacing-8`: 2rem (32px)
- `--spacing-12`: 3rem (48px)
- `--spacing-16`: 4rem (64px)

### Border Radius
- `--radius-sm`: calc(0.75rem - 4px)
- `--radius-md`: calc(0.75rem - 2px)
- `--radius-lg`: 0.75rem (12px)
- `--radius-full`: 9999px

### Shadows
- `--shadow-sm`: 0 1px 2px 0 rgba(0, 0, 0, 0.05)
- `--shadow-brutal`: 4px 4px 0 0 rgba(15, 23, 42, 0.9)
- `--shadow-brutal-success`: 4px 4px 0 0 rgba(22, 101, 52, 0.9)
- `--shadow-glow`: 0 0 0 2px rgba(255, 92, 27, 0.35), 6px 6px 0 0 rgba(255, 122, 60, 0.35)

## 3. Layout System

### Grid System
- **Container**: `max-width: 1400px`, `padding: 2rem`
- **Columns**: 12-column grid
- **Gutters**: `gap-4` (1rem) or `gap-6` (1.5rem)

### Responsive Breakpoints
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1400px

## 4. Component Library

### Button
**Primary Button**
```html
<button class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
  Primary Action
</button>
```

**Secondary Button**
```html
<button class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2">
  Secondary Action
</button>
```

**Destructive Button**
```html
<button class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-10 px-4 py-2">
  Delete
</button>
```

### Input Fields
**Text Input**
```html
<input
  type="text"
  class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
  placeholder="Enter text..."
/>
```

### Cards
**Standard Card**
```html
<div class="rounded-lg border bg-card text-card-foreground shadow-sm">
  <div class="flex flex-col space-y-1.5 p-6">
    <h3 class="text-2xl font-semibold leading-none tracking-tight">Card Title</h3>
    <p class="text-sm text-muted-foreground">Card Description</p>
  </div>
  <div class="p-6 pt-0">
    Card Content
  </div>
  <div class="flex items-center p-6 pt-0">
    Card Footer
  </div>
</div>
```

**Brutalist Card**
```html
<div class="rounded-lg border bg-card text-card-foreground shadow-brutal">
  <!-- Content -->
</div>
```

### Modals
**Dialog Structure**
```html
<div class="fixed inset-0 z-50 flex items-center justify-center">
  <!-- Overlay -->
  <div class="fixed inset-0 z-50 bg-black/80"></div>

  <!-- Content -->
  <div class="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg sm:rounded-lg duration-200">
    <div class="flex flex-col space-y-1.5 text-center sm:text-left">
      <h2 class="text-lg font-semibold leading-none tracking-tight">Modal Title</h2>
      <p class="text-sm text-muted-foreground">Modal Description</p>
    </div>

    <div>Modal Content</div>

    <div class="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
      <button class="...">Cancel</button>
      <button class="...">Confirm</button>
    </div>

    <!-- Close Button -->
    <button class="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
      <span class="sr-only">Close</span>
      <!-- Icon -->
    </button>
  </div>
</div>
```

## 5. Accessibility Guidelines
- **WCAG Level**: AA Recommended.
- **Focus**: Visible `ring-2` outline on all interactive elements.
- **Contrast**: `foreground` (#161B28) on `background` (#F2F5F9) passes 7:1 ratio.
- **Screen Readers**: Use `sr-only` for icon buttons; ensure forms have associated labels.

## 6. Animation Guidelines
- **Transitions**: `transition-colors`, `transition-opacity`, `transition-transform` used frequently.
- **Duration**: Fast (0.2s - 0.5s).
- **Easing**: `ease-out` for entering elements.
- **Keyframes**:
  - `fade-in`: opacity 0 -> 1, translate-y 10px -> 0
  - `accordion-down`: height 0 -> content-height

## 7. Icon System
- **Library**: Lucide React
- **Sizes**:
  - `w-4 h-4` (16px) - Small/Inline
  - `w-6 h-6` (24px) - Standard UI
- **Stroke**: 2px default

## 8. State Indicators
### Loading
```html
<!-- Spinner -->
<svg class="animate-spin h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
</svg>
```

### Error
```html
<div role="alert" class="relative w-full rounded-lg border border-destructive/50 p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 text-destructive dark:border-destructive [&>svg]:text-destructive">
  <h5 class="mb-1 font-medium leading-none tracking-tight">Error</h5>
  <div class="text-sm [&_p]:leading-relaxed">Something went wrong.</div>
</div>
```

## 9. Responsive Design
- **Mobile-First**: Styles are applied for mobile by default (e.g., `w-full`).
- **Tablet (md)**: Adjusts inputs to `text-sm`, layouts to grids.
- **Desktop (lg)**: Sidebar layouts, multi-column grids.

## 10. Performance Guidelines
- **Image Optimization**: Use WebP, explicit width/height.
- **Code Splitting**: Lazy load heavy routes/components.
- **Animation**: Animate `opacity` and `transform` only.

## 11. Browser Support
- **Supported**: Chrome, Firefox, Safari, Edge (last 2 versions).
- **Progressive Enhancement**: Layouts function without JS; interactivity enhances experience.
