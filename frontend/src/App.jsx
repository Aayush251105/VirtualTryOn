import { useState, useRef, useEffect, useCallback } from 'react';
import './App.css';

/* ══════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════ */
const LOADING_STEPS = [
  'Analysing person image…',
  'Extracting garment features…',
  'Running virtual try-on model…',
  'Rendering final output…',
  'Finalising result…',
];

const DATA_CHARS = '01アイウエオカキクケコSYNTHESIS'.split('');
const randomChar = () => DATA_CHARS[Math.floor(Math.random() * DATA_CHARS.length)];
const randomStream = (len = 35) => Array.from({ length: len }, randomChar).join(' ');

// Placeholder images used in demo mode (public domain / picsum)
const DEMO_PERSON_URL   = 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&q=80';
const DEMO_GARMENT_URL  = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80';
const DEMO_RESULT_URL   = 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&q=80'; // same person – mock

/* ══════════════════════════════════════════════════════
   HOOK — Intersection Observer for scroll animations
══════════════════════════════════════════════════════ */
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

/* ══════════════════════════════════════════════════════
   PARTICLES (hero background)
══════════════════════════════════════════════════════ */
function Particles() {
  const items = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    size: Math.random() * 4 + 2,
    x: Math.random() * 100,
    y: Math.random() * 100,
    dur: Math.random() * 10 + 8,
    delay: Math.random() * 8,
  }));
  return (
    <div className="particles" aria-hidden="true">
      {items.map(p => (
        <div
          key={p.id}
          className="particle"
          style={{
            width: p.size, height: p.size,
            left: `${p.x}%`, top: `${p.y}%`,
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   DATA STREAMS (loading background)
══════════════════════════════════════════════════════ */
function DataStreams() {
  const streams = Array.from({ length: 14 }, (_, i) => ({
    id: i,
    left: `${(i / 14) * 100 + Math.random() * 5}%`,
    dur: Math.random() * 6 + 6,
    delay: Math.random() * 6,
    text: randomStream(40),
  }));
  return (
    <div className="loading-streams" aria-hidden="true">
      {streams.map(s => (
        <div
          key={s.id}
          className="stream-column"
          style={{ left: s.left, animationDuration: `${s.dur}s`, animationDelay: `${s.delay}s` }}
        >
          {s.text}
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   TOAST
══════════════════════════════════════════════════════ */
function Toast({ message, type = 'error', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`toast toast-${type}`} role="alert" aria-live="assertive">
      <span className="toast-icon">{type === 'error' ? '✕' : '✓'}</span>
      <span className="toast-msg">{message}</span>
      <button className="toast-close" onClick={onClose} aria-label="Dismiss">×</button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   UPLOAD CARD
══════════════════════════════════════════════════════ */
function UploadCard({ id, label, hint, icon, image, onFile, onRemove }) {
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) onFile(file);
  }, [onFile]);

  return (
    <div
      className={`upload-card ${dragOver ? 'drag-over' : ''} ${image ? 'has-image' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => !image && fileRef.current?.click()}
      role="button"
      tabIndex={0}
      aria-label={`Upload ${label}`}
      onKeyDown={(e) => e.key === 'Enter' && !image && fileRef.current?.click()}
    >
      <input
        id={id}
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
        style={{ display: 'none' }}
      />

      {image ? (
        <div className="upload-preview">
          <div className="preview-badge">{label}</div>
          <img src={image.url} alt={label} />
          <div className="preview-overlay">
            <div className="preview-actions">
              <button
                className="preview-btn"
                onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
              >↑ Replace</button>
              <button
                className="preview-btn danger"
                onClick={(e) => { e.stopPropagation(); onRemove(); }}
              >✕ Remove</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="upload-placeholder">
          <div className="upload-icon-wrap">
            <span className="upload-icon">{icon}</span>
          </div>
          <div className="upload-card-label">{label}</div>
          <div className="upload-card-hint">{hint}</div>
          <div className="upload-card-formats">
            {['JPG', 'PNG', 'WEBP'].map(f => (
              <span key={f} className="format-badge">{f}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   LOADING OVERLAY
══════════════════════════════════════════════════════ */
function LoadingOverlay({ progress, stepIndex }) {
  return (
    <div className="loading-overlay" role="status" aria-live="polite" aria-label="Generating try-on">
      <DataStreams />

      <div className="loading-rings" aria-hidden="true">
        <div className="loading-ring loading-ring-1" />
        <div className="loading-ring loading-ring-2" />
        <div className="loading-ring loading-ring-3" />
        <div className="loading-center-dot" />
      </div>

      <div className="loading-text-block">
        <div className="loading-title">Generating Try-On</div>
        <div className="loading-status">
          <span key={stepIndex} className="loading-status-text">
            {LOADING_STEPS[Math.min(stepIndex, LOADING_STEPS.length - 1)]}
          </span>
        </div>
      </div>

      <div className="loading-progress-wrap">
        <div className="loading-progress-bar">
          <div className="loading-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="loading-progress-label">
          <span>Processing</span>
          <span>{Math.round(progress)}%</span>
        </div>
      </div>

      <div className="loading-steps" role="list">
        {LOADING_STEPS.map((step, i) => (
          <div
            key={step}
            role="listitem"
            className={`loading-step ${i < stepIndex ? 'done' : i === stepIndex ? 'active' : ''}`}
          >
            <div className="loading-step-icon">
              {i < stepIndex ? '✓' : i === stepIndex ? '◉' : '○'}
            </div>
            {step}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   RESULT DISPLAY
══════════════════════════════════════════════════════ */
function ResultDisplay({ resultUrl, personImage, garmentImage, onReset, isDemo }) {
  const handleDownload = () => {
    if (isDemo) { alert('This is a demo result — connect your backend to download real outputs!'); return; }
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = `fitai-tryon-${Date.now()}.png`;
    a.click();
  };

  return (
    <section className="result-section" id="result" aria-label="Try-on result">
      <div className="section-header">
        <div className="section-tag">Result</div>
        <h2 className="section-title">Your Virtual Try-On</h2>
        <p className="section-subtitle">Here's how the garment looks on you.</p>
      </div>

      {isDemo && (
        <div className="demo-banner" role="note">
          <span className="demo-banner-icon">⚡</span>
          <span>
            <strong>Demo Mode</strong> — This is a placeholder result.
            Connect your backend at <code>/api/tryon</code> to see real try-ons.
          </span>
        </div>
      )}

      <div className="result-card">
        <div className="result-header">
          <div className="result-header-left">
            <div className="result-status-dot" />
            <div>
              <div className="result-header-title">
                {isDemo ? 'Demo Result' : 'AI Generation Complete'}
              </div>
              <div className="result-header-sub">Virtual try-on rendered successfully</div>
            </div>
          </div>
          <button className="btn-result-action" onClick={handleDownload} id="download-result-header">
            ↓ Download
          </button>
        </div>

        <div className="result-image-wrap">
          <img src={resultUrl} alt="Virtual try-on result" className="result-image" id="result-image" />
          <div className="result-scan-line" aria-hidden="true" />
        </div>

        <div className="result-inputs-row">
          <div className="result-input-thumb">
            <img src={personImage} alt="Person" className="result-thumb-img" />
            <span className="result-thumb-label">Person</span>
          </div>
          <div className="result-arrow">+</div>
          <div className="result-input-thumb">
            <img src={garmentImage} alt="Garment" className="result-thumb-img" />
            <span className="result-thumb-label">Garment</span>
          </div>
          <div className="result-arrow">→</div>
          <div className="result-input-thumb">
            <img src={resultUrl} alt="Result" className="result-thumb-img" />
            <span className="result-thumb-label">Result</span>
          </div>
        </div>

        <div className="result-footer">
          <div className="result-meta">Powered by FitAI Vision Model</div>
          <div className="result-actions">
            <button className="btn-download" onClick={handleDownload} id="download-result-footer">
              ↓ Download Image
            </button>
            <button className="btn-try-again" onClick={onReset} id="try-again-btn">
              ↺ Try Again
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   HOW IT WORKS (with scroll-in animation)
══════════════════════════════════════════════════════ */
const HOW_CARDS = [
  { n: '01', title: 'Upload Your Photo', desc: 'Provide a clear, front-facing photo of yourself or a model against any background.' },
  { n: '02', title: 'Pick a Garment', desc: 'Upload any clothing item — shirt, dress, jacket — from any image source.' },
  { n: '03', title: 'AI Renders It', desc: 'Our vision model warps and blends the garment onto the body photorealistically.' },
];

function HowItWorks() {
  const [ref, inView] = useInView(0.1);
  return (
    <div className="how-strip" ref={ref} aria-label="How it works">
      <div className="section-header" style={{ marginBottom: 40 }}>
        <div className="section-tag">Process</div>
        <h2 className="section-title" style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)' }}>How It Works</h2>
      </div>
      <div className="how-grid">
        {HOW_CARDS.map((card, i) => (
          <div
            key={card.n}
            className={`how-card scroll-reveal ${inView ? 'in-view' : ''}`}
            style={{ transitionDelay: `${i * 0.12}s` }}
          >
            <div className="how-card-number">{card.n}</div>
            <div className="how-card-title">{card.title}</div>
            <div className="how-card-desc">{card.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN APP
══════════════════════════════════════════════════════ */
export default function App() {
  const [personImage, setPersonImage]   = useState(null);   // { file?, url }
  const [garmentImage, setGarmentImage] = useState(null);
  const [isLoading, setIsLoading]       = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStep, setLoadingStep]   = useState(0);
  const [resultUrl, setResultUrl]       = useState(null);
  const [isDemo, setIsDemo]             = useState(false);
  const [scrolled, setScrolled]         = useState(false);
  const [toast, setToast]               = useState(null);   // { message, type }

  const tryOnRef = useRef(null);
  const tickRef  = useRef(null);

  /* Navbar shrink on scroll */
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  /* File handlers */
  const handlePersonFile = useCallback((file) => {
    setPersonImage({ file, url: URL.createObjectURL(file) });
  }, []);
  const handleGarmentFile = useCallback((file) => {
    setGarmentImage({ file, url: URL.createObjectURL(file) });
  }, []);
  const removePersonImage = useCallback(() => {
    if (personImage?.url?.startsWith('blob:')) URL.revokeObjectURL(personImage.url);
    setPersonImage(null);
  }, [personImage]);
  const removeGarmentImage = useCallback(() => {
    if (garmentImage?.url?.startsWith('blob:')) URL.revokeObjectURL(garmentImage.url);
    setGarmentImage(null);
  }, [garmentImage]);

  /* Animated progress ticker */
  const startTicker = useCallback(() => {
    let prog = 0, step = 0;
    const thresholds = [10, 30, 55, 80, 95];
    tickRef.current = setInterval(() => {
      prog = Math.min(prog + Math.random() * 2.5 + 0.5, 98);
      setLoadingProgress(prog);
      const newStep = thresholds.filter(t => prog >= t).length;
      if (newStep !== step) {
        step = newStep;
        setLoadingStep(Math.min(step, LOADING_STEPS.length - 1));
      }
    }, 280);
  }, []);

  const stopTicker = useCallback(() => {
    clearInterval(tickRef.current);
    tickRef.current = null;
  }, []);

  /* ── Demo Mode ── */
  const handleDemo = async () => {
    setIsDemo(true);
    setPersonImage({ url: DEMO_PERSON_URL });
    setGarmentImage({ url: DEMO_GARMENT_URL });

    setIsLoading(true);
    setLoadingProgress(0);
    setLoadingStep(0);
    setResultUrl(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    startTicker();
    // Simulate a 4-second model run
    await new Promise(r => setTimeout(r, 4200));
    stopTicker();
    setLoadingProgress(100);
    setLoadingStep(LOADING_STEPS.length - 1);
    await new Promise(r => setTimeout(r, 600));

    setIsLoading(false);
    setResultUrl(DEMO_RESULT_URL);
    setTimeout(() => document.getElementById('result')?.scrollIntoView({ behavior: 'smooth' }), 200);
  };

  /* ── Real Generate ── */
  const handleGenerate = async () => {
    if (!personImage || !garmentImage) return;

    setIsDemo(false);
    setIsLoading(true);
    setLoadingProgress(0);
    setLoadingStep(0);
    setResultUrl(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    startTicker();

    try {
      const formData = new FormData();
      formData.append('person_image', personImage.file);
      formData.append('garment_image', garmentImage.file);

      const res = await fetch('/api/tryon', { method: 'POST', body: formData });
      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      const data = await res.json();

      stopTicker();
      setLoadingProgress(100);
      setLoadingStep(LOADING_STEPS.length - 1);
      await new Promise(r => setTimeout(r, 600));

      if (data.result_url) {
        setResultUrl(data.result_url);
      } else if (data.result_image) {
        setResultUrl(`data:image/png;base64,${data.result_image}`);
      } else {
        throw new Error('Unexpected response format from backend');
      }
      setTimeout(() => document.getElementById('result')?.scrollIntoView({ behavior: 'smooth' }), 200);
    } catch (err) {
      stopTicker();
      setToast({ message: `${err.message}. Is the backend running on port 8000?`, type: 'error' });
    } finally {
      setIsLoading(false);
      setLoadingProgress(0);
    }
  };

  /* ── Reset ── */
  const handleReset = () => {
    if (personImage?.url?.startsWith('blob:')) URL.revokeObjectURL(personImage.url);
    if (garmentImage?.url?.startsWith('blob:')) URL.revokeObjectURL(garmentImage.url);
    setPersonImage(null);
    setGarmentImage(null);
    setResultUrl(null);
    setIsDemo(false);
    setTimeout(() => tryOnRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const scrollToTryOn = () => tryOnRef.current?.scrollIntoView({ behavior: 'smooth' });

  const canGenerate = !!(personImage?.file && garmentImage?.file);
  const stepsDone   = [personImage, garmentImage].filter(Boolean).length;

  return (
    <div className="app">
      {/* ── TOAST ── */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* ── LOADING ── */}
      {isLoading && (
        <LoadingOverlay progress={loadingProgress} stepIndex={loadingStep} />
      )}

      {/* ── NAVBAR ── */}
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-logo">
          FitAI
          <span className="nav-badge">BETA</span>
        </div>
        <div className="nav-right">
          <button className="nav-demo-btn" onClick={handleDemo} id="nav-demo-btn">
            ▷ Try Demo
          </button>
          <button className="nav-cta" onClick={scrollToTryOn} id="nav-try-btn">
            Start Try-On →
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero" aria-label="Hero">
        <div className="hero-grid" aria-hidden="true" />
        <Particles />
        <div className="hero-orb hero-orb-1" aria-hidden="true" />
        <div className="hero-orb hero-orb-2" aria-hidden="true" />
        <div className="hero-orb hero-orb-3" aria-hidden="true" />
        <Particles />

        <div className="hero-eyebrow">
          <span className="hero-eyebrow-dot" aria-hidden="true" />
          AI-Powered Fashion Technology
        </div>

        <h1 className="hero-title">
          <span className="hero-title-line1">Try Before</span>
          <span className="hero-title-line2">You Buy</span>
        </h1>

        <p className="hero-subtitle">
          Upload your photo and any garment — our AI renders a photorealistic
          result in seconds. No dressing room required.
        </p>

        <div className="hero-actions">
          <button className="btn-primary" onClick={scrollToTryOn} id="hero-cta-btn">
            ✦ Start Try-On
          </button>
          <button className="btn-ghost" onClick={handleDemo} id="hero-demo-btn">
            ▷ Live Demo
          </button>
        </div>

        <div className="hero-stats" role="list">
          {[
            { value: '< 5s',  label: 'Generation Time' },
            { value: '98%',   label: 'Accuracy Rate'   },
            { value: '10K+',  label: 'Try-Ons Daily'   },
          ].map(s => (
            <div key={s.label} className="hero-stat" role="listitem">
              <div className="hero-stat-value">{s.value}</div>
              <div className="hero-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <HowItWorks />

      {/* ── TRY-ON / RESULT ── */}
      {resultUrl ? (
        <ResultDisplay
          resultUrl={resultUrl}
          personImage={personImage?.url}
          garmentImage={garmentImage?.url}
          onReset={handleReset}
          isDemo={isDemo}
        />
      ) : (
        <section
          className="tryon-section"
          id="tryon"
          ref={tryOnRef}
          aria-label="Virtual try-on"
        >
          <div className="section-header">
            <div className="section-tag">Virtual Try-On</div>
            <h2 className="section-title">Upload Your Images</h2>
            <p className="section-subtitle">
              Drop or click to upload both images, then hit Generate.
            </p>
          </div>

          {/* Progress steps */}
          <div className="steps-row" role="list" aria-label="Steps">
            {[
              { label: 'Upload Person'  },
              { label: 'Upload Garment' },
              { label: 'Generate'       },
            ].map((step, i) => (
              <div key={step.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  role="listitem"
                  className={`step-indicator ${stepsDone > i ? 'done' : stepsDone === i ? 'active' : ''}`}
                >
                  <div className="step-number">{stepsDone > i ? '✓' : i + 1}</div>
                  {step.label}
                </div>
                {i < 2 && <div className="step-divider" aria-hidden="true" />}
              </div>
            ))}
          </div>

          <div className="upload-grid">
            <UploadCard
              id="person-upload"
              label="Person / Model"
              hint="A clear front-facing photo of the person"
              icon="🧍"
              image={personImage}
              onFile={handlePersonFile}
              onRemove={removePersonImage}
            />
            <UploadCard
              id="garment-upload"
              label="Garment / Apparel"
              hint="The clothing item you want to try on"
              icon="👕"
              image={garmentImage}
              onFile={handleGarmentFile}
              onRemove={removeGarmentImage}
            />
          </div>

          <div className="generate-area">
            <button
              id="generate-btn"
              className="btn-generate"
              onClick={handleGenerate}
              disabled={!canGenerate}
              aria-disabled={!canGenerate}
            >
              {canGenerate ? '✦ Generate Try-On' : 'Upload Both Images First'}
            </button>
            {!canGenerate && (
              <p className="generate-hint">
                {!personImage && !garmentImage
                  ? 'Upload a person photo and a garment to get started'
                  : !personImage ? 'Still need the person photo'
                  : 'Still need the garment photo'}
              </p>
            )}
            <div className="generate-separator">
              <span className="generate-sep-line" />
              <span className="generate-sep-text">or</span>
              <span className="generate-sep-line" />
            </div>
            <button className="btn-demo-inline" onClick={handleDemo} id="demo-inline-btn">
              ▷ Try with Demo Images
            </button>
          </div>
        </section>
      )}

      {/* ── FOOTER ── */}
      <footer className="footer">
        <p>Built with <span>FitAI Vision</span> — AI-Powered Virtual Try-On © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
