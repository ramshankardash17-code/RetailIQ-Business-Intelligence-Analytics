import React from 'react';
import { Sparkles, RefreshCw, Calendar, Globe, Layers, Filter } from 'lucide-react';

export default function Header({
  activeTab,
  filters,
  setFilters,
  onRefresh,
  loading,
  insightCount,
  onOpenInsights
}) {
  const titles = {
    dashboard: { title: 'Executive Performance Dashboard', desc: 'Enterprise retail KPIs, revenue momentum, and margin distribution' },
    sales: { title: 'Sales & Growth Analytics', desc: 'MoM and YoY expansion rates, discount sensitivity, and returns impact' },
    products: { title: 'Product Catalog & Merchandise Intelligence', desc: 'SKU profitability, price realization, and store-level stock' },
    customers: { title: 'Customer Lifetime Value & RFM Segmentation', desc: 'Recency, Frequency, Monetary behavioral clusters and churn risk' },
    stores: { title: 'Store & Regional Footprint Analysis', desc: 'Regional market share, revenue per square foot, and store rankings' },
    inventory: { title: 'Supply Chain & Inventory Risk Control', desc: 'Stock turnover velocity, days of cover, and stockout prevention' },
    predictions: { title: 'Machine Learning Prediction Center', desc: 'Demand forecasting, stockout risk scoring, and repeat purchase likelihood' },
    powerbi: { title: 'Microsoft Power BI Reporting Suite', desc: 'Interactive Power BI dashboards, DAX measures, and Star Schema data model' },
    data: { title: 'Data Management & File Ingestion', desc: 'Upload new CSV/XLSX retail batches with automated schema validation' },
  };

  const current = titles[activeTab] || titles.dashboard;

  return (
    <header style={{
      backgroundColor: '#0F172A',
      borderBottom: '1px solid #1E293B',
      padding: '0.85rem 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '1rem',
      position: 'sticky',
      top: 0,
      zIndex: 10
    }}>
      {/* Title & Description */}
      <div>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.02em', margin: 0 }}>
          {current.title}
        </h1>
        <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0.1rem 0 0 0' }}>
          {current.desc}
        </p>
      </div>

      {/* Global Filter Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        {/* Region Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#1E293B', padding: '0.35rem 0.65rem', borderRadius: '0.5rem', border: '1px solid #334155' }}>
          <Globe size={14} color="#38BDF8" />
          <select
            value={filters.region}
            onChange={(e) => setFilters({ ...filters, region: e.target.value })}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#F1F5F9',
              fontSize: '0.8rem',
              fontWeight: 600,
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="All" style={{ background: '#0F172A' }}>All Regions</option>
            <option value="West" style={{ background: '#0F172A' }}>West Region</option>
            <option value="North" style={{ background: '#0F172A' }}>North Region</option>
            <option value="South" style={{ background: '#0F172A' }}>South Region</option>
            <option value="Central" style={{ background: '#0F172A' }}>Central Region</option>
            <option value="East" style={{ background: '#0F172A' }}>East Region</option>
          </select>
        </div>

        {/* Category Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#1E293B', padding: '0.35rem 0.65rem', borderRadius: '0.5rem', border: '1px solid #334155' }}>
          <Layers size={14} color="#38BDF8" />
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#F1F5F9',
              fontSize: '0.8rem',
              fontWeight: 600,
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="All" style={{ background: '#0F172A' }}>All Categories</option>
            <option value="Electronics" style={{ background: '#0F172A' }}>Electronics</option>
            <option value="Apparel" style={{ background: '#0F172A' }}>Apparel</option>
            <option value="Home & Kitchen" style={{ background: '#0F172A' }}>Home & Kitchen</option>
            <option value="Health & Beauty" style={{ background: '#0F172A' }}>Health & Beauty</option>
            <option value="Sports & Outdoors" style={{ background: '#0F172A' }}>Sports & Outdoors</option>
          </select>
        </div>

        {/* Time Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#1E293B', padding: '0.35rem 0.65rem', borderRadius: '0.5rem', border: '1px solid #334155' }}>
          <Calendar size={14} color="#38BDF8" />
          <select
            value={filters.year}
            onChange={(e) => setFilters({ ...filters, year: e.target.value })}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#F1F5F9',
              fontSize: '0.8rem',
              fontWeight: 600,
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="2025" style={{ background: '#0F172A' }}>FY 2025 (Latest)</option>
            <option value="2024" style={{ background: '#0F172A' }}>FY 2024</option>
            <option value="2023" style={{ background: '#0F172A' }}>FY 2023</option>
            <option value="All" style={{ background: '#0F172A' }}>All Time (3 Years)</option>
          </select>
        </div>

        {/* Rule-Based Automated Insights Button */}
        <button
          onClick={onOpenInsights}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.45rem 0.85rem',
            backgroundColor: 'rgba(2, 132, 199, 0.15)',
            border: '1px solid rgba(2, 132, 199, 0.4)',
            color: '#38BDF8',
            borderRadius: '0.5rem',
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
        >
          <Sparkles size={14} color="#38BDF8" />
          <span>Insights</span>
          <span style={{
            backgroundColor: '#0284C7',
            color: 'white',
            borderRadius: '9999px',
            padding: '0.1rem 0.4rem',
            fontSize: '0.7rem',
            fontWeight: 800
          }}>
            {insightCount}
          </span>
        </button>

        {/* Refresh Data Button */}
        <button
          onClick={onRefresh}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.45rem 0.75rem',
            backgroundColor: '#1E293B',
            border: '1px solid #334155',
            color: '#94A3B8',
            borderRadius: '0.5rem',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
          title="Refresh Data from Database"
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
        </button>
      </div>
    </header>
  );
}
