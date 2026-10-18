import React from 'react';
import { X, Sparkles, TrendingUp, AlertTriangle, AlertCircle, Info, CheckCircle2, ArrowRight } from 'lucide-react';

export default function InsightsModal({ isOpen, onClose, insights = [] }) {
  if (!isOpen) return null;

  const getSeverityStyle = (severity) => {
    switch (severity) {
      case 'critical':
        return {
          border: '1px solid rgba(239, 68, 68, 0.4)',
          bg: 'rgba(239, 68, 68, 0.08)',
          badgeBg: 'rgba(239, 68, 68, 0.2)',
          badgeColor: '#F87171',
          icon: AlertCircle,
          iconColor: '#EF4444'
        };
      case 'warning':
        return {
          border: '1px solid rgba(245, 158, 11, 0.4)',
          bg: 'rgba(245, 158, 11, 0.08)',
          badgeBg: 'rgba(245, 158, 11, 0.2)',
          badgeColor: '#FBBF24',
          icon: AlertTriangle,
          iconColor: '#F59E0B'
        };
      case 'positive':
        return {
          border: '1px solid rgba(16, 185, 129, 0.4)',
          bg: 'rgba(16, 185, 129, 0.08)',
          badgeBg: 'rgba(16, 185, 129, 0.2)',
          badgeColor: '#34D399',
          icon: TrendingUp,
          iconColor: '#10B981'
        };
      default:
        return {
          border: '1px solid rgba(2, 132, 199, 0.4)',
          bg: 'rgba(2, 132, 199, 0.08)',
          badgeBg: 'rgba(2, 132, 199, 0.2)',
          badgeColor: '#38BDF8',
          icon: Info,
          iconColor: '#0284C7'
        };
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      padding: '1.5rem'
    }}>
      <div style={{
        backgroundColor: '#0F172A',
        border: '1px solid #334155',
        borderRadius: '1rem',
        width: '100%',
        maxWidth: '750px',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #1E293B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '2rem',
              height: '2rem',
              borderRadius: '0.5rem',
              backgroundColor: 'rgba(2, 132, 199, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Sparkles size={18} color="#38BDF8" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#F8FAFC', margin: 0 }}>
                Rule-Based Automated Business Insights
              </h2>
              <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.1rem 0 0 0' }}>
                Deterministic mathematical computations derived from live MySQL sales, inventory, and RFM tables
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '0.25rem'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{
          padding: '1.5rem',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {insights.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748B' }}>
              No active operational anomalies or alerts detected.
            </div>
          ) : (
            insights.map((item) => {
              const style = getSeverityStyle(item.severity);
              const Icon = style.icon;
              return (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: style.bg,
                    border: style.border,
                    borderRadius: '0.75rem',
                    padding: '1.15rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Icon size={18} color={style.iconColor} />
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F1F5F9', margin: 0 }}>
                        {item.title}
                      </h3>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{
                        backgroundColor: style.badgeBg,
                        color: style.badgeColor,
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '0.35rem',
                        textTransform: 'uppercase'
                      }}>
                        {item.category}
                      </span>
                      <span style={{
                        backgroundColor: '#1E293B',
                        color: '#F8FAFC',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '0.35rem',
                        border: '1px solid #334155'
                      }}>
                        {item.metric}
                      </span>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.825rem', color: '#CBD5E1', margin: '0.65rem 0', lineHeight: 1.45 }}>
                    {item.message}
                  </p>

                  <div style={{
                    marginTop: '0.65rem',
                    padding: '0.6rem 0.75rem',
                    backgroundColor: '#0F172A',
                    borderRadius: '0.5rem',
                    border: '1px solid #1E293B',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.78rem',
                    color: '#94A3B8'
                  }}>
                    <ArrowRight size={14} color="#38BDF8" style={{ flexShrink: 0 }} />
                    <span>
                      <strong style={{ color: '#E2E8F0' }}>Action Recommendation:</strong> {item.action_recommendation}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid #1E293B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#0B1120'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
            Powered by SQL Analytical Calculations & Predefined Business Rules
          </div>
          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
