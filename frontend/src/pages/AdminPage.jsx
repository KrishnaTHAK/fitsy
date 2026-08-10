import { useState } from 'react';
import { useProducts } from '../context/ProductsContext';
import { LayoutDashboard, Package, TrendingUp, Sparkles, Users, Plus, Edit2, Trash2, CheckCircle, Clock } from 'lucide-react';

export default function AdminPage() {
  const { products } = useProducts();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('inventory');

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-20">
      {/* ─── Admin Top Header ────────────────────────────────────────── */}
      <header className="bg-surface-container-low py-8 border-b border-outline-variant/30">
        <div className="max-w-container-max mx-auto px-4 md:px-margin-desktop flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-2">
              <LayoutDashboard className="w-3.5 h-3.5" /> FITSY Platform Admin
            </span>
            <h1 className="text-3xl font-bold font-sans text-on-surface">Store Administration &amp; AI Analytics</h1>
          </div>
          <button
            onClick={() => alert('Add Product feature is available in production API mode.')}
            className="px-5 py-2.5 rounded-full bg-primary text-white font-bold text-xs shadow-md hover:bg-primary-container flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add New Product
          </button>
        </div>
      </header>

      <div className="max-w-container-max mx-auto px-4 md:px-margin-desktop py-10 space-y-8">
        {/* ─── Metrics Cards ──────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-3xl bg-surface border border-outline-variant/40 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-on-surface-variant">Total Sales Volume</p>
              <p className="text-2xl font-bold text-on-surface">$48,920.50</p>
              <span className="text-[10px] font-bold text-emerald-600">↑ 18.4% this month</span>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-surface border border-outline-variant/40 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-on-surface-variant">Try-On Conversion</p>
              <p className="text-2xl font-bold text-on-surface">34.2%</p>
              <span className="text-[10px] font-bold text-emerald-600">↑ 12% boost from VTO</span>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-surface border border-outline-variant/40 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-on-surface-variant">Active Catalog Items</p>
              <p className="text-2xl font-bold text-on-surface">{products.length}</p>
              <span className="text-[10px] font-bold text-primary">All Try-On Enabled</span>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-surface border border-outline-variant/40 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-on-surface-variant">AI Latency Rate</p>
              <p className="text-2xl font-bold text-on-surface">0.84s</p>
              <span className="text-[10px] font-bold text-emerald-600">Sub-second rendering</span>
            </div>
          </div>
        </div>

        {/* ─── Navigation Tabs & Table ────────────────────────────────── */}
        <div className="bg-surface border border-outline-variant/40 rounded-3xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-outline-variant/30 pb-4 mb-6 gap-4">
            <div className="flex gap-4">
              <button
                onClick={() => setSelectedTab('inventory')}
                className={`pb-2 text-sm font-bold border-b-2 transition-all ${
                  selectedTab === 'inventory' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant'
                }`}
              >
                Product Inventory ({filteredProducts.length})
              </button>
              <button
                onClick={() => setSelectedTab('analytics')}
                className={`pb-2 text-sm font-bold border-b-2 transition-all ${
                  selectedTab === 'analytics' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant'
                }`}
              >
                Try-On Analytics Log
              </button>
            </div>

            <input
              type="text"
              placeholder="Search product inventory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 bg-surface-container-low border border-outline-variant/40 rounded-full text-xs text-on-surface focus:outline-none focus:border-primary"
            />
          </div>

          {selectedTab === 'inventory' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-outline-variant/30 text-on-surface-variant font-bold uppercase tracking-wider bg-surface-container-low">
                    <th className="p-3">Garment</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Price</th>
                    <th className="p-3">Stock</th>
                    <th className="p-3">VTO Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id || product._id} className="border-b border-outline-variant/20 hover:bg-surface-container-low/40">
                      <td className="p-3 flex items-center gap-3">
                        <img src={product.image} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                        <div>
                          <p className="font-bold text-on-surface">{product.name}</p>
                          <p className="text-[10px] text-on-surface-variant">{product.badge || 'Default'}</p>
                        </div>
                      </td>
                      <td className="p-3 font-semibold text-on-surface-variant">{product.category}</td>
                      <td className="p-3 font-bold text-primary">${product.price}</td>
                      <td className="p-3 font-semibold">{product.inventory || 24} units</td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold text-[10px]">
                          <CheckCircle className="w-3 h-3" /> Ready
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <button className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-primary">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-rose-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-on-surface">Virtual Try-On Session #8492</p>
                  <p className="text-on-surface-variant text-[11px]">User uploaded custom portrait • Matched Blue Oversized T-Shirt (M)</p>
                </div>
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full font-bold">Fit Score: 98.4%</span>
              </div>
              <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-on-surface">Virtual Try-On Session #8491</p>
                  <p className="text-on-surface-variant text-[11px]">Selected Studio Model A • Matched Tailored Trench Coat (L)</p>
                </div>
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full font-bold">Fit Score: 97.8%</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
