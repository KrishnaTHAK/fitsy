import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { useProducts } from '../context/ProductsContext';

const SORT_OPTIONS = ['Featured', 'Newest', 'Top Rated', 'Price: Low to High'];

export default function Catalog() {
  const { products, categories } = useProducts();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category');
  const [selectedCategory, setSelectedCategory] = useState(
    initialCategory && categories.includes(initialCategory) ? initialCategory : 'All',
  );
  const [query, setQuery] = useState('');
  const [selectedSort, setSelectedSort] = useState('Featured');

  const filteredProducts = useMemo(() => {
    const matches = products.filter((product) => {
      const matchesCategory =
        selectedCategory === 'All' || product.category === selectedCategory;
      const matchesQuery = [product.name, product.category, product.accent, product.badge]
        .join(' ')
        .toLowerCase()
        .includes(query.toLowerCase());

      return matchesCategory && matchesQuery;
    });

    if (selectedSort === 'Top Rated') return [...matches].sort((a, b) => b.rating - a.rating);
    if (selectedSort === 'Price: Low to High') return [...matches].sort((a, b) => a.price - b.price);
    if (selectedSort === 'Newest') {
      return [...matches].sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return new Date(b.createdAt) - new Date(a.createdAt);
        }
        const aId = a.id || a._id || '';
        const bId = b.id || b._id || '';
        return String(bId).localeCompare(String(aId));
      });
    }
    return matches;
  }, [products, query, selectedCategory, selectedSort]);

  function handleCategoryChange(category) {
    setSelectedCategory(category);

    if (category === 'All') {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('category');
      setSearchParams(nextParams);
      return;
    }

    setSearchParams({ category });
  }

  return (
    <div className="catalog-page">
      <section className="container catalog-stage">
        <div className="catalog-stage__hero">
          <span className="eyebrow">Catalog</span>
          <h1>{products.length} curated products across fashion, beauty, eyewear, jewelry, shoes, and accessories.</h1>
          <p>
            The catalog has been restructured to feel more like a designed collection wall than a
            default ecommerce list. Filter by category, search by mood, and sort by merit.
          </p>
        </div>
        <div className="catalog-stage__meta">
          <strong>{filteredProducts.length}</strong>
          <span>results visible</span>
        </div>
      </section>

      <section className="container catalog-shell">
        <aside className="catalog-shell__filters">
          <div className="filter-panel">
            <div className="filter-panel__title">
              <SlidersHorizontal size={18} />
              <h2>Refine</h2>
            </div>

            <label className="search-field">
              <Search size={16} />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by product, badge, or mood"
              />
            </label>

            <div className="filter-cluster">
              <span>Categories</span>
              <div className="filter-pills">
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    className={`filter-pill ${selectedCategory === category ? 'is-selected' : ''}`}
                    onClick={() => handleCategoryChange(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-cluster">
              <span>Sort</span>
              <div className="filter-pills">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`filter-pill ${selectedSort === option ? 'is-selected' : ''}`}
                    onClick={() => setSelectedSort(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <main className="catalog-shell__results">
          <div className="results-head">
            <div>
              <span className="eyebrow">Collection Wall</span>
              <h2>{selectedCategory === 'All' ? 'All Categories' : selectedCategory}</h2>
            </div>
            <p>Unique tile layout with stronger image-led merchandising.</p>
          </div>

          <div className="catalog-mosaic">
            {filteredProducts.map((product, index) => (
              <div
                key={product.id || product._id}
                className={`catalog-mosaic__item ${index % 5 === 0 ? 'catalog-mosaic__item--wide' : ''}`}
              >
                <ProductCard product={product} featured={index % 7 === 0} />
              </div>
            ))}
          </div>
        </main>
      </section>
    </div>
  );
}
