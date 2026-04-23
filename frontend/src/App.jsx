import { useEffect, useRef, useState } from 'react';
import heroImage from './assets/hero-tryon.png';
import './App.css';

const LOADING_STEPS = [
  'Reading model image',
  'Extracting apparel geometry',
  'Mapping fabric and lighting',
  'Compositing final preview',
];

const DEMO_PERSON_URL = 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=900&q=80';
const DEMO_GARMENT_URL = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900&q=80';
const DEMO_RESULT_URL = 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=900&q=80';

function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark';

  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={onToggle}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      aria-pressed={isDark}
    >
      <span className="theme-toggle-track">
        <span className="theme-toggle-thumb" />
      </span>
      <span>{isDark ? 'Dark' : 'Light'}</span>
    </button>
  );
}

function UploadCard({ id, eyebrow, title, description, image, onFile, onRemove }) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      return;
    }

    onFile(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    handleFile(event.dataTransfer.files?.[0]);
  };

  return (
    <article
      className={`upload-card ${image ? 'has-preview' : ''} ${isDragging ? 'is-dragging' : ''}`}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/*"
        onChange={(event) => handleFile(event.target.files?.[0])}
      />

      {image ? (
        <div className="upload-preview">
          <img src={image.url} alt={`${title} preview`} />
          <div className="preview-toolbar">
            <span>{eyebrow}</span>
            <div>
              <button type="button" onClick={() => inputRef.current?.click()}>
                Replace
              </button>
              <button type="button" onClick={onRemove}>
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button className="upload-empty" type="button" onClick={() => inputRef.current?.click()}>
          <span className="upload-index">{eyebrow}</span>
          <span className="upload-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" role="img">
              <path d="M12 3v12m0-12 4.5 4.5M12 3 7.5 7.5" />
              <path d="M5 14v3.5A2.5 2.5 0 0 0 7.5 20h9a2.5 2.5 0 0 0 2.5-2.5V14" />
            </svg>
          </span>
          <span className="upload-title">{title}</span>
          <span className="upload-description">{description}</span>
          <span className="upload-formats">JPG / PNG / WEBP</span>
        </button>
      )}
    </article>
  );
}

function LoadingOverlay({ progress }) {
  const activeStep = Math.min(
    LOADING_STEPS.length - 1,
    Math.floor((progress / 100) * LOADING_STEPS.length),
  );

  return (
    <div className="loading-overlay" role="status" aria-live="polite">
      <div className="loader-shell">
        <div className="loader-orbit" aria-hidden="true" />
        <p className="loader-label">Precision render in progress</p>
        <h2>{LOADING_STEPS[activeStep]}</h2>
        <div className="loader-bar">
          <span style={{ width: `${progress}%` }} />
        </div>
        <p className="loader-progress">{Math.round(progress)}%</p>
      </div>
    </div>
  );
}

function ResultPanel({ resultUrl, personImage, garmentImage, isDemo, onReset }) {
  const handleDownload = () => {
    if (isDemo) {
      window.alert('Demo mode uses placeholder imagery. Connect /api/tryon for downloadable outputs.');
      return;
    }

    const link = document.createElement('a');
    link.href = resultUrl;
    link.download = `virtual-try-on-${Date.now()}.png`;
    link.click();
  };

  return (
    <section className="result-section" id="result">
      <div className="section-kicker">Render Output</div>
      <div className="section-heading-row">
        <div>
          <h2>Your virtual fitting result</h2>
          <p>Review the generated composite and compare it with your original inputs.</p>
        </div>
        <button className="secondary-button" type="button" onClick={onReset}>
          Start over
        </button>
      </div>

      {isDemo && (
        <div className="demo-note">
          Demo preview active. The production flow still posts to <code>/api/tryon</code>.
        </div>
      )}

      <div className="result-layout">
        <div className="result-image-card">
          <img src={resultUrl} alt="Virtual try-on result" />
        </div>
        <div className="result-side">
          <div className="result-status">
            <span className="status-dot" />
            Generation complete
          </div>
          <div className="compare-grid">
            <img src={personImage} alt="Uploaded model" />
            <img src={garmentImage} alt="Uploaded apparel" />
          </div>
          <button className="primary-button full-width" type="button" onClick={handleDownload}>
            Download result
          </button>
        </div>
      </div>
    </section>
  );
}

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('tryon-theme') || 'dark');
  const [personImage, setPersonImage] = useState(null);
  const [garmentImage, setGarmentImage] = useState(null);
  const [resultUrl, setResultUrl] = useState(null);
  const [isDemo, setIsDemo] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const tryOnRef = useRef(null);
  const progressRef = useRef(null);

  useEffect(() => {
    const revealItems = document.querySelectorAll('[data-reveal]');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16, rootMargin: '0px 0px -8% 0px' },
    );

    revealItems.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [resultUrl]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('tryon-theme', theme);
  }, [theme]);

  useEffect(() => {
    return () => {
      [personImage, garmentImage].forEach((image) => {
        if (image?.url?.startsWith('blob:')) URL.revokeObjectURL(image.url);
      });
    };
  }, [personImage, garmentImage]);

  const setImageFromFile = (setter) => (file) => {
    setError('');
    setter((current) => {
      if (current?.url?.startsWith('blob:')) URL.revokeObjectURL(current.url);
      return { file, url: URL.createObjectURL(file) };
    });
    setResultUrl(null);
    setIsDemo(false);
  };

  const removeImage = (setter) => () => {
    setter((current) => {
      if (current?.url?.startsWith('blob:')) URL.revokeObjectURL(current.url);
      return null;
    });
    setResultUrl(null);
  };

  const beginProgress = () => {
    setProgress(0);
    window.clearInterval(progressRef.current);
    progressRef.current = window.setInterval(() => {
      setProgress((value) => Math.min(96, value + Math.random() * 8 + 2));
    }, 360);
  };

  const finishProgress = async () => {
    window.clearInterval(progressRef.current);
    setProgress(100);
    await new Promise((resolve) => window.setTimeout(resolve, 500));
  };

  const handleDemo = async () => {
    setError('');
    setIsDemo(true);
    setResultUrl(null);
    setPersonImage({ url: DEMO_PERSON_URL });
    setGarmentImage({ url: DEMO_GARMENT_URL });
    setIsLoading(true);
    beginProgress();
    await new Promise((resolve) => window.setTimeout(resolve, 2600));
    await finishProgress();
    setIsLoading(false);
    setResultUrl(DEMO_RESULT_URL);
    window.setTimeout(() => document.getElementById('result')?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleGenerate = async () => {
    if (!personImage?.file || !garmentImage?.file) {
      setError('Upload both a model image and an apparel image to generate a try-on.');
      return;
    }

    setError('');
    setIsDemo(false);
    setResultUrl(null);
    setIsLoading(true);
    beginProgress();

    try {
      const formData = new FormData();
      formData.append('person_image', personImage.file);
      formData.append('garment_image', garmentImage.file);

      const response = await fetch('/api/tryon', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}`);
      }

      const data = await response.json();
      await finishProgress();

      if (data.result_url) {
        setResultUrl(data.result_url);
      } else if (data.result_image) {
        setResultUrl(`data:image/png;base64,${data.result_image}`);
      } else {
        throw new Error('The backend response did not include a result image.');
      }

      window.setTimeout(() => document.getElementById('result')?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      window.clearInterval(progressRef.current);
      setError(`${err.message}. Make sure the try-on backend is running and reachable.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setPersonImage(null);
    setGarmentImage(null);
    setResultUrl(null);
    setIsDemo(false);
    setError('');
    window.setTimeout(() => tryOnRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const canGenerate = Boolean(personImage?.file && garmentImage?.file);

  return (
    <div className="app">
      {isLoading && <LoadingOverlay progress={progress} />}

      <header className="site-header">
        <a className="brand" href="#top" aria-label="Precision home">
          <span className="brand-mark">P</span>
          Precision
        </a>
        <nav aria-label="Primary navigation">
          <a href="#workflow">Workflow</a>
          <a href="#tryon">Try-on</a>
          <button type="button" onClick={handleDemo}>
            Demo
          </button>
        </nav>
        <ThemeToggle theme={theme} onToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />
      </header>

      <main id="top">
        <section className="hero-section">
          <div className="hero-content">
            <div className="eyebrow hero-reveal">
              <span />
              Neural engine v4.0
            </div>
            <h1 className="hero-reveal delay-1">
              Virtual fitting that feels ready for a fashion launch.
            </h1>
            <p className="hero-reveal delay-2">
              Upload a model image and an apparel image. Precision maps fabric, form, and lighting
              into a clean try-on preview built for modern commerce workflows.
            </p>
            <div className="hero-actions hero-reveal delay-3">
              <button className="primary-button" type="button" onClick={() => tryOnRef.current?.scrollIntoView({ behavior: 'smooth' })}>
                Start try-on
              </button>
              <button className="secondary-button" type="button" onClick={handleDemo}>
                Preview demo
              </button>
            </div>
            <div className="hero-metrics hero-reveal delay-4" aria-label="Product highlights">
              <div>
                <strong>2 inputs</strong>
                <span>Model + apparel</span>
              </div>
              <div>
                <strong>4 stages</strong>
                <span>Vision pipeline</span>
              </div>
              <div>
                <strong>API ready</strong>
                <span>/api/tryon</span>
              </div>
            </div>
          </div>

          <div className="hero-visual" aria-label="Virtual try-on system preview">
            <div className="visual-frame">
              <img src={heroImage} alt="Futuristic apparel mapping interface" />
              <div className="scan-panel">
                <span>Fit alignment</span>
                <strong>98.4%</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="workflow-section" id="workflow">
          <div data-reveal>
            <div className="section-kicker">The workflow</div>
            <h2>From two images to a production-grade preview.</h2>
          </div>
          <div className="workflow-grid">
            {[
              ['01', 'Upload assets', 'Add a clear model reference and an apparel image with visible garment structure.'],
              ['02', 'Analyze fit', 'The model reads pose, silhouette, drape, lighting, and garment boundaries.'],
              ['03', 'Render output', 'Generate a polished try-on result and keep the original inputs for comparison.'],
            ].map(([number, title, description]) => (
              <article className="workflow-card" key={number} data-reveal>
                <span>{number}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        {!resultUrl ? (
          <section className="tryon-section" id="tryon" ref={tryOnRef}>
            <div className="section-kicker" data-reveal>Module preview</div>
            <div className="section-heading-row" data-reveal>
              <div>
                <h2>Input visualization</h2>
                <p>Drop your two assets below. The generate button activates once both uploads are ready.</p>
              </div>
              <span className="session-pill">Session ID: PV_8829_QX</span>
            </div>

            <div className="upload-grid">
              <div data-reveal>
              <UploadCard
                id="person-image"
                eyebrow="Area A"
                title="Model image"
                description="Upload the person or mannequin reference."
                image={personImage}
                onFile={setImageFromFile(setPersonImage)}
                onRemove={removeImage(setPersonImage)}
              />
              </div>
              <div data-reveal>
              <UploadCard
                id="garment-image"
                eyebrow="Area B"
                title="Apparel image"
                description="Upload the garment you want to map."
                image={garmentImage}
                onFile={setImageFromFile(setGarmentImage)}
                onRemove={removeImage(setGarmentImage)}
              />
              </div>
            </div>

            {error && <p className="error-message" role="alert">{error}</p>}

            <div className="execute-panel">
              <span className={canGenerate ? 'ready-dot ready' : 'ready-dot'} />
              <span>{canGenerate ? 'Processing ready' : 'Awaiting both uploads'}</span>
              <button className="primary-button" type="button" onClick={handleGenerate} disabled={!canGenerate}>
                Execute mapping sequence
              </button>
            </div>
          </section>
        ) : (
          <ResultPanel
            resultUrl={resultUrl}
            personImage={personImage?.url}
            garmentImage={garmentImage?.url}
            isDemo={isDemo}
            onReset={handleReset}
          />
        )}
      </main>

      <footer className="site-footer">
        <span>Precision</span>
        <span>Virtual apparel mapping interface</span>
      </footer>
    </div>
  );
}

export default App;
