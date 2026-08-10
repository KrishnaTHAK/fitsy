import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Star, Camera, ShieldCheck, Zap, Layers, RefreshCw } from 'lucide-react';
import { useProducts } from '../context/ProductsContext';
import GarmentTryOn from '../components/GarmentTryOn';

export default function Home() {
  const { products } = useProducts();
  const navigate = useNavigate();

  const [activeTryOnProduct, setActiveTryOnProduct] = useState(null);

  const featuredProducts = products.slice(0, 6);
  const heroProduct = products[0] || products[10];

  return (
    <div className="bg-surface text-on-surface flex flex-col min-h-screen">
      {/* ─── Hero Section (High-Resolution Original Model) ─────────────── */}
      <section className="relative w-full h-[716px] min-h-[600px] flex items-center justify-center overflow-hidden bg-surface">
        <div className="absolute inset-0 z-0">
          <div
            className="w-full h-full bg-cover bg-center bg-no-repeat opacity-100"
            style={{
              backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuDAXL8lX_oRdUx-dM9aXz4y_Ap7OdsCdgJIO_JQa-7Q3kMX8a7-3YDVKUjVs340_Yxpy--Zpx7JJXZMeS2_tBy1eAY5Uc_MQ5BRdYqjYnSWSnnV1VFXTIxm5wDYHji7hENo8THQo2SzLxOcemBZ__esWvi1wi_HzWD7qGGDVm6nzdDwJ8Gw28tBt_-PZLqUL-0-n14y4Nr126AtT0uBCLQKIYL82vZb6GeXjU9zKsMuVydU5hmtDy-s=s2560')`,
              imageRendering: '-webkit-optimize-contrast',
              filter: 'contrast(1.04) brightness(1.02)',
            }}
          />
          {/* Subtle gradient overlay to keep character crisp on right & text legible on left */}
          <div className="absolute inset-0 bg-gradient-to-r from-surface via-surface/75 via-40% to-transparent" />
        </div>

        <div className="relative z-10 w-full max-w-container-max mx-auto px-4 md:px-margin-desktop flex flex-col items-start justify-center h-full">
          <div className="max-w-xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-sans text-on-surface mb-6 leading-tight tracking-tight">
              Try Before You Buy.
            </h1>

            <p className="text-lg text-on-surface-variant mb-10 max-w-md leading-relaxed">
              Experience the future of premium fashion. Our AI-driven virtual fitting room ensures the perfect look, every time.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                to="/catalog"
                className="bg-primary text-white px-8 py-4 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center"
              >
                Explore Products
              </Link>

              <button
                onClick={() => setActiveTryOnProduct(heroProduct)}
                className="border-2 border-primary text-primary bg-surface/50 backdrop-blur-sm px-8 py-4 rounded-xl text-sm font-semibold hover:bg-primary hover:text-white transition-all duration-300 flex items-center justify-center cursor-pointer"
              >
                Try Virtual Try-On
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── AI Feature Specs Ribbon ─────────────────────────────────── */}
      <section className="bg-surface-container py-8 border-y border-outline-variant/30">
        <div className="max-w-container-max mx-auto px-4 md:px-margin-desktop grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface">Instant AI Render</h4>
              <p className="text-xs text-on-surface-variant">Sub-second garment mapping</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface">Fabric Physics</h4>
              <p className="text-xs text-on-surface-variant">Realistic texture &amp; drape</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface">Photo &amp; Live Camera</h4>
              <p className="text-xs text-on-surface-variant">Upload or use sample model</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface">Fit Score Analysis</h4>
              <p className="text-xs text-on-surface-variant">Shoulder, waist &amp; chest metric</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Virtual Try-On Banner Section ───────────────────────────── */}
      <section className="py-20 max-w-container-max mx-auto px-4 md:px-margin-desktop w-full">
        <div className="relative rounded-3xl bg-gradient-to-r from-primary-container via-primary to-surface-tint text-white p-8 md:p-14 overflow-hidden shadow-2xl flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="relative z-10 max-w-xl">
            <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold uppercase tracking-wider mb-4 backdrop-blur-md">
              Interactive Fitting Room
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold font-sans tracking-tight mb-4 leading-tight">
              See How Garments Fit Your Exact Silhouette
            </h2>
            <p className="text-white/80 text-base mb-8 leading-relaxed">
              Upload your photo or choose one of our studio sample models to test sizes, check drape accuracy, and assemble full outfits in real time.
            </p>
            <button
              onClick={() => setActiveTryOnProduct(heroProduct)}
              className="px-8 py-3.5 rounded-full bg-white text-primary font-bold text-sm shadow-xl hover:bg-slate-100 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              Launch Virtual Fitting Room
            </button>
          </div>

          <div className="relative z-10 w-full md:w-80 h-96 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20 bg-slate-900 group">
            <img
              src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80"
              alt="FITSY Try-On Preview"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-5">
              <div className="flex items-center justify-between text-white mb-1">
                <span className="text-xs font-bold uppercase tracking-wider bg-primary/80 px-2.5 py-1 rounded-full">
                  AI Fit Verified
                </span>
                <span className="text-xs font-bold text-emerald-400">98.4% Accuracy</span>
              </div>
              <p className="text-sm font-bold text-white">Luxe Tailored Oversized Coat</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Trending Products Grid with "Try It On" Badges ─────────── */}
      <section className="py-16 bg-surface-container-low/50">
        <div className="max-w-container-max mx-auto px-4 md:px-margin-desktop">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Front Row Selection</span>
              <h2 className="text-3xl font-bold font-sans tracking-tight text-on-surface mt-1">
                Trending Try-On Ready Arrivals
              </h2>
            </div>
            <Link
              to="/catalog"
              className="mt-4 md:mt-0 text-sm font-bold text-primary hover:underline flex items-center gap-1"
            >
              View Full Catalog <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProducts.map((product) => (
              <div
                key={product.id || product._id}
                className="group relative bg-surface border border-outline-variant/40 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
              >
                {/* Image & Try On Trigger */}
                <div className="relative aspect-[3/4] bg-surface-container overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Category Pill */}
                  <span className="absolute top-4 left-4 bg-surface/90 backdrop-blur-md text-on-surface text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                    {product.category}
                  </span>

                  {/* Prominent "Try It On" Hover Button */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-6 backdrop-blur-xs">
                    <button
                      onClick={() => setActiveTryOnProduct(product)}
                      className="w-full py-3 px-4 rounded-full bg-primary text-white font-bold text-sm shadow-xl hover:bg-primary-container transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      Try On with AI
                    </button>
                  </div>
                </div>

                {/* Product Meta Details */}
                <div className="p-5 flex flex-col flex-1 justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-on-surface-variant mb-1">
                      <span className="flex items-center gap-1 font-semibold text-amber-500">
                        <Star className="w-3.5 h-3.5 fill-current" /> {product.rating || '4.9'}
                      </span>
                      <span>{product.colors?.length || 3} Colors</span>
                    </div>
                    <Link
                      to={`/product/${product.id || product._id}`}
                      className="font-bold text-base text-on-surface hover:text-primary transition-colors line-clamp-1"
                    >
                      {product.name}
                    </Link>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-outline-variant/20">
                    <span className="text-lg font-bold text-primary">${product.price}</span>
                    <button
                      onClick={() => navigate(`/product/${product.id || product._id}`)}
                      className="text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors"
                    >
                      View Details &rarr;
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 3-Step How It Works ─────────────────────────────────────── */}
      <section className="py-20 max-w-container-max mx-auto px-4 md:px-margin-desktop w-full">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">Simple &amp; Seamless</span>
          <h2 className="text-3xl md:text-4xl font-bold font-sans text-on-surface mt-2">
            How FITSY Virtual Try-On Works
          </h2>
          <p className="text-on-surface-variant text-sm mt-3">
            3 simple steps to find your ideal fit without leaving home.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-3xl bg-surface border border-outline-variant/40 shadow-sm text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl mb-6">
              01
            </div>
            <h3 className="text-xl font-bold text-on-surface mb-3">Select Your Garment</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Browse our curated collection of jackets, tops, dresses, and pants. Click "Try On with AI" on any item.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-surface border border-outline-variant/40 shadow-sm text-center flex flex-col items-center relative">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl mb-6">
              02
            </div>
            <h3 className="text-xl font-bold text-on-surface mb-3">Upload Photo or Model</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Upload a front-facing photo of yourself or pick from our range of high-definition studio models.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-surface border border-outline-variant/40 shadow-sm text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl mb-6">
              03
            </div>
            <h3 className="text-xl font-bold text-on-surface mb-3">Instant Fit Analysis</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Our AI engine overlays the item with realistic fabric physics, fit breakdown scores, and direct cart integration.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Try On Modal Trigger */}
      {activeTryOnProduct && (
        <GarmentTryOn
          product={activeTryOnProduct}
          onClose={() => setActiveTryOnProduct(null)}
        />
      )}
    </div>
  );
}

