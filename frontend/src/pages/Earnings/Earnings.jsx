import React, { useState, useEffect } from 'react';
import api from '../../config/axios.js';
import { Link } from 'react-router-dom';
import './Earnings.css';

const Earnings = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        const res = await api.get('/api/rider/earnings');
        if (res.data.success) setData(res.data.data);
      } catch (err) {
        console.error('Error fetching earnings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEarnings();
  }, []);

  if (loading) return <div className="earnings-loading">Calculating earnings...</div>;

  const { totalEarnings = 0, deliveryCount = 0, breakdown = [], perDelivery = 40 } = data || {};

  // Group by date for daily summary
  const byDate = breakdown.reduce((acc, item) => {
    const day = new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    if (!acc[day]) acc[day] = { earned: 0, count: 0 };
    acc[day].earned += item.earned;
    acc[day].count  += 1;
    return acc;
  }, {});

  return (
    <div className="earnings-page fade-in">
      <header className="earnings-header">
        <div>
          <h1 className="font-display">My Earnings</h1>
          <p className="earnings-sub">₹{perDelivery} per completed delivery</p>
        </div>
        <Link to="/rider-dashboard" className="btn-back-dash">← Dashboard</Link>
      </header>

      {/* Top stats */}
      <div className="earnings-stats">
        <div className="earnings-stat-card glass earnings-stat-card--main">
          <span className="earnings-stat-label">Total Earned</span>
          <span className="earnings-stat-big">₹{totalEarnings.toLocaleString()}</span>
        </div>
        <div className="earnings-stat-card glass">
          <span className="earnings-stat-label">Deliveries</span>
          <span className="earnings-stat-num">{deliveryCount}</span>
        </div>
        <div className="earnings-stat-card glass">
          <span className="earnings-stat-label">Per Delivery</span>
          <span className="earnings-stat-num">₹{perDelivery}</span>
        </div>
      </div>

      {/* Daily breakdown */}
      <section className="earnings-section">
        <h2 className="earnings-section-title">Day-wise Breakdown</h2>
        {Object.keys(byDate).length === 0 ? (
          <div className="earnings-empty glass">
            <p>No completed deliveries yet. Start earning by claiming orders!</p>
          </div>
        ) : (
          <div className="earnings-breakdown">
            {Object.entries(byDate).map(([day, info]) => (
              <div key={day} className="earnings-row glass">
                <div>
                  <p className="earnings-day">{day}</p>
                  <p className="earnings-deliveries-count">{info.count} delivery{info.count !== 1 ? 'ies' : ''}</p>
                </div>
                <span className="earnings-day-amount">+₹{info.earned}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Per-order detail */}
      {breakdown.length > 0 && (
        <section className="earnings-section">
          <h2 className="earnings-section-title">Order-wise Detail</h2>
          <div className="earnings-table-wrapper glass">
            <table className="earnings-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Date</th>
                  <th>Order Value</th>
                  <th>Earned</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.map(item => (
                  <tr key={item.orderId}>
                    <td className="earnings-order-id">#{item.orderId.slice(-8).toUpperCase()}</td>
                    <td>{new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                    <td>₹{item.orderAmount}</td>
                    <td className="earnings-earned">+₹{item.earned}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};

export default Earnings;
