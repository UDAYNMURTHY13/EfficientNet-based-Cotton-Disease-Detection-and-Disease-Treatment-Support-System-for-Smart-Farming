/**
 * i18n.js — i18next initialisation + dynamic Google Translate loader
 *
 * English strings are bundled at build-time.
 * All other languages are fetched on-demand from the backend
 * (POST /api/v1/translate/batch) and cached in localStorage so
 * Google Translate is only called once per language per device.
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// ─── English source strings ───────────────────────────────────────────────
const en = {
  sidebar: {
    dashboard: 'Dashboard',
    analyze: 'Analyze',
    history: 'History',
    profile: 'Profile',
    settings: 'Settings',
    farmer: 'Farmer',
    logout: 'Logout',
  },
  dashboard: {
    greeting_morning: 'Good morning',
    greeting_afternoon: 'Good afternoon',
    greeting_evening: 'Good evening',
    subtitle: 'Monitor your cotton crops with AI-powered disease detection',
    new_analysis: 'New Analysis',
    total_analyses: 'Total Analyses',
    all_time: 'All time',
    diseases_found: 'Diseases Found',
    unique_types: 'Unique types',
    avg_confidence: 'Avg Confidence',
    detection_accuracy: 'Detection accuracy',
    moderate_cases: 'Moderate Cases',
    needs_attention: 'Needs attention',
    quick_actions: 'Quick Actions',
    analyze_image: 'Analyze Image',
    analyze_desc: 'Upload or capture a leaf photo',
    view_history: 'View History',
    history_desc: 'Browse all past analyses',
    my_profile: 'My Profile',
    profile_desc: 'Update farm information',
    recent_analyses: 'Recent Analyses',
    view_all: 'View all →',
    no_analyses: 'No analyses yet',
    no_analyses_desc: 'Upload your first cotton leaf image to get started',
    start_analysis: 'Start Analysis',
    disease: 'Disease',
    severity: 'Severity',
    confidence: 'Confidence',
    location: 'Location',
    date: 'Date',
    how_it_works: 'How It Works',
    step_capture: 'Capture',
    step_capture_desc: 'Take a photo of your cotton leaf',
    step_ai: 'AI Analysis',
    step_ai_desc: 'Deep learning detects diseases instantly',
    step_results: 'Results',
    step_results_desc: 'Detailed diagnosis with severity score',
    step_treatment: 'Treatment',
    step_treatment_desc: 'Expert treatment recommendations',
    loading: 'Loading statistics…',
  },
  analyze: {
    title: 'Disease Analysis',
    subtitle: 'Upload or capture a cotton leaf image for instant AI analysis',
    history_btn: 'History',
    upload_tab: 'Upload',
    camera_tab: 'Camera',
    click_drop: 'Click or drag & drop',
    file_types: 'PNG, JPG, WebP · max 10 MB',
    pipeline_title: 'Analysis Pipeline',
    run_analysis: 'Run Analysis',
    analyzing: 'Analyzing…',
    reset: 'Reset',
    photo_tips: 'Photo Tips',
    tip_lighting: 'Good natural lighting',
    tip_frame: 'Leaf fills most of frame',
    tip_focus: 'Focus on affected area',
    tip_blur: 'Avoid blurry images',
    analyze_another: '← Analyze Another Image',
    location_pending: 'Getting location…',
    location_denied: '📍 Location access denied — analysis will proceed without GPS',
    location_unavailable: '📍 Geolocation not supported by this browser',
    select_image_first: 'Please select or capture an image first',
    pipeline_1: 'Disease Detection',
    pipeline_1_desc: 'CNN classification model',
    pipeline_2: 'Area Analysis',
    pipeline_2_desc: 'Affected region estimation',
    pipeline_3: 'Lesion Mapping',
    pipeline_3_desc: 'Spot-level detection',
    pipeline_4: 'Severity Scoring',
    pipeline_4_desc: 'Clinical severity grade',
  },
  history: {
    title: 'Analysis History',
    total_record: '{{count}} total analyses on record',
    new_analysis: '+ New Analysis',
    filter_severity: 'Filter by severity:',
    all: 'All',
    loading: 'Loading history…',
    no_analyses: 'No analyses found',
    no_filter_desc: 'Start your first analysis to see results here',
    filter_desc: 'No {{filter}} severity results',
    disease: 'Disease',
    severity: 'Severity',
    confidence: 'Confidence',
    affected_area: 'Affected Area',
    location: 'Location',
    date: 'Date',
    actions: 'Actions',
    detection: 'Detection',
    disease_label: 'Disease',
    severity_label: 'Severity',
    severity_score: 'Severity Score',
    inference_time: 'Inference Time',
    area_lesions: 'Area & Lesions',
    affected_area_label: 'Affected Area',
    lesion_count: 'Lesion Count',
    severity_indicators: 'Severity Indicators',
    place: 'Place',
    latitude: 'Latitude',
    longitude: 'Longitude',
    accuracy: 'Accuracy',
    gps: 'GPS',
    not_recorded: 'Not recorded',
    image: 'Image',
    analyzed: 'Analyzed',
    analysis_notes: 'Analysis Notes',
    prev: '← Prev',
    next: 'Next →',
    page_of: 'Page {{page}} of {{total}}',
    delete_confirm: 'Delete this analysis?',
    delete_failed: 'Failed to delete',
    load_failed: 'Failed to load history',
    start_analysis: 'Start Analysis',
    collapse: 'Collapse',
    view_details: 'View details',
  },
  profile: {
    title: 'My Profile',
    subtitle: 'Manage your account and farm information',
    account_info: 'Account Info',
    email: 'Email',
    role: 'Role',
    phone: 'Phone',
    location: 'Location',
    farm_size: 'Farm Size',
    farm_size_unit: '{{size}} acres',
    sign_out: 'Sign out',
    edit_profile: 'Edit Profile',
    full_name: 'Full Name',
    full_name_placeholder: 'Your full name',
    phone_placeholder: '+91 9876543210',
    farm_location: 'Farm Location',
    farm_location_placeholder: 'City / District',
    farm_size_acres: 'Farm Size (Acres)',
    farm_size_placeholder: 'e.g. 5.5',
    save_changes: 'Save Changes',
    saving: 'Saving…',
    save_success: 'Profile updated successfully!',
    save_failed: 'Failed to update profile',
  },
  settings: {
    title: 'Settings',
    subtitle: 'Customize your CottonCare AI experience',
    appearance: 'Appearance',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    system_hint: '"System" follows your device\'s dark/light mode preference automatically.',
    language: 'Language',
    app_language: 'App Language',
    language_hint: 'UI language selection — powered by Google Translate.',
    active_settings: 'Active Settings',
    active_theme: 'Theme',
    active_language: 'Language',
  },
  login: {
    welcome: 'Welcome back',
    subtitle: 'Sign in to your CottonCare account',
    email: 'Email address',
    password: 'Password',
    sign_in: 'Sign in',
    signing_in: 'Signing in…',
    demo_hint: 'Demo: test@example.com / password123',
    no_account: "Don't have an account?",
    create_free: 'Create one free',
    feature_1: 'Multi-stage disease analysis',
    feature_2: 'Explainable AI insights',
    feature_3: 'Treatment recommendations',
    feature_4: 'Crop health tracking',
    tagline: 'AI-powered cotton disease detection for modern farmers',
  },
  signup: {
    title: 'Create your account',
    subtitle: 'Start protecting your cotton crops today',
    brand_subtitle: 'Join thousands of farmers protecting their cotton crops with AI',
    full_name: 'Full Name',
    email: 'Email Address',
    phone: 'Phone Number',
    password: 'Password',
    password_hint: 'Minimum 8 characters',
    farm_location: 'Farm Location',
    farm_size_acres: 'Farm Size (Acres)',
    farm_location_placeholder: 'City / District',
    create_btn: 'Create account',
    creating: 'Creating account…',
    already_account: 'Already have an account?',
    sign_in: 'Sign in',
    feature_1: 'Free to get started',
    feature_2: 'Works on any device',
    feature_3: 'Your data stays private',
  },
  common: {
    loading: 'Loading…',
    error: 'Something went wrong',
    na: '—',
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────

/** Flatten { a: { b: 'v' } } → { 'a.b': 'v' } */
function flatten(obj, prefix = '') {
  return Object.entries(obj).reduce((acc, [k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object') {
      Object.assign(acc, flatten(v, key));
    } else {
      acc[key] = v;
    }
    return acc;
  }, {});
}

/** Rebuild { 'a.b': 'v' } → { a: { b: 'v' } } */
function unflatten(flat) {
  const result = {};
  for (const [dotKey, val] of Object.entries(flat)) {
    const parts = dotKey.split('.');
    let cur = result;
    for (let i = 0; i < parts.length - 1; i++) {
      cur[parts[i]] = cur[parts[i]] || {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = val;
  }
  return result;
}

const CACHE_PREFIX = 'cc_trans_v2_';
const API_BASE = 'http://localhost:8000/api/v1';

// ─── i18next init ─────────────────────────────────────────────────────────

i18n.use(initReactI18next).init({
  resources: { en: { translation: en } },
  lng: localStorage.getItem('cc_language') || 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

// ─── Dynamic language loader ──────────────────────────────────────────────

/**
 * Call this instead of i18n.changeLanguage().
 * Fetches translations from the backend on first use, caches them in
 * localStorage, then wires them into i18next.
 */
export async function loadLanguage(lang) {
  if (lang === 'en') {
    await i18n.changeLanguage('en');
    return;
  }

  // Already loaded this session
  if (i18n.hasResourceBundle(lang, 'translation')) {
    await i18n.changeLanguage(lang);
    return;
  }

  // Check localStorage cache
  const cacheKey = `${CACHE_PREFIX}${lang}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      const bundle = JSON.parse(cached);
      i18n.addResourceBundle(lang, 'translation', bundle, true, true);
      await i18n.changeLanguage(lang);
      return;
    } catch {
      localStorage.removeItem(cacheKey);
    }
  }

  // Fetch from backend
  try {
    const flatEn = flatten(en);
    const englishValues = Object.values(flatEn);

    const res = await fetch(`${API_BASE}/translate/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: englishValues, target_lang: lang }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const translatedMap = await res.json(); // { "English text": "Translated text" }

    // Rebuild the nested structure with translated values
    const translatedFlat = {};
    for (const [key, engVal] of Object.entries(flatEn)) {
      translatedFlat[key] = translatedMap[engVal] ?? engVal;
    }
    const bundle = unflatten(translatedFlat);

    localStorage.setItem(cacheKey, JSON.stringify(bundle));
    i18n.addResourceBundle(lang, 'translation', bundle, true, true);
    await i18n.changeLanguage(lang);
  } catch (err) {
    console.warn(`[i18n] Translation fetch failed for "${lang}", using English fallback:`, err);
    await i18n.changeLanguage('en');
  }
}

export default i18n;
