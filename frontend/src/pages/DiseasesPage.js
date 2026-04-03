import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { useTranslation } from 'react-i18next';
import { BookOpen, Info, Warning, Sparkle } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const DiseasesPage = () => {
  const [diseases, setDiseases] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedDisease, setSelectedDisease] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    fetchDiseases();
  }, []);

  const fetchDiseases = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/diseases`);
      setDiseases(data);
      if (Object.keys(data).length > 0) {
        setSelectedDisease(Object.keys(data)[0]);
      }
    } catch (error) {
      console.error('Failed to fetch diseases:', error);
    } finally {
      setLoading(false);
    }
  };

  const diseaseIcons = {
    'Red Rot': <Warning size={32} weight="fill" className="text-[#D9534F]" />,
    'Smut': <Warning size={32} weight="fill" className="text-[#F5A623]" />,
    'Rust': <Info size={32} weight="fill" className="text-[#F5A623]" />,
    'Healthy': <Sparkle size={32} weight="fill" className="text-[#5CB85C]" />
  };

  return (
    <Layout>
      <div data-testid="diseases-page" className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl sm:text-5xl font-bold text-[#1A201C] mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {t('diseases')}
          </h1>
          <p className="text-base text-[#5C6B61] mb-8">
            Learn about common sugarcane diseases and their management
          </p>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#2D5A27] mx-auto"></div>
              <p className="mt-4 text-[#5C6B61]">{t('loading')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Disease List */}
              <div className="space-y-3">
                {Object.keys(diseases).map((diseaseName) => (
                  <motion.button
                    key={diseaseName}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedDisease(diseaseName)}
                    data-testid={`disease-card-${diseaseName.toLowerCase().replace(' ', '-')}`}
                    className={`w-full text-left p-4 rounded-xl transition-all ${
                      selectedDisease === diseaseName
                        ? 'bg-[#2D5A27] text-white shadow-lg'
                        : 'bg-white hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={selectedDisease === diseaseName ? 'text-white' : ''}>
                        {diseaseIcons[diseaseName]}
                      </div>
                      <h3 className="font-bold text-lg">{diseaseName}</h3>
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Disease Details */}
              <div className="md:col-span-2">
                {selectedDisease && diseases[selectedDisease] && (
                  <motion.div
                    key={selectedDisease}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white rounded-2xl shadow-lg p-8 space-y-6"
                  >
                    <div className="flex items-center space-x-4">
                      {diseaseIcons[selectedDisease]}
                      <h2 className="text-3xl font-bold text-[#1A201C]" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        {selectedDisease}
                      </h2>
                    </div>

                    <div className="space-y-4">
                      <div className="border-l-4 border-[#2D5A27] pl-4">
                        <h3 className="font-semibold text-[#1A201C] mb-2">{t('symptoms')}</h3>
                        <p className="text-[#5C6B61] leading-relaxed">{diseases[selectedDisease].symptoms}</p>
                      </div>

                      <div className="border-l-4 border-[#F5A623] pl-4">
                        <h3 className="font-semibold text-[#1A201C] mb-2">{t('causes')}</h3>
                        <p className="text-[#5C6B61] leading-relaxed">{diseases[selectedDisease].causes}</p>
                      </div>

                      <div className="border-l-4 border-[#5CB85C] pl-4">
                        <h3 className="font-semibold text-[#1A201C] mb-2">{t('prevention')}</h3>
                        <p className="text-[#5C6B61] leading-relaxed">{diseases[selectedDisease].prevention}</p>
                      </div>

                      <div className="border-l-4 border-[#D9534F] pl-4">
                        <h3 className="font-semibold text-[#1A201C] mb-2">{t('treatment')}</h3>
                        <p className="text-[#5C6B61] leading-relaxed">{diseases[selectedDisease].treatment}</p>
                      </div>

                      {diseases[selectedDisease].syngenta_products.length > 0 && (
                        <div className="bg-[#E8ECE5] rounded-xl p-6">
                          <h3 className="font-semibold text-[#2D5A27] mb-4 text-lg">{t('recommendedProducts')}</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {diseases[selectedDisease].syngenta_products.map((product, idx) => (
                              <div key={idx} className="bg-white rounded-lg p-3 font-medium text-[#1A201C]">
                                {product}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
};
