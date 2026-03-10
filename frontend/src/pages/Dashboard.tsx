import { useEffect, useState } from 'react';
import api from '../lib/api';
import './Dashboard.css';

interface BarangayData {
  barangay: string;
  count: number;
  displayName?: string;
}

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalEncoded: 0,
    barangaysCovered: 0,
    maleCount: 0,
    femaleCount: 0,
    lastUpdate: '—',
  });
  const [loading, setLoading] = useState(true);

  const [barangayData, setBarangayData] = useState<BarangayData[]>([]);

  useEffect(() => {
    // Fetch dashboard statistics from API aggregation endpoint
    const fetchStats = async () => {
      try {
        const response = await api.get('/households/dashboard-stats');
        const data = response.data;
        
        setStats({
          totalEncoded: data.stats.totalEncoded,
          barangaysCovered: data.stats.barangaysCovered,
          maleCount: data.stats.maleCount,
          femaleCount: data.stats.femaleCount,
          lastUpdate: data.stats.lastUpdate,
        });

        setBarangayData(data.barangayData);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Dashboard Overview</h1>
        <p className="dashboard-subtitle">Manage nutrition data per barangay in a single view.</p>
      </div>

      <div className="dashboard-grid">
        <div className="metric-card">
          <h3 className="metric-title">Total Encoded</h3>
          <p className="metric-value">
            {loading ? '0' : stats.totalEncoded.toLocaleString()}
          </p>
          <p className="metric-subtitle">All Data</p>
        </div>

        <div className="metric-card">
          <h3 className="metric-title">Barangays Covered</h3>
          <p className="metric-value">
            {loading ? '0' : stats.barangaysCovered}
          </p>
          <p className="metric-subtitle">Active data sources</p>
        </div>

        <div className="metric-card">
          <h3 className="metric-title">Sex Distribution</h3>
          <p className="metric-value">
            {loading ? '—' : `${stats.maleCount.toLocaleString()} Male ${stats.femaleCount.toLocaleString()} Female`}
          </p>
          <p className="metric-subtitle">Current encoded mix</p>
        </div>

        <div className="metric-card">
          <h3 className="metric-title">Last Update</h3>
          <p className="metric-value">{loading ? '—' : stats.lastUpdate}</p>
          <p className="metric-subtitle">Latest submission</p>
        </div>
      </div>

      <div className="distribution-section">
        <h2 className="section-title">Barangay Record Distribution</h2>
        <p className="section-subtitle">Counts of encoded records per barangay.</p>
        <div className="chart-container">
          <div className="chart-legend">
            <span className="bullet">•</span> Records
          </div>
          <div className="bar-chart">
            {barangayData.length > 0 ? (() => {
              // Calculate the maximum value from actual data
              const maxCount = Math.max(...barangayData.map(d => d.count));

              // Calculate a nice maximum for the Y-axis (round up to next nice number)
              const getNiceMax = (max: number): number => {
                if (max === 0) return 5; // Show at least 0-5 when all values are 0
                if (max <= 5) return 5;
                if (max <= 10) return 10;
                if (max <= 20) return 20;
                if (max <= 50) return Math.ceil(max / 10) * 10;
                if (max <= 100) return Math.ceil(max / 20) * 20;
                return Math.ceil(max / 50) * 50;
              };

              const niceMax = getNiceMax(maxCount);

              // Generate Y-axis labels based on the nice maximum
              const generateYAxisLabels = (max: number): number[] => {
                if (max <= 5) return [5, 4, 3, 2, 1, 0];
                if (max <= 10) return [10, 8, 6, 4, 2, 0];
                if (max <= 20) return [20, 16, 12, 8, 4, 0];
                const step = max / 8;
                const labels: number[] = [];
                for (let i = max; i >= 0; i -= step) {
                  labels.push(Math.round(i));
                }
                return labels;
              };

              const yAxisLabels = generateYAxisLabels(niceMax);

              return (
                <>
                  <div className="chart-y-axis">
                    {yAxisLabels.map((value) => (
                      <div key={value} className="y-axis-tick">
                        <span className="y-axis-label">{value}</span>
                        <span className="y-axis-dash" aria-hidden="true" />
                      </div>
                    ))}
                  </div>
                  <div className="chart-bars-container">
                    <div className="chart-scroll-area">
                      <div className="chart-bars">
                        {barangayData.map((item, index) => {
                          const height = niceMax > 0 ? (item.count / niceMax) * 100 : 0;
                          const displayName = item.displayName || item.barangay;
                          return (
                            <div key={index} className="bar-wrapper">
                              <div
                                className="bar"
                                style={{ height: `${height}%` }}
                                title={`${displayName}: ${item.count} records`}
                              >
                                <span className="bar-value">{item.count}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="chart-labels-row">
                        {barangayData.map((item, index) => {
                          const displayName = item.displayName || item.barangay;
                          return (
                            <div key={index} className="bar-label">{displayName}</div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </>
              );
            })() : (
              <div className="chart-empty">No data available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
