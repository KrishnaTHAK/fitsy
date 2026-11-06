import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SizeRecommendationModal from './SizeRecommendationModal';

const { mockAuth, recommend } = vi.hoisted(() => ({
  mockAuth: { isAuthenticated: false, user: null, updateFitProfile: vi.fn() },
  recommend: vi.fn(),
}));

vi.mock('../context/AuthContext', () => ({ useAuth: () => mockAuth }));
vi.mock('../services/api', () => ({ sizeRecommendation: { recommend } }));

// Same shape as the backend's memory-mode catalog: BOTH a numeric id and a string _id.
const tops = {
  _id: 'prod_001',
  id: 1,
  name: 'Test Tee',
  category: 'Tops',
  sizes: ['S', 'M', 'L'],
  sizeChart: [
    { size: 'S', chestMin: 84, chestMax: 90, shoulderMin: 40, shoulderMax: 42 },
    { size: 'M', chestMin: 90, chestMax: 98, shoulderMin: 42, shoulderMax: 44 },
    { size: 'L', chestMin: 98, chestMax: 106, shoulderMin: 44, shoulderMax: 46 },
  ],
};

const okResponse = {
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
};

function setup(props = {}) {
  const onClose = vi.fn();
  const onSelectSize = vi.fn();
  render(<SizeRecommendationModal product={tops} onClose={onClose} onSelectSize={onSelectSize} {...props} />);
  return { onClose, onSelectSize, user: userEvent.setup() };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.isAuthenticated = false;
  mockAuth.user = null;
});

describe('SizeRecommendationModal', () => {
  it('asks only for the measurements this product uses', () => {
    setup();
    expect(screen.getByLabelText(/chest/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/shoulder/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/waist/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^hip/i)).not.toBeInTheDocument();
  });

  it('does not call the API when nothing relevant is entered, and says what to enter', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: /recommend my size/i }));
    expect(await screen.findByText(/enter at least one of: chest, shoulder/i)).toBeInTheDocument();
    expect(recommend).not.toHaveBeenCalled();
  });

  it('shows an inline error for an unrealistic value and does not call the API', async () => {
    const { user } = setup();
    await user.type(screen.getByLabelText(/chest/i), '400');
    await user.click(screen.getByRole('button', { name: /recommend my size/i }));
    expect(await screen.findByText(/chest should be between 50 and 180 cm/i)).toBeInTheDocument();
    expect(recommend).not.toHaveBeenCalled();
  });

  it('sends the backend product id and only the entered measurements, then shows the result', async () => {
    recommend.mockResolvedValue(okResponse);
    const { user } = setup();
    await user.type(screen.getByLabelText(/chest/i), '94');
    await user.type(screen.getByLabelText(/shoulder/i), '43');
    await user.click(screen.getByRole('button', { name: /recommend my size/i }));

    expect(recommend).toHaveBeenCalledWith({
      productId: 'prod_001',
      measurements: { chest: 94, shoulder: 43 },
      fitPreference: 'regular',
    });

    expect(await screen.findByText('M')).toBeInTheDocument();
    expect(screen.getByText(/confidence: high/i)).toBeInTheDocument();
    expect(screen.getByText(/chest and shoulder measurements fall within/i)).toBeInTheDocument();
    expect(screen.getByText(/You: 94 cm · Range: 90–98 cm/)).toBeInTheDocument();
    // honest wording: an estimate, not a guarantee
    expect(screen.getByText(/actual fit varies by brand, fabric and garment cut/i)).toBeInTheDocument();
    expect(screen.queryByText(/guarantee/i)).not.toBeInTheDocument();
  });

  it('"Select M" hands the size to the product page and closes the modal', async () => {
    recommend.mockResolvedValue(okResponse);
    const { user, onSelectSize, onClose } = setup();
    await user.type(screen.getByLabelText(/chest/i), '94');
    await user.click(screen.getByRole('button', { name: /recommend my size/i }));
    await user.click(await screen.findByRole('button', { name: 'Select M' }));
    expect(onSelectSize).toHaveBeenCalledWith('M');
    expect(onClose).toHaveBeenCalled();
  });

  it('offers the alternative size when two sizes are close', async () => {
    recommend.mockResolvedValue({
      data: { success: true, data: { ...okResponse.data.data, confidence: 'medium', alternative: 'L' } },
    });
    const { user, onSelectSize } = setup();
    await user.type(screen.getByLabelText(/chest/i), '98');
    await user.click(screen.getByRole('button', { name: /recommend my size/i }));
    await user.click(await screen.findByRole('button', { name: /select l instead/i }));
    expect(onSelectSize).toHaveBeenCalledWith('L');
  });

  it('a no-match result shows the message and no Select button', async () => {
    recommend.mockResolvedValue({
      data: { success: true, data: { status: 'no_match', message: 'Your chest measurement is above the largest available size for this product.' } },
    });
    const { user } = setup();
    await user.type(screen.getByLabelText(/chest/i), '120');
    await user.click(screen.getByRole('button', { name: /recommend my size/i }));
    expect(await screen.findByText(/above the largest available size/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^select/i })).not.toBeInTheDocument();
  });

  it('shows a friendly error when the request fails, and keeps the form', async () => {
    recommend.mockResolvedValue({ error: 'Network error', data: null });
    const { user } = setup();
    await user.type(screen.getByLabelText(/chest/i), '94');
    await user.click(screen.getByRole('button', { name: /recommend my size/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/network error/i);
    expect(screen.getByLabelText(/chest/i)).toBeInTheDocument();
  });

  it('shows a calculating state while the request is in flight', async () => {
    let resolve;
    recommend.mockReturnValue(new Promise((r) => { resolve = r; }));
    const { user } = setup();
    await user.type(screen.getByLabelText(/chest/i), '94');
    await user.click(screen.getByRole('button', { name: /recommend my size/i }));
    expect(await screen.findByRole('button', { name: /calculating/i })).toBeDisabled();
    resolve(okResponse);
    await waitFor(() => expect(screen.getByText(/your recommended size/i)).toBeInTheDocument());
  });

  it('saving to the profile MERGES with what is already saved instead of erasing it', async () => {
    recommend.mockResolvedValue(okResponse);
    mockAuth.isAuthenticated = true;
    mockAuth.user = { fitProfile: { chest: 90, waist: 75, hip: 95, fitPreference: 'slim' } };
    mockAuth.updateFitProfile.mockResolvedValue({ success: true });

    const { user } = setup();
    const chest = screen.getByLabelText(/chest/i);
    await user.clear(chest);
    await user.type(chest, '94');
    await user.type(screen.getByLabelText(/shoulder/i), '43');
    await user.click(screen.getByLabelText(/save these measurements/i));
    await user.click(screen.getByRole('button', { name: /recommend my size/i }));

    await waitFor(() => expect(mockAuth.updateFitProfile).toHaveBeenCalled());
    expect(mockAuth.updateFitProfile).toHaveBeenCalledWith(
      expect.objectContaining({ chest: 94, shoulder: 43, waist: 75, hip: 95, fitPreference: 'slim' })
    );
  });

  it('prefills relevant saved measurements for a logged-in user', () => {
    mockAuth.isAuthenticated = true;
    mockAuth.user = { fitProfile: { chest: 96, shoulder: 44, waist: 80 } };
    setup();
    expect(screen.getByLabelText(/chest/i)).toHaveValue(96);
    expect(screen.getByLabelText(/shoulder/i)).toHaveValue(44);
  });
});
