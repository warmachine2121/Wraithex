import './globals.css';

export const metadata = {
  title: 'WRAITHEX — Live Crypto Prices',
  description: 'Real-time cryptocurrency market data with privacy scoring. Move like a wraith. Leave no trace.',
  keywords: 'crypto, cryptocurrency, bitcoin, monero, XMR, privacy, live prices, dashboard',
  openGraph: {
    title: 'WRAITHEX — Live Crypto Prices',
    description: 'Real-time crypto prices with XMR privacy scoring. Move like a wraith. Leave no trace.',
    type: 'website',
    url: 'https://wraithex.xyz',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WRAITHEX — Live Crypto Prices',
    description: 'Real-time crypto prices with XMR privacy scoring. Move like a wraith. Leave no trace.',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Bebas+Neue&family=Rajdhani:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
