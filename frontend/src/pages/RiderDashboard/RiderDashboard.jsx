import React, { useState, useEffect, useContext, useCallback } from 'react';
import api from '../../config/axios.js';
import { StoreContext } from '../../context/StoreContext.jsx';
import { getSocket, connectSocket } from '../../config/socket.js';
import { toast } from 'react-toastify';
import './RiderDashboard.css';

const RiderDashboard = () => {
  const { token, userName } = useContext(StoreContext);
  const [activeOrder, setActiveOrder] = useState(null);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const [watchId, setWatchId] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchActiveOrder = async () => {
    try {
      const res = await api.get('/api/rider/active');
      if (res.data.success) setActiveOrder(res.data.data);
    } catch (err) {
      console.error("Error fetching active order:", err);
    }
  };

  const fetchAvailableOrders = async () => {
    try {
      const res = await api.get('/api/rider/available');
      if (res.data.success) setAvailableOrders(res.data.data);
    } catch (err) {
      console.error("Error fetching available orders:", err);
    }
  };

  const init = async () => {
    setLoading(true);
    await Promise.all([fetchActiveOrder(), fetchAvailableOrders()]);
    setLoading(false);
  };

  useEffect(() => {
    init();
    
    // Socket setup
    const userId = localStorage.getItem("userId");
    const socket = connectSocket(userId);
    socket.emit('join_rider', userId);   // pass riderId so backend can join rider_<id> room

    socket.on('food_ready', () => {
      toast.info("New order ready for pickup!", { theme: "dark" });
      fetchAvailableOrders();
    });

    socket.on('order_completed', () => {
      setActiveOrder(null);
      fetchAvailableOrders();
    });

    return () => {
      socket.off('food_ready');
      socket.off('order_completed');
    };
  }, []);

  // Location tracking
  useEffect(() => {
    if (isSharingLocation) {
      const id = navigator.geolocation.watchPosition(
        async (pos) => {
          try {
            await api.post('/api/rider/location', {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude
            });
          } catch (err) {
            console.error("Location update failed:", err);
          }
        },
        (err) => toast.error("Location access denied"),
        { enableHighAccuracy: true }
      );
      setWatchId(id);
    } else {
      if (watchId) navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    return () => { if (watchId) navigator.geolocation.clearWatch(watchId); };
  }, [isSharingLocation]);

  const handleClaim = async (orderId) => {
    try {
      const res = await api.post('/api/rider/claim', { orderId });
      if (res.data.success) {
        toast.success("Order claimed!");
        setActiveOrder(res.data.data);
        fetchAvailableOrders();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to claim order");
    }
  };

  const handleAdvance = async () => {
    if (!activeOrder) return;
    try {
      const res = await api.post('/api/rider/advance', { orderId: activeOrder.id });
      if (res.data.success) {
        setActiveOrder(res.data.data.status === 'Delivered' ? null : res.data.data);
        if (res.data.data.status === 'Delivered') toast.success("Delivery completed!");
      }
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const getAdvanceButtonLabel = (status) => {
    switch (status) {
      case 'Ready for Pickup': return "Mark as Picked Up";
      case 'Out for Delivery': return "Mark as Delivered";
      case 'Delivered': return "Completed";
      default: return "Next Step";
    }
  };

  if (loading) return <div className="rider-loading">Initializing Rider Dashboard...</div>;

  return (
    <div className="rider-dashboard fade-in">
      <header className="rider-header">
        <div>
          <h1 className="font-display">Rider Portal</h1>
          <p className="rider-welcome">Welcome back, {userName}</p>
        </div>
        <div className="location-toggle glass">
          <span>Share Location</span>
          <label className="switch">
            <input 
              type="checkbox" 
              checked={isSharingLocation} 
              onChange={(e) => setIsSharingLocation(e.target.checked)} 
            />
            <span className="slider round"></span>
          </label>
        </div>
      </header>

      <main className="rider-content">
        {/* Active Order Section */}
        <section className="active-section">
          <h2 className="section-title">Active Task</h2>
          {activeOrder ? (
            <div className="active-card glass">
              <div className="active-badge">ACTIVE</div>
              <div className="active-main">
                <div className="active-info">
                  <h3>#{activeOrder.id.slice(-8).toUpperCase()}</h3>
                  <p className="status-tag">{activeOrder.status}</p>
                  <div className="address-box">
                    <strong>Delivery Address:</strong>
                    <p>{activeOrder.address.street}, {activeOrder.address.city}</p>
                  </div>
                </div>
                <button 
                  className="btn-advance" 
                  onClick={handleAdvance}
                  disabled={activeOrder.status === 'Delivered'}
                >
                  {getAdvanceButtonLabel(activeOrder.status)}
                </button>
              </div>
            </div>
          ) : (
            <div className="empty-state glass">
              <p>No active delivery. Claim one from the pool below.</p>
            </div>
          )}
        </section>

        {/* Available Orders Section */}
        <section className="pool-section">
          <h2 className="section-title">Available Orders ({availableOrders.length})</h2>
          <div className="order-grid">
            {availableOrders.map(order => (
              <div key={order.id} className="pool-card glass">
                <div className="pool-header">
                  <span>{order.items.length} Items</span>
                  <span className="pool-price">₹{order.amount}</span>
                </div>
                <p className="pool-address">{order.address.street}, {order.address.city}</p>
                <button className="btn-claim" onClick={() => handleClaim(order.id)}>Claim Order</button>
              </div>
            ))}
            {availableOrders.length === 0 && (
              <p className="no-orders">Waiting for new orders to be ready...</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default RiderDashboard;
