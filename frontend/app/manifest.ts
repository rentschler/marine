import type { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AVA25 group4',
    short_name: 'MARINE',
    description: 'MARINE Analytics for Radio Interception and Naval Environment',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.pn',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}