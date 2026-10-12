import React, { useState, useEffect, useRef } from 'react';
import { getMeta, getSample, predict } from './api/client';
import AlgoSelector from './components/AlgoSelector';
import FeatureForm from './components/FeatureForm';
import ResultsPanel from './components/ResultsPanel';
import ComparisonPanel from './components/ComparisonPanel';
import {
  BrainCircuit,
  Database,
  BarChart2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import './App.css';

const DEFAULT_FORM_VALUES = {
  age: 40,
  job: 'management',
  marital: 'married',
  education: 'tertiary',
  default: 'no',
  balance: 2500,
  housing: 'yes',
  loan: 'no',
  contact: 'cellular',
  day: 15,
  month: 'may',
  duration: 260,
  campaign: 1,
  pdays: -1,
  previous: 0,
  poutcome: 'unknown',
};

export default function App() {
  const [meta, setMeta] = useState(null);
  const [selectedAlgos, setSelectedAlgos] = useState(['svm', 'random_forest', 'mlp']);
  const [formValues, setFormValues] = useState(DEFAULT_FORM_VALUES);
  const [response, setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSampleLoading, setIsSampleLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const resultsRef = useRef(null);

  // Load metadata and initial sample
  useEffect(() => {
    async function init() {
      try {
        const metadata = await getMeta();
        setMeta(metadata);
        // Try loading real sample
        try {
          const sample = await getSample('yes');
          if (sample?.data) {
            setFormValues(sample.data);
          }
        } catch {
          // Use default values if sample endpoint is unavailable
        }
      } catch (err) {
        setError("Impossible de se connecter à l'API FastAPI backend. Vérifiez que le serveur tourne sur http://localhost:8000");
      }
    }
    init();
  }, []);

  // Charger un exemple du dataset (yes ou no)
  const handleLoadSample = async (type) => {
    setIsSampleLoading(true);
    setError(null);
    try {
      const res = await getSample(type);
      if (res?.data) {
        setFormValues(res.data);
        setNotice(`Profil exemple de client "${type === 'yes' ? 'Souscripteur (Oui)' : 'Réfractaire (Non)'}" chargé.`);
        setTimeout(() => setNotice(null), 4000);
      }
    } catch (err) {
      setError(`Erreur lors du chargement de l'échantillon: ${err.message}`);
    } finally {
      setIsSampleLoading(false);
    }
  };

  // Lancer la simulation
  const handleSimulate = async () => {
    if (selectedAlgos.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        algorithms: selectedAlgos,
        ...formValues,
      };
      const res = await predict(payload);
      setResponse(res);

      // Smooth scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      setError(`Erreur lors de la simulation : ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      {/* Background ambient decorative glows */}
      <div className="ambient-glow glow-1" />
      <div className="ambient-glow glow-2" />

      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="header-badge">
            <BrainCircuit size={16} className="badge-icon" />
            <span>Machine Learning & Deep Learning · TP Bank Marketing</span>
          </div>

          <h1 className="header-title">Simulateur ML</h1>
          <p className="header-subtitle">
            Prédiction de souscription bancaire par <strong>SVM</strong>, <strong>Random Forest</strong> et <strong>MLP</strong>
          </p>

          <div className="header-tags">
            <div className="tag">
              <Database size={14} />
              <span>Dataset : bank.csv (4 521 clients)</span>
            </div>
            <div className="tag">
              <BarChart2 size={14} />
              <span>Validation croisée & Test Set (20% stratifié)</span>
            </div>
            <div className="tag">
              <CheckCircle2 size={14} />
              <span>FastAPI + Scikit-Learn + React</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="app-main">
        {/* Error notification banner */}
        {error && (
          <div className="alert-banner alert-error">
            <AlertTriangle size={20} />
            <div className="alert-text">
              <strong>Erreur :</strong> {error}
            </div>
            <button className="btn-close-alert" onClick={() => setError(null)}>✕</button>
          </div>
        )}

        {/* Info notice banner */}
        {notice && (
          <div className="alert-banner alert-success">
            <CheckCircle2 size={20} />
            <div className="alert-text">{notice}</div>
          </div>
        )}

        {/* 1. Algorithmes Selector */}
        <section className="section-step">
          <AlgoSelector
            algorithms={meta?.algorithms || [
              { key: 'svm', label: 'SVM' },
              { key: 'random_forest', label: 'Random Forest' },
              { key: 'mlp', label: 'MLP (Perceptron multicouche)' },
            ]}
            selectedAlgos={selectedAlgos}
            onChange={setSelectedAlgos}
          />
        </section>

        {/* 2. Features Form */}
        <section className="section-step">
          <FeatureForm
            meta={meta}
            formValues={formValues}
            onChange={setFormValues}
            onSimulate={handleSimulate}
            onLoadSample={handleLoadSample}
            isLoading={isLoading || isSampleLoading}
            canSimulate={selectedAlgos.length > 0}
          />
        </section>

        {/* 3. Results Section */}
        <div ref={resultsRef}>
          {response && response.results && response.results.length > 0 && (
            <div className="results-wrapper">
              {/* Individual Results Panel */}
              <ResultsPanel results={response.results} />

              {/* Comparative Panel (Only if comparison === true or >= 2 algos) */}
              {response.comparison && (
                <ComparisonPanel results={response.results} />
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <span>Simulateur ML - Bank Marketing · Support Vector Machine · Random Forest · Réseau Neuronal MLP</span>
          <div className="footer-links">
            <span className="footer-note">Évaluation des métriques sur jeu de test fixe (test_size=0.2, random_state=42)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
