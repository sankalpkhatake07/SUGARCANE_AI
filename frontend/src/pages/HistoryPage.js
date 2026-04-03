import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { useTranslation } from 'react-i18next';
import { ClockCounterClockwise, MagnifyingGlass } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { format } from 'date-fns';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const HistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/history`, {
        withCredentials: true
      });
      setHistory(data);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
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
    item.disease.toLowerCase().includes(searchTerm.toLowerCase())
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
              <p className="text-base text-[#5C6B61] mt-2">
                View all your previous disease scans
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B9D77]" size={20} />
              <input
                type="text"
                placeholder="Search by disease name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-[#DDE3DA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
              />
            </div>
          </div>

          {/* History List */}
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
              {filteredHistory.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  data-testid={`history-item-${idx}`}
                  className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
                >
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
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-[#1A201C]">{item.disease}</h3>
                          <p className="text-sm text-[#5C6B61] mt-1">
                            {format(new Date(item.created_at), 'PPpp')}
                          </p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getSeverityColor(item.severity)}`}>
                          {t(item.severity)}
                        </div>
                      </div>
                      <div className="mt-3">
                        <p className="text-sm text-[#5C6B61]"><span className="font-medium text-[#1A201C]">{t('confidence')}:</span> {item.confidence}%</p>
                        <p className="text-sm text-[#5C6B61] mt-1"><span className="font-medium text-[#1A201C]">{t('treatment')}:</span> {item.treatment}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
};
