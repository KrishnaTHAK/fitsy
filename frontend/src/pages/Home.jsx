import { Link } from 'react-router-dom';
import { ArrowRight, Camera, Play, Sparkles, Star } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import ProductImage from '../components/ProductImage';
import { useProducts } from '../context/ProductsContext';

export default function Home() {
  const { products, categories } = useProducts();

  // Derived slices — same selections as before, now from the live products array
  const featuredProducts = products.slice(0, 6);
  const curatedProducts = products.slice(12, 16);
  const heroProduct = products[10];

  if (!heroProduct) return null;

  return (
    <div className="home-page">
      <section className="hero-stage">
        <div className="container hero-stage__grid">
          <div className="hero-stage__copy">
            <span className="eyebrow">Distinctive storefront redesign</span>
            <h1>Shop fashion like an editorial drop, then preview it with virtual try-on.</h1>
            <p>
              The new Fitsy direction leans into a sharper, gallery-inspired storefront instead of
              generic marketplace cards. It is built to feel branded, premium, and investor-ready.
            </p>

            <div className="hero-stage__actions">
              <Link to="/catalog" className="btn-primary">
                Browse the full catalog
                <ArrowRight size={18} />
              </Link>
              <Link to={`/product/${heroProduct.id || heroProduct._id}`} className="btn-secondary">
                <Camera size={18} />
                Launch try-on demo
              </Link>
            </div>

            <div className="hero-stage__stats">
              <div>
                <strong>{products.length}+</strong>
                <span>catalog products</span>
              </div>
              <div>
                <strong>{categories.length - 1}</strong>
                <span>shopping categories</span>
              </div>
              <div>
                <strong>AR</strong>
                <span>preview-enabled assortment</span>
              </div>
            </div>
          </div>

          <div className="hero-stage__feature">
            <div className="hero-poster">
              <ProductImage product={heroProduct} src={heroProduct.image} alt={heroProduct.name} />
              <div className="hero-poster__panel">
                <span>Featured look</span>
                <strong>{heroProduct.name}</strong>
                <p>{heroProduct.accent}</p>
                <Link to={`/product/${heroProduct.id || heroProduct._id}`}>
                  View product <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container marquee-band">
        <div>New season essentials</div>
        <div>Spatial try-on ready</div>
        <div>Beauty, jewelry, eyewear, apparel</div>
        <div>Designed to feel like a real brand</div>
      </section>

      <section className="container editorial-board section-space">
        <div className="editorial-board__intro">
          <span className="eyebrow">Front Row Picks</span>
          <h2>Not another generic product grid.</h2>
          <p>
            This redesign shifts the storefront toward an editorial commerce feel with stronger
            composition, more whitespace, larger imagery, and clearer merchandising hierarchy.
          </p>
        </div>

        <div className="editorial-board__cards">
          {featuredProducts.map((product, index) => (
            <ProductCard key={product.id || product._id} product={product} featured={index === 0} />
          ))}
        </div>
      </section>

      <section className="container collection-rail section-space">
        <div className="collection-rail__lead">
          <span className="eyebrow">Collections</span>
          <h2>Enter through a mood, not only a menu.</h2>
        </div>
        <div className="collection-rail__grid">
          {categories.filter((category) => category !== 'All').map((category, index) => (
            <Link
              key={category}
              to={`/catalog?category=${encodeURIComponent(category)}`}
              className="collection-pill"
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <strong>{category}</strong>
              <span>Open the edit</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="container split-story section-space">
        <div className="split-story__panel split-story__panel--dark">
          <span className="eyebrow">Live Try-On</span>
          <h3>Camera-led product discovery that still feels like shopping.</h3>
          <p>
            Fitsy keeps the product-first experience while making AR a premium layer rather than a
            gimmick. Start with face, jewelry, and eyewear items for the strongest experience.
          </p>
          <Link to="/catalog?category=Glasses" className="inline-link">
            Open try-on edit <Play size={14} />
          </Link>
        </div>

        <div className="split-story__products">
          {curatedProducts.map((product) => (
            <Link key={product.id || product._id} to={`/product/${product.id || product._id}`} className="mini-feature">
              <ProductImage product={product} src={product.image} alt={product.name} loading="lazy" />
              <div>
                <span><Sparkles size={12} /> {product.badge}</span>
                <strong>{product.name}</strong>
                <p>
                  <Star size={13} fill="currentColor" /> {product.rating} rated
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
