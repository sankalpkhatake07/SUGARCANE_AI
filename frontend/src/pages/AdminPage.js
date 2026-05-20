import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { useTranslation } from 'react-i18next';
import { UserGear, Users, Scan, ChartPie, DownloadSimple, CheckCircle, XCircle, Clock, PencilSimple, ClockCounterClockwise } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { format } from 'date-fns';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const DISEASE_LIST = [
  "Early Shoot Borer", "Top Shoot Borer", "Grassy Shoot Disease", "Healthy",
  "Mites", "Mosaic", "Pokkah Boeng", "Red Rot", "Whiplash Smut",
  "Woolly Aphids", "Black Aphid", "Aphids", "Brown Rust", "Orange Rust",
  "Brown Spot", "Eye Spot", "Internode Borer", "Root Borer", "Pink Borer",
  "Leaf Footed Bug", "Pyrilla", "Scale Insect", "White Grub", "Whitefly",
  "Wilt", "Yellow Leaf Disease"
];

export const AdminPage = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [detections, setDetections] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [downloading, setDownloading] = useState(false);
  const [reviewingId, setReviewingId] = useState(null);
  const [reviewForm, setReviewForm] = useState({ disease: '', severity: '', suggestion: '' });
  const [submitting, setSubmitting] = useState(null);
  const { t } = useTranslation();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [statsRes, usersRes, detectionsRes, pendingRes] = await Promise.all([
        axios.get(`${API_URL}/api/admin/stats`, { withCredentials: true }),
        axios.get(`${API_URL}/api/admin/users`, { withCredentials: true }),
        axios.get(`${API_URL}/api/admin/detections`, { withCredentials: true }),
        axios.get(`${API_URL}/api/admin/pending`, { withCredentials: true })
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setDetections(detectionsRes.data);
      setPending(pendingRes.data);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (detectionId, action) => {
    setSubmitting(detectionId + action);
    try {
      const body = { action };
      if (action === 'approve') {
        body.disease = reviewForm.disease || undefined;
        body.severity = reviewForm.severity || undefined;
        body.suggestion = reviewForm.suggestion || '';
      } else {
        body.suggestion = reviewForm.suggestion || '';
      }
      await axios.post(`${API_URL}/api/admin/review/${detectionId}`, body, { withCredentials: true });
      setReviewingId(null);
      setReviewForm({ disease: '', severity: '', suggestion: '' });
      await fetchData();
    } catch (error) {
      console.error('Review failed:', error);
      alert('Review failed. Please try again.');
    } finally {
      setSubmitting(null);
    }
  };

  const openReview = (item) => {
    setReviewingId(item.id);
    setReviewForm({ disease: item.ai_disease || item.disease, severity: item.ai_severity || item.severity, suggestion: '' });
  };

  const handleDownloadImages = async () => {
    setDownloading(true);
    try {
      const response = await axios.get(`${API_URL}/api/admin/download-images`, { withCredentials: true, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sugarcane_images_${new Date().toISOString().slice(0,10)}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert(error.response?.status === 404 ? 'No images to download yet.' : 'Download failed.');
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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved': return <span className="px-2 py-1 rounded-full text-xs font-medium bg-[#EFF8EF] text-[#2D5A27]">Approved</span>;
      case 'rejected': return <span className="px-2 py-1 rounded-full text-xs font-medium bg-[#FDF0EF] text-[#D9534F]">Rejected</span>;
      default: return <span className="px-2 py-1 rounded-full text-xs font-medium bg-[#FEF8ED] text-[#F5A623]">Pending</span>;
    }
  };

  return (
    <Layout>
      <div data-testid="admin-page" className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl sm:text-5xl font-bold text-[#1A201C] mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {t('admin')}
          </h1>
          <p className="text-base text-[#5C6B61] mb-6">Manage users, review scans, and view analytics</p>

          <div className="flex flex-wrap gap-3 mb-8">
            <button
              data-testid="download-images-btn"
              onClick={handleDownloadImages}
              disabled={downloading}
              className="inline-flex items-center space-x-2 bg-[#2D5A27] hover:bg-[#24481F] text-white px-5 py-2.5 rounded-xl font-medium transition-all disabled:opacity-50 shadow-md active:scale-95"
            >
              {downloading ? (
                <><div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div><span>Preparing...</span></>
              ) : (
                <><DownloadSimple size={20} weight="bold" /><span>Download All Images (ZIP)</span></>
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
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-xl shadow-md p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[#5C6B61]">{t('totalUsers')}</p>
                      <p className="text-3xl font-bold text-[#1A201C]">{stats?.total_users || 0}</p>
                    </div>
                    <div className="w-11 h-11 bg-[#E8ECE5] rounded-full flex items-center justify-center">
                      <Users size={22} className="text-[#2D5A27]" weight="fill" />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-md p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[#5C6B61]">{t('totalScans')}</p>
                      <p className="text-3xl font-bold text-[#1A201C]">{stats?.total_scans || 0}</p>
                    </div>
                    <div className="w-11 h-11 bg-[#E8ECE5] rounded-full flex items-center justify-center">
                      <Scan size={22} className="text-[#2D5A27]" weight="fill" />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-md p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[#F5A623]">Pending Review</p>
                      <p className="text-3xl font-bold text-[#F5A623]">{pending.length}</p>
                    </div>
                    <div className="w-11 h-11 bg-[#FEF8ED] rounded-full flex items-center justify-center">
                      <Clock size={22} className="text-[#F5A623]" weight="fill" />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-md p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[#5C6B61]">Disease Types</p>
                      <p className="text-3xl font-bold text-[#1A201C]">{stats?.disease_distribution?.length || 0}</p>
                    </div>
                    <div className="w-11 h-11 bg-[#E8ECE5] rounded-full flex items-center justify-center">
                      <ChartPie size={22} className="text-[#2D5A27]" weight="fill" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex space-x-1 mb-6 border-b border-[#DDE3DA]">
                {['pending', 'reviewed', 'overview', 'users', 'scans'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-3 px-4 font-medium transition-colors capitalize ${
                      activeTab === tab ? 'text-[#2D5A27] border-b-2 border-[#2D5A27]' : 'text-[#5C6B61] hover:text-[#1A201C]'
                    }`}
                  >
                    {tab === 'pending' ? `Pending Reviews (${pending.length})` : tab === 'reviewed' ? `Reviewed (${detections.filter(d => d.status === 'approved' || d.status === 'rejected').length})` : tab === 'scans' ? 'All Scans' : tab}
                  </button>
                ))}
              </div>

              {/* PENDING REVIEWS TAB */}
              {activeTab === 'pending' && (
                <div className="space-y-4">
                  {pending.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-md p-12 text-center">
                      <CheckCircle size={64} className="mx-auto text-[#2D5A27] mb-4" weight="fill" />
                      <p className="text-lg font-medium text-[#1A201C]">All caught up!</p>
                      <p className="text-[#5C6B61] mt-1">No pending scans to review.</p>
                    </div>
                  ) : (
                    pending.map((item) => (
                      <div key={item.id} data-testid={`pending-item-${item.id}`} className="bg-white rounded-xl shadow-md overflow-hidden">
                        <div className="p-6">
                          <div className="flex gap-6">
                            {/* Image */}
                            <div className="w-40 h-40 rounded-lg overflow-hidden flex-shrink-0 bg-[#E8ECE5]">
                              <img src={`${API_URL}/api/files/${item.image_path}`} alt="scan" className="w-full h-full object-cover" />
                            </div>
                            {/* Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <p className="text-sm text-[#5C6B61]">Submitted by <span className="font-semibold text-[#1A201C]">{item.username}</span></p>
                                  <p className="text-xs text-[#5C6B61] mt-0.5">{format(new Date(item.created_at), 'PPpp')}</p>
                                </div>
                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FEF8ED] text-[#F5A623] border border-[#F5A623]">Pending</span>
                              </div>

                              {/* AI Prediction */}
                              <div className="bg-[#F9F8F6] rounded-lg p-4 mb-4">
                                <p className="text-xs font-semibold text-[#5C6B61] uppercase tracking-wide mb-2">AI Prediction</p>
                                <div className="flex items-center gap-3">
                                  <span className="text-lg font-bold text-[#2D5A27]">{item.ai_disease || item.disease}</span>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(item.ai_severity || item.severity)}`}>
                                    {item.ai_severity || item.severity}
                                  </span>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              {reviewingId !== item.id ? (
                                <div className="flex gap-3">
                                  <button
                                    data-testid={`review-btn-${item.id}`}
                                    onClick={() => openReview(item)}
                                    className="flex items-center gap-2 bg-[#2D5A27] hover:bg-[#24481F] text-white px-4 py-2 rounded-lg font-medium transition-all text-sm active:scale-95"
                                  >
                                    <PencilSimple size={16} /> Review & Approve
                                  </button>
                                  <button
                                    data-testid={`quick-reject-btn-${item.id}`}
                                    onClick={() => {
                                      setReviewForm({ ...reviewForm, suggestion: '' });
                                      openReview(item);
                                    }}
                                    className="flex items-center gap-2 bg-white border-2 border-[#D9534F] text-[#D9534F] hover:bg-[#FDF0EF] px-4 py-2 rounded-lg font-medium transition-all text-sm active:scale-95"
                                  >
                                    <XCircle size={16} /> Reject
                                  </button>
                                </div>
                              ) : (
                                /* Review Form */
                                <div className="border-t border-[#DDE3DA] pt-4 space-y-3">
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="text-xs font-semibold text-[#5C6B61] uppercase">Disease (correct if needed)</label>
                                      <select
                                        data-testid="review-disease-select"
                                        value={reviewForm.disease}
                                        onChange={(e) => setReviewForm({ ...reviewForm, disease: e.target.value })}
                                        className="w-full mt-1 px-3 py-2 border border-[#DDE3DA] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2D5A27]"
                                      >
                                        {DISEASE_LIST.map(d => <option key={d} value={d}>{d}</option>)}
                                      </select>
                                    </div>
                                    <div>
                                      <label className="text-xs font-semibold text-[#5C6B61] uppercase">Severity</label>
                                      <select
                                        data-testid="review-severity-select"
                                        value={reviewForm.severity}
                                        onChange={(e) => setReviewForm({ ...reviewForm, severity: e.target.value })}
                                        className="w-full mt-1 px-3 py-2 border border-[#DDE3DA] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2D5A27]"
                                      >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                      </select>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-xs font-semibold text-[#5C6B61] uppercase">Suggestion / Notes for Farmer</label>
                                    <textarea
                                      data-testid="review-suggestion-input"
                                      value={reviewForm.suggestion}
                                      onChange={(e) => setReviewForm({ ...reviewForm, suggestion: e.target.value })}
                                      placeholder="Add your suggestion or notes for the farmer..."
                                      rows={3}
                                      className="w-full mt-1 px-3 py-2 border border-[#DDE3DA] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2D5A27] resize-none"
                                    />
                                  </div>
                                  <div className="flex gap-3">
                                    <button
                                      data-testid={`approve-btn-${item.id}`}
                                      onClick={() => handleReview(item.id, 'approve')}
                                      disabled={!!submitting}
                                      className="flex items-center gap-2 bg-[#2D5A27] hover:bg-[#24481F] text-white px-5 py-2 rounded-lg font-medium text-sm disabled:opacity-50 transition-all active:scale-95"
                                    >
                                      {submitting === item.id + 'approve' ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                                      ) : <CheckCircle size={18} weight="fill" />}
                                      Approve
                                    </button>
                                    <button
                                      data-testid={`reject-btn-${item.id}`}
                                      onClick={() => handleReview(item.id, 'reject')}
                                      disabled={!!submitting}
                                      className="flex items-center gap-2 bg-[#D9534F] hover:bg-[#C9302C] text-white px-5 py-2 rounded-lg font-medium text-sm disabled:opacity-50 transition-all active:scale-95"
                                    >
                                      {submitting === item.id + 'reject' ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                                      ) : <XCircle size={18} weight="fill" />}
                                      Reject
                                    </button>
                                    <button
                                      onClick={() => { setReviewingId(null); setReviewForm({ disease: '', severity: '', suggestion: '' }); }}
                                      className="text-[#5C6B61] hover:text-[#1A201C] px-4 py-2 rounded-lg text-sm transition-colors"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* REVIEWED HISTORY TAB */}
              {activeTab === 'reviewed' && (
                <div className="space-y-4">
                  {detections.filter(d => d.status === 'approved' || d.status === 'rejected').length === 0 ? (
                    <div className="bg-white rounded-xl shadow-md p-12 text-center">
                      <ClockCounterClockwise size={64} className="mx-auto text-[#DDE3DA] mb-4" />
                      <p className="text-lg font-medium text-[#1A201C]">No reviewed scans yet</p>
                      <p className="text-[#5C6B61] mt-1">Scans you approve or reject will appear here.</p>
                    </div>
                  ) : (
                    detections.filter(d => d.status === 'approved' || d.status === 'rejected').map((item) => (
                      <div key={item.id} data-testid={`reviewed-item-${item.id}`} className="bg-white rounded-xl shadow-md overflow-hidden">
                        <div className="p-6">
                          <div className="flex gap-6">
                            <div className="w-32 h-32 rounded-lg overflow-hidden flex-shrink-0 bg-[#E8ECE5]">
                              <img src={`${API_URL}/api/files/${item.image_path}`} alt="scan" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <p className="text-sm text-[#5C6B61]">Farmer: <span className="font-semibold text-[#1A201C]">{item.username}</span></p>
                                  <p className="text-xs text-[#5C6B61]">{format(new Date(item.created_at), 'PPpp')}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                  item.status === 'approved' 
                                    ? 'bg-[#EFF8EF] text-[#2D5A27] border-[#5CB85C]' 
                                    : 'bg-[#FDF0EF] text-[#D9534F] border-[#D9534F]'
                                }`}>
                                  {item.status === 'approved' ? 'Approved' : 'Rejected'}
                                </span>
                              </div>

                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-lg font-bold text-[#2D5A27]">{item.disease}</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(item.severity)}`}>{item.severity}</span>
                              </div>

                              {item.ai_disease && item.ai_disease !== item.disease && (
                                <p className="text-xs text-[#5C6B61] mb-1">AI predicted: <span className="line-through">{item.ai_disease}</span> → Corrected to: <span className="font-semibold text-[#2D5A27]">{item.disease}</span></p>
                              )}

                              {item.admin_suggestion && (
                                <div className="bg-[#E8F0FE] border border-[#4A90D9] rounded-lg p-3 mt-2">
                                  <p className="text-xs font-semibold text-[#4A90D9] uppercase mb-1">Your Suggestion</p>
                                  <p className="text-sm text-[#5C6B61]">{item.admin_suggestion}</p>
                                </div>
                              )}

                              {item.reviewed_at && (
                                <p className="text-xs text-[#5C6B61] mt-2">Reviewed on {format(new Date(item.reviewed_at), 'PPpp')}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* OVERVIEW TAB */}
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

              {/* USERS TAB */}
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
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-[#2D5A27] text-white' : 'bg-[#E8ECE5] text-[#2D5A27]'}`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-[#5C6B61]">{format(new Date(user.created_at), 'PP')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ALL SCANS TAB */}
              {activeTab === 'scans' && (
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[#E8ECE5]">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-[#1A201C]">User</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-[#1A201C]">Disease</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-[#1A201C]">Severity</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-[#1A201C]">Status</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-[#1A201C]">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#DDE3DA]">
                        {detections.slice(0, 30).map((det, idx) => (
                          <tr key={idx} className="hover:bg-[#F9F8F6] transition-colors">
                            <td className="px-6 py-4 text-sm text-[#1A201C]">{det.username}</td>
                            <td className="px-6 py-4 text-sm font-medium text-[#2D5A27]">{det.disease}</td>
                            <td className="px-6 py-4 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(det.severity)}`}>{det.severity}</span>
                            </td>
                            <td className="px-6 py-4 text-sm">{getStatusBadge(det.status || 'pending')}</td>
                            <td className="px-6 py-4 text-sm text-[#5C6B61]">{format(new Date(det.created_at), 'PP p')}</td>
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
