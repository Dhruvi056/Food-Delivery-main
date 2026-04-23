import React, { useContext, useEffect, useState } from 'react';
import { StoreContext } from '../../context/StoreContext.jsx';
import api from '../../config/axios.js';
import './Profile.css';

// ── Rider Profile ──────────────────────────────────────────────────────────────

const RiderProfile = ({ userName, userEmail }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRiderStats = async () => {
      try {
        // Fetch active order + available orders to derive stats
        const [activeRes, availableRes] = await Promise.allSettled([
          api.get('/api/rider/active'),
          api.get('/api/rider/available'),
        ]);

        const activeOrder = activeRes.status === 'fulfilled' && activeRes.value.data.success
          ? activeRes.value.data.data
          : null;

        const availableCount = availableRes.status === 'fulfilled' && availableRes.value.data.success
          ? availableRes.value.data.data.length
          : 0;

        setStats({ activeOrder, availableCount });
      } catch (err) {
        console.error('Error fetching rider stats:', err);
        setStats({ activeOrder: null, availableCount: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchRiderStats();
  }, []);

  const currentStatus = stats?.activeOrder ? 'On Delivery' : 'Available';
  const statusColor = stats?.activeOrder ? '#f5a623' : '#3ecf4b';

  return (
    <div className="profile-container fade-in">
      <header className="profile-header">
        <div className="user-meta">
          <div className="avatar-large">{userName ? userName.charAt(0).toUpperCase() : 'R'}</div>
          <div>
            <h1 className="font-display">{userName}</h1>
            <p className="user-email">{userEmail}</p>
            <span className="rider-role-badge">🛵 Delivery Rider</span>
          </div>
        </div>
      </header>

      {loading ? (
        <p className="profile-loading">Loading rider stats...</p>
      ) : (
        <div className="profile-grid">
          {/* Status Card */}
          <section className="profile-section glass">
            <h2 className="section-title">Current Status</h2>
            <div className="rider-status-display">
              <span
                className="rider-status-dot"
                style={{ background: statusColor, boxShadow: `0 0 12px ${statusColor}` }}
              />
              <span className="rider-status-text" style={{ color: statusColor }}>
                {currentStatus}
              </span>
            </div>
            {stats?.activeOrder && (
              <div className="active-order-mini">
                <p className="active-order-label">Active Order</p>
                <p className="active-order-id">#{stats.activeOrder.id?.slice(-8).toUpperCase()}</p>
                <p className="active-order-status">{stats.activeOrder.status}</p>
              </div>
            )}
          </section>

          {/* Available Orders */}
          <section className="profile-section glass">
            <h2 className="section-title">Order Pool</h2>
            <div className="rider-stat-block">
              <span className="rider-stat-number">{stats?.availableCount ?? 0}</span>
              <span className="rider-stat-label">Orders awaiting pickup</span>
            </div>
          </section>

          {/* Account Info */}
          <section className="profile-section glass full-width">
            <h2 className="section-title">Account Info</h2>
            <div className="account-info-grid">
              <div className="account-info-item">
                <span className="info-label">Name</span>
                <span className="info-value">{userName}</span>
              </div>
              <div className="account-info-item">
                <span className="info-label">Email</span>
                <span className="info-value">{userEmail}</span>
              </div>
              <div className="account-info-item">
                <span className="info-label">Role</span>
                <span className="info-value">Delivery Rider</span>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

// ── Customer Profile ───────────────────────────────────────────────────────────

const CustomerProfile = ({ userName, userEmail, notifications }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/api/order/userorders?limit=5');
        if (res.data.success) {
          setOrders(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="profile-loading">Loading your dashboard...</div>;

  return (
    <div className="profile-container fade-in">
      <header className="profile-header">
        <div className="user-meta">
          <div className="avatar-large">{userName ? userName.charAt(0).toUpperCase() : 'U'}</div>
          <div>
            <h1 className="font-display">{userName}</h1>
            <p className="user-email">{userEmail}</p>
          </div>
        </div>
      </header>

      <div className="profile-grid">
        {/* Recent Activity */}
        <section className="profile-section glass">
          <h2 className="section-title">Recent Activity</h2>
          <div className="notifications-list">
            {notifications.length === 0 ? (
              <p className="empty-msg">No recent activity.</p>
            ) : (
              notifications.slice(0, 6).map((n, idx) => (
                <div key={idx} className="notif-item">
                  <p>{n.message}</p>
                  <span>{new Date(n.created_at).toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Order Stats */}
        <section className="profile-section glass">
          <h2 className="section-title">Order Summary</h2>
          <div className="rider-stat-block">
            <span className="rider-stat-number">{orders.length}</span>
            <span className="rider-stat-label">Recent orders</span>
          </div>
          {orders.length > 0 && (
            <p className="last-order-note">
              Last order: {new Date(orders[0]?.date || orders[0]?.created_at).toLocaleDateString()}
            </p>
          )}
        </section>

        {/* Recent Orders Table */}
        <section className="profile-section glass full-width">
          <h2 className="section-title">Recent Orders</h2>
          {orders.length === 0 ? (
            <p className="empty-msg">No orders yet. Start exploring the menu!</p>
          ) : (
            <div className="orders-table-wrapper">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order._id || order.id}>
                      <td className="order-id-cell">
                        #{(order._id || order.id || '').slice(-8).toUpperCase()}
                      </td>
                      <td>{new Date(order.date || order.created_at).toLocaleDateString()}</td>
                      <td>₹{order.amount}</td>
                      <td>
                        <span className={`status-badge ${order.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                          {order.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn-track-mini"
                          onClick={() => window.location.href = `/track/${order._id || order.id}`}
                        >
                          Track
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

// ── Root: Role Gate ────────────────────────────────────────────────────────────

const Profile = () => {
  const { userName, userEmail, notifications, fetchNotifications } = useContext(StoreContext);
  const role = (localStorage.getItem('role') || 'user').toLowerCase();

  useEffect(() => {
    fetchNotifications();
  }, []);

  if (role === 'rider') {
    return <RiderProfile userName={userName} userEmail={userEmail} />;
  }

  return <CustomerProfile userName={userName} userEmail={userEmail} notifications={notifications} />;
};

export default Profile;
