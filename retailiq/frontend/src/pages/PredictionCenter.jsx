import React, { useState, useEffect } from 'react';
import {
  Cpu,
  TrendingUp,
  AlertTriangle,
  UserCheck,
  Calendar,
  Store,
  Package,
  Layers,
  Percent,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Zap,
  Clock,
  Boxes
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';
import api from '../services/api';

export default function PredictionCenter() {
  const [activeSubTab, setActiveSubTab] = useState('demand'); // 'demand', 'stockout', 'repeat'
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [customers, setCustomers] = useState([]);

  // Demand Forecast State
  const [demandReq, setDemandReq] = useState({
    product_id: 'PRD1005',
    store_id: 'STR101',
    forecast_days: 30,
    planned_discount_pct: 0,
    has_promotion: false
  });
  const [demandRes, setDemandRes] = useState(null);
  const [demandLoading, setDemandLoading] = useState(false);

  // Stockout Risk State
  const [stockoutReq, setStockoutReq] = useState({
    product_id: 'PRD1005',
    store_id: 'STR101'
  });
  const [stockoutRes, setStockoutRes] = useState(null);
  const [stockoutLoading, setStockoutLoading] = useState(false);

  // Repeat Purchase State
  const [repeatReq, setRepeatReq] = useState({
    customer_id: 'CUST00001',
    timeframe_days: 90
  });
  const [repeatRes, setRepeatRes] = useState(null);
  const [repeatLoading, setRepeatLoading] = useState(false);

  useEffect(() => {
    loadMetadata();
  }, []);

  const loadMetadata = async () => {
    try {
      const pRes = await api.getProducts();
      setProducts(pRes.data);
      const sRes = await api.getStoreAnalytics();
      setStores(sRes.data.store_rankings || []);
      const cRes = await api.getCustomerRFM();
      setCustomers(cRes.data.top_customers || []);

      // Trigger initial predictions
      runDemandForecast('PRD1005', 'STR101', 30, 0, false);
      runStockoutRisk('PRD1005', 'STR101');
      runRepeatPurchase('CUST00001', 90);
    } catch (err) {
      console.error('Failed to load metadata for predictions:', err);
    }
  };

  const runDemandForecast = async (pid, sid, days, disc, promo) => {
    try {
      setDemandLoading(true);
      const res = await api.predictDemand({
        product_id: pid || demandReq.product_id,
        store_id: sid || demandReq.store_id,
        forecast_days: days || demandReq.forecast_days,
        planned_discount_pct: disc !== undefined ? disc : demandReq.planned_discount_pct,
        has_promotion: promo !== undefined ? promo : demandReq.has_promotion
      });
      setDemandRes(res.data);
    } catch (err) {
      console.error('Demand prediction error:', err);
    } finally {
      setDemandLoading(false);
    }
  };

  const runStockoutRisk = async (pid, sid) => {
    try {
      setStockoutLoading(true);
      const res = await api.predictStockout({
        product_id: pid || stockoutReq.product_id,
        store_id: sid || stockoutReq.store_id
      });
      setStockoutRes(res.data);
    } catch (err) {
      console.error('Stockout prediction error:', err);
    } finally {
      setStockoutLoading(false);
    }
  };

  const runRepeatPurchase = async (cid, tf) => {
    try {
      setRepeatLoading(true);
      const res = await api.predictRepeatPurchase({
        customer_id: cid || repeatReq.customer_id,
        timeframe_days: tf || repeatReq.timeframe_days
      });
      setRepeatRes(res.data);
    } catch (err) {
      console.error('Repeat purchase prediction error:', err);
    } finally {
      setRepeatLoading(false);
    }
  };

  return (
    <div>
      {/* Sub-tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        borderBottom: '1px solid #1E293B',
        marginBottom: '1.75rem',
        paddingBottom: '0.5rem'
      }}>
        <button
          onClick={() => setActiveSubTab('demand')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.25rem',
            borderRadius: '0.5rem',
            border: 'none',
            backgroundColor: activeSubTab === 'demand' ? '#0284C7' : '#1E293B',
            color: activeSubTab === 'demand' ? '#FFFFFF' : '#94A3B8',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
        >
          <TrendingUp size={16} />
          1. Demand Forecasting
        </button>

        <button
          onClick={() => setActiveSubTab('stockout')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.25rem',
            borderRadius: '0.5rem',
            border: 'none',
            backgroundColor: activeSubTab === 'stockout' ? '#0284C7' : '#1E293B',
            color: activeSubTab === 'stockout' ? '#FFFFFF' : '#94A3B8',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
        >
          <AlertTriangle size={16} />
          2. Stockout Risk Evaluator
        </button>

        <button
          onClick={() => setActiveSubTab('repeat')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.25rem',
            borderRadius: '0.5rem',
            border: 'none',
            backgroundColor: activeSubTab === 'repeat' ? '#0284C7' : '#1E293B',
            color: activeSubTab === 'repeat' ? '#FFFFFF' : '#94A3B8',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
        >
          <UserCheck size={16} />
          3. Customer Repeat Purchase
        </button>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: PRODUCT DEMAND FORECASTING */}
      {/* ===================================================================== */}
      {activeSubTab === 'demand' && (
        <div>
          {/* Controls Card */}
          <div className="retail-card" style={{ marginBottom: '1.75rem' }}>
            <div className="card-header">
              <div>
                <h3 className="card-title">
                  <Cpu size={18} color="#38BDF8" />
                  Product Demand Forecasting Simulator
                </h3>
                <p className="card-subtitle">
                  Select product, retail store, forecast window, and simulate promotion sensitivity
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
              {/* Product */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', display: 'block', marginBottom: '0.4rem' }}>
                  SELECT PRODUCT
                </label>
                <select
                  value={demandReq.product_id}
                  onChange={(e) => {
                    const newReq = { ...demandReq, product_id: e.target.value };
                    setDemandReq(newReq);
                    runDemandForecast(e.target.value, demandReq.store_id, demandReq.forecast_days, demandReq.planned_discount_pct, demandReq.has_promotion);
                  }}
                  className="form-select"
                  style={{ width: '100%' }}
                >
                  {products.map((p) => (
                    <option key={p.product_id} value={p.product_id}>
                      [{p.product_id}] {p.product_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Store */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', display: 'block', marginBottom: '0.4rem' }}>
                  SELECT RETAIL STORE
                </label>
                <select
                  value={demandReq.store_id}
                  onChange={(e) => {
                    const newReq = { ...demandReq, store_id: e.target.value };
                    setDemandReq(newReq);
                    runDemandForecast(demandReq.product_id, e.target.value, demandReq.forecast_days, demandReq.planned_discount_pct, demandReq.has_promotion);
                  }}
                  className="form-select"
                  style={{ width: '100%' }}
                >
                  {stores.map((s) => (
                    <option key={s.store_id} value={s.store_id}>
                      {s.store_name} ({s.city})
                    </option>
                  ))}
                </select>
              </div>

              {/* Forecast Horizon */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', display: 'block', marginBottom: '0.4rem' }}>
                  FORECAST HORIZON: {demandReq.forecast_days} DAYS
                </label>
                <select
                  value={demandReq.forecast_days}
                  onChange={(e) => {
                    const days = parseInt(e.target.value);
                    setDemandReq({ ...demandReq, forecast_days: days });
                    runDemandForecast(demandReq.product_id, demandReq.store_id, days, demandReq.planned_discount_pct, demandReq.has_promotion);
                  }}
                  className="form-select"
                  style={{ width: '100%' }}
                >
                  <option value={14}>14 Days (2 Weeks)</option>
                  <option value={30}>30 Days (1 Month)</option>
                  <option value={60}>60 Days (2 Months)</option>
                  <option value={90}>90 Days (Quarter)</option>
                </select>
              </div>

              {/* Planned Discount Simulator */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', display: 'block', marginBottom: '0.4rem' }}>
                  PLANNED DISCOUNT: {demandReq.planned_discount_pct}%
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="range"
                    min="0"
                    max="40"
                    step="5"
                    value={demandReq.planned_discount_pct}
                    onChange={(e) => {
                      const disc = parseFloat(e.target.value);
                      setDemandReq({ ...demandReq, planned_discount_pct: disc });
                      runDemandForecast(demandReq.product_id, demandReq.store_id, demandReq.forecast_days, disc, demandReq.has_promotion);
                    }}
                    style={{ flex: 1, accentColor: '#0284C7' }}
                  />
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38BDF8', width: '32px' }}>
                    {demandReq.planned_discount_pct}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Forecast Output Banner & Metrics */}
          {demandRes && (
            <div>
              <div className="kpi-grid">
                <div className="kpi-card">
                  <div className="kpi-header">
                    <span className="kpi-label">Forecast Demand</span>
                    <TrendingUp size={18} color="#38BDF8" />
                  </div>
                  <div className="kpi-value">{demandRes.total_predicted_demand} units</div>
                  <div className="kpi-footer">
                    <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>
                      ~{demandRes.avg_daily_demand} units / day
                    </span>
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-header">
                    <span className="kpi-label">Current Stock in Store</span>
                    <Boxes size={18} color="#FBBF24" />
                  </div>
                  <div className="kpi-value">{demandRes.current_inventory} units</div>
                  <div className="kpi-footer">
                    <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>Available on hand</span>
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-header">
                    <span className="kpi-label">Projected Stock Balance</span>
                    <Percent size={18} color={demandRes.expected_inventory_balance < 0 ? '#F87171' : '#10B981'} />
                  </div>
                  <div className="kpi-value" style={{ color: demandRes.expected_inventory_balance < 0 ? '#F87171' : '#10B981' }}>
                    {demandRes.expected_inventory_balance > 0 ? `+${demandRes.expected_inventory_balance}` : demandRes.expected_inventory_balance} units
                  </div>
                  <div className="kpi-footer">
                    <span className={`badge ${demandRes.expected_inventory_balance < 0 ? 'badge-high' : 'badge-low'}`}>
                      {demandRes.inventory_status}
                    </span>
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-header">
                    <span className="kpi-label">Stockout Risk Level</span>
                    <AlertTriangle size={18} color={demandRes.stockout_risk === 'HIGH' ? '#F87171' : (demandRes.stockout_risk === 'MEDIUM' ? '#F59E0B' : '#10B981')} />
                  </div>
                  <div className="kpi-value">
                    <span className={`badge ${demandRes.stockout_risk === 'HIGH' ? 'badge-high' : (demandRes.stockout_risk === 'MEDIUM' ? 'badge-medium' : 'badge-low')}`} style={{ fontSize: '1.1rem', padding: '0.3rem 0.75rem' }}>
                      {demandRes.stockout_risk} RISK
                    </span>
                  </div>
                  <div className="kpi-footer">
                    <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>
                      {demandRes.stockout_expected_day ? `Depletion expected Day ${demandRes.stockout_expected_day}` : 'Inventory healthy across horizon'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Daily Forecast Curve */}
              <div className="retail-card" style={{ marginBottom: '1.75rem' }}>
                <div className="card-header">
                  <div>
                    <h3 className="card-title">Daily Predicted Demand Velocity Curve</h3>
                    <p className="card-subtitle">
                      Day-by-day projected demand with weekend surges and promo sensitivity ({demandRes.model_name})
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span className="badge badge-blue">MAE: {demandRes.model_metrics?.MAE || 0.567}</span>
                    <span className="badge badge-blue">RMSE: {demandRes.model_metrics?.RMSE || 0.787}</span>
                  </div>
                </div>

                <div style={{ height: '300px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={demandRes.daily_forecast} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0284C7" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#0284C7" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" stroke="#64748B" fontSize={10} tickLine={false} />
                      <YAxis stroke="#64748B" fontSize={11} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '0.5rem', color: '#F8FAFC' }}
                        formatter={(val, name, item) => [`${val} units (${item.payload.day_name})`, 'Predicted Demand']}
                      />
                      <Area type="monotone" dataKey="predicted_units" name="Predicted Demand" stroke="#38BDF8" strokeWidth={2.5} fillOpacity={1} fill="url(#predGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: STOCKOUT RISK EVALUATOR */}
      {/* ===================================================================== */}
      {activeSubTab === 'stockout' && (
        <div>
          <div className="retail-card" style={{ marginBottom: '1.75rem' }}>
            <div className="card-header">
              <div>
                <h3 className="card-title">
                  <AlertTriangle size={18} color="#FBBF24" />
                  Supply Chain Stockout Risk Evaluator
                </h3>
                <p className="card-subtitle">
                  Machine learning risk classification powered by Random Forest Classifier (Accuracy: 99.34%, F1: 0.993)
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', alignItems: 'flex-end' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', display: 'block', marginBottom: '0.4rem' }}>
                  SELECT PRODUCT
                </label>
                <select
                  value={stockoutReq.product_id}
                  onChange={(e) => {
                    setStockoutReq({ ...stockoutReq, product_id: e.target.value });
                    runStockoutRisk(e.target.value, stockoutReq.store_id);
                  }}
                  className="form-select"
                  style={{ width: '100%' }}
                >
                  {products.map((p) => (
                    <option key={p.product_id} value={p.product_id}>
                      [{p.product_id}] {p.product_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', display: 'block', marginBottom: '0.4rem' }}>
                  SELECT STORE
                </label>
                <select
                  value={stockoutReq.store_id}
                  onChange={(e) => {
                    setStockoutReq({ ...stockoutReq, store_id: e.target.value });
                    runStockoutRisk(stockoutReq.product_id, e.target.value);
                  }}
                  className="form-select"
                  style={{ width: '100%' }}
                >
                  {stores.map((s) => (
                    <option key={s.store_id} value={s.store_id}>
                      {s.store_name} ({s.city})
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => runStockoutRisk(stockoutReq.product_id, stockoutReq.store_id)}
                className="btn btn-primary"
                style={{ padding: '0.55rem 1.25rem' }}
              >
                Re-evaluate
              </button>
            </div>
          </div>

          {stockoutRes && (
            <div className="retail-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span className="badge badge-blue">{stockoutRes.category}</span>
                    <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>{stockoutRes.store_name}</span>
                  </div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#F1F5F9', margin: '0.25rem 0' }}>
                    {stockoutRes.product_name}
                  </h3>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700 }}>PREDICTED RISK CLASSIFICATION</div>
                  <span className={`badge ${stockoutRes.risk_level === 'HIGH' ? 'badge-high' : (stockoutRes.risk_level === 'MEDIUM' ? 'badge-medium' : 'badge-low')}`} style={{ fontSize: '1.2rem', padding: '0.35rem 0.85rem' }}>
                    {stockoutRes.risk_level} RISK ({stockoutRes.confidence_score}% confidence)
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ padding: '1rem', backgroundColor: '#0F172A', borderRadius: '0.5rem', border: '1px solid #334155' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>CURRENT STOCK</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: stockoutRes.current_stock < 15 ? '#F87171' : '#F1F5F9' }}>
                    {stockoutRes.current_stock} units
                  </div>
                </div>

                <div style={{ padding: '1rem', backgroundColor: '#0F172A', borderRadius: '0.5rem', border: '1px solid #334155' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>30-DAY VELOCITY</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#38BDF8' }}>
                    {stockoutRes.velocity_30d} units/day
                  </div>
                </div>

                <div style={{ padding: '1rem', backgroundColor: '#0F172A', borderRadius: '0.5rem', border: '1px solid #334155' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>DAYS OF INVENTORY COVER</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: stockoutRes.days_of_inventory < 8 ? '#F87171' : '#10B981' }}>
                    {stockoutRes.days_of_inventory} days
                  </div>
                </div>

                <div style={{ padding: '1rem', backgroundColor: '#0F172A', borderRadius: '0.5rem', border: '1px solid #334155' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>SAFETY STOCK LEVEL</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#94A3B8' }}>
                    {stockoutRes.safety_stock} units
                  </div>
                </div>
              </div>

              {/* Factors & Action */}
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F1F5F9', marginBottom: '0.5rem' }}>
                  CONTRIBUTING SUPPLY CHAIN FACTORS:
                </h4>
                <ul style={{ paddingLeft: '1.25rem', color: '#CBD5E1', fontSize: '0.85rem', lineHeight: 1.6 }}>
                  {stockoutRes.factors?.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>

              <div style={{
                padding: '1rem',
                backgroundColor: stockoutRes.risk_level === 'HIGH' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(2, 132, 199, 0.12)',
                borderRadius: '0.5rem',
                border: stockoutRes.risk_level === 'HIGH' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(2, 132, 199, 0.3)',
                color: stockoutRes.risk_level === 'HIGH' ? '#FCA5A5' : '#7DD3FC',
                fontSize: '0.85rem'
              }}>
                <strong>RECOMMENDED SUPPLY CHAIN DIRECTIVE:</strong> {stockoutRes.suggested_action}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: CUSTOMER REPEAT PURCHASE PREDICTION */}
      {/* ===================================================================== */}
      {activeSubTab === 'repeat' && (
        <div>
          <div className="retail-card" style={{ marginBottom: '1.75rem' }}>
            <div className="card-header">
              <div>
                <h3 className="card-title">
                  <UserCheck size={18} color="#10B981" />
                  Customer Repeat Purchase Predictor
                </h3>
                <p className="card-subtitle">
                  Machine learning propensity scoring powered by Logistic Regression (Balanced) (ROC-AUC: 0.909, Precision: 99.6%)
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', alignItems: 'flex-end' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', display: 'block', marginBottom: '0.4rem' }}>
                  SELECT CUSTOMER ACCOUNT
                </label>
                <select
                  value={repeatReq.customer_id}
                  onChange={(e) => {
                    setRepeatReq({ ...repeatReq, customer_id: e.target.value });
                    runRepeatPurchase(e.target.value, repeatReq.timeframe_days);
                  }}
                  className="form-select"
                  style={{ width: '100%' }}
                >
                  {customers.map((c) => (
                    <option key={c.customer_id} value={c.customer_id}>
                      [{c.customer_id}] {c.full_name} ({c.segment}) - ${c.monetary_value}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', display: 'block', marginBottom: '0.4rem' }}>
                  PREDICTION TIMEFRAME
                </label>
                <select
                  value={repeatReq.timeframe_days}
                  onChange={(e) => {
                    const tf = parseInt(e.target.value);
                    setRepeatReq({ ...repeatReq, timeframe_days: tf });
                    runRepeatPurchase(repeatReq.customer_id, tf);
                  }}
                  className="form-select"
                  style={{ width: '100%' }}
                >
                  <option value={30}>Within Next 30 Days</option>
                  <option value={60}>Within Next 60 Days</option>
                  <option value={90}>Within Next 90 Days (Quarter)</option>
                </select>
              </div>

              <button
                onClick={() => runRepeatPurchase(repeatReq.customer_id, repeatReq.timeframe_days)}
                className="btn btn-primary"
                style={{ padding: '0.55rem 1.25rem' }}
              >
                Compute Propensity
              </button>
            </div>
          </div>

          {repeatRes && (
            <div className="retail-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span className="badge badge-blue">{repeatRes.customer_segment}</span>
                    <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Customer ID: {repeatRes.customer_id}</span>
                  </div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#F1F5F9', margin: '0.25rem 0' }}>
                    {repeatRes.customer_name}
                  </h3>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700 }}>REPEAT PURCHASE PROBABILITY</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: repeatRes.repeat_probability > 0.6 ? '#10B981' : '#FBBF24' }}>
                    {repeatRes.repeat_probability_pct}
                  </div>
                  <span className={`badge ${repeatRes.churn_risk_level === 'HIGH' ? 'badge-high' : (repeatRes.churn_risk_level === 'MEDIUM' ? 'badge-medium' : 'badge-low')}`}>
                    {repeatRes.predicted_class}
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ padding: '1rem', backgroundColor: '#0F172A', borderRadius: '0.5rem', border: '1px solid #334155' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>RECENCY</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F1F5F9' }}>
                    {repeatRes.recency_days} days
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Since last transaction</div>
                </div>

                <div style={{ padding: '1rem', backgroundColor: '#0F172A', borderRadius: '0.5rem', border: '1px solid #334155' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>PURCHASE FREQUENCY</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#38BDF8' }}>
                    {repeatRes.frequency} orders
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Cumulative volume</div>
                </div>

                <div style={{ padding: '1rem', backgroundColor: '#0F172A', borderRadius: '0.5rem', border: '1px solid #334155' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>LIFETIME VALUE (CLV)</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10B981' }}>
                    ${repeatRes.monetary_value?.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Avg basket: ${repeatRes.avg_order_value}</div>
                </div>

                <div style={{ padding: '1rem', backgroundColor: '#0F172A', borderRadius: '0.5rem', border: '1px solid #334155' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>CHURN RISK LEVEL</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: repeatRes.churn_risk_level === 'HIGH' ? '#F87171' : '#10B981' }}>
                    {repeatRes.churn_risk_level}
                  </div>
                </div>
              </div>

              {/* Drivers & Action */}
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F1F5F9', marginBottom: '0.5rem' }}>
                  BEHAVIORAL PROPENSITY DRIVERS:
                </h4>
                <ul style={{ paddingLeft: '1.25rem', color: '#CBD5E1', fontSize: '0.85rem', lineHeight: 1.6 }}>
                  {repeatRes.key_drivers?.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>

              <div style={{
                padding: '1rem',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                borderRadius: '0.5rem',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#6EE7B7',
                fontSize: '0.85rem'
              }}>
                <strong>RECOMMENDED MARKETING RETENTION DIRECTIVE:</strong> {repeatRes.recommended_retention_action}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
