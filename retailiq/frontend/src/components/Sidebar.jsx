import React from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  Package,
  Users,
  MapPin,
  Boxes,
  Cpu,
  BarChart3,
  Database,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
  { id: 'sales', label: 'Sales Analytics', icon: TrendingUp },
  { id: 'products', label: 'Product Analytics', icon: Package },
  { id: 'customers', label: 'Customer Analytics', icon: Users },
  { id: 'stores', label: 'Store & Regional', icon: MapPin },
  { id: 'inventory', label: 'Inventory Analytics', icon: Boxes },
  { id: 'predictions', label: 'Prediction Center', icon: Cpu, badge: 'ML' },
  { id: 'powerbi', label: 'Power BI Reports', icon: BarChart3 },
  { id: 'data', label: 'Data Management', icon: Database },
];

export default function Sidebar({ activeTab, setActiveTab }) {
  return (
    <aside style={{
      width: '260px',
      height: '100vh',
      backgroundColor: '#0F172A',
      borderRight: '1px solid #1E293B',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      zIndex: 20
    }}>
      {/* Brand Header */}
      <div style={{
        padding: '1.5rem 1.25rem',
        borderBottom: '1px solid #1E293B',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        <div style={{
          width: '2.5rem',
          height: '2.5rem',
          borderRadius: '0.6rem',
          background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
          boxShadow: '0 0 15px rgba(2, 132, 199, 0.4)'
        }}>
          <BarChart3 size={20} />
        </div>
        <div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.02em' }}>
            Retail<span style={{ color: '#38BDF8' }}>IQ</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600, letterSpacing: '0.04em' }}>
            BUSINESS INTELLIGENCE
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav style={{ flex: 1, padding: '1rem 0.75rem', overflowY: 'auto' }}>
        <div style={{
          fontSize: '0.7rem',
          fontWeight: 700,
          color: '#475569',
          padding: '0.5rem 0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          Analytics Modules
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.65rem 0.85rem',
                margin: '0.2rem 0',
                borderRadius: '0.5rem',
                border: 'none',
                background: isActive ? 'linear-gradient(90deg, rgba(2, 132, 199, 0.2) 0%, rgba(2, 132, 199, 0.05) 100%)' : 'transparent',
                color: isActive ? '#38BDF8' : '#94A3B8',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
                fontWeight: isActive ? 700 : 500,
                borderLeft: isActive ? '3px solid #38BDF8' : '3px solid transparent'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Icon size={18} color={isActive ? '#38BDF8' : '#64748B'} />
                <span style={{ fontSize: '0.85rem' }}>{item.label}</span>
              </div>
              {item.badge && (
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  backgroundColor: 'rgba(2, 132, 199, 0.25)',
                  color: '#38BDF8',
                  padding: '0.1rem 0.4rem',
                  borderRadius: '0.25rem'
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Database Status */}
      <div style={{
        padding: '1rem',
        borderTop: '1px solid #1E293B',
        backgroundColor: '#0B1120'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.6rem 0.75rem',
          borderRadius: '0.5rem',
          backgroundColor: '#1E293B',
          border: '1px solid #334155'
        }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981', boxShadow: '0 0 8px #10B981' }} />
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#F1F5F9' }}>
              PostgreSQL Live
            </div>
            <div style={{ fontSize: '0.68rem', color: '#64748B' }}>
              retailiq_db
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
