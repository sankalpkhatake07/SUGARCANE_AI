import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { useTranslation } from 'react-i18next';
import { UserGear, Users, Scan, ChartPie, DownloadSimple } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { format } from 'date-fns';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const AdminPage = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [detections, setDetections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [downloading, setDownloading] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, usersRes, detectionsRes] = await Promise.all([
        axios.get(`${API_URL}/api/admin/stats`, { withCredentials: true }),
        axios.get(`${API_URL}/api/admin/users`, { withCredentials: true }),
        axios.get(`${API_URL}/api/admin/detections`, { withCredentials: true })
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setDetections(detectionsRes.data);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadImages = async () => {
    setDownloading(true);
    try {
      const response = await axios.get(`${API_URL}/api/admin/download-images`, {
        withCredentials: true,
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sugarcane_images_${new Date().toISOString().slice(0,10)}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert(error.response?.status === 404 ? 'No images to download yet.' : 'Download failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  };


  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'bg-[#FDF0EF] text-[#D9534F]';
      case 'medium': return 'bg-[#FEF8ED] text-[#F5A623]';
      case 'low': return 'bg-[#EFF8EF] text-[#5CB85C]';
      default: return 'bg-[#F9F8F6] text-[#5C6B61]';
    }
  };

  return (
    <Layout>
      <div data-testid="admin-page" className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl sm:text-5xl font-bold text-[#1A201C] mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {t('admin')}
          </h1>
          <p className="text-base text-[#5C6B61] mb-8">
            Manage users and view system analytics
          </p>

          {/* Download All Images Button */}
          <div className="mb-6">
            <button
              data-testid="download-images-btn"
              onClick={handleDownloadImages}
              disabled={downloading}
              className="inline-flex items-center space-x-2 bg-[#2D5A27] hover:bg-[#24481F] text-white px-5 py-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:scale-95"
            >
              {downloading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
                  <span>Preparing ZIP...</span>
                </>
              ) : (
                <>
                  <DownloadSimple size={20} weight="bold" />
                  <span>Download All Images (ZIP)</span>
                </>
              )}
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#2D5A27] mx-auto"></div>
              <p className="mt-4 text-[#5C6B61]">{t('loading')}</p>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[#5C6B61] mb-1">{t('totalUsers')}</p>
                      <p className="text-3xl font-bold text-[#1A201C]">{stats?.total_users || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-[#E8ECE5] rounded-full flex items-center justify-center">
                      <Users size={24} className="text-[#2D5A27]" weight="fill" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[#5C6B61] mb-1">{t('totalScans')}</p>
                      <p className="text-3xl font-bold text-[#1A201C]">{stats?.total_scans || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-[#E8ECE5] rounded-full flex items-center justify-center">
                      <Scan size={24} className="text-[#2D5A27]" weight="fill" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[#5C6B61] mb-1">Disease Types</p>
                      <p className="text-3xl font-bold text-[#1A201C]">{stats?.disease_distribution?.length || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-[#E8ECE5] rounded-full flex items-center justify-center">
                      <ChartPie size={24} className="text-[#2D5A27]" weight="fill" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex space-x-4 mb-6 border-b border-[#DDE3DA]">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`pb-3 px-4 font-medium transition-colors ${
                    activeTab === 'overview'
                      ? 'text-[#2D5A27] border-b-2 border-[#2D5A27]'
                      : 'text-[#5C6B61] hover:text-[#1A201C]'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`pb-3 px-4 font-medium transition-colors ${
                    activeTab === 'users'
                      ? 'text-[#2D5A27] border-b-2 border-[#2D5A27]'
                      : 'text-[#5C6B61] hover:text-[#1A201C]'
                  }`}
                >
                  Users
                </button>
                <button
                  onClick={() => setActiveTab('scans')}
                  className={`pb-3 px-4 font-medium transition-colors ${
                    activeTab === 'scans'
                      ? 'text-[#2D5A27] border-b-2 border-[#2D5A27]'
                      : 'text-[#5C6B61] hover:text-[#1A201C]'
                  }`}
                >
                  Recent Scans
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === 'overview' && (
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h2 className="text-2xl font-bold text-[#1A201C] mb-4">{t('diseaseDistribution')}</h2>
                  <div className="space-y-3">
                    {stats?.disease_distribution?.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-[#F9F8F6] rounded-lg">
                        <span className="font-medium text-[#1A201C]">{item._id}</span>
                        <span className="text-2xl font-bold text-[#2D5A27]">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'users' && (
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[#E8ECE5]">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-[#1A201C]">Username</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-[#1A201C]">Name</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-[#1A201C]">Mobile</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-[#1A201C]">Role</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-[#1A201C]">Joined</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#DDE3DA]">
                        {users.map((user, idx) => (
                          <tr key={idx} className="hover:bg-[#F9F8F6] transition-colors">
                            <td className="px-6 py-4 text-sm text-[#1A201C]">{user.username}</td>
                            <td className="px-6 py-4 text-sm text-[#5C6B61]">{user.name || '-'}</td>
                            <td className="px-6 py-4 text-sm text-[#5C6B61]">{user.mobile || '-'}</td>
                            <td className="px-6 py-4 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                user.role === 'admin' ? 'bg-[#2D5A27] text-white' : 'bg-[#E8ECE5] text-[#2D5A27]'
                              }`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-[#5C6B61]">
                              {format(new Date(user.created_at), 'PP')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'scans' && (
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[#E8ECE5]">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-[#1A201C]">User</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-[#1A201C]">Disease</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-[#1A201C]">Severity</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-[#1A201C]">Treatment</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-[#1A201C]">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#DDE3DA]">
                        {detections.slice(0, 20).map((detection, idx) => (
                          <tr key={idx} className="hover:bg-[#F9F8F6] transition-colors">
                            <td className="px-6 py-4 text-sm text-[#1A201C]">{detection.username}</td>
                            <td className="px-6 py-4 text-sm font-medium text-[#2D5A27]">{detection.disease}</td>
                            <td className="px-6 py-4 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(detection.severity)}`}>
                                {detection.severity}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-[#5C6B61] max-w-xs truncate">{detection.treatment}</td>
                            <td className="px-6 py-4 text-sm text-[#5C6B61]">
                              {format(new Date(detection.created_at), 'PP p')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </Layout>
  );
};
