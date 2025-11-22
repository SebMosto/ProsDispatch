# UX-Responsive-01

## UX Pattern: Responsive Design (Mobile-First & Progressive Enhancement)

**Pattern Code:** UX-Responsive-01  
**Title:** Mobile-First Responsive Design for MVP1  
**Last Updated:** Nov 22, 2025

### Intent & Scope

This pattern governs the responsive design approach for the Dispatch MVP1 user interfaces. It ensures a consistent, optimized experience across mobile, tablet, and desktop devices. The design philosophy is **mobile-first**, with progressive enhancement for larger screens. All feature UIs developed in MVP1 must follow these guidelines unless explicitly exempted (e.g., admin portal exceptions noted below).

The goal is to guarantee that the core user (a contractor often on a job site, using a smartphone) has full functionality and a smooth experience, while also accommodating users on tablets or desktops with appropriate layout improvements. By codifying this, we avoid desktop-centric designs that break on mobile, and we prevent neglecting larger screens where simple enhancements can improve usability.

### Mobile-First Design Mandate

* **Primary Breakpoint – Mobile:** Design starting with a small viewport (\~360–414px width, typical of modern smartphones). All content and actions must fit within a narrow vertical layout. This means using a single-column flow, large touch-friendly buttons, readable font sizes (at least 16px base), and avoiding any hover-dependent interactions (since touchscreens may not have hover).

* **Content Priority:** On mobile, screen real estate is limited. Prioritize content that the user needs to see or interact with first; hide or defer less important info. Use progressive disclosure (collapsing sections, accordions) to keep screens manageable. For example, on a job detail view, show essential info (job title, status, assigned contractor) prominently, and perhaps tuck extended details (description, history) into expandable sections.

* **Performance on Mobile:** Mobile devices may have slower connections – optimize assets (use compressed images, minimal third-party scripts) to ensure quick loads. Also, aim for minimal reflows: heavy animations or large DOM updates can feel janky on low-end phones. The pattern is to favor simple, CSS-driven animations over JS-heavy ones for performance.

### Progressive Enhancement for Tablet/Desktop

* **Adaptive Layout:** For intermediate viewports (tablet, small laptop \~768px to \~1200px), leverage the extra space. This can mean switching to a two-column layout, revealing a sidebar navigation, or showing additional details that were hidden on mobile. *However, do not require a larger screen to access core functionality.* Everything a user can do on desktop, they must also be able to do on mobile (even if via more taps or navigation).

* **Consistency:** Maintain the same information architecture. The navigation structure shouldn't completely change between mobile and desktop. For instance, if the mobile uses a hamburger menu for navigation, the desktop might show a navbar – but the sections and hierarchy remain identical. Users should not have to "re-learn" the UI when switching devices.

* **Constrained Width on Large Screens:** Avoid ultra-wide layouts that become hard to read. Even on desktop, constrain content to a reasonable max width (e.g., \~1200px center container) so that text isn't in long lines across a huge monitor. This improves readability. The design can simply center the content with margins at very large sizes. We're not optimizing for multi-column dashboard views beyond what's necessary; the app will mostly look like a centered web app on big screens, which is acceptable for MVP.

* **Additional Enhancements:** On desktop, it's acceptable to add minor conveniences that wouldn't fit on mobile, like hover tooltips for truncated text or displaying labels next to icons (where on mobile maybe only icons show to save space). These should *enhance* usability but not introduce entirely new controls or flows. Progressive enhancement means the experience gets better on bigger screens, but it's never broken or substantially different on smaller ones.

### Responsive Components & Implementation Guidelines

* **Grid and Flex Layouts:** Use CSS flexbox/grid to create fluid layouts that automatically adjust. Define components in a mobile-friendly way (often full-width) and then add media query breakpoints (@media (min-width: X)) to reposition or size them for larger screens. For example, a list of jobs might be a vertical stack on mobile, but on tablet you might use a grid with two columns if space allows.

* **Typography Scaling:** Use relative units (rem/em) for font sizes and spacing, so things scale reasonably with device settings. On mobile, ensure text isn't too small. On desktop, avoid gigantic text stretching across; you might slightly increase font-size for headings on larger screens for balance. The Tailwind CSS utilities and design tokens should include responsive variants (like text-lg md:text-xl to use larger text on medium screens and up).

* **Navigation Patterns:**

* Mobile: likely a hamburger menu or bottom tab bar for primary navigation. Ensure the tap targets are large (44px by 44px at least). Use a fixed bottom nav if appropriate for quick access, or a top burger \+ menu drawer for a more complex menu.

* Tablet/Desktop: a persistent sidebar or top nav bar can be used since there's room. For example, a sidebar menu listing all sections could be visible on a tablet in landscape or desktop, whereas that menu collapses into the hamburger on mobile. Use the same icons and labels to avoid confusion.

* **Forms and Modals:** Forms should be single-column on mobile. Input fields should stretch to full width of the screen. For multi-step processes, consider a wizard or stacked cards that the user can swipe/scroll through rather than a wide form. On desktop, you might show multi-column forms if it doesn't hurt clarity, but often one column is still fine for simplicity. Modals (pop-ups) on mobile must occupy a large portion of the screen (possibly full-screen dialogs) to be usable, while on desktop they can be smaller windows. Always ensure modals on mobile are easily scrollable and not fixed to a height that could overflow.

* **Tables and Data Display:** If any tabular data is present (lists of payments, etc.), design it to be mobile-friendly: either make the table horizontally scrollable with clear indications, or transform each row into a card view (where rows stack as blocks with label-value pairs). For larger screens, the full table layout can be shown. For MVP1 specifically, we expect minimal tabular data, but any that exists should follow this rule.

### Admin Portal Exception – Desktop-First

* **Rationale:** The admin interface is primarily used by internal staff, likely on desktops. We allow the admin UI to be optimized for desktop screens first (wider layout, lots of data on one screen). However, since this is a single codebase, we still must ensure it degrades on mobile (i.e., it doesn't break completely if opened on a phone).

* **What's Allowed:** Admin pages can use complex tables or multi-column layouts that would be awkward on a phone. It's acceptable if using them on a phone is not ideal, but basic viewing should work (e.g., you might need to scroll horizontally to see a whole table – that's okay for admin). We won't invest significant time in perfecting admin UX for mobile.

* **Minimum Mobile Support for Admin:** Critical admin functions (if any) should at least be possible on mobile in an emergency. For instance, if there's an "ban user" button only on an admin page, ensure that page can load on mobile and the button is reachable (even if the layout is not pretty). This typically means using standard HTML/CSS that naturally stacks on a narrow screen, rather than something completely unusable like a fixed-size pixel grid. In summary, **graceful degradation**: it works, but not necessarily elegantly.

* We explicitly mark in documentation which screens are Admin-only and thus exempt from strict mobile-first polish, so QA knows when a mobile issue on admin is tolerable (or at least lower priority) versus when it's a real bug.

### Validation & Testing

* **Cross-Device Testing:** Every user story is considered done only after testing on common device sizes: e.g. iPhone 12/13 size (\~390px width), a mid-size Android (\~411px), iPad (\~768px and 1024px), and a typical desktop width (\~1440px). We will catch issues like elements off-screen, wrapping oddities, or excessively stretched components this way. Test with both English and French UI, as French often expands UI and could cause mobile layout issues.

* **No Horizontal Scroll:** A guiding rule – on any page, at any supported width, horizontal scrolling (except within intentionally scrollable containers like data tables) is a **bug**. The presence of an unintended horizontal scrollbar is usually a sign something is too wide (an image, a long word, a fixed-width element). It must be fixed (often by adding flex-wrap, max-width, or adjusting margins). This is considered a P0-level issue for mobile and should be caught by our CI screenshot tests or dev testing.

* **Responsive Units:** Use relative CSS units (%, flex, or viewport units) instead of absolute pixel widths wherever possible so that layouts naturally adapt. If an element's width is set in px and doesn't shrink on a smaller screen, that's likely a bug. Our CSS guidelines (enforced by stylelint) may flag excessive fixed dimensions.

* **Font Legibility:** On small devices, ensure text is legible without pinch-zoom. This means avoid tiny fonts; 1rem (16px) is generally the smallest for body text. Also, allow the user's accessibility settings (like larger text) to still work – don't lock font sizes by using px for fonts. We test by enabling larger text in OS settings to see if the app scales properly.

* **Touch Target Checks:** All interactive controls (buttons, links, icons) should be easy to tap on a phone. We enforce a minimum hit area of \~44px in CSS (even if the visual icon is smaller, padding makes the clickable area bigger). This will be manually checked and also can be audited via Axe (touch target size recommendations).

* **Orientation and Platform Quirks:** Test on both portrait and landscape orientations for mobile. Particularly, ensure that in landscape (which is a shorter height), modals or forms still scroll and are usable (mobile landscape can surface issues with fixed elements occupying too much vertical space). Also test on both iOS Safari and Android Chrome for any differences (like form input zoom on iOS if font \<16px, which we avoid by using \>=16px fonts).

### Accessibility Considerations in Responsive Design

Responsive design isn't just visual – it affects accessibility too:  
\- Ensure that reflowing content (especially when using CSS order changes for different layouts) still makes sense in the DOM order for screen readers. Don't rely solely on visual positioning that might confuse a non-visual user.  
\- On mobile, the screen reader experience is linear (swipe through elements). Make sure important information or actions aren't buried too deep. The structured headings and regions should follow the mobile layout order (which they naturally will if we code mobile-first).  
\- No content should be hidden in a way that only sighted desktop users can find it. E.g., avoid "on hover show more info" without another way to access that info on touch devices. Provide an alternative like "tap to reveal" or always visible icon.  
\- Test with screen reader on mobile (VoiceOver or TalkBack) to ensure the navigation order follows the intended flow.

### Conclusion

By following **UX-Responsive-01**, we ensure Dispatch MVP1 delivers a **great mobile experience** (crucial for on-the-go contractor users), while still being fully functional and user-friendly on larger screens. This pattern will be revisited as the product grows, but for MVP1 these rules set a strong baseline. All design and code reviews include a check against these guidelines. Non-compliance is treated as a design bug. The end result should be an interface that "just works" wherever the user accesses it – mobile in hand, tablet in a truck, or desktop at the office – with no frustration or broken layouts.
