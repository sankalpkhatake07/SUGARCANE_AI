import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { useTranslation } from 'react-i18next';
import { ClockCounterClockwise, MagnifyingGlass, Clock, CheckCircle, XCircle, ChatText } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { format } from 'date-fns';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const HistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const { t, i18n } = useTranslation();

  useEffect(() => { fetchHistory(); }, [i18n.language]);

  const fetchHistory = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/history?lang=${i18n.language}`, { withCredentials: true });
      setHistory(data);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'approved': return { bg: 'bg-[#EFF8EF]', text: 'text-[#2D5A27]', border: 'border-[#5CB85C]', label: 'Approved' };
      case 'rejected': return { bg: 'bg-[#FDF0EF]', text: 'text-[#D9534F]', border: 'border-[#D9534F]', label: 'Rejected' };
      default: return { bg: 'bg-[#FEF8ED]', text: 'text-[#F5A623]', border: 'border-[#F5A623]', label: 'Pending Review' };
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle size={18} weight="fill" className="text-[#2D5A27]" />;
      case 'rejected': return <XCircle size={18} weight="fill" className="text-[#D9534F]" />;
      default: return <Clock size={18} weight="fill" className="text-[#F5A623]" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'bg-[#FDF0EF] text-[#D9534F] border-[#D9534F]';
      case 'medium': return 'bg-[#FEF8ED] text-[#F5A623] border-[#F5A623]';
      case 'low': return 'bg-[#EFF8EF] text-[#5CB85C] border-[#5CB85C]';
      default: return 'bg-[#F9F8F6] text-[#5C6B61] border-[#DDE3DA]';
    }
  };

  const filteredHistory = history.filter(item =>
    item.disease?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.status || 'pending').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div data-testid="history-page" className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold text-[#1A201C]" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {t('scanHistory')}
              </h1>
              <p className="text-base text-[#5C6B61] mt-2">View your submitted scans and approved results</p>
            </div>
          </div>

          <div className="mb-6">
            <div className="relative max-w-md">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B9D77]" size={20} />
              <input
                type="text"
                placeholder="Search by disease or status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-[#DDE3DA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#2D5A27] mx-auto"></div>
              <p className="mt-4 text-[#5C6B61]">{t('loading')}</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <ClockCounterClockwise size={64} className="mx-auto text-[#DDE3DA] mb-4" />
              <p className="text-[#5C6B61] text-lg">{t('noHistory')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredHistory.map((item, idx) => {
                const status = item.status || 'pending';
                const statusStyle = getStatusStyle(status);
                const isExpanded = expandedId === item.id;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    data-testid={`history-item-${idx}`}
                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  >
                    <div className="p-6">
                      <div className="flex items-center space-x-6">
                        {/* Thumbnail */}
                        <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-[#E8ECE5]">
                          <img
                            src={`${API_URL}/api/files/${item.image_path}`}
                            alt={item.disease}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              {status === 'approved' ? (
                                <h3 className="text-xl font-bold text-[#1A201C]">
                                  {item.disease_name_local || item.disease}
                                  {item.disease_name_local && item.disease_name_local !== item.disease && (
                                    <span className="text-sm font-normal text-[#5C6B61] ml-2">({item.disease})</span>
                                  )}
                                </h3>
                              ) : status === 'rejected' ? (
                                <h3 className="text-xl font-bold text-[#D9534F]">Scan Rejected</h3>
                              ) : (
                                <h3 className="text-xl font-bold text-[#5C6B61]">Awaiting Review</h3>
                              )}
                              <p className="text-sm text-[#5C6B61] mt-1">
                                {format(new Date(item.created_at), 'PPpp')}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {status === 'approved' && (
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getSeverityColor(item.severity)}`}>
                                  {item.severity}
                                </span>
                              )}
                              <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                                {getStatusIcon(status)}
                                {statusStyle.label}
                              </span>
                            </div>
                          </div>

                          {status === 'approved' && (
                            <p className="text-sm text-[#5C6B61] mt-2">
                              <span className="font-medium text-[#1A201C]">{t('treatment')}:</span> {item.treatment}
                            </p>
                          )}
                          {status === 'pending' && (
                            <p className="text-sm text-[#F5A623] mt-2">Your scan is being reviewed by an admin...</p>
                          )}
                          {status === 'rejected' && (
                            <p className="text-sm text-[#D9534F] mt-2">This scan was rejected by the admin.</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details (only for approved) */}
                    {isExpanded && status === 'approved' && (
                      <div className="border-t border-[#DDE3DA] p-6 bg-[#F9F8F6] space-y-4">
                        <div>
                          <h4 className="font-semibold text-[#1A201C] mb-1">{t('symptoms')}</h4>
                          <p className="text-sm text-[#5C6B61]">{item.symptoms}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-[#1A201C] mb-1">{t('causes')}</h4>
                          <p className="text-sm text-[#5C6B61]">{item.causes}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-[#1A201C] mb-1">{t('treatment')}</h4>
                          <p className="text-sm text-[#5C6B61]">{item.treatment}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-[#1A201C] mb-1">{t('prevention')}</h4>
                          <p className="text-sm text-[#5C6B61]">{item.prevention}</p>
                        </div>
                        {item.syngenta_products && item.syngenta_products.length > 0 && (
                          <div className="bg-[#E8ECE5] rounded-xl p-4">
                            <h4 className="font-semibold text-[#2D5A27] mb-2">{t('recommendedProducts')}</h4>
                            <div className="flex flex-wrap gap-2">
                              {item.syngenta_products.map((p, i) => (
                                <span key={i} className="bg-white px-3 py-1 rounded-full text-sm font-medium text-[#2D5A27] border border-[#2D5A27]">{p}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {item.admin_suggestion && (
                          <div className="bg-[#E8F0FE] border border-[#4A90D9] rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <ChatText size={20} weight="fill" className="text-[#4A90D9]" />
                              <h4 className="font-semibold text-[#1A201C]">Admin Suggestion</h4>
                            </div>
                            <p className="text-sm text-[#5C6B61]">{item.admin_suggestion}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Expanded for rejected — show reason */}
                    {isExpanded && status === 'rejected' && item.admin_suggestion && (
                      <div className="border-t border-[#DDE3DA] p-6 bg-[#FDF0EF]">
                        <div className="flex items-center gap-2 mb-2">
                          <ChatText size={20} weight="fill" className="text-[#D9534F]" />
                          <h4 className="font-semibold text-[#1A201C]">Admin Note</h4>
                        </div>
                        <p className="text-sm text-[#5C6B61]">{item.admin_suggestion}</p>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
};
