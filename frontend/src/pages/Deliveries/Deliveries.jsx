import React, { useState, useEffect } from 'react';
import api from '../../config/axios.js';
import { Link } from 'react-router-dom';
import './Deliveries.css';

const STATUS_COLOR = {
  'Delivered':       { bg: 'rgba(62,207,75,0.12)',  color: '#3ecf4b' },
  'Out for Delivery':{ bg: 'rgba(90,120,255,0.12)', color: '#5a78ff' },
  'Food Processing': { bg: 'rgba(245,166,35,0.12)', color: '#f5a623' },
  'Ready for Pickup':{ bg: 'rgba(245,166,35,0.12)', color: '#f5a623' },
  'Cancelled':       { bg: 'rgba(232,82,58,0.12)',  color: '#e8523a' },
};

const Deliveries = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    const fetchDeliveries = async () => {
      try {
        const res = await api.get('/api/rider/deliveries');
        if (res.data.success) setDeliveries(res.data.data || []);
      } catch (err) {
        console.error('Error fetching deliveries:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDeliveries();
  }, []);

  const filterTabs = ['All', 'Delivered', 'Out for Delivery', 'Food Processing', 'Cancelled'];

  const filtered = filter === 'All'
    ? deliveries
    : deliveries.filter(d => d.status === filter);

  const completedCount = deliveries.filter(d => d.status === 'Delivered').length;
  const activeCount    = deliveries.filter(d => ['Food Processing', 'Ready for Pickup', 'Out for Delivery'].includes(d.status)).length;

  if (loading) return <div className="deliveries-loading">Loading deliveries...</div>;

  return (
    <div className="deliveries-page fade-in">
      <header className="deliveries-header">
        <div>
          <h1 className="font-display">Delivery History</h1>
          <p className="deliveries-sub">All orders assigned to you</p>
        </div>
        <Link to="/rider-dashboard" className="btn-back-dash">← Dashboard</Link>
      </header>

      {/* Summary row */}
      <div className="deliveries-summary">
        <div className="summary-stat glass">
          <span className="summary-num">{deliveries.length}</span>
          <span className="summary-label">Total Assigned</span>
        </div>
        <div className="summary-stat glass">
          <span className="summary-num" style={{ color: '#3ecf4b' }}>{completedCount}</span>
          <span className="summary-label">Completed</span>
        </div>
        <div className="summary-stat glass">
          <span className="summary-num" style={{ color: '#f5a623' }}>{activeCount}</span>
          <span className="summary-label">In Progress</span>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="filter-tabs">
        {filterTabs.map(tab => (
          <button
            key={tab}
            className={`filter-tab ${filter === tab ? 'filter-tab--active' : ''}`}
            onClick={() => setFilter(tab)}
          >
            {tab}
            <span className="filter-count">
              {tab === 'All' ? deliveries.length : deliveries.filter(d => d.status === tab).length}
            </span>
          </button>
        ))}
      </div>

      {/* Deliveries list */}
      {filtered.length === 0 ? (
        <div className="deliveries-empty glass">
          <p>No deliveries found for this filter.</p>
        </div>
      ) : (
        <div className="deliveries-list">
          {filtered.map(order => {
            const statusStyle = STATUS_COLOR[order.status] || STATUS_COLOR['Food Processing'];
            return (
              <div key={order.id} className="delivery-card glass">
                <div className="delivery-card-header">
                  <div>
                    <span className="delivery-id">#{order.id.slice(-8).toUpperCase()}</span>
                    <span
                      className="delivery-status-badge"
                      style={{ background: statusStyle.bg, color: statusStyle.color }}
                    >
                      {order.status}
                    </span>
                  </div>
                  <span className="delivery-amount">₹{order.amount}</span>
                </div>

                <div className="delivery-card-body">
                  <div className="delivery-address">
                    <span className="delivery-label">📍 Delivery To</span>
                    <p>{order.address?.street}, {order.address?.city}</p>
                  </div>
                  <div className="delivery-items">
                    <span className="delivery-label">🛍 Items</span>
                    <p>{order.items?.length} item{order.items?.length !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="delivery-date">
                    <span className="delivery-label">📅 Date</span>
                    <p>{new Date(order.delivered_at || order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Deliveries;
