import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Navigation
      dashboard: 'Dashboard',
      history: 'History',
      diseases: 'Disease Library',
      admin: 'Admin Panel',
      logout: 'Logout',
      
      // Auth
      login: 'Login',
      register: 'Register',
      username: 'Username',
      password: 'Password',
      loginButton: 'Login',
      registerButton: 'Register',
      alreadyHaveAccount: 'Already have an account?',
      dontHaveAccount: "Don't have an account?",
      
      // Profile
      completeProfile: 'Complete Your Profile',
      name: 'Name',
      mobile: 'Mobile Number',
      saveProfile: 'Save Profile',
      
      // Dashboard
      uploadImage: 'Upload Sugarcane Image',
      takePhoto: 'Take Photo',
      dragDrop: 'Drag and drop an image here, or click to select',
      analyzing: 'Analyzing...',
      detectDisease: 'Detect Disease',
      
      // Results
      diseaseDetected: 'Disease Detected',
      confidence: 'Confidence',
      severity: 'Severity',
      high: 'High',
      medium: 'Medium',
      low: 'Low',
      treatment: 'Treatment',
      recommendedProducts: 'Recommended Syngenta Products',
      symptoms: 'Symptoms',
      causes: 'Causes',
      prevention: 'Prevention',
      
      // History
      scanHistory: 'Scan History',
      noHistory: 'No scan history yet',
      date: 'Date',
      disease: 'Disease',
      
      // Admin
      totalUsers: 'Total Users',
      totalScans: 'Total Scans',
      diseaseDistribution: 'Disease Distribution',
      recentScans: 'Recent Scans',
      user: 'User',
      
      // Common
      loading: 'Loading...',
      error: 'Error',
      success: 'Success'
    }
  },
  hi: {
    translation: {
      // Navigation
      dashboard: 'डैशबोर्ड',
      history: 'इतिहास',
      diseases: 'रोग पुस्तकालय',
      admin: 'प्रशासन पैनल',
      logout: 'लॉग आउट',
      
      // Auth
      login: 'लॉग इन',
      register: 'पंजीकरण',
      username: 'उपयोगकर्ता नाम',
      password: 'पासवर्ड',
      loginButton: 'लॉग इन करें',
      registerButton: 'पंजीकरण करें',
      alreadyHaveAccount: 'पहले से खाता है?',
      dontHaveAccount: 'खाता नहीं है?',
      
      // Profile
      completeProfile: 'अपना प्रोफ़ाइल पूरा करें',
      name: 'नाम',
      mobile: 'मोबाइल नंबर',
      saveProfile: 'प्रोफ़ाइल सहेजें',
      
      // Dashboard
      uploadImage: 'गन्ने की छवि अपलोड करें',
      takePhoto: 'फोटो लें',
      dragDrop: 'यहां एक छवि खींचें और छोड़ें, या चुनने के लिए क्लिक करें',
      analyzing: 'विश्लेषण कर रहा है...',
      detectDisease: 'रोग का पता लगाएं',
      
      // Results
      diseaseDetected: 'रोग का पता चला',
      confidence: 'विश्वास',
      severity: 'गंभीरता',
      high: 'उच्च',
      medium: 'मध्यम',
      low: 'कम',
      treatment: 'उपचार',
      recommendedProducts: 'अनुशंसित सिंजेंटा उत्पाद',
      symptoms: 'लक्षण',
      causes: 'कारण',
      prevention: 'रोकथाम',
      
      // History
      scanHistory: 'स्कैन इतिहास',
      noHistory: 'अभी तक कोई स्कैन इतिहास नहीं',
      date: 'तारीख',
      disease: 'रोग',
      
      // Admin
      totalUsers: 'कुल उपयोगकर्ता',
      totalScans: 'कुल स्कैन',
      diseaseDistribution: 'रोग वितरण',
      recentScans: 'हाल के स्कैन',
      user: 'उपयोगकर्ता',
      
      // Common
      loading: 'लोड हो रहा है...',
      error: 'त्रुटि',
      success: 'सफलता'
    }
  },
  mr: {
    translation: {
      // Navigation
      dashboard: 'डॅशबोर्ड',
      history: 'इतिहास',
      diseases: 'रोग ग्रंथालय',
      admin: 'प्रशासन पॅनेल',
      logout: 'लॉग आउट',
      
      // Auth
      login: 'लॉगिन',
      register: 'नोंदणी',
      username: 'वापरकर्ता नाव',
      password: 'पासवर्ड',
      loginButton: 'लॉगिन करा',
      registerButton: 'नोंदणी करा',
      alreadyHaveAccount: 'आधीच खाते आहे?',
      dontHaveAccount: 'खाते नाही?',
      
      // Profile
      completeProfile: 'तुमचे प्रोफाइल पूर्ण करा',
      name: 'नाव',
      mobile: 'मोबाईल नंबर',
      saveProfile: 'प्रोफाइल जतन करा',
      
      // Dashboard
      uploadImage: 'ऊस प्रतिमा अपलोड करा',
      takePhoto: 'फोटो काढा',
      dragDrop: 'येथे प्रतिमा ओढा आणि सोडा, किंवा निवडण्यासाठी क्लिक करा',
      analyzing: 'विश्लेषण करत आहे...',
      detectDisease: 'रोग शोधा',
      
      // Results
      diseaseDetected: 'रोग आढळला',
      confidence: 'विश्वास',
      severity: 'तीव्रता',
      high: 'उच्च',
      medium: 'मध्यम',
      low: 'कमी',
      treatment: 'उपचार',
      recommendedProducts: 'शिफारस केलेली सिंजेंटा उत्पादने',
      symptoms: 'लक्षणे',
      causes: 'कारणे',
      prevention: 'प्रतिबंध',
      
      // History
      scanHistory: 'स्कॅन इतिहास',
      noHistory: 'अद्याप कोणताही स्कॅन इतिहास नाही',
      date: 'तारीख',
      disease: 'रोग',
      
      // Admin
      totalUsers: 'एकूण वापरकर्ते',
      totalScans: 'एकूण स्कॅन',
      diseaseDistribution: 'रोग वितरण',
      recentScans: 'अलीकडील स्कॅन',
      user: 'वापरकर्ता',
      
      // Common
      loading: 'लोड होत आहे...',
      error: 'त्रुटी',
      success: 'यश'
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
