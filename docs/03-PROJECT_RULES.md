# Arab Skills Bank — Project Development Rules

## Purpose

This document defines the engineering, design, and development rules for the Arab Skills Bank project.

Every implementation, feature, and design decision must follow these rules.

The goal is to maintain a clean, scalable, professional, and production-quality codebase.

---

# 1. Source of Truth

The official project documentation is the only source of truth.

Never change:

- Business Model
- Learning Hours Economy
- User Experience Philosophy
- AI Philosophy
- Operational Rules

If a better technical solution exists, propose it first before implementing it.

Never modify the project's philosophy.

---

# 2. Development Philosophy

Build the project as if it will become a real product after the Hackathon.

Prioritize:

- Maintainability
- Scalability
- Clean Code
- Simplicity
- Performance
- Accessibility

Never prioritize shortcuts over code quality.

---

# 3. Architecture

Always maintain a modular architecture.

Avoid tightly coupled code.

Keep business logic separate from UI.

Prefer reusable components.

Every feature should remain easy to extend.

---

# 4. UI Philosophy

The interface should feel:

- Premium
- Modern
- Minimal
- Clean
- Elegant
- Calm
- Professional

Avoid visual clutter.

Avoid unnecessary animations.

Whitespace is part of the design.

---

# 5. Design Consistency

Every screen must use the Design System.

Never create random colors.

Never create random spacing.

Never use different button styles.

Everything should remain visually consistent.

---

# 6. Typography

Arabic Font:

Alexandria

English Font:

Inter

Never replace these fonts without approval.

---

# 7. Colors

Use only the approved color palette.

Do not invent new colors.

Keep excellent contrast.

Support both Light and Dark Mode.

---

# 8. Components

Create reusable components whenever possible.

Avoid duplicated UI.

If multiple screens use the same component, create it once.

---

# 9. Code Quality

Use TypeScript everywhere.

Prefer readable code.

Avoid large files.

Avoid deeply nested components.

Prefer composition over duplication.

---

# 10. Performance

Always optimize for performance.

Use:

- Next.js Image
- Lazy Loading
- Dynamic Imports
- Server Components when appropriate

Avoid unnecessary rendering.

---

# 11. Accessibility

Every screen should support:

- Keyboard Navigation
- Focus States
- Semantic HTML
- Proper Contrast
- ARIA Labels

Accessibility is not optional.

---

# 12. Responsive Design

Every page must work perfectly on:

- Desktop
- Laptop
- Tablet
- Mobile

No horizontal scrolling.

No broken layouts.

---

# 13. Arabic First

The platform is currently Arabic-first.

English is postponed until the official launch.

Keep the architecture ready for multilingual support.

When users press the English button, display a professional "Coming Soon" modal.

Do not build English pages yet.

---

# 14. AI

AI exists to guide learners.

Never allow AI to manipulate choices.

Recommendations should focus on:

- Skills
- Learning Paths
- Educational Growth

Never recommend trainers because of popularity.

---

# 15. Learning Hours Economy

This is the core innovation of the platform.

Every screen should reinforce this concept.

Never treat learning hours like a marketing gimmick.

Users purchase learning time—not courses.

---

# 16. Fairness

Trainer equality is a fundamental principle.

Never display:

- Best Seller
- Most Popular
- Top Rated
- Student Count Rankings

Do not bias learners toward specific instructors.

---

# 17. User Experience

Reduce friction.

Keep every interaction simple.

Avoid unnecessary steps.

Always think:

"What is the easiest experience for the learner?"

---

# 18. Business Logic

Do not place business logic inside UI components.

Separate:

- UI
- Services
- Data
- Utilities

Keep responsibilities clear.

---

# 19. Comments

Only write comments when they improve understanding.

Avoid obvious comments.

Prefer self-explanatory code.

---

# 20. Before Every New Feature

Before implementing any feature, ask yourself:

- Does it respect the project philosophy?
- Does it improve the user experience?
- Can it be reused?
- Is it maintainable?
- Is it scalable?
- Is it simple?

If the answer is "No", rethink the implementation.

---

# 21. Final Goal

The objective is not simply to complete a prototype.

The objective is to build a product that feels launch-ready.

Every screen should reflect quality.

Every interaction should feel intentional.

Every line of code should be maintainable.

Think like a Senior Software Engineer building the future of Arab Skills Bank.