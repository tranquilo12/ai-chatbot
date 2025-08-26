# Chat App Design Language

## Overview

This document defines the design language and visual system for our AI chat application. It serves as the single source of truth for all design decisions and should be referenced for any future UI/UX modifications.

## Core Design Principles

### 1. **Dark-First Design**
- **Primary Theme**: Dark mode is the default and primary experience
- **Color Philosophy**: Deep, rich backgrounds with high-contrast text
- **Visual Hierarchy**: Uses contrast and subtle gradients rather than bright colors
- **Accessibility**: Maintains WCAG AA contrast ratios throughout

### 2. **Minimalism & Clean Interface**
- **Visual Noise**: Eliminate unnecessary elements and decorations
- **White Space**: Generous use of negative space for breathing room
- **Typography**: Clean, readable fonts with consistent hierarchy
- **UI Elements**: Simple, functional components without excessive styling

### 3. **High Contrast Visual Elements**
- **Text Contrast**: Strong contrast between text and backgrounds
- **Interactive Elements**: Clear visual feedback on hover/focus states
- **Borders**: Subtle but defined boundaries between sections
- **Status Indicators**: High-contrast colors for important states

### 4. **Fluid & Responsive Animations**
- **Micro-interactions**: Subtle animations for user feedback
- **Transitions**: Smooth state changes (200-300ms duration)
- **Performance**: Hardware-accelerated animations using CSS transforms
- **Purpose**: Animations serve functional purposes, not decoration

## Technical Foundation

### UI Framework
- **Component Library**: shadcn/ui
- **Styling**: Tailwind CSS with custom CSS variables
- **Icons**: Lucide React for consistent iconography
- **Animations**: Framer Motion for complex animations

### Color System
```css
/* Dark Theme Variables */
--background: 222.2 84% 4.9%;           /* Deep dark background */
--foreground: 210 40% 98%;              /* High contrast text */
--muted: 217.2 32.6% 17.5%;             /* Subtle backgrounds */
--muted-foreground: 215 20.2% 65.1%;    /* Secondary text */
--border: 217.2 32.6% 17.5%;            /* Subtle borders */
--accent: 217.2 32.6% 17.5%;            /* Accent elements */
```

### Typography Scale
- **Base Size**: 14px (text-sm) for body text
- **Headings**: Reduced scale for compact display
  - H1: text-xl (20px)
  - H2: text-lg (18px)  
  - H3: text-base (16px)
  - H4: text-sm (14px)
- **Font Weight**: Semibold for headings, normal for body
- **Line Height**: Tight leading for compact text

## Layout Architecture

### 3-Panel Structure

```
┌─────────────┬──────────────────────┬─────────────┐
│   Sidebar   │    Chat Interface    │ Right Panel │
│ (Collapsible)│  ┌─────────────────┐  │ (Resizable) │
│             │  │     Header      │  │             │
│             │  ├─────────────────┤  │             │
│             │  │    Messages     │  │   Controls  │
│             │  ├─────────────────┤  │   & Tools   │
│             │  │     Input       │  │             │
│             │  └─────────────────┘  │             │
└─────────────┴──────────────────────┴─────────────┘
```

### Panel Specifications

#### Left Panel: Sidebar
- **Purpose**: Navigation, chat history, user controls
- **Width**: Collapsible (0px collapsed, ~280px expanded)
- **Padding**: `--sidebar-padding-x: 1.5rem` (24px)
- **Background**: Slightly darker than main background
- **Content**: Chat history, user profile, settings

#### Center Panel: Main Chat Interface
- **Purpose**: Primary chat interaction area
- **Width**: Flexible, responds to sidebar and right panel
- **Structure**: Header → Messages → Input (fixed order)
- **Padding**: `--chat-padding-x: 1.5rem` left, `--chat-padding-right: 4rem` right

#### Right Panel: Control Panel
- **Purpose**: Chat width controls, future tool integrations
- **Width**: Resizable (10-70% of remaining space)
- **Default**: 30% of total width
- **Background**: Subtle muted background
- **Content**: Resizing controls, preset buttons

### Spacing System

#### CSS Custom Properties
```css
:root {
  /* Main content padding - consistent across all panels */
  --chat-padding-x: 1.5rem;        /* 24px - left padding */
  --chat-padding-right: 4rem;      /* 64px - right padding for drag handle */
  --chat-padding-y: 1rem;          /* 16px - vertical padding */
  
  /* Sidebar padding */
  --sidebar-padding-x: 1.5rem;     /* 24px - sidebar horizontal */
  --sidebar-padding-y: 1rem;       /* 16px - sidebar vertical */
  
  /* Header padding */
  --header-padding-x: 1.5rem;      /* 24px - header horizontal */
  --header-padding-y: 0.375rem;    /* 6px - header vertical */
}
```

#### Utility Classes
- `.chat-container-padding` - Main content areas
- `.sidebar-container-padding` - Sidebar content
- `.header-container-padding` - Header elements
- `.chat-main-container` - Main chat wrapper
- `.prevent-x-overflow` - Overflow prevention

### Message Spacing
- **Between Messages**: `gap-4` (16px)
- **Within Message Content**: `gap-2` (8px)
- **Text Elements**: Tight spacing with custom prose classes
- **Paragraphs**: 0.5rem top/bottom margins
- **Lists**: 0.25rem between items

## Component Design Patterns

### Interactive Elements
- **Buttons**: Rounded corners, subtle hover states
- **Input Fields**: Minimal borders, focus ring indicators
- **Hover States**: Subtle background color changes
- **Active States**: Slightly darker backgrounds

### Message Design
- **User Messages**: Right-aligned, primary background
- **AI Messages**: Left-aligned, default background
- **Code Blocks**: Monospace font, muted background with borders
- **Inline Code**: Subtle background, small padding

### Navigation Elements
- **Sidebar Items**: Hover states, active indicators
- **Menu Items**: Consistent padding, clear hierarchy
- **Breadcrumbs**: Minimal, high contrast

## Animation Guidelines

### Timing Functions
- **Standard**: `ease-out` for most transitions
- **Duration**: 200-300ms for UI feedback
- **Complex**: Framer Motion spring animations for panels

### Animation Types
- **Hover Effects**: Subtle background/color changes
- **Panel Transitions**: Smooth resize animations
- **Loading States**: Subtle pulse or fade effects
- **Scroll Indicators**: Smooth appearance/disappearance

## Responsive Behavior

### Breakpoints
- **Mobile**: < 768px (sidebar collapses)
- **Tablet**: 768px - 1024px (adjusted padding)
- **Desktop**: > 1024px (full 3-panel layout)

### Mobile Adaptations
- Sidebar becomes overlay/drawer
- Right panel may be hidden or become modal
- Reduced padding on smaller screens
- Touch-friendly interactive elements

## Content Guidelines

### Text Formatting
- **Markdown Support**: Full markdown rendering with custom styles
- **Code Highlighting**: Syntax highlighting for code blocks
- **Lists**: Consistent bullet points and numbering
- **Links**: High contrast, underlined, external indicators

### Message Flow
- **Compact Display**: Reduced spacing for information density
- **Readability**: Maintained through contrast and typography
- **Scanning**: Clear visual hierarchy for quick reading

## Accessibility Standards

### Contrast Requirements
- **Text**: Minimum 4.5:1 contrast ratio
- **Interactive Elements**: Clear focus indicators
- **Color Independence**: Information not conveyed by color alone

### Keyboard Navigation
- **Tab Order**: Logical flow through interface
- **Focus Management**: Clear focus indicators
- **Shortcuts**: Standard keyboard shortcuts supported

### Screen Reader Support
- **Semantic HTML**: Proper heading hierarchy
- **ARIA Labels**: Descriptive labels for complex elements
- **Live Regions**: Dynamic content announcements

## Future Considerations

### Extensibility
- **Plugin Architecture**: Right panel ready for tool integrations
- **Theme System**: CSS variables allow easy theme switching
- **Component Library**: shadcn/ui provides consistent expansion path

### Performance
- **Lazy Loading**: Messages and components load as needed
- **Animation Performance**: Hardware acceleration preferred
- **Bundle Size**: Minimal dependencies, tree-shaking enabled

### Customization
- **CSS Variables**: Easy color and spacing adjustments
- **Component Props**: Flexible component configurations
- **Layout Options**: Panel sizing and visibility controls

---

## Implementation Notes

This design language is implemented through:
1. **CSS Custom Properties** in `app/globals.css`
2. **Utility Classes** for consistent spacing
3. **Component Structure** following 3-panel architecture
4. **shadcn/ui Components** for consistent UI elements

All future modifications should reference this document to maintain design consistency and user experience quality.
