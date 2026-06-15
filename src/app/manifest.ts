
import { MetadataRoute } from 'next';

/**
 * Generates the web manifest for PWA support.
 * This allows the web app to be "installed" on mobile devices.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SRM Club Hub',
    short_name: 'SRM Hub',
    description: 'The futuristic hub for SRM Welkin community collaboration and AI-powered meeting recaps.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#4f46e5',
    icons: [
      {
        src: 'https://picsum.photos/seed/srm192/192/192',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'https://picsum.photos/seed/srm512/512/512',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
