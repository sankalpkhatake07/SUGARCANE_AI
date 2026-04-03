import React, { useState, useRef } from 'react';
import { Layout } from '../components/Layout';
import { useTranslation } from 'react-i18next';
import { UploadSimple, Camera, Scan, CheckCircle, Warning, Info } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const DashboardPage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [detecting, setDetecting] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);
  const { t } = useTranslation();

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setResult(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setResult(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDetect = async () => {
    if (!selectedFile) return;

    setDetecting(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const { data } = await axios.post(`${API_URL}/api/detect`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      });
      setResult(data);
    } catch (error) {
      console.error('Detection error:', error);
      alert('Detection failed. Please try again.');
    } finally {
      setDetecting(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return { bg: '#FDF0EF', text: '#D9534F', border: '#D9534F' };
      case 'medium': return { bg: '#FEF8ED', text: '#F5A623', border: '#F5A623' };
      case 'low': return { bg: '#EFF8EF', text: '#5CB85C', border: '#5CB85C' };
      default: return { bg: '#F9F8F6', text: '#5C6B61', border: '#DDE3DA' };
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high': return <Warning size={24} weight="fill" />;
      case 'medium': return <Info size={24} weight="fill" />;
      case 'low': return <CheckCircle size={24} weight="fill" />;
      default: return <Info size={24} />;
    }
  };

  return (
    <Layout>
      <div data-testid="dashboard-page" className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl sm:text-5xl font-bold text-[#1A201C] mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {t('dashboard')}
          </h1>
          <p className="text-base text-[#5C6B61] mb-8">
            Upload or capture a sugarcane leaf image for disease analysis
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upload Section */}
            <div className="space-y-6">
              <div
                data-testid="upload-zone"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#8B9D77] bg-[#E8ECE5]/50 rounded-2xl min-h-[300px] flex items-center justify-center cursor-pointer hover:bg-[#E8ECE5] transition-all"
              >
                {preview ? (
                  <div className="relative w-full h-full p-4">
                    <img src={preview} alt="Preview" className="w-full h-full object-contain rounded-xl" />
                  </div>
                ) : (
                  <div className="text-center p-8">
                    <UploadSimple size={64} className="mx-auto text-[#8B9D77] mb-4" />
                    <p className="text-[#1A201C] font-medium mb-2">{t('uploadImage')}</p>
                    <p className="text-sm text-[#5C6B61]">{t('dragDrop')}</p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              <button
                data-testid="detect-button"
                onClick={handleDetect}
                disabled={!selectedFile || detecting}
                className="w-full bg-[#2D5A27] hover:bg-[#24481F] text-white py-4 rounded-xl font-semibold text-lg flex items-center justify-center space-x-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl active:scale-95"
              >
                {detecting ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-white"></div>
                    <span>{t('analyzing')}</span>
                  </>
                ) : (
                  <>
                    <Scan size={24} />
                    <span>{t('detectDisease')}</span>
                  </>
                )}
              </button>
            </div>

            {/* Results Section */}
            <div>
              <AnimatePresence>
                {result && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    data-testid="detection-result"
                    className="bg-white rounded-2xl shadow-lg p-6 space-y-6"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-[#1A201C]" style={{ fontFamily: 'Outfit, sans-serif' }}>
                          {t('diseaseDetected')}
                        </h2>
                        <p data-testid="disease-name" className="text-3xl font-bold text-[#2D5A27] mt-2">
                          {result.disease}
                        </p>
                        {result.is_validated && (
                          <span className="inline-block mt-2 text-xs px-3 py-1 rounded-full bg-[#2F6A40] text-white">
                            AI Verified
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          backgroundColor: getSeverityColor(result.severity).bg,
                          color: getSeverityColor(result.severity).text,
                          borderColor: getSeverityColor(result.severity).border
                        }}
                        className="px-4 py-2 rounded-full flex items-center space-x-2 border-2"
                      >
                        {getSeverityIcon(result.severity)}
                        <span className="font-bold text-sm uppercase">{t(result.severity)}</span>
                      </div>
                    </div>

                    <div className="border-t border-[#DDE3DA] pt-4">
                      <p className="text-sm text-[#5C6B61] mb-1">{t('confidence')}</p>
                      <div className="flex items-center space-x-3">
                        <div className="flex-1 bg-[#E8ECE5] rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-[#2D5A27] h-full rounded-full"
                            style={{ width: `${result.confidence}%` }}
                          ></div>
                        </div>
                        <span className="font-bold text-[#1A201C]">{result.confidence}%</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-[#1A201C] mb-2">{t('symptoms')}</h3>
                        <p className="text-[#5C6B61] text-sm leading-relaxed">{result.symptoms}</p>
                      </div>

                      <div>
                        <h3 className="font-semibold text-[#1A201C] mb-2">{t('causes')}</h3>
                        <p className="text-[#5C6B61] text-sm leading-relaxed">{result.causes}</p>
                      </div>

                      <div>
                        <h3 className="font-semibold text-[#1A201C] mb-2">{t('treatment')}</h3>
                        <p className="text-[#5C6B61] text-sm leading-relaxed">{result.treatment}</p>
                      </div>

                      <div>
                        <h3 className="font-semibold text-[#1A201C] mb-2">{t('prevention')}</h3>
                        <p className="text-[#5C6B61] text-sm leading-relaxed">{result.prevention}</p>
                      </div>

                      {result.syngenta_products && result.syngenta_products.length > 0 && (
                        <div className="bg-[#E8ECE5] rounded-xl p-4">
                          <h3 className="font-semibold text-[#2D5A27] mb-3">{t('recommendedProducts')}</h3>
                          <div className="space-y-2">
                            {result.syngenta_products.map((product, idx) => (
                              <div key={idx} className="flex items-center space-x-2">
                                <CheckCircle size={18} className="text-[#2D5A27]" weight="fill" />
                                <span className="text-[#1A201C] font-medium">{product}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {!result && (
                <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                  <Scan size={64} className="mx-auto text-[#DDE3DA] mb-4" />
                  <p className="text-[#5C6B61]">Upload an image and click detect to see results</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};
