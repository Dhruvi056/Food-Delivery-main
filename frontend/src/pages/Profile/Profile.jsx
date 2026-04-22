import React, { useContext, useEffect, useState } from 'react';
import { StoreContext } from '../../context/StoreContext.jsx';
import api from '../../config/axios.js';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import './Profile.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Profile = () => {
  const { userName, userEmail, notifications, fetchNotifications } = useContext(StoreContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await api.get('/api/order/userorders?limit=5');
      if (res.data.success) {
        setOrders(res.data.data);
      }
      await fetchNotifications();
    } catch (err) {
      console.error("Error fetching profile data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Prepare chart data
  const chartData = {
    labels: orders.map(o => new Date(o.date).toLocaleDateString([], { month: 'short', day: 'numeric' })).reverse(),
    datasets: [
      {
        label: 'Calories per Order',
        data: orders.map(o => {
          return o.items.reduce((sum, item) => sum + (item.calorie || 0) * item.quantity, 0);
        }).reverse(),
        backgroundColor: '#e8523a',
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Calorie Trends (Last 5 Orders)', color: '#f0ede6' },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#2a2a25' },
        ticks: { color: '#7a7870' }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#7a7870' }
      }
    }
  };

  if (loading) return <div className="profile-loading">Loading your dashboard...</div>;

  return (
    <div className="profile-container fade-in">
      <header className="profile-header">
        <div className="user-meta">
          <div className="avatar-large">{userName.charAt(0).toUpperCase()}</div>
          <div>
            <h1 className="font-display">{userName}</h1>
            <p className="user-email">{userEmail}</p>
          </div>
        </div>
      </header>

      <div className="profile-grid">
        {/* Calorie Tracker */}
        <section className="profile-section glass">
          <h2 className="section-title">Calorie Tracker</h2>
          <div className="chart-container">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </section>

        {/* Notifications */}
        <section className="profile-section glass">
          <h2 className="section-title">Recent Activity</h2>
          <div className="notifications-list">
            {notifications.length === 0 ? (
              <p className="empty-msg">No recent activity.</p>
            ) : (
              notifications.map((n, idx) => (
                <div key={idx} className="notif-item">
                  <p>{n.message}</p>
                  <span>{new Date(n.created_at).toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Recent Orders */}
        <section className="profile-section glass full-width">
          <h2 className="section-title">Recent Orders</h2>
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
                  <tr key={order._id}>
                    <td className="order-id-cell">#{order._id.slice(-8).toUpperCase()}</td>
                    <td>{new Date(order.date).toLocaleDateString()}</td>
                    <td>₹{order.amount}</td>
                    <td><span className={`status-badge ${order.status.toLowerCase().replace(/\s+/g, '-')}`}>{order.status}</span></td>
                    <td><button className="btn-track-mini" onClick={() => window.location.href=`/track/${order._id}`}>Track</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Profile;
