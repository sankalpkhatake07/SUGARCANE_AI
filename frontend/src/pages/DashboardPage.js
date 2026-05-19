import React, { useState, useRef } from 'react';
import { Layout } from '../components/Layout';
import { useTranslation } from 'react-i18next';
import { UploadSimple, Scan, CheckCircle, Warning, Info, Clock, PaperPlaneTilt } from '@phosphor-icons/react';
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
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setResult(null);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
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

  const handleNewScan = () => {
    setSelectedFile(null);
    setPreview(null);
    setResult(null);
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
                onClick={() => !result && fileInputRef.current?.click()}
                className={`border-2 border-dashed border-[#8B9D77] bg-[#E8ECE5]/50 rounded-2xl min-h-[300px] flex items-center justify-center transition-all ${!result ? 'cursor-pointer hover:bg-[#E8ECE5]' : ''}`}
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
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

              {!result ? (
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
              ) : (
                <button
                  data-testid="new-scan-button"
                  onClick={handleNewScan}
                  className="w-full bg-[#5C6B61] hover:bg-[#4A564F] text-white py-4 rounded-xl font-semibold text-lg flex items-center justify-center space-x-3 transition-all shadow-lg hover:shadow-xl active:scale-95"
                >
                  <Scan size={24} />
                  <span>New Scan</span>
                </button>
              )}
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
                    className="bg-white rounded-2xl shadow-lg p-6 space-y-5"
                  >
                    {/* Submitted for Review Banner */}
                    <div className="bg-[#FEF8ED] border-2 border-[#F5A623] rounded-xl p-5 flex items-start space-x-4">
                      <Clock size={32} className="text-[#F5A623] flex-shrink-0 mt-0.5" weight="fill" />
                      <div>
                        <h3 className="text-lg font-bold text-[#1A201C]">Submitted for Review</h3>
                        <p className="text-sm text-[#5C6B61] mt-1">
                          Your scan has been submitted. An admin will review the results and may add suggestions. 
                          You will see the full diagnosis once it is approved.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 text-[#5C6B61]">
                      <PaperPlaneTilt size={20} weight="fill" className="text-[#2D5A27]" />
                      <span className="text-sm">AI has analyzed your image. Waiting for admin verification.</span>
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
