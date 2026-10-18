import React, { useState } from 'react';
import {
  BarChart3,
  ExternalLink,
  Code,
  Copy,
  Check,
  Layers,
  Database,
  Info,
  Maximize2,
  FileSpreadsheet,
  BookOpen
} from 'lucide-react';

const DAX_MEASURES = [
  { name: 'Total Net Revenue', category: 'Financials', formula: 'SUM(sales[net_revenue])' },
  { name: 'Total Cost of Goods Sold', category: 'Financials', formula: 'SUMX(sales, sales[quantity] * sales[cost_price])' },
  { name: 'Total Net Profit', category: 'Financials', formula: '[Total Net Revenue] - [Total Cost of Goods Sold]' },
  { name: 'Profit Margin %', category: 'Financials', formula: 'DIVIDE([Total Net Profit], [Total Net Revenue], 0)' },
  { name: 'Average Order Value (AOV)', category: 'Financials', formula: 'DIVIDE([Total Net Revenue], [Total Orders], 0)' },
  { name: 'Prior Month Net Revenue', category: 'Time Intelligence', formula: "CALCULATE([Total Net Revenue], DATEADD('Dim_Date'[Date], -1, MONTH))" },
  { name: 'MoM Revenue Growth %', category: 'Time Intelligence', formula: 'DIVIDE([Total Net Revenue] - [Prior Month Net Revenue], [Prior Month Net Revenue], 0)' },
  { name: 'Prior Year Net Revenue', category: 'Time Intelligence', formula: "CALCULATE([Total Net Revenue], SAMEPERIODLASTYEAR('Dim_Date'[Date]))" },
  { name: 'YoY Revenue Growth %', category: 'Time Intelligence', formula: 'DIVIDE([Total Net Revenue] - [Prior Year Net Revenue], [Prior Year Net Revenue], 0)' },
  { name: 'Rolling 30-Day Revenue', category: 'Time Intelligence', formula: "CALCULATE([Total Net Revenue], DATESINPERIOD('Dim_Date'[Date], LASTDATE('Dim_Date'[Date]), -30, DAY))" },
  { name: 'Customer Lifetime Value', category: 'Customer Intelligence', formula: 'DIVIDE([Total Net Revenue], [Total Customers], 0)' },
  { name: 'Repeat Customer Rate %', category: 'Customer Intelligence', formula: 'DIVIDE([Repeat Customer Count], [Active Purchasing Customers], 0)' },
  { name: 'Champions Revenue', category: 'Customer Intelligence', formula: 'CALCULATE([Total Net Revenue], customers[customer_segment] = "Champions")' },
  { name: 'Estimated Days of Inventory', category: 'Supply Chain', formula: 'DIVIDE([Total Current Stock Units], [Daily Sales Velocity 30D], 999)' },
  { name: 'Annualized Inventory Turnover', category: 'Supply Chain', formula: 'DIVIDE([Total Cost of Goods Sold], [Total Inventory Valuation], 0)' },
  { name: 'Return Rate %', category: 'Returns', formula: 'DIVIDE([Total Returns Count], [Total Orders], 0)' }
];

export default function PowerBIReports() {
  const [embedUrl, setEmbedUrl] = useState('');
  const [activeReportPage, setActiveReportPage] = useState('1');
  const [copiedFormula, setCopiedFormula] = useState(null);

  const reportPages = [
    { id: '1', title: '1. Executive Overview', desc: 'Enterprise scorecards, revenue momentum, and category mix' },
    { id: '2', title: '2. Sales Analysis', desc: 'MoM/YoY growth trajectories, payment methods, and discount impact' },
    { id: '3', title: '3. Product Analysis', desc: 'SKU profitability, inventory cover, and sales velocity' },
    { id: '4', title: '4. Customer Analysis', desc: 'RFM segmentation, retention curves, and CLV distribution' },
    { id: '5', title: '5. Store / Regional', desc: 'Regional market share, revenue per sqft, and store rankings' },
    { id: '6', title: '6. Inventory Analysis', desc: 'Stock turnover, days of inventory, and stockout risk table' },
    { id: '7', title: '7. Forecast Analysis', desc: 'Projected demand curves and expected stock balances' }
  ];

  const handleCopy = (formula, name) => {
    navigator.clipboard.writeText(formula);
    setCopiedFormula(name);
    setTimeout(() => setCopiedFormula(null), 2000);
  };

  return (
    <div>
      {/* Top Banner */}
      <div className="retail-card" style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span className="badge badge-blue">ENTERPRISE POWER BI HUB</span>
              <span style={{ fontSize: '0.8rem', color: '#10B981', fontWeight: 600 }}>MySQL Direct Connection Ready</span>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#F8FAFC', margin: '0.35rem 0' }}>
              Microsoft Power BI Enterprise Analytics Suite
            </h2>
            <p style={{ fontSize: '0.825rem', color: '#94A3B8', margin: 0 }}>
              Connected to <strong>retailiq_db</strong> with pre-computed analytical views and 30+ production DAX measures.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <a
              href="/powerbi/RetailIQ_PowerBI_DAX_Measures.dax"
              download
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem' }}
            >
              <Code size={14} /> Download DAX Library (.dax)
            </a>
          </div>
        </div>
      </div>

      {/* Report Pages Navigation Bar */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
        {reportPages.map((page) => (
          <button
            key={page.id}
            onClick={() => setActiveReportPage(page.id)}
            style={{
              padding: '0.55rem 0.95rem',
              borderRadius: '0.5rem',
              border: activeReportPage === page.id ? '1px solid #38BDF8' : '1px solid #334155',
              backgroundColor: activeReportPage === page.id ? '#0284C7' : '#1E293B',
              color: activeReportPage === page.id ? '#FFFFFF' : '#94A3B8',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s'
            }}
          >
            {page.title}
          </button>
        ))}
      </div>

      {/* Embedded Report Container */}
      <div className="retail-card" style={{ marginBottom: '1.75rem', padding: '0.5rem' }}>
        {embedUrl ? (
          <iframe
            title="RetailIQ Power BI Report"
            width="100%"
            height="620px"
            src={embedUrl}
            frameBorder="0"
            allowFullScreen={true}
            style={{ borderRadius: '0.5rem', border: 'none' }}
          />
        ) : (
          <div style={{
            height: '520px',
            backgroundColor: '#0F172A',
            borderRadius: '0.5rem',
            border: '2px dashed #334155',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            textAlign: 'center'
          }}>
            <div style={{
              width: '3.5rem',
              height: '3.5rem',
              borderRadius: '1rem',
              backgroundColor: 'rgba(2, 132, 199, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <BarChart3 size={32} color="#38BDF8" />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F8FAFC', marginBottom: '0.5rem' }}>
              Active Report Canvas: {reportPages.find(p => p.id === activeReportPage)?.title}
            </h3>

            <p style={{ fontSize: '0.85rem', color: '#94A3B8', maxWidth: '620px', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              This section is configured to embed your live Microsoft Power BI report. Enter your published Power BI URL below or use the instructions in <code>powerbi/PowerBI_Setup_Guide.md</code> to connect Power BI Desktop directly to your local MySQL database (<code>retailiq_db</code>).
            </p>

            <div style={{ display: 'flex', gap: '0.5rem', width: '100%', maxWidth: '580px', marginBottom: '1rem' }}>
              <input
                type="text"
                placeholder="Paste Power BI Embed URL (e.g., https://app.powerbi.com/view?r=...)"
                value={embedUrl}
                onChange={(e) => setEmbedUrl(e.target.value)}
                className="form-input"
                style={{ flex: 1, fontSize: '0.85rem' }}
              />
              <button
                onClick={() => {
                  if (!embedUrl) {
                    alert('Please paste a valid Power BI Embed URL. See instructions below.');
                  }
                }}
                className="btn btn-primary"
                style={{ fontSize: '0.85rem' }}
              >
                Load Report
              </button>
            </div>

            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.78rem', color: '#64748B' }}>
              <span>Server: <code>127.0.0.1:3306</code></span>
              <span>•</span>
              <span>Database: <code>retailiq_db</code></span>
              <span>•</span>
              <span>Schema: <code>Star Schema</code></span>
            </div>
          </div>
        )}
      </div>

      {/* Row 2: Production DAX Measures Explorer */}
      <div className="retail-card">
        <div className="card-header">
          <div>
            <h3 className="card-title">
              <Code size={18} color="#38BDF8" />
              Power BI Production DAX Measure Library
            </h3>
            <p className="card-subtitle">
              Click copy to integrate directly into Power BI Desktop Model View
            </p>
          </div>
          <span className="badge badge-blue">{DAX_MEASURES.length} Active Measures</span>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Measure Name</th>
                <th>Category</th>
                <th>DAX Expression</th>
                <th style={{ textAlign: 'center' }}>Copy</th>
              </tr>
            </thead>
            <tbody>
              {DAX_MEASURES.map((m) => (
                <tr key={m.name}>
                  <td style={{ fontWeight: 700, color: '#F1F5F9' }}>{m.name}</td>
                  <td><span className="badge badge-blue">{m.category}</span></td>
                  <td>
                    <code style={{
                      backgroundColor: '#0F172A',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '0.3rem',
                      color: '#38BDF8',
                      fontSize: '0.8rem',
                      fontFamily: 'Consolas, monospace'
                    }}>
                      {m.formula}
                    </code>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => handleCopy(m.formula, m.name)}
                      className="btn btn-secondary"
                      style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}
                    >
                      {copiedFormula === m.name ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                      {copiedFormula === m.name ? 'Copied' : 'Copy'}
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
