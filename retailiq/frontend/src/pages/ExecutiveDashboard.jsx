import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  Percent,
  ShoppingBag,
  Users,
  Package,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Award,
  Store,
  ChevronRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart
} from 'recharts';
import api from '../services/api';

const CATEGORY_COLORS = ['#0284C7', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
const REGION_COLORS = ['#38BDF8', '#34D399', '#FBBF24', '#A78BFA', '#F472B6'];

export default function ExecutiveDashboard({ filters, onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, [filters]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (filters.year && filters.year !== 'All') {
        params.start_date = `${filters.year}-01-01`;
        params.end_date = `${filters.year}-12-31`;
      }
      if (filters.region && filters.region !== 'All') params.region = filters.region;
      if (filters.category && filters.category !== 'All') params.category = filters.category;

      const res = await api.getDashboardKPIs(params);
      setData(res.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError('Failed to retrieve live metrics from FastAPI / MySQL. Please ensure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#94A3B8' }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>Loading Executive Analytics from MySQL...</div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div style={{ padding: '3rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '0.75rem', color: '#F87171' }}>
        <h3>Error Connecting to Backend</h3>
        <p>{error}</p>
        <button onClick={fetchDashboard} className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Retry Query
        </button>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const trends = data?.trends || [];
  const categoryShares = data?.category_shares || [];
  const regionalShares = data?.regional_shares || [];
  const topProducts = data?.top_products || [];
  const topStores = data?.top_stores || [];

  return (
    <div>
      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        {/* 1. Revenue */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Total Revenue</span>
            <div className="kpi-icon-wrap" style={{ color: '#38BDF8', backgroundColor: 'rgba(2, 132, 199, 0.15)' }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div className="kpi-value">{kpis.total_revenue?.formatted || '$0'}</div>
          <div className="kpi-footer">
            <span className={`delta-badge ${kpis.total_revenue?.is_positive ? 'delta-positive' : 'delta-negative'}`}>
              {kpis.total_revenue?.is_positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {kpis.total_revenue?.delta_pct > 0 ? `+${kpis.total_revenue?.delta_pct}%` : `${kpis.total_revenue?.delta_pct}%`}
            </span>
            <span style={{ color: '#64748B', fontSize: '0.75rem' }}>vs previous period</span>
          </div>
        </div>

        {/* 2. Profit */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Total Net Profit</span>
            <div className="kpi-icon-wrap" style={{ color: '#34D399', backgroundColor: 'rgba(16, 185, 129, 0.15)' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="kpi-value">{kpis.total_profit?.formatted || '$0'}</div>
          <div className="kpi-footer">
            <span className={`delta-badge ${kpis.total_profit?.is_positive ? 'delta-positive' : 'delta-negative'}`}>
              {kpis.total_profit?.is_positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {kpis.total_profit?.delta_pct > 0 ? `+${kpis.total_profit?.delta_pct}%` : `${kpis.total_profit?.delta_pct}%`}
            </span>
            <span style={{ color: '#64748B', fontSize: '0.75rem' }}>vs prior benchmark</span>
          </div>
        </div>

        {/* 3. Margin */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Profit Margin</span>
            <div className="kpi-icon-wrap" style={{ color: '#FBBF24', backgroundColor: 'rgba(245, 158, 11, 0.15)' }}>
              <Percent size={18} />
            </div>
          </div>
          <div className="kpi-value">{kpis.profit_margin?.formatted || '0%'}</div>
          <div className="kpi-footer">
            <span className={`delta-badge ${kpis.profit_margin?.is_positive ? 'delta-positive' : 'delta-negative'}`}>
              {kpis.profit_margin?.is_positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {kpis.profit_margin?.delta_pct > 0 ? `+${kpis.profit_margin?.delta_pct}%` : `${kpis.profit_margin?.delta_pct}%`}
            </span>
            <span style={{ color: '#64748B', fontSize: '0.75rem' }}>pts margin variance</span>
          </div>
        </div>

        {/* 4. Orders */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Total Orders</span>
            <div className="kpi-icon-wrap" style={{ color: '#A78BFA', backgroundColor: 'rgba(139, 92, 246, 0.15)' }}>
              <ShoppingBag size={18} />
            </div>
          </div>
          <div className="kpi-value">{kpis.total_orders?.formatted || '0'}</div>
          <div className="kpi-footer">
            <span className={`delta-badge ${kpis.total_orders?.is_positive ? 'delta-positive' : 'delta-negative'}`}>
              {kpis.total_orders?.is_positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {kpis.total_orders?.delta_pct > 0 ? `+${kpis.total_orders?.delta_pct}%` : `${kpis.total_orders?.delta_pct}%`}
            </span>
            <span style={{ color: '#64748B', fontSize: '0.75rem' }}>fulfilled transactions</span>
          </div>
        </div>

        {/* 5. Customers */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Active Customers</span>
            <div className="kpi-icon-wrap" style={{ color: '#38BDF8', backgroundColor: 'rgba(2, 132, 199, 0.15)' }}>
              <Users size={18} />
            </div>
          </div>
          <div className="kpi-value">{kpis.unique_customers?.formatted || '0'}</div>
          <div className="kpi-footer">
            <span className={`delta-badge ${kpis.unique_customers?.is_positive ? 'delta-positive' : 'delta-negative'}`}>
              {kpis.unique_customers?.is_positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {kpis.unique_customers?.delta_pct > 0 ? `+${kpis.unique_customers?.delta_pct}%` : `${kpis.unique_customers?.delta_pct}%`}
            </span>
            <span style={{ color: '#64748B', fontSize: '0.75rem' }}>active roster</span>
          </div>
        </div>

        {/* 6. Units Sold */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Units Sold</span>
            <div className="kpi-icon-wrap" style={{ color: '#34D399', backgroundColor: 'rgba(16, 185, 129, 0.15)' }}>
              <Package size={18} />
            </div>
          </div>
          <div className="kpi-value">{kpis.units_sold?.formatted || '0'}</div>
          <div className="kpi-footer">
            <span className={`delta-badge ${kpis.units_sold?.is_positive ? 'delta-positive' : 'delta-negative'}`}>
              {kpis.units_sold?.is_positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {kpis.units_sold?.delta_pct > 0 ? `+${kpis.units_sold?.delta_pct}%` : `${kpis.units_sold?.delta_pct}%`}
            </span>
            <span style={{ color: '#64748B', fontSize: '0.75rem' }}>merchandised volume</span>
          </div>
        </div>

        {/* 7. AOV */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Average Order Value</span>
            <div className="kpi-icon-wrap" style={{ color: '#F472B6', backgroundColor: 'rgba(236, 72, 153, 0.15)' }}>
              <CreditCard size={18} />
            </div>
          </div>
          <div className="kpi-value">{kpis.average_order_value?.formatted || '$0'}</div>
          <div className="kpi-footer">
            <span className={`delta-badge ${kpis.average_order_value?.is_positive ? 'delta-positive' : 'delta-negative'}`}>
              {kpis.average_order_value?.is_positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {kpis.average_order_value?.delta_pct > 0 ? `+${kpis.average_order_value?.delta_pct}%` : `${kpis.average_order_value?.delta_pct}%`}
            </span>
            <span style={{ color: '#64748B', fontSize: '0.75rem' }}>ticket depth</span>
          </div>
        </div>

        {/* 8. YoY Growth */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">YoY Growth Momentum</span>
            <div className="kpi-icon-wrap" style={{ color: '#38BDF8', backgroundColor: 'rgba(2, 132, 199, 0.15)' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="kpi-value">{kpis.yoy_growth?.formatted || '+0.0%'}</div>
          <div className="kpi-footer">
            <span className="badge badge-blue">ANNUAL PACE</span>
            <span style={{ color: '#64748B', fontSize: '0.75rem' }}>vs previous fiscal year</span>
          </div>
        </div>
      </div>

      {/* Row 1: Revenue & Profit Dual Axis Trend */}
      <div className="retail-card" style={{ marginBottom: '1.75rem' }}>
        <div className="card-header">
          <div>
            <h2 className="card-title">
              <TrendingUp size={18} color="#38BDF8" />
              Monthly Revenue vs Profit Trajectory
            </h2>
            <p className="card-subtitle">
              Net revenue, gross profit, and blended margin performance across the fiscal period
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span className="badge badge-blue">MySQL Analytical Aggregation</span>
          </div>
        </div>

        <div style={{ height: '360px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={trends} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284C7" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#0284C7" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="period" stroke="#64748B" fontSize={11} tickLine={false} />
              <YAxis yAxisId="left" stroke="#64748B" fontSize={11} tickFormatter={(val) => `$${(val / 1000000).toFixed(1)}M`} />
              <YAxis yAxisId="right" orientation="right" stroke="#F59E0B" fontSize={11} tickFormatter={(val) => `${val}%`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '0.5rem', color: '#F8FAFC' }}
                formatter={(val, name) => {
                  if (name === 'Margin %') return [`${val}%`, name];
                  return [`$${val.toLocaleString()}`, name];
                }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Area yAxisId="left" type="monotone" dataKey="revenue" name="Net Revenue" stroke="#0284C7" strokeWidth={2} fillOpacity={1} fill="url(#revenueGrad)" />
              <Bar yAxisId="left" dataKey="profit" name="Net Profit" fill="#10B981" radius={[4, 4, 0, 0]} opacity={0.85} barSize={22} />
              <Line yAxisId="right" type="monotone" dataKey="margin_pct" name="Margin %" stroke="#F59E0B" strokeWidth={2.5} dot={{ r: 3, fill: '#F59E0B' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: Category Mix & Regional Performance */}
      <div className="grid-2">
        {/* Category Share Donut */}
        <div className="retail-card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Revenue by Merchandise Category</h2>
              <p className="card-subtitle">Volume contribution and category revenue distribution</p>
            </div>
          </div>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryShares}
                  dataKey="revenue"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={105}
                  paddingAngle={3}
                >
                  {categoryShares.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '0.5rem', color: '#F8FAFC' }}
                  formatter={(val, name, item) => [`$${val.toLocaleString()} (${item.payload.revenue_share_pct}%)`, name]}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Regional Bar Chart */}
        <div className="retail-card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Regional Revenue & Profit Contribution</h2>
              <p className="card-subtitle">Regional market penetration across North, West, South, Central, East</p>
            </div>
          </div>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionalShares} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <XAxis dataKey="region" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickFormatter={(val) => `$${(val / 1000000).toFixed(1)}M`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '0.5rem', color: '#F8FAFC' }}
                  formatter={(val, name) => [`$${val.toLocaleString()}`, name]}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                <Bar dataKey="revenue" name="Revenue" fill="#0284C7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" name="Profit" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Top Products & Top Stores Leaderboards */}
      <div className="grid-2">
        {/* Top 5 Products */}
        <div className="retail-card">
          <div className="card-header">
            <div>
              <h2 className="card-title">
                <Award size={18} color="#FBBF24" />
                Top 5 Revenue Flagship Products
              </h2>
              <p className="card-subtitle">Highest grossing SKUs across store network</p>
            </div>
            <button onClick={() => onNavigate('products')} className="btn btn-secondary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}>
              Catalog View <ChevronRight size={12} />
            </button>
          </div>

          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th style={{ textAlign: 'right' }}>Units Sold</th>
                  <th style={{ textAlign: 'right' }}>Net Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p, idx) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{
                          width: '1.4rem',
                          height: '1.4rem',
                          borderRadius: '0.3rem',
                          backgroundColor: idx === 0 ? 'rgba(245, 158, 11, 0.2)' : '#1E293B',
                          color: idx === 0 ? '#FBBF24' : '#94A3B8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 700
                        }}>
                          {idx + 1}
                        </span>
                        <div>
                          <div style={{ fontWeight: 600, color: '#F1F5F9' }}>{p.name}</div>
                          <div style={{ fontSize: '0.7rem', color: '#64748B' }}>SKU: {p.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-blue">{p.subtitle}</span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{p.secondary_formatted}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#38BDF8' }}>{p.metric_formatted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top 5 Stores */}
        <div className="retail-card">
          <div className="card-header">
            <div>
              <h2 className="card-title">
                <Store size={18} color="#34D399" />
                Top 5 High-Performing Retail Stores
              </h2>
              <p className="card-subtitle">Leading brick-and-mortar locations by net sales</p>
            </div>
            <button onClick={() => onNavigate('stores')} className="btn btn-secondary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}>
              Store Rankings <ChevronRight size={12} />
            </button>
          </div>

          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Store</th>
                  <th>Location</th>
                  <th style={{ textAlign: 'right' }}>Orders</th>
                  <th style={{ textAlign: 'right' }}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topStores.map((s, idx) => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{
                          width: '1.4rem',
                          height: '1.4rem',
                          borderRadius: '0.3rem',
                          backgroundColor: idx === 0 ? 'rgba(16, 185, 129, 0.2)' : '#1E293B',
                          color: idx === 0 ? '#34D399' : '#94A3B8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 700
                        }}>
                          {idx + 1}
                        </span>
                        <div>
                          <div style={{ fontWeight: 600, color: '#F1F5F9' }}>{s.name}</div>
                          <div style={{ fontSize: '0.7rem', color: '#64748B' }}>ID: {s.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>{s.subtitle}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{s.secondary_formatted}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#10B981' }}>{s.metric_formatted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
