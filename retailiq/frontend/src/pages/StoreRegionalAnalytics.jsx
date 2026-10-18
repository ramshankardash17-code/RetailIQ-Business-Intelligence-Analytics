import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Store,
  DollarSign,
  TrendingUp,
  Percent,
  Layers,
  Award,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Cell
} from 'recharts';
import api from '../services/api';

const REGION_COLORS = {
  'West': '#0284C7',
  'North': '#10B981',
  'South': '#F59E0B',
  'Central': '#8B5CF6',
  'East': '#EC4899'
};

export default function StoreRegionalAnalytics({ filters }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('total_revenue');
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    fetchStoreAnalytics();
  }, [filters]);

  const fetchStoreAnalytics = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.region && filters.region !== 'All') params.region = filters.region;
      const res = await api.getStoreAnalytics(params);
      setData(res.data);
    } catch (err) {
      console.error('Failed to load store analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: '#94A3B8' }}>Loading Store Footprint Analytics...</div>;
  }

  const regionalSummary = data?.regional_summary || [];
  let storeRankings = [...(data?.store_rankings || [])];

  // Sorting
  storeRankings.sort((a, b) => {
    const valA = a[sortBy];
    const valB = b[sortBy];
    if (sortAsc) return valA > valB ? 1 : -1;
    return valA < valB ? 1 : -1;
  });

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(field);
      setSortAsc(false);
    }
  };

  return (
    <div>
      {/* Regional Performance Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
        {regionalSummary.map((reg) => (
          <div key={reg.region} className="kpi-card" style={{ borderLeft: `4px solid ${REGION_COLORS[reg.region] || '#0284C7'}` }}>
            <div className="kpi-header">
              <span className="kpi-label">{reg.region} Region</span>
              <span className="badge badge-blue">{reg.store_count} Stores</span>
            </div>
            <div className="kpi-value">${(reg.revenue / 1000000).toFixed(2)}M</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.65rem', fontSize: '0.8rem' }}>
              <span style={{ color: '#94A3B8' }}>Profit: <strong style={{ color: '#10B981' }}>${(reg.profit / 1000000).toFixed(2)}M</strong></span>
              <span className="delta-badge delta-positive">{reg.margin_pct}% margin</span>
            </div>
            <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#64748B' }}>
              Revenue per sqft: <strong style={{ color: '#F1F5F9' }}>${reg.rev_per_sqft}</strong> ({reg.share_pct}% market share)
            </div>
          </div>
        ))}
      </div>

      {/* Row 1: Regional Comparison Chart */}
      <div className="retail-card" style={{ marginBottom: '1.75rem' }}>
        <div className="card-header">
          <div>
            <h2 className="card-title">Regional Footprint Revenue & Margin Comparison</h2>
            <p className="card-subtitle">Aggregated retail revenue and operating margins across primary territories</p>
          </div>
        </div>

        <div style={{ height: '300px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={regionalSummary} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
              <XAxis dataKey="region" stroke="#64748B" fontSize={12} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={11} tickFormatter={(val) => `$${(val / 1000000).toFixed(1)}M`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '0.5rem', color: '#F8FAFC' }}
                formatter={(val, name) => [`$${val.toLocaleString()}`, name]}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Bar dataKey="revenue" name="Regional Revenue" fill="#0284C7" radius={[4, 4, 0, 0]}>
                {regionalSummary.map((entry) => (
                  <Cell key={`cell-${entry.region}`} fill={REGION_COLORS[entry.region] || '#0284C7'} />
                ))}
              </Bar>
              <Bar dataKey="profit" name="Net Profit" fill="#10B981" radius={[4, 4, 0, 0]} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: Comprehensive Store Performance Ranking Table */}
      <div className="retail-card">
        <div className="card-header">
          <div>
            <h2 className="card-title">
              <Store size={18} color="#34D399" />
              Retail Store Performance Rankings (All 20 Locations)
            </h2>
            <p className="card-subtitle">
              Sortable multi-store financial efficiency, orders fulfilled, square footage, and regional rankings
            </p>
          </div>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('store_name')}>
                  Store Name {sortBy === 'store_name' && (sortAsc ? '▲' : '▼')}
                </th>
                <th>Region</th>
                <th>Format</th>
                <th style={{ textAlign: 'right', cursor: 'pointer' }} onClick={() => handleSort('square_feet')}>
                  Sq Ft {sortBy === 'square_feet' && (sortAsc ? '▲' : '▼')}
                </th>
                <th style={{ textAlign: 'right', cursor: 'pointer' }} onClick={() => handleSort('total_orders')}>
                  Orders {sortBy === 'total_orders' && (sortAsc ? '▲' : '▼')}
                </th>
                <th style={{ textAlign: 'right', cursor: 'pointer' }} onClick={() => handleSort('total_revenue')}>
                  Net Revenue {sortBy === 'total_revenue' && (sortAsc ? '▲' : '▼')}
                </th>
                <th style={{ textAlign: 'right', cursor: 'pointer' }} onClick={() => handleSort('total_profit')}>
                  Profit {sortBy === 'total_profit' && (sortAsc ? '▲' : '▼')}
                </th>
                <th style={{ textAlign: 'right', cursor: 'pointer' }} onClick={() => handleSort('profit_margin_pct')}>
                  Margin % {sortBy === 'profit_margin_pct' && (sortAsc ? '▲' : '▼')}
                </th>
                <th style={{ textAlign: 'right', cursor: 'pointer' }} onClick={() => handleSort('revenue_per_sqft')}>
                  Rev / SqFt {sortBy === 'revenue_per_sqft' && (sortAsc ? '▲' : '▼')}
                </th>
                <th style={{ textAlign: 'center' }}>Regional Rank</th>
              </tr>
            </thead>
            <tbody>
              {storeRankings.map((s, idx) => (
                <tr key={s.store_id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{
                        width: '1.4rem',
                        height: '1.4rem',
                        borderRadius: '0.3rem',
                        backgroundColor: idx < 3 ? 'rgba(16, 185, 129, 0.2)' : '#1E293B',
                        color: idx < 3 ? '#34D399' : '#94A3B8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}>
                        {idx + 1}
                      </span>
                      <div>
                        <div style={{ fontWeight: 600, color: '#F1F5F9' }}>{s.store_name}</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748B' }}>{s.city}, {s.state} ({s.store_id})</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{
                      backgroundColor: `${REGION_COLORS[s.region] || '#0284C7'}25`,
                      color: REGION_COLORS[s.region] || '#38BDF8',
                      padding: '0.15rem 0.45rem',
                      borderRadius: '0.3rem',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}>
                      {s.region}
                    </span>
                  </td>
                  <td>{s.store_type}</td>
                  <td style={{ textAlign: 'right' }}>{s.square_feet?.toLocaleString()} sqft</td>
                  <td style={{ textAlign: 'right' }}>{s.total_orders?.toLocaleString()}</td>
                  <td style={{ textAlign: 'right', fontWeight: 800, color: '#38BDF8' }}>${s.total_revenue?.toLocaleString()}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#10B981' }}>${s.total_profit?.toLocaleString()}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: s.profit_margin_pct < 48 ? '#FBBF24' : '#34D399' }}>
                    {s.profit_margin_pct}%
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: '#F1F5F9' }}>${s.revenue_per_sqft}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="badge badge-blue">#{s.regional_rank} in {s.region}</span>
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
