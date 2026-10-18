import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  Percent,
  ShoppingBag,
  RotateCcw,
  Tag,
  CreditCard,
  Layers,
  ArrowUpRight,
  ArrowDownRight
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
  BarChart,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import api from '../services/api';

const PAY_COLORS = ['#0284C7', '#10B981', '#8B5CF6', '#F59E0B'];

export default function SalesAnalytics({ filters }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSales();
  }, [filters]);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.year && filters.year !== 'All') params.year = parseInt(filters.year);
      if (filters.region && filters.region !== 'All') params.region = filters.region;
      if (filters.category && filters.category !== 'All') params.category = filters.category;

      const res = await api.getSalesAnalytics(params);
      setData(res.data);
    } catch (err) {
      console.error('Failed to load sales analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: '#94A3B8' }}>Loading Sales Data from MySQL...</div>;
  }

  const summary = data?.summary || {};
  const trajectory = data?.monthly_trajectory || [];
  const discountImpact = data?.discount_impact || [];
  const paymentMethods = data?.payment_methods || [];
  const returnsImpact = data?.returns_impact || [];

  return (
    <div>
      {/* Macro Sales Metric Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Gross Net Sales</span>
            <DollarSign size={18} color="#38BDF8" />
          </div>
          <div className="kpi-value">${summary.revenue?.toLocaleString() || '0'}</div>
          <div className="kpi-footer">
            <span className="badge badge-blue">{summary.units_sold?.toLocaleString()} units</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Total Realized Profit</span>
            <TrendingUp size={18} color="#34D399" />
          </div>
          <div className="kpi-value">${summary.profit?.toLocaleString() || '0'}</div>
          <div className="kpi-footer">
            <span className="delta-badge delta-positive">{summary.margin_pct}% margin</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Average Order Value</span>
            <CreditCard size={18} color="#FBBF24" />
          </div>
          <div className="kpi-value">${summary.aov?.toFixed(2) || '0.00'}</div>
          <div className="kpi-footer">
            <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>{summary.orders?.toLocaleString()} total orders</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Merchandise Return Rate</span>
            <RotateCcw size={18} color="#F87171" />
          </div>
          <div className="kpi-value" style={{ color: summary.return_rate_pct > 8 ? '#F87171' : '#F1F5F9' }}>
            {summary.return_rate_pct}%
          </div>
          <div className="kpi-footer">
            <span className="badge badge-medium">Return Frequency</span>
          </div>
        </div>
      </div>

      {/* Row 1: Monthly Sales Trajectory with MoM & YoY Growth */}
      <div className="retail-card" style={{ marginBottom: '1.75rem' }}>
        <div className="card-header">
          <div>
            <h2 className="card-title">
              <TrendingUp size={18} color="#38BDF8" />
              Monthly Sales Trajectory & Growth Dynamics
            </h2>
            <p className="card-subtitle">
              Net revenue volume coupled with Month-over-Month (MoM) and Year-over-Year (YoY) percentage changes
            </p>
          </div>
        </div>

        <div style={{ height: '350px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={trajectory} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <XAxis dataKey="period" stroke="#64748B" fontSize={11} tickLine={false} />
              <YAxis yAxisId="left" stroke="#64748B" fontSize={11} tickFormatter={(val) => `$${(val / 1000000).toFixed(1)}M`} />
              <YAxis yAxisId="right" orientation="right" stroke="#38BDF8" fontSize={11} tickFormatter={(val) => `${val}%`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '0.5rem', color: '#F8FAFC' }}
                formatter={(val, name) => {
                  if (name.includes('Growth') || name.includes('Margin')) return [`${val}%`, name];
                  return [`$${val.toLocaleString()}`, name];
                }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Bar yAxisId="left" dataKey="revenue" name="Net Revenue" fill="#0284C7" radius={[4, 4, 0, 0]} barSize={24} />
              <Line yAxisId="right" type="monotone" dataKey="mom_growth_pct" name="MoM Growth %" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} />
              <Line yAxisId="right" type="monotone" dataKey="yoy_growth_pct" name="YoY Growth %" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: Discount Impact & Payment Methods */}
      <div className="grid-2">
        {/* Discount Tier Impact */}
        <div className="retail-card">
          <div className="card-header">
            <div>
              <h2 className="card-title">
                <Tag size={18} color="#FBBF24" />
                Discount Impact on Profitability & Volume
              </h2>
              <p className="card-subtitle">Margin compression vs incremental transaction lift by discount tier</p>
            </div>
          </div>

          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Discount Tier</th>
                  <th style={{ textAlign: 'right' }}>Orders</th>
                  <th style={{ textAlign: 'right' }}>Revenue</th>
                  <th style={{ textAlign: 'right' }}>Discount Given</th>
                  <th style={{ textAlign: 'right' }}>Margin %</th>
                </tr>
              </thead>
              <tbody>
                {discountImpact.map((d) => (
                  <tr key={d.tier}>
                    <td style={{ fontWeight: 600 }}>{d.tier}</td>
                    <td style={{ textAlign: 'right' }}>{d.orders?.toLocaleString()}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: '#38BDF8' }}>${d.net_revenue?.toLocaleString()}</td>
                    <td style={{ textAlign: 'right', color: '#F87171' }}>-${d.discount_amount?.toLocaleString()}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: d.margin_pct < 45 ? '#FBBF24' : '#34D399' }}>
                      {d.margin_pct}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Method Breakdown */}
        <div className="retail-card">
          <div className="card-header">
            <div>
              <h2 className="card-title">
                <CreditCard size={18} color="#38BDF8" />
                Payment Method Revenue Share
              </h2>
              <p className="card-subtitle">Channel preferences across credit cards, digital wallets, and cash</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', height: '260px' }}>
            <div style={{ flex: 1, height: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentMethods}
                    dataKey="revenue"
                    nameKey="method"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {paymentMethods.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PAY_COLORS[index % PAY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '0.5rem', color: '#F8FAFC' }}
                    formatter={(val, name, item) => [`$${val.toLocaleString()} (${item.payload.share_pct}%)`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div style={{ width: '45%', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {paymentMethods.map((p, idx) => (
                <div key={p.method} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: PAY_COLORS[idx % PAY_COLORS.length] }} />
                    <span style={{ color: '#E2E8F0', fontWeight: 500 }}>{p.method}</span>
                  </div>
                  <span style={{ fontWeight: 700, color: '#38BDF8' }}>{p.share_pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Returns Impact by Category */}
      <div className="retail-card">
        <div className="card-header">
          <div>
            <h2 className="card-title">
              <RotateCcw size={18} color="#F87171" />
              Customer Returns & Refund Dilution by Category
            </h2>
            <p className="card-subtitle">Product return rates and total revenue refunded to customers</p>
          </div>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product Category</th>
                <th style={{ textAlign: 'right' }}>Total Orders</th>
                <th style={{ textAlign: 'right' }}>Return Count</th>
                <th style={{ textAlign: 'right' }}>Return Rate %</th>
                <th style={{ textAlign: 'right' }}>Total Refunded Amount</th>
                <th>Return Severity</th>
              </tr>
            </thead>
            <tbody>
              {returnsImpact.map((r) => (
                <tr key={r.category}>
                  <td style={{ fontWeight: 600, color: '#F1F5F9' }}>{r.category}</td>
                  <td style={{ textAlign: 'right' }}>{r.orders?.toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>{r.returns?.toLocaleString()}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>{r.return_rate_pct}%</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: '#F87171' }}>-${r.refunded_amount?.toLocaleString()}</td>
                  <td>
                    <span className={`badge ${r.return_rate_pct > 10 ? 'badge-high' : (r.return_rate_pct > 4 ? 'badge-medium' : 'badge-low')}`}>
                      {r.return_rate_pct > 10 ? 'HIGH' : (r.return_rate_pct > 4 ? 'MODERATE' : 'LOW')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
