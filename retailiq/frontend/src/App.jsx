import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import InsightsModal from './components/InsightsModal';

import ExecutiveDashboard from './pages/ExecutiveDashboard';
import SalesAnalytics from './pages/SalesAnalytics';
import ProductAnalytics from './pages/ProductAnalytics';
import CustomerAnalytics from './pages/CustomerAnalytics';
import StoreRegionalAnalytics from './pages/StoreRegionalAnalytics';
import InventoryAnalytics from './pages/InventoryAnalytics';
import PredictionCenter from './pages/PredictionCenter';
import PowerBIReports from './pages/PowerBIReports';
import DataManagement from './pages/DataManagement';

import api from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [filters, setFilters] = useState({
    year: '2025',
    region: 'All',
    category: 'All',
  });
  const [insights, setInsights] = useState([]);
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    fetchRuleBasedInsights();
  }, [refreshTrigger]);

  const fetchRuleBasedInsights = async () => {
    try {
      const res = await api.getRuleBasedInsights();
      setInsights(res.data);
    } catch (err) {
      console.error('Failed to load rule-based insights:', err);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    setRefreshTrigger((prev) => prev + 1);
    setTimeout(() => setLoading(false), 600);
  };

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <ExecutiveDashboard filters={filters} onNavigate={setActiveTab} key={refreshTrigger} />;
      case 'sales':
        return <SalesAnalytics filters={filters} key={refreshTrigger} />;
      case 'products':
        return <ProductAnalytics onNavigateToPrediction={setActiveTab} key={refreshTrigger} />;
      case 'customers':
        return <CustomerAnalytics key={refreshTrigger} />;
      case 'stores':
        return <StoreRegionalAnalytics filters={filters} key={refreshTrigger} />;
      case 'inventory':
        return <InventoryAnalytics filters={filters} onNavigateToPrediction={setActiveTab} key={refreshTrigger} />;
      case 'predictions':
        return <PredictionCenter key={refreshTrigger} />;
      case 'powerbi':
        return <PowerBIReports key={refreshTrigger} />;
      case 'data':
        return <DataManagement key={refreshTrigger} />;
      default:
        return <ExecutiveDashboard filters={filters} onNavigate={setActiveTab} key={refreshTrigger} />;
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main App Content Viewport */}
      <div className="main-content">
        <Header
          activeTab={activeTab}
          filters={filters}
          setFilters={setFilters}
          onRefresh={handleRefresh}
          loading={loading}
          insightCount={insights.length}
          onOpenInsights={() => setIsInsightsOpen(true)}
        />

        <main className="page-content">
          {renderActivePage()}
        </main>
      </div>

      {/* Rule-Based Automated Insights Modal */}
      <InsightsModal
        isOpen={isInsightsOpen}
        onClose={() => setIsInsightsOpen(false)}
        insights={insights}
      />
    </div>
  );
}
