import React, { useState, useEffect } from 'react';
import {
  Package,
  DollarSign,
  TrendingUp,
  Percent,
  Search,
  Cpu,
  Layers,
  ArrowRight,
  Boxes,
  RotateCcw
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart
} from 'recharts';
import api from '../services/api';

export default function ProductAnalytics({ onNavigateToPrediction }) {
  const [products, setProducts] = useState([]);
  const [selectedId, setSelectedId] = useState('PRD1005');
  const [productData, setProductData] = useState(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [quickForecast, setQuickForecast] = useState(null);
  const [predicting, setPredicting] = useState(false);

  useEffect(() => {
    fetchProductList();
  }, [categoryFilter, search]);

  useEffect(() => {
    if (selectedId) {
      fetchProductDetail(selectedId);
      fetchQuickDemand(selectedId);
    }
  }, [selectedId]);

  const fetchProductList = async () => {
    try {
      const params = {};
      if (categoryFilter !== 'All') params.category = categoryFilter;
      if (search) params.search = search;
      const res = await api.getProducts(params);
      setProducts(res.data);
      if (res.data.length > 0 && !selectedId) {
        setSelectedId(res.data[0].product_id);
      }
    } catch (err) {
      console.error('Failed to load products list:', err);
    }
  };

  const fetchProductDetail = async (id) => {
    try {
      setLoading(true);
      const res = await api.getProductDetail(id);
      setProductData(res.data);
    } catch (err) {
      console.error('Failed to load product detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuickDemand = async (id) => {
    try {
      setPredicting(true);
      // Quick forecast for STR101 (or first flagship store)
      const res = await api.predictDemand({
        product_id: id,
        store_id: 'STR101',
        forecast_days: 30,
        planned_discount_pct: 0,
        has_promotion: false
      });
      setQuickForecast(res.data);
    } catch (err) {
      console.error('Quick forecast error:', err);
    } finally {
      setPredicting(false);
    }
  };

  return (
    <div>
      {/* Top Filter and SKU Selector Bar */}
      <div className="retail-card" style={{ marginBottom: '1.75rem', padding: '1rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          {/* Search SKU */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '260px' }}>
            <Search size={16} color="#64748B" />
            <input
              type="text"
              placeholder="Search product by name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
              style={{ width: '100%' }}
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="form-select"
          >
            <option value="All">All Categories</option>
            <option value="Electronics">Electronics</option>
            <option value="Apparel">Apparel</option>
            <option value="Home & Kitchen">Home & Kitchen</option>
            <option value="Health & Beauty">Health & Beauty</option>
            <option value="Sports & Outdoors">Sports & Outdoors</option>
          </select>

          {/* Product Dropdown */}
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="form-select"
            style={{ fontWeight: 700, color: '#38BDF8', minWidth: '280px' }}
          >
            {products.map((p) => (
              <option key={p.product_id} value={p.product_id}>
                [{p.product_id}] {p.product_name} (${p.unit_price})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && !productData ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#94A3B8' }}>Loading product metrics...</div>
      ) : productData ? (
        <div>
          {/* Header Card for Selected Product */}
          <div className="retail-card" style={{ marginBottom: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span className="badge badge-blue">{productData.category}</span>
                  <span style={{ fontSize: '0.8rem', color: '#64748B' }}>{productData.subcategory}</span>
                  <span style={{ fontSize: '0.8rem', color: '#475569' }}>|</span>
                  <span style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600 }}>SKU: {productData.product_id}</span>
                </div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#F8FAFC', margin: '0.35rem 0' }}>
                  {productData.product_name}
                </h2>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>Unit Price</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#38BDF8' }}>${productData.unit_price?.toFixed(2)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>Cost Price</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#94A3B8' }}>${productData.cost_price?.toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Product Specific KPIs */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-header">
                <span className="kpi-label">Product Revenue</span>
                <DollarSign size={18} color="#38BDF8" />
              </div>
              <div className="kpi-value">${productData.total_revenue?.toLocaleString()}</div>
              <div className="kpi-footer">
                <span className="badge badge-blue">{productData.units_sold?.toLocaleString()} sold</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-header">
                <span className="kpi-label">Realized Profit</span>
                <TrendingUp size={18} color="#10B981" />
              </div>
              <div className="kpi-value">${productData.total_profit?.toLocaleString()}</div>
              <div className="kpi-footer">
                <span className="delta-badge delta-positive">{productData.realized_margin_pct}% margin</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-header">
                <span className="kpi-label">Current Total Stock</span>
                <Boxes size={18} color="#FBBF24" />
              </div>
              <div className="kpi-value">{productData.current_inventory}</div>
              <div className="kpi-footer">
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Across 20 store locations</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-header">
                <span className="kpi-label">Return Rate</span>
                <RotateCcw size={18} color="#F87171" />
              </div>
              <div className="kpi-value">{productData.return_rate_pct}%</div>
              <div className="kpi-footer">
                <span className={`badge ${productData.return_rate_pct > 8 ? 'badge-high' : 'badge-low'}`}>
                  {productData.return_rate_pct > 8 ? 'HIGH RISK' : 'HEALTHY'}
                </span>
              </div>
            </div>
          </div>

          {/* Row 1: Historical Sales Trend & Demand Forecast Integration */}
          <div className="grid-2">
            {/* 12-Month Sales Trend */}
            <div className="retail-card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">12-Month Sales & Revenue Trajectory</h3>
                  <p className="card-subtitle">Monthly sales volume and revenue trend for this SKU</p>
                </div>
              </div>
              <div style={{ height: '280px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={productData.monthly_sales_trend}>
                    <XAxis dataKey="period" stroke="#64748B" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={11} tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '0.5rem', color: '#F8FAFC' }}
                      formatter={(val, name) => [name === 'revenue' ? `$${val.toLocaleString()}` : `${val} units`, name]}
                    />
                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#0284C7" fill="rgba(2, 132, 199, 0.2)" />
                    <Bar dataKey="units" name="Units Sold" fill="#10B981" radius={[3, 3, 0, 0]} barSize={18} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick Demand Forecast Card */}
            <div className="retail-card" style={{ background: 'linear-gradient(180deg, #1E293B 0%, #0F172A 100%)' }}>
              <div className="card-header">
                <div>
                  <h3 className="card-title">
                    <Cpu size={18} color="#38BDF8" />
                    Machine Learning Demand Forecast
                  </h3>
                  <p className="card-subtitle">30-day projected velocity from {quickForecast?.model_name || 'Gradient Boosting'}</p>
                </div>
                <span className={`badge ${quickForecast?.stockout_risk === 'HIGH' ? 'badge-high' : (quickForecast?.stockout_risk === 'MEDIUM' ? 'badge-medium' : 'badge-low')}`}>
                  {quickForecast?.stockout_risk || 'LOW'} STOCKOUT RISK
                </span>
              </div>

              {quickForecast ? (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', margin: '1rem 0' }}>
                    <div style={{ padding: '1rem', backgroundColor: '#0F172A', borderRadius: '0.5rem', border: '1px solid #334155' }}>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>30-DAY FORECAST DEMAND</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38BDF8' }}>
                        {quickForecast.total_predicted_demand} units
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>~{quickForecast.avg_daily_demand} units/day</div>
                    </div>

                    <div style={{ padding: '1rem', backgroundColor: '#0F172A', borderRadius: '0.5rem', border: '1px solid #334155' }}>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>EXPECTED INVENTORY BALANCE</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: quickForecast.expected_inventory_balance < 0 ? '#F87171' : '#34D399' }}>
                        {quickForecast.expected_inventory_balance > 0 ? `+${quickForecast.expected_inventory_balance}` : quickForecast.expected_inventory_balance} units
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{quickForecast.inventory_status}</div>
                    </div>
                  </div>

                  <div style={{ padding: '0.75rem', backgroundColor: 'rgba(2, 132, 199, 0.1)', borderRadius: '0.5rem', border: '1px solid rgba(2, 132, 199, 0.3)', fontSize: '0.8rem', color: '#CBD5E1' }}>
                    <strong>Model Status:</strong> Evaluated on 192k historical observations. Test RMSE: <strong>{quickForecast.model_metrics?.RMSE || 0.787}</strong>, MAE: <strong>{quickForecast.model_metrics?.MAE || 0.567}</strong>.
                  </div>

                  <button
                    onClick={() => onNavigateToPrediction && onNavigateToPrediction('predictions')}
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: '1.25rem', fontSize: '0.825rem' }}
                  >
                    Open Full Prediction Center <ArrowRight size={14} />
                  </button>
                </div>
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>Computing forecast...</div>
              )}
            </div>
          </div>

          {/* Row 2: Store Breakdown Table */}
          <div className="retail-card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Cross-Store Inventory & Revenue Distribution</h3>
                <p className="card-subtitle">Performance and current stock levels across all 20 retail outlets</p>
              </div>
            </div>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Store Name</th>
                    <th>City & Region</th>
                    <th style={{ textAlign: 'right' }}>Units Sold</th>
                    <th style={{ textAlign: 'right' }}>Total Revenue</th>
                    <th style={{ textAlign: 'right' }}>Current Stock in Store</th>
                    <th>Stockout Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {productData.store_performance?.map((s) => (
                    <tr key={s.store_id}>
                      <td style={{ fontWeight: 600, color: '#F1F5F9' }}>{s.store_name}</td>
                      <td>{s.city}, {s.region}</td>
                      <td style={{ textAlign: 'right' }}>{s.units?.toLocaleString()}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: '#38BDF8' }}>${s.revenue?.toLocaleString()}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>{s.stock}</td>
                      <td>
                        <span className={`badge ${s.stock < 15 ? 'badge-high' : (s.stock < 35 ? 'badge-medium' : 'badge-low')}`}>
                          {s.stock < 15 ? 'HIGH RISK' : (s.stock < 35 ? 'MEDIUM' : 'HEALTHY')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
