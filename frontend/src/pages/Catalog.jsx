import { useMemo, useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, SlidersHorizontal, Sparkles, Star, ArrowUpDown, Check } from 'lucide-react';
import { useProducts } from '../context/ProductsContext';
import GarmentTryOn from '../components/GarmentTryOn';

const SORT_OPTIONS = ['Featured', 'Newest', 'Top Rated', 'Price: Low to High'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export default function Catalog() {
  const { products, categories } = useProducts();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialCategory = searchParams.get('category');
  const initialTryOn = searchParams.get('tryon');

  const [selectedCategory, setSelectedCategory] = useState(
    initialCategory && categories.includes(initialCategory) ? initialCategory : 'All'
  );
  const [query, setQuery] = useState('');
  const [selectedSort, setSelectedSort] = useState('Featured');
  const [maxPrice, setMaxPrice] = useState(2000);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [activeTryOnProduct, setActiveTryOnProduct] = useState(null);

  // If URL has ?tryon=active, open modal with first product automatically
  useEffect(() => {
    if (initialTryOn === 'active' && products.length > 0) {
      setActiveTryOnProduct(products[0]);
    }
  }, [initialTryOn, products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === 'All' ||
        product.category === selectedCategory ||
        (selectedCategory === 'Clothes' &&
          ['Clothes', 'Outerwear', 'Tops', 'Bottoms', 'Dresses'].includes(product.category));
      const matchesQuery = [product.name, product.category, product.accent, product.badge]
        .join(' ')
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesPrice = product.price <= maxPrice;

      return matchesCategory && matchesQuery && matchesPrice;
    }).sort((a, b) => {
      if (selectedSort === 'Top Rated') return b.rating - a.rating;
      if (selectedSort === 'Price: Low to High') return a.price - b.price;
      if (selectedSort === 'Newest') {
        const aId = a.id || a._id || '';
        const bId = b.id || b._id || '';
        return String(bId).localeCompare(String(aId));
      }
      return 0;
    });
  }, [products, query, selectedCategory, selectedSort, maxPrice]);

  function handleCategoryChange(category) {
    setSelectedCategory(category);
    const nextParams = new URLSearchParams(searchParams);
    if (category === 'All') {
      nextParams.delete('category');
    } else {
      nextParams.set('category', category);
    }
    setSearchParams(nextParams);
  }

  function toggleSize(size) {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-20">
      {/* ─── Hero Header ────────────────────────────────────────────── */}
      <section className="bg-surface-container-low py-12 border-b border-outline-variant/30">
        <div className="max-w-container-max mx-auto px-4 md:px-margin-desktop">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" /> FITSY Studio Collection
          </div>
          <h1 className="text-3xl md:text-5xl font-bold font-sans text-on-surface tracking-tight">
            Shop Collection &amp; Virtual Fitting Room
          </h1>
          <p className="text-on-surface-variant text-base mt-2 max-w-2xl">
            Browse our AI-enabled apparel edit. Click "Try On with AI" on any garment to launch interactive fitting.
          </p>

          {/* Search bar & quick categories */}
          <div className="mt-8 flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products, styles, categories..."
                className="w-full pl-12 pr-4 py-3.5 bg-surface border border-outline-variant/60 rounded-full text-sm text-on-surface focus:outline-none focus:border-primary shadow-sm"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  className={`px-4 py-2.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === category
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-surface border border-outline-variant/50 text-on-surface-variant hover:border-primary'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Main Shop Catalog ────────────────────────────────────────── */}
      <div className="max-w-container-max mx-auto px-4 md:px-margin-desktop py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <aside className="lg:col-span-1 space-y-8 bg-surface p-6 rounded-2xl border border-outline-variant/40 shadow-sm h-fit">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-4">
              <h3 className="font-bold text-base text-on-surface flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-primary" /> Filter Products
              </h3>
              <span className="text-xs text-on-surface-variant font-semibold">
                {filteredProducts.length} items
              </span>
            </div>

            {/* Price Range Filter */}
            <div>
              <div className="flex justify-between items-center text-xs font-bold text-on-surface mb-2">
                <span>Max Price</span>
                <span className="text-primary">${maxPrice}</span>
              </div>
              <input
                type="range"
                min="20"
                max="2000"
                step="20"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
            </div>

            {/* Size Selector */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface mb-3">Available Sizes</h4>
              <div className="grid grid-cols-3 gap-2">
                {SIZES.map((size) => {
                  const isSelected = selectedSizes.includes(size);
                  return (
                    <button
                      key={size}
                      onClick={() => toggleSize(size)}
                      className={`py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-surface-container-low border-outline-variant/40 text-on-surface-variant hover:border-primary'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sorting Dropdown */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface mb-2 flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5" /> Sort By
              </h4>
              <select
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-3 text-xs font-semibold text-on-surface focus:outline-none focus:border-primary"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </aside>

          {/* Product Cards Grid */}
          <main className="lg:col-span-3">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-20 bg-surface p-8 rounded-3xl border border-outline-variant/40">
                <p className="text-lg font-bold text-on-surface">No products match your criteria</p>
                <p className="text-sm text-on-surface-variant mt-1">Try clearing filters or expanding search term.</p>
                <button
                  onClick={() => {
                    setSelectedCategory('All');
                    setQuery('');
                    setMaxPrice(300);
                  }}
                  className="mt-4 px-6 py-2.5 bg-primary text-white rounded-full text-xs font-bold"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id || product._id}
                    className="group bg-surface border border-outline-variant/40 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
                  >
                    <div className="relative aspect-[3/4] bg-surface-container overflow-hidden">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-3 left-3 bg-surface/90 backdrop-blur-md text-on-surface text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                        {product.category}
                      </span>

                      {/* Try On Trigger Overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-4">
                        <button
                          onClick={() => setActiveTryOnProduct(product)}
                          className="w-full py-2.5 px-4 rounded-full bg-primary text-white font-bold text-xs shadow-lg hover:bg-primary-container flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" /> Try On with AI
                        </button>
                      </div>
                    </div>

                    <div className="p-4 flex flex-col flex-1 justify-between">
                      <div>
                        <div className="flex items-center justify-between text-xs text-on-surface-variant mb-1">
                          <span className="flex items-center gap-1 font-semibold text-amber-500">
                            <Star className="w-3.5 h-3.5 fill-current" /> {product.rating || '4.8'}
                          </span>
                          <span className="text-[11px]">{product.badge || 'New'}</span>
                        </div>
                        <Link
                          to={`/product/${product.id || product._id}`}
                          className="font-bold text-sm text-on-surface hover:text-primary transition-colors line-clamp-1"
                        >
                          {product.name}
                        </Link>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-outline-variant/20">
                        <span className="text-base font-bold text-primary">${product.price}</span>
                        <Link
                          to={`/product/${product.id || product._id}`}
                          className="text-xs font-semibold text-on-surface-variant hover:text-primary"
                        >
                          Details &rarr;
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Try-On Modal */}
      {activeTryOnProduct && (
        <GarmentTryOn
          product={activeTryOnProduct}
          onClose={() => setActiveTryOnProduct(null)}
        />
      )}
    </div>
  );
}

