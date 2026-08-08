import { useEffect, useMemo, useState } from 'react';

const CATEGORY_STYLES = {
  Accessories: ['#f7efe2', '#c97b42', '#3b2216'],
  Clothes: ['#f0e9df', '#627a97', '#1f2f42'],
  Glasses: ['#eef2f6', '#3f5268', '#0f1720'],
  Jewelry: ['#f8f0de', '#bb9250', '#50351d'],
  Makeup: ['#fff1ee', '#d96c73', '#5b2633'],
  Shoes: ['#eff1f4', '#64748b', '#162033'],
  default: ['#f3ede3', '#8b7357', '#2f2418'],
};

function toDataUri(value) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(value)}`;
}

function buildFallbackSvg(product) {
  const [backgroundStart, backgroundEnd, accent] =
    CATEGORY_STYLES[product.category] || CATEGORY_STYLES.default;
  const productName = product.name || 'Fitsy Product';
  const badge = product.badge || product.category || 'Fitsy';
  const category = (product.category || 'Product').toUpperCase();

  return toDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1200">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${backgroundStart}" />
          <stop offset="100%" stop-color="${backgroundEnd}" />
        </linearGradient>
        <linearGradient id="glow" x1="0.15" y1="0.2" x2="0.9" y2="0.8">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.8" />
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
        </linearGradient>
      </defs>
      <rect width="1200" height="1200" rx="72" fill="url(#bg)" />
      <circle cx="950" cy="250" r="260" fill="url(#glow)" />
      <rect x="90" y="92" width="300" height="82" rx="41" fill="#fffaf4" fill-opacity="0.95" />
      <text x="240" y="144" font-size="34" text-anchor="middle" fill="${accent}" font-family="Georgia, serif">${badge}</text>
      <text x="110" y="910" font-size="42" fill="#fffaf4" fill-opacity="0.92" letter-spacing="10" font-family="Arial, sans-serif">${category}</text>
      <text x="110" y="1000" font-size="84" fill="#fffaf4" font-weight="700" font-family="Georgia, serif">${productName}</text>
      <text x="110" y="1060" font-size="36" fill="#fffaf4" fill-opacity="0.8" font-family="Arial, sans-serif">Image preview unavailable. Fallback artwork is shown instead.</text>
      <rect x="120" y="240" width="960" height="520" rx="54" fill="rgba(255,255,255,0.14)" stroke="rgba(255,255,255,0.22)" stroke-width="4" />
      <path d="M280 625C355 470 445 392 560 392C685 392 760 470 832 625" fill="none" stroke="#fffaf4" stroke-opacity="0.75" stroke-width="44" stroke-linecap="round"/>
      <circle cx="560" cy="360" r="82" fill="#fffaf4" fill-opacity="0.85" />
      <rect x="490" y="450" width="140" height="170" rx="44" fill="#fffaf4" fill-opacity="0.72" />
    </svg>
  `);
}

export default function ProductImage({ product, src, alt, className, ...rest }) {
  const fallbackSrc = useMemo(() => buildFallbackSvg(product || {}), [product]);
  const [currentSrc, setCurrentSrc] = useState(src || fallbackSrc);

  useEffect(() => {
    setCurrentSrc(src || fallbackSrc);
  }, [src, fallbackSrc]);

  return (
    <img
      {...rest}
      src={currentSrc}
      alt={alt}
      className={className}
      onError={() => setCurrentSrc(fallbackSrc)}
    />
  );
}
