import React, { useContext, useEffect, useState } from 'react';
import { StoreContext } from '../../context/StoreContext';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title, CategoryScale, LinearScale, BarElement, PointElement, LineElement } from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import './Calorie.css';


ChartJS.register(
  ArcElement, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend
);

const Calorie = () => {
  const { 
    getTotalCalories, 
    cartItems, 
    food_list, 
    calorieHistory, 
    getCurrentMonthCalories: _getCurrentMonthCalories,
  } = useContext(StoreContext);

  // getCurrentMonthCalories is not implemented in StoreContext yet — safe fallback
  const getCurrentMonthCalories = _getCurrentMonthCalories || (() => ({
    dailyData: {},
    totalCalories: 0,
    daysTracked: 0,
  }));

  
  const [calorieDetails, setCalorieDetails] = useState([]);
  const [totalCalories, setTotalCalories] = useState(0);
  const [activeTab, setActiveTab] = useState('daily');
  const dailyCalorieTarget = 2000;
  const monthlyCalorieTarget = dailyCalorieTarget * 30; 

  useEffect(() => {
    
    const details = [];
    let total = 0;
    
    for (const itemId in cartItems) {
      if (cartItems[itemId] > 0) {
        const itemInfo = food_list.find((product) => product._id === itemId);
        if (itemInfo) {
          const itemCalories = itemInfo.calorie * cartItems[itemId];
          details.push({
            name: itemInfo.name,
            quantity: cartItems[itemId],
            caloriePerUnit: itemInfo.calorie,
            totalCalories: itemCalories
          });
          total += itemCalories;
        }
      }
    }
    
    setCalorieDetails(details);
    setTotalCalories(total);
  }, [cartItems, food_list]);


  const dailyCaloriePieData = {
    labels: ['Consumed Calories', 'Remaining Calories'],
    datasets: [
      {
        data: [
          totalCalories,
          totalCalories > dailyCalorieTarget ? 0 : dailyCalorieTarget - totalCalories
        ],
        backgroundColor: [
          'rgba(228, 77, 22, 0.7)',  
          'rgba(221, 221, 221, 0.99)'
        ],
        borderColor: [
          'rgba(230, 77, 22, 0.7)',
          'rgba(200, 200, 200, 1)'
        ],
        borderWidth: 1,
      },
    ],
  };

  
  const prepareMonthlyData = () => {
    const currentMonthData = getCurrentMonthCalories();
    const dailyData = currentMonthData.dailyData || {};
    
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    const labels = [];
    const calorieData = [];
    const targetLine = [];
    
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      labels.push(day);
      
      
      const dayCalories = dailyData[dateStr] || 0;
      calorieData.push(dayCalories);
      
    
      targetLine.push(dailyCalorieTarget);
    }
    
    return {
      labels,
      calorieData,
      targetLine,
      totalMonthlyCalories: currentMonthData.totalCalories || 0,
      daysTracked: currentMonthData.daysTracked || 0
    };
  };

  const monthlyData = prepareMonthlyData();

  
  const monthlyCalorieLineData = {
    labels: monthlyData.labels,
    datasets: [
      {
        label: 'Daily Calories',
        data: monthlyData.calorieData,
        fill: false,
        backgroundColor: 'rgba(228, 77, 22, 0.7)',
        borderColor: 'rgba(228, 77, 22, 0.7)',
        tension: 0.1
      },
      {
        label: 'Daily Target (2000)',
        data: monthlyData.targetLine,
        fill: false,
        backgroundColor: 'rgba(100, 100, 100, 0.4)',
        borderColor: 'rgba(100, 100, 100, 0.4)',
        borderDash: [5, 5],
        pointRadius: 0
      }
    ]
  };

  
  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#444'
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw || 0;
            return `${label}: ${value} calories`;
          }
        }
      }
    }
  };

  
  const lineChartOptions = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Calories'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Day of Month'
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Monthly Calorie Tracking'
      }
    }
  };

  return (
    <div className="calorie-chart-container">
      <h2>Calorie Tracker</h2>
      
      <div className="calorie-tabs">
        <button 
          className={`tab-button ${activeTab === 'daily' ? 'active' : ''}`}
          onClick={() => setActiveTab('daily')}
        >
          Daily View
        </button>
        <button 
          className={`tab-button ${activeTab === 'monthly' ? 'active' : ''}`}
          onClick={() => setActiveTab('monthly')}
        >
          Monthly View
        </button>
      </div>
      
      {activeTab === 'daily' ? (
        // Daily View
        calorieDetails.length > 0 ? (
          <div className="calorie-dashboard">
            <div className="chart-section">
              <div className="chart-container">
                <h3>Daily Calorie Target (2000 cal)</h3>
                <Pie data={dailyCaloriePieData} options={pieChartOptions} />
                <div className="calorie-status">
                  {totalCalories > dailyCalorieTarget ? (
                    <p className="warning">Exceeds daily target by {totalCalories - dailyCalorieTarget} calories</p>
                  ) : (
                    <p className="good">{dailyCalorieTarget - totalCalories} calories remaining</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="calorie-details">
              <h3>Detailed Breakdown</h3>
              <table className="calorie-table">
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Quantity</th>
                    <th>Calories (per unit)</th>
                    <th>Total Calories</th>
                  </tr>
                </thead>
                <tbody>
                  {calorieDetails.map((item, index) => (
                    <tr key={index}>
                      <td>{item.name}</td>
                      <td>{item.quantity}</td>
                      <td>{item.caloriePerUnit}</td>
                      <td>{item.totalCalories}</td>
                    </tr>
                  ))}
                  <tr className="total-row">
                    <td colSpan="3"><strong>Total Calories</strong></td>
                    <td><strong>{totalCalories}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="calorie-summary">
              <div className="summary-box">
                <h3>Total Calories</h3>
                <p className="calorie-count">{totalCalories}</p>
                <p className="daily-info">
                  {totalCalories < dailyCalorieTarget ? 
                    `${Math.round((totalCalories/dailyCalorieTarget) * 100)}% of daily calorie target` : 
                    `Exceeds daily calorie target by ${Math.round(((totalCalories-dailyCalorieTarget)/dailyCalorieTarget) * 100)}%`
                  }
                </p>
              </div>
            </div>
          </div>
        ) : (
          <p className="empty-cart-message">No items in cart. Add some food items to see their calorie information.</p>
        )
      ) : (

        // Monthly View

        <div className="calorie-dashboard">
          <div className="chart-section">
            <div className="chart-container monthly-chart">
              <h3>Monthly Calorie Tracking</h3>
              <Line data={monthlyCalorieLineData} options={lineChartOptions} />
            </div>
          </div>
          
          <div className="calorie-monthly-summary">
            <div className="summary-box">
              <h3>Monthly Stats</h3>
              <div className="monthly-stats">
                <div className="stat-item">
                  <span className="stat-label">Total Calories:</span>
                  <span className="stat-value">{monthlyData.totalMonthlyCalories}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Days Tracked:</span>
                  <span className="stat-value">{monthlyData.daysTracked}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Daily Average:</span>
                  <span className="stat-value">
                    {monthlyData.daysTracked > 0 
                      ? Math.round(monthlyData.totalMonthlyCalories / monthlyData.daysTracked) 
                      : 0}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Monthly Target:</span>
                  <span className="stat-value">{dailyCalorieTarget} × 30 = {monthlyCalorieTarget}</span>
                </div>
              </div>
              
              <div className="monthly-progress">
                <h4>Progress</h4>
                <div className="progress-bar-container">
                  <div 
                    className="progress-bar" 
                    style={{ 
                      width: `${Math.min(100, (monthlyData.totalMonthlyCalories / monthlyCalorieTarget) * 100)}%`,
                      backgroundColor: monthlyData.totalMonthlyCalories > monthlyCalorieTarget ? '#e44d16' : '#4CAF50'
                    }}
                  ></div>
                </div>
                <p className="progress-text">
                  {Math.round((monthlyData.totalMonthlyCalories / monthlyCalorieTarget) * 100)}% of monthly target
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calorie;