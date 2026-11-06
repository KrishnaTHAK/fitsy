// Integration test: the recommendation flows into the EXISTING size selector
// and the EXISTING add-to-cart on the product page (nothing is duplicated).
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProductPage from './ProductPage';

const { mockAuth, mockProducts, mockStore, recommend } = vi.hoisted(() => ({
  mockAuth: { isAuthenticated: true, user: { fitProfile: {} }, updateFitProfile: vi.fn() },
  mockProducts: { products: [], getProductById: vi.fn() },
  mockStore: {
    cartItems: [],
    addToCart: vi.fn(),
    updateCartQuantity: vi.fn(),
    wishlistItems: [],
    toggleWishlist: vi.fn(),
  },
  recommend: vi.fn(),
}));

vi.mock('../context/AuthContext', () => ({ useAuth: () => mockAuth }));
vi.mock('../context/ProductsContext', () => ({ useProducts: () => mockProducts }));
vi.mock('../context/StoreContext', () => ({ useStore: () => mockStore }));
vi.mock('../components/GarmentTryOn', () => ({ default: () => null }));
vi.mock('../services/api', () => ({ sizeRecommendation: { recommend } }));

const base = {
  price: 49,
  rating: 4.6,
  description: 'A test garment.',
  image: 'test.jpg',
  badge: '',
  accent: '',
  inventory: 10,
};

const backendTee = {
  ...base,
  _id: 'prod_001',
  id: 1,
  name: 'Backend Tee',
  category: 'Tops',
  sizes: ['S', 'M', 'L'],
  sizeChart: [
    { size: 'S', chestMin: 84, chestMax: 90, shoulderMin: 40, shoulderMax: 42 },
    { size: 'M', chestMin: 90, chestMax: 98, shoulderMin: 42, shoulderMax: 44 },
    { size: 'L', chestMin: 98, chestMax: 106, shoulderMin: 44, shoulderMax: 46 },
  ],
};
const staticTee = { ...base, id: 11, name: 'Static Tee', category: 'Tops', sizes: ['S', 'M', 'L'] }; // numeric id, no _id
const shoes = { ...base, _id: 'prod_031', id: 31, name: 'Runner', category: 'Shoes', sizes: ['8', '9', '10'], sizeChart: [] };

function renderPage(product) {
  mockProducts.products = [product];
  mockProducts.getProductById.mockReturnValue(product);
  return render(
    <MemoryRouter
      initialEntries={[`/product/${product._id ?? product.id}`]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path="/product/:id" element={<ProductPage />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.isAuthenticated = true;
  mockStore.cartItems = [];
});

describe('Find My Size on the product page', () => {
  it('is shown for a backend product with a size chart', () => {
    renderPage(backendTee);
    expect(screen.getByRole('button', { name: /find my size/i })).toBeInTheDocument();
  });

  it('is hidden for static-catalog products, which the backend cannot look up', () => {
    renderPage(staticTee);
    expect(screen.queryByRole('button', { name: /find my size/i })).not.toBeInTheDocument();
  });

  it('is hidden for shoes and other products with no body-measurement chart', () => {
    renderPage(shoes);
    expect(screen.queryByRole('button', { name: /find my size/i })).not.toBeInTheDocument();
  });

  it('the existing Size Guide is still there', () => {
    renderPage(backendTee);
    expect(screen.getByRole('button', { name: /size guide/i })).toBeInTheDocument();
  });

  it('selecting the recommended size updates the EXISTING size selector, and Add to Shopping Bag uses it', async () => {
    recommend.mockResolvedValue({
      data: {
        success: true,
        data: {
          status: 'ok',
          recommendedSize: 'M',
          confidence: 'high',
          alternative: null,
          incomplete: false,
          reason: 'Your chest and shoulder measurements fall within the M size range for this product.',
          measurementBreakdown: {
            chest: { user: 94, min: 90, max: 98, match: true },
            shoulder: { user: 43, min: 42, max: 44, match: true },
          },
        },
      },
    });
    const user = userEvent.setup();
    renderPage(backendTee);

    // Default selection is the first size, as before this feature existed
    expect(screen.getByRole('button', { name: 'S', pressed: true })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /find my size/i }));
    const dialog = screen.getByRole('dialog', { name: /find your size/i });
    await user.type(within(dialog).getByLabelText(/chest/i), '94');
    await user.type(within(dialog).getByLabelText(/shoulder/i), '43');
    await user.click(within(dialog).getByRole('button', { name: /recommend my size/i }));
    await user.click(await within(dialog).findByRole('button', { name: 'Select M' }));

    expect(recommend).toHaveBeenCalledWith(expect.objectContaining({ productId: 'prod_001' }));

    // Modal closed, and the existing selector now shows M as selected
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'M', pressed: true })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'S', pressed: false })).toBeInTheDocument();

    // The existing add-to-cart receives the chosen size: same cart, no duplicate logic
    await user.click(screen.getByRole('button', { name: /add to shopping bag/i }));
    expect(mockStore.addToCart).toHaveBeenCalledTimes(1);
    expect(mockStore.addToCart).toHaveBeenCalledWith({ product: backendTee, size: 'M' });
  });

  it('manual size selection and add to cart still work without using the feature', async () => {
    const user = userEvent.setup();
    renderPage(backendTee);
    await user.click(screen.getByRole('button', { name: 'L' }));
    await user.click(screen.getByRole('button', { name: /add to shopping bag/i }));
    expect(mockStore.addToCart).toHaveBeenCalledWith({ product: backendTee, size: 'L' });
  });
});
