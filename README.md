# MapToPoster

Create beautiful, minimalist map posters for any city in the world.

## Features

- Interactive map with real-time preview
- 9 color themes (Noir, Midnight Blue, Sunset, Blueprint, Japanese Ink, Ocean, Forest, Warm Beige, Cyberpunk)
- Search for any city worldwide
- Click anywhere on the map to select a location
- Export as high-resolution PNG or SVG
- Responsive design for desktop and mobile

## Getting Started

### Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## Deployment

This app is ready for deployment on [Vercel](https://vercel.com):

1. Push to GitHub
2. Import the repository on Vercel
3. Deploy

## Tech Stack

- [Next.js](https://nextjs.org/) - React framework
- [MapLibre GL](https://maplibre.org/) - Interactive maps
- [OpenFreeMap](https://openfreemap.org/) - Map tiles
- [Nominatim](https://nominatim.org/) - Geocoding
- CSS Modules - Styling

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── globals.css       # CSS variables
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Main page
│   ├── components/
│   │   ├── Sidebar/          # App sidebar
│   │   ├── SearchInput/      # City search
│   │   ├── LocationInfo/     # Location details
│   │   ├── ThemeGrid/        # Theme selector
│   │   ├── ExportButtons/    # Export controls
│   │   ├── MapPoster/        # Map visualization
│   │   └── LoadingSpinner/   # Loading indicator
│   └── lib/
│       ├── themes.ts         # Theme definitions
│       ├── mapStyle.ts       # MapLibre style
│       └── types.ts          # TypeScript types
├── public/                   # Static assets
└── package.json
```

## License

MIT
