import React, { useState, useEffect } from 'react';
import {
  Users,
  Award,
  DollarSign,
  TrendingUp,
  RotateCcw,
  Search,
  UserCheck,
  UserX,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import api from '../services/api';

const SEGMENT_COLORS = {
  'Champions': '#10B981',
  'Loyal Customers': '#0284C7',
  'Potential Loyalists': '#8B5CF6',
  'At Risk': '#F59E0B',
  'Lost Customers': '#EF4444'
};

export default function CustomerAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.getCustomerRFM();
      setData(res.data);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: '#94A3B8' }}>Loading Customer Intelligence from MySQL...</div>;
  }

  const summary = data?.summary || {};
  const segments = data?.segments || [];
  const topCustomers = data?.top_customers || [];

  const filteredCustomers = topCustomers.filter((c) =>
    c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.customer_id?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Customer Macro KPIs */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Total Customer Base</span>
            <Users size={18} color="#38BDF8" />
          </div>
          <div className="kpi-value">{summary.total_customers?.toLocaleString()}</div>
          <div className="kpi-footer">
            <span className="badge badge-blue">{summary.repeat_rate_pct}% Repeat Rate</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Repeat Buyers</span>
            <UserCheck size={18} color="#10B981" />
          </div>
          <div className="kpi-value">{summary.repeat_customers?.toLocaleString()}</div>
          <div className="kpi-footer">
            <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>{summary.new_customers?.toLocaleString()} one-time buyers</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Average Lifetime Value (CLV)</span>
            <DollarSign size={18} color="#FBBF24" />
          </div>
          <div className="kpi-value">${summary.avg_clv?.toLocaleString()}</div>
          <div className="kpi-footer">
            <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>Across multi-year tenure</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Order Frequency</span>
            <RotateCcw size={18} color="#A78BFA" />
          </div>
          <div className="kpi-value">{summary.avg_frequency} orders</div>
          <div className="kpi-footer">
            <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>Avg ticket: ${summary.overall_aov}</span>
          </div>
        </div>
      </div>

      {/* Row 1: RFM Segmentation Matrix & Value Distribution */}
      <div className="grid-2">
        {/* Customer Base Share by Segment */}
        <div className="retail-card">
          <div className="card-header">
            <div>
              <h2 className="card-title">RFM Customer Count Distribution</h2>
              <p className="card-subtitle">Customer base breakdown by recency, frequency, and monetary clusters</p>
            </div>
          </div>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={segments}
                  dataKey="customer_count"
                  nameKey="segment"
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={100}
                  paddingAngle={3}
                >
                  {segments.map((entry) => (
                    <Cell key={entry.segment} fill={SEGMENT_COLORS[entry.segment] || '#0284C7'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '0.5rem', color: '#F8FAFC' }}
                  formatter={(val, name, item) => [`${val.toLocaleString()} (${item.payload.pct_of_customers}%)`, name]}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Contribution by Segment */}
        <div className="retail-card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Revenue Generated by RFM Segment</h2>
              <p className="card-subtitle">Disproportionate monetary contribution from Champions and Loyal segments</p>
            </div>
          </div>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={segments} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <XAxis dataKey="segment" stroke="#64748B" fontSize={10} tickLine={false} interval={0} />
                <YAxis stroke="#64748B" fontSize={11} tickFormatter={(val) => `$${(val / 1000000).toFixed(1)}M`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '0.5rem', color: '#F8FAFC' }}
                  formatter={(val, name, item) => [`$${val.toLocaleString()} (${item.payload.pct_of_revenue}% of Total)`, 'Revenue']}
                />
                <Bar dataKey="total_revenue" name="Segment Revenue" radius={[4, 4, 0, 0]}>
                  {segments.map((entry) => (
                    <Cell key={entry.segment} fill={SEGMENT_COLORS[entry.segment] || '#0284C7'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Segment Breakdown Table */}
      <div className="retail-card" style={{ marginBottom: '1.75rem' }}>
        <div className="card-header">
          <div>
            <h2 className="card-title">RFM Segment Architecture & Behavioral Profiles</h2>
            <p className="card-subtitle">Recency, Frequency, Spend, and Churn Risk Indicators</p>
          </div>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Segment Name</th>
                <th style={{ textAlign: 'right' }}>Customers</th>
                <th style={{ textAlign: 'right' }}>% Customer Base</th>
                <th style={{ textAlign: 'right' }}>Avg Frequency</th>
                <th style={{ textAlign: 'right' }}>Avg Ticket (AOV)</th>
                <th style={{ textAlign: 'right' }}>Total Revenue</th>
                <th style={{ textAlign: 'right' }}>% Revenue Share</th>
                <th>Churn Risk</th>
              </tr>
            </thead>
            <tbody>
              {segments.map((s) => (
                <tr key={s.segment}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: SEGMENT_COLORS[s.segment] || '#0284C7' }} />
                      <span style={{ fontWeight: 700, color: '#F1F5F9' }}>{s.segment}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>{s.customer_count?.toLocaleString()}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{s.pct_of_customers}%</td>
                  <td style={{ textAlign: 'right' }}>{s.avg_frequency} orders</td>
                  <td style={{ textAlign: 'right' }}>${s.avg_order_value?.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#38BDF8' }}>${s.total_revenue?.toLocaleString()}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#10B981' }}>{s.pct_of_revenue}%</td>
                  <td>
                    <span className={`badge ${s.churn_risk === 'Critical' ? 'badge-high' : (s.churn_risk === 'High' ? 'badge-medium' : 'badge-low')}`}>
                      {s.churn_risk}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row 3: High-Value VIP Customer Leaderboard */}
      <div className="retail-card">
        <div className="card-header">
          <div>
            <h2 className="card-title">
              <Award size={18} color="#FBBF24" />
              High-Value VIP Customer Leaderboard (Top Lifetime Spend)
            </h2>
            <p className="card-subtitle">Highest lifetime value accounts and recent purchase activity</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Search size={14} color="#64748B" />
            <input
              type="text"
              placeholder="Search VIP customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.65rem' }}
            />
          </div>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Region</th>
                <th>Segment</th>
                <th style={{ textAlign: 'right' }}>Orders Placed</th>
                <th style={{ textAlign: 'right' }}>Average Ticket</th>
                <th style={{ textAlign: 'right' }}>Lifetime Spend</th>
                <th style={{ textAlign: 'right' }}>Days Since Last Order</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((c) => (
                <tr key={c.customer_id}>
                  <td>
                    <div>
                      <div style={{ fontWeight: 600, color: '#F1F5F9' }}>{c.full_name}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B' }}>{c.email} ({c.customer_id})</div>
                    </div>
                  </td>
                  <td>{c.region}</td>
                  <td>
                    <span style={{
                      backgroundColor: `${SEGMENT_COLORS[c.segment] || '#0284C7'}25`,
                      color: SEGMENT_COLORS[c.segment] || '#38BDF8',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '0.35rem',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}>
                      {c.segment}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{c.total_orders}</td>
                  <td style={{ textAlign: 'right' }}>${c.avg_order_value?.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 800, color: '#38BDF8' }}>${c.monetary_value?.toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>
                    <span style={{ color: c.recency_days > 90 ? '#F87171' : '#34D399', fontWeight: 600 }}>
                      {c.recency_days} days ago
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => setSelectedCustomer(c)}
                      className="btn btn-secondary"
                      style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                    >
                      Inspect Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Drawer Modal */}
      {selectedCustomer && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 60,
          padding: '1.5rem'
        }}>
          <div style={{
            backgroundColor: '#0F172A',
            border: '1px solid #334155',
            borderRadius: '1rem',
            width: '100%',
            maxWidth: '560px',
            padding: '1.75rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <span className="badge badge-blue">{selectedCustomer.segment}</span>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#F8FAFC', margin: '0.3rem 0' }}>
                  {selectedCustomer.full_name}
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                  ID: {selectedCustomer.customer_id} | Member since {selectedCustomer.signup_date}
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ padding: '0.85rem', backgroundColor: '#1E293B', borderRadius: '0.5rem' }}>
                <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>LIFETIME VALUE</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#38BDF8' }}>${selectedCustomer.monetary_value?.toLocaleString()}</div>
              </div>
              <div style={{ padding: '0.85rem', backgroundColor: '#1E293B', borderRadius: '0.5rem' }}>
                <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>TOTAL ORDERS</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#10B981' }}>{selectedCustomer.total_orders} orders</div>
              </div>
              <div style={{ padding: '0.85rem', backgroundColor: '#1E293B', borderRadius: '0.5rem' }}>
                <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>AVERAGE BASKET (AOV)</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#FBBF24' }}>${selectedCustomer.avg_order_value?.toFixed(2)}</div>
              </div>
              <div style={{ padding: '0.85rem', backgroundColor: '#1E293B', borderRadius: '0.5rem' }}>
                <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>LAST ORDER DATE</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F1F5F9' }}>{selectedCustomer.last_order_date}</div>
              </div>
            </div>

            <div style={{ padding: '0.85rem', backgroundColor: 'rgba(2, 132, 199, 0.1)', borderRadius: '0.5rem', border: '1px solid rgba(2, 132, 199, 0.3)', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38BDF8', marginBottom: '0.25rem' }}>
                STRATEGIC RETENTION DIRECTIVE:
              </div>
              <p style={{ fontSize: '0.825rem', color: '#CBD5E1', margin: 0 }}>
                {selectedCustomer.segment === 'Champions'
                  ? 'Assign VIP loyalty manager, complimentary priority shipping, and early access to Black Friday catalog.'
                  : (selectedCustomer.segment === 'At Risk'
                    ? 'Deploy automated re-engagement win-back voucher (+15% discount for 14 days).'
                    : 'Recommend cross-category product offerings to accelerate frequency.')}
              </p>
            </div>

            <button
              onClick={() => setSelectedCustomer(null)}
              className="btn btn-secondary"
              style={{ width: '100%' }}
            >
              Close Profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
