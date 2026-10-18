import React, { useState } from 'react';
import {
  Upload,
  Database,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Download,
  ShieldCheck,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import api from '../services/api';

export default function DataManagement() {
  const [file, setFile] = useState(null);
  const [datasetType, setDatasetType] = useState('sales');
  const [uploading, setUploading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setSummary(null);
      setError(null);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a valid CSV or XLSX file to upload.');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('dataset_type', datasetType);

      const res = await api.uploadDataset(formData);
      setSummary(res.data);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.detail || 'File processing failed. Please check column format and data types.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {/* Top Banner */}
      <div className="retail-card" style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span className="badge badge-blue">DATA INGESTION PIPELINE</span>
              <span style={{ fontSize: '0.8rem', color: '#10B981', fontWeight: 600 }}>ACID Safe Ingestion</span>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#F8FAFC', margin: '0.35rem 0' }}>
              Retail Data Ingestion & Batch Management
            </h2>
            <p style={{ fontSize: '0.825rem', color: '#94A3B8', margin: 0 }}>
              Upload new CSV or XLSX batches directly into MySQL (<code>retailiq_db</code>) with automated column validation, duplicate screening, and type coercion.
            </p>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Upload Form Card */}
        <div className="retail-card">
          <div className="card-header">
            <div>
              <h3 className="card-title">
                <Upload size={18} color="#38BDF8" />
                Upload New Data Batch (.csv / .xlsx)
              </h3>
              <p className="card-subtitle">Select dataset entity and choose your local file</p>
            </div>
          </div>

          <form onSubmit={handleUpload}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', display: 'block', marginBottom: '0.4rem' }}>
                SELECT TARGET DATASET SCHEMA
              </label>
              <select
                value={datasetType}
                onChange={(e) => setDatasetType(e.target.value)}
                className="form-select"
                style={{ width: '100%' }}
              >
                <option value="sales">Sales Transactions (order_id, product_id, order_date, customer_id, store_id, quantity, unit_price)</option>
                <option value="products">Product Catalog (product_id, product_name, category, subcategory, cost_price, unit_price)</option>
                <option value="customers">Customers (customer_id, first_name, last_name, email, city, region)</option>
                <option value="stores">Retail Stores (store_id, store_name, city, state, region, store_type)</option>
              </select>
            </div>

            {/* Drag & Drop Upload Zone */}
            <div
              style={{
                border: '2px dashed #334155',
                borderRadius: '0.75rem',
                padding: '2rem',
                textAlign: 'center',
                backgroundColor: '#0F172A',
                marginBottom: '1.25rem',
                cursor: 'pointer'
              }}
              onClick={() => document.getElementById('file-upload-input').click()}
            >
              <FileSpreadsheet size={36} color="#0284C7" style={{ margin: '0 auto 0.75rem auto' }} />
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#F1F5F9' }}>
                {file ? file.name : 'Click to select or drag CSV / Excel file here'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.35rem' }}>
                Supports up to 500,000 transaction rows (.csv, .xlsx, .xls)
              </div>
              <input
                id="file-upload-input"
                type="file"
                accept=".csv, .xlsx, .xls"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>

            {error && (
              <div style={{
                padding: '0.75rem 1rem',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '0.5rem',
                color: '#F87171',
                fontSize: '0.8rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={uploading || !file}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem' }}
            >
              {uploading ? (
                <>
                  <RefreshCw size={16} className="spin" />
                  Validating & Ingesting Records into MySQL...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Validate & Ingest File
                </>
              )}
            </button>
          </form>
        </div>

        {/* Upload Summary Card */}
        <div className="retail-card">
          <div className="card-header">
            <div>
              <h3 className="card-title">
                <ShieldCheck size={18} color="#10B981" />
                Ingestion Verification & Summary Report
              </h3>
              <p className="card-subtitle">Real-time validation summary returned by FastAPI backend</p>
            </div>
          </div>

          {summary ? (
            <div>
              <div style={{
                padding: '0.75rem 1rem',
                backgroundColor: summary.validation_status === 'SUCCESS' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                border: summary.validation_status === 'SUCCESS' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '0.5rem',
                color: summary.validation_status === 'SUCCESS' ? '#34D399' : '#FBBF24',
                fontSize: '0.85rem',
                fontWeight: 700,
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span>STATUS: {summary.validation_status}</span>
                <span>File: {summary.filename}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ padding: '0.85rem', backgroundColor: '#0F172A', borderRadius: '0.5rem', border: '1px solid #334155' }}>
                  <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>TOTAL ROWS RECEIVED</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#F1F5F9' }}>
                    {summary.total_rows_received?.toLocaleString()}
                  </div>
                </div>

                <div style={{ padding: '0.85rem', backgroundColor: '#0F172A', borderRadius: '0.5rem', border: '1px solid #334155' }}>
                  <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>VALID ROWS PARSED</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38BDF8' }}>
                    {summary.valid_rows_parsed?.toLocaleString()}
                  </div>
                </div>

                <div style={{ padding: '0.85rem', backgroundColor: '#0F172A', borderRadius: '0.5rem', border: '1px solid #334155' }}>
                  <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>DUPLICATE ROWS (IGNORED)</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FBBF24' }}>
                    {summary.duplicate_rows_ignored?.toLocaleString()}
                  </div>
                </div>

                <div style={{ padding: '0.85rem', backgroundColor: '#0F172A', borderRadius: '0.5rem', border: '1px solid #334155' }}>
                  <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>RECORDS INSERTED TO MYSQL</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10B981' }}>
                    {summary.records_inserted_to_mysql?.toLocaleString()}
                  </div>
                </div>
              </div>

              {summary.sample_errors?.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#F87171', marginBottom: '0.4rem' }}>
                    VALIDATION WARNINGS:
                  </div>
                  <ul style={{ paddingLeft: '1.2rem', fontSize: '0.78rem', color: '#FCA5A5' }}>
                    {summary.sample_errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748B' }}>
              Upload a dataset on the left to view the automated schema audit, row validation breakdown, and database insertion log.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
