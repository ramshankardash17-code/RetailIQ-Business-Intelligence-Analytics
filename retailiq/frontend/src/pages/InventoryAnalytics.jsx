import React, { useState, useEffect } from 'react';
import {
  Boxes,
  AlertTriangle,
  RotateCcw,
  Clock,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  ArrowRight,
  Filter
} from 'lucide-react';
import api from '../services/api';

export default function InventoryAnalytics({ filters, onNavigateToPrediction }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [riskFilter, setRiskFilter] = useState('All');

  useEffect(() => {
    fetchInventory();
  }, [filters, riskFilter]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.region && filters.region !== 'All') params.region = filters.region;
      if (riskFilter !== 'All') params.risk_filter = riskFilter;
      const res = await api.getInventoryAnalytics(params);
      setData(res.data);
    } catch (err) {
      console.error('Failed to load inventory analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: '#94A3B8' }}>Loading Supply Chain Inventory from MySQL...</div>;
  }

  const health = data?.health_summary || {};
  const riskTable = data?.risk_table || [];
  const fastMoving = data?.fast_moving || [];
  const slowMoving = data?.slow_moving || [];

  return (
    <div>
      {/* Inventory Health Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Total Inventory Valuation</span>
            <Boxes size={18} color="#38BDF8" />
          </div>
          <div className="kpi-value">${health.total_inventory_value ? (health.total_inventory_value / 1000000).toFixed(2) : '0'}M</div>
          <div className="kpi-footer">
            <span className="badge badge-blue">{health.total_stock_units?.toLocaleString()} total units</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Inventory Turnover Ratio</span>
            <RotateCcw size={18} color="#10B981" />
          </div>
          <div className="kpi-value">{health.inventory_turnover_ratio}x</div>
          <div className="kpi-footer">
            <span className="delta-badge delta-positive">Annual Velocity</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Days of Inventory Remaining</span>
            <Clock size={18} color="#FBBF24" />
          </div>
          <div className="kpi-value">{health.avg_days_of_inventory} days</div>
          <div className="kpi-footer">
            <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>Average stock coverage</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Critical Stockout Alerts</span>
            <ShieldAlert size={18} color="#F87171" />
          </div>
          <div className="kpi-value" style={{ color: '#F87171' }}>
            {health.high_risk_count} SKUs
          </div>
          <div className="kpi-footer">
            <span className="badge badge-high">{health.medium_risk_count} Medium Risk</span>
          </div>
        </div>
      </div>

      {/* Row 1: Fast-Moving vs Slow-Moving Merchandise */}
      <div className="grid-2">
        {/* Fast Moving */}
        <div className="retail-card">
          <div className="card-header">
            <div>
              <h3 className="card-title">
                <TrendingUp size={18} color="#10B981" />
                Fast-Moving Merchandise (Highest Daily Velocity)
              </h3>
              <p className="card-subtitle">Products requiring frequent supplier purchase order replenishment</p>
            </div>
          </div>

          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th style={{ textAlign: 'right' }}>Daily Sales Velocity</th>
                  <th style={{ textAlign: 'right' }}>Current Stock</th>
                </tr>
              </thead>
              <tbody>
                {fastMoving.map((p) => (
                  <tr key={p.product_id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#F1F5F9' }}>{p.product_name}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B' }}>SKU: {p.product_id}</div>
                    </td>
                    <td><span className="badge badge-blue">{p.category}</span></td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#10B981' }}>{p.daily_velocity} units/day</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{p.current_stock?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Slow Moving */}
        <div className="retail-card">
          <div className="card-header">
            <div>
              <h3 className="card-title">
                <TrendingDown size={18} color="#F59E0B" />
                Slow-Moving / Overstocked Merchandise
              </h3>
              <p className="card-subtitle">Low turnover velocity items carrying excess holding capital</p>
            </div>
          </div>

          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th style={{ textAlign: 'right' }}>Daily Sales Velocity</th>
                  <th style={{ textAlign: 'right' }}>Current Stock</th>
                </tr>
              </thead>
              <tbody>
                {slowMoving.map((p) => (
                  <tr key={p.product_id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#F1F5F9' }}>{p.product_name}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B' }}>SKU: {p.product_id}</div>
                    </td>
                    <td><span className="badge badge-blue">{p.category}</span></td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#FBBF24' }}>{p.daily_velocity} units/day</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{p.current_stock?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Row 2: Mandatory Inventory Risk Table */}
      <div className="retail-card">
        <div className="card-header">
          <div>
            <h2 className="card-title">
              <AlertTriangle size={18} color="#F87171" />
              Inventory Risk & Stockout Warning Matrix
            </h2>
            <p className="card-subtitle">
              Product | Store | Current Stock | Average Demand | Predicted Demand | Stockout Risk
            </p>
          </div>

          {/* Risk Level Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={14} color="#64748B" />
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="form-select"
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.65rem' }}
            >
              <option value="All">All Risk Levels</option>
              <option value="HIGH">High Risk Only</option>
              <option value="MEDIUM">Medium Risk Only</option>
              <option value="LOW">Low Risk Only</option>
            </select>
          </div>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Store Location</th>
                <th style={{ textAlign: 'right' }}>Current Stock</th>
                <th style={{ textAlign: 'right' }}>Safety Stock</th>
                <th style={{ textAlign: 'right' }}>Average Demand</th>
                <th style={{ textAlign: 'right' }}>Predicted Demand</th>
                <th style={{ textAlign: 'right' }}>Days of Cover</th>
                <th>Stockout Risk</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {riskTable.map((item, idx) => (
                <tr key={`${item.product_id}-${item.store_id}-${idx}`}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#F1F5F9' }}>{item.product_name}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748B' }}>SKU: {item.product_id}</div>
                  </td>
                  <td>{item.category}</td>
                  <td>
                    <div style={{ fontWeight: 500, color: '#E2E8F0' }}>{item.store_name}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748B' }}>{item.region} Region</div>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: item.current_stock <= item.safety_stock ? '#F87171' : '#F1F5F9' }}>
                    {item.current_stock}
                  </td>
                  <td style={{ textAlign: 'right', color: '#94A3B8' }}>{item.safety_stock}</td>
                  <td style={{ textAlign: 'right' }}>{item.avg_daily_demand} /day</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: '#38BDF8' }}>{item.forecast_daily_demand} /day</td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>{item.estimated_days_of_inventory} d</td>
                  <td>
                    <span className={`badge ${item.stockout_risk === 'HIGH' ? 'badge-high' : (item.stockout_risk === 'MEDIUM' ? 'badge-medium' : 'badge-low')}`}>
                      {item.stockout_risk}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => onNavigateToPrediction && onNavigateToPrediction('predictions')}
                      className="btn btn-secondary"
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                    >
                      Forecast <ArrowRight size={12} />
                    </button>
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
