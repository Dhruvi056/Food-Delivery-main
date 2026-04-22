import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../config/axios.js';
import { StoreContext } from '../../context/StoreContext.jsx';
import { getSocket } from '../../config/socket.js';
import './Track.css';

const Track = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const { token } = useContext(StoreContext);

  const steps = [
    { label: 'Food Processing', status: 'Food Processing', icon: '🍳' },
    { label: 'Ready for Pickup', status: 'Ready for Pickup', icon: '🥡' },
    { label: 'Out for Delivery', status: 'Out for Delivery', icon: '🛵' },
    { label: 'Delivered', status: 'Delivered', icon: '🏠' },
  ];

  const fetchOrder = async () => {
    try {
      const response = await api.get(`/api/order/${orderId}`);
      if (response.data.success) {
        setOrder(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching order:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    
    const socket = getSocket();
    if (socket) {
      socket.on('order_status_update', (data) => {
        if (data.orderId === orderId) {
          setOrder(prev => ({ ...prev, status: data.status }));
        }
      });
    }

    return () => {
      if (socket) socket.off('order_status_update');
    };
  }, [orderId]);

  if (loading) return <div className="track-loading">Locating your order...</div>;
  if (!order) return <div className="track-error">Order not found.</div>;

  const currentStepIndex = steps.findIndex(s => s.status === order.status);

  return (
    <div className="track-container fade-in">
      <div className="track-header">
        <h1 className="font-display">Track Order</h1>
        <p className="order-id">#{order._id.slice(-8).toUpperCase()}</p>
      </div>

      <div className="status-timeline">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isActive = index === currentStepIndex;
          const isFuture = index > currentStepIndex;

          let timestamp = null;
          if (step.status === 'Ready for Pickup') timestamp = order.claimed_at;
          if (step.status === 'Out for Delivery') timestamp = order.picked_up_at;
          if (step.status === 'Delivered') timestamp = order.delivered_at;

          return (
            <div key={step.label} className={`timeline-item ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
              <div className="timeline-icon">{step.icon}</div>
              <div className="timeline-content">
                <h3>{step.label}</h3>
                {timestamp && <span className="timestamp">{new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
              </div>
              {index < steps.length - 1 && <div className="timeline-connector"></div>}
            </div>
          );
        })}
      </div>

      {order.rider && (
        <div className="rider-card glass">
          <div className="rider-info">
            <div className="rider-avatar">🛵</div>
            <div>
              <h4>{order.rider.name} is on the way!</h4>
              <p className="rider-status">{order.rider.phone}</p>
            </div>
          </div>
          <button className="btn-contact" onClick={() => window.location.href=`tel:${order.rider.phone}`}>Call Rider</button>
        </div>
      )}

      <div className="order-summary-card glass">
        <h3>Order Summary</h3>
        <div className="order-items">
          {order.items.map((item, idx) => (
            <div key={idx} className="order-item">
              <span>{item.name} x {item.quantity}</span>
              <span>₹{item.price * item.quantity}</span>
            </div>
          ))}
        </div>
        <div className="order-total">
          <span>Total Paid</span>
          <span className="amount">₹{order.amount}</span>
        </div>
      </div>
    </div>
  );
};

export default Track;
