import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Redline — Context-Dependent AI Compliance Test Bench',
  description: 'Deterministic compliance test bench evaluating conversational AI debt collection agents for context-dependent compliance under FDCPA & Regulation F.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&family=Public+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-canvas text-slate-100 min-h-screen flex flex-col selection:bg-white selection:text-slate-950">
        {children}
      </body>
    </html>
  );
}
