# Sidequest

A responsive single-page guide to eight fictional New York City events. Built with React, TypeScript, Tailwind CSS, Framer Motion, and Vite.

## Run locally

Use Node.js 22.12 or newer and npm.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. To type-check and create the static production bundle, run `npm run build`. Serve the bundle with `npm run preview`.

## Event listings

Edit `src/data/events.json` to change the listings. Each entry includes an ISO date, a local event time, a USD price, a venue, and a path to a photograph in `public/images`. A price of zero means free admission. Dates in this edition span November and December 2026. Relative date filters use the visitor’s current calendar day.

## Interactions

Search by event, venue, neighborhood, or tag. Combine date, category, price, and free-admission filters. Open an event for details, or bookmark it to revisit in the saved-events drawer. Bookmarks and the theme preference are stored in the browser. Swipe or drag the featured ticket horizontally to change events. A tap opens its details, and vertical gestures scroll the page. The title, stamp, filters, and bookmarks animate on both desktop and mobile, following the visitor’s reduced-motion preference.

Event cards tilt toward a desktop pointer. On touch devices and narrow screens, they tilt with scrolling and face forward at the center of the viewport. Reduced-motion preferences keep the cards flat.

Ctrl+K (Command+K on Mac) focuses search. Use the left and right arrow keys on the featured ticket to change slides. Use the arrow keys in filter choices and Escape to dismiss an open menu or dialog. All data, imagery, and fonts are bundled locally.
