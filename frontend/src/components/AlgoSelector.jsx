import React from 'react';
import { Cpu, Network, Layers, CheckCircle2, ShieldAlert } from 'lucide-react';

const ALGO_DETAILS = {
  svm: {
    icon: Network,
    badge: 'Noyau RBF',
    color: '#6366f1',
    description: 'Support Vector Machine : frontière de décision optimale à marge maximale.',
  },
  random_forest: {
    icon: Layers,
    badge: '100 Arbres',
    color: '#10b981',
    description: 'Ensemble d’arbres de décision avec vote majoritaire et bagging.',
  },
  mlp: {
    icon: Cpu,
    badge: 'Réseau Neuronal',
    color: '#ec4899',
    description: 'Perceptron multicouche : rétropropagation du gradient (100 neurones).',
  },
};

export default function AlgoSelector({ algorithms = [], selectedAlgos = [], onChange }) {
  const toggleAlgo = (key) => {
    if (selectedAlgos.includes(key)) {
      onChange(selectedAlgos.filter((k) => k !== key));
    } else {
      onChange([...selectedAlgos, key]);
    }
  };

  const selectAll = () => {
    onChange(algorithms.map((a) => a.key));
  };

  const deselectAll = () => {
    onChange([]);
  };

  return (
    <div className="card algo-selector-card">
      <div className="card-header">
        <div className="card-title-group">
          <div className="badge-pill">Étape 1</div>
          <h2 className="card-title">Choix des Algorithmes</h2>
        </div>
        <div className="algo-actions">
          <button
            type="button"
            className="btn-link"
            onClick={selectAll}
            disabled={selectedAlgos.length === algorithms.length}
          >
            Tout cocher
          </button>
          <span className="divider">·</span>
          <button
            type="button"
            className="btn-link"
            onClick={deselectAll}
            disabled={selectedAlgos.length === 0}
          >
            Tout décocher
          </button>
        </div>
      </div>

      <p className="card-subtitle">
        Sélectionnez 1, 2 ou les 3 algorithmes à évaluer. Dès 2 algorithmes sélectionnés,
        un panneau comparatif s’affiche automatiquement.
      </p>

      <div className="algo-grid">
        {algorithms.map((algo) => {
          const isSelected = selectedAlgos.includes(algo.key);
          const meta = ALGO_DETAILS[algo.key] || {
            icon: Cpu,
            badge: 'Modèle ML',
            color: '#6366f1',
            description: '',
          };
          const Icon = meta.icon;

          return (
            <div
              key={algo.key}
              id={`algo-card-${algo.key}`}
              className={`algo-card ${isSelected ? 'selected' : ''}`}
              onClick={() => toggleAlgo(algo.key)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  toggleAlgo(algo.key);
                }
              }}
            >
              <div className="algo-card-top">
                <div
                  className="algo-icon-wrapper"
                  style={{
                    backgroundColor: `${meta.color}18`,
                    color: meta.color,
                    borderColor: `${meta.color}35`,
                  }}
                >
                  <Icon size={22} />
                </div>
                <div className="algo-badge" style={{ borderColor: `${meta.color}40`, color: meta.color }}>
                  {meta.badge}
                </div>
                <div className={`checkbox-custom ${isSelected ? 'checked' : ''}`}>
                  {isSelected && <CheckCircle2 size={18} color="#fff" />}
                </div>
              </div>

              <div className="algo-card-body">
                <h3 className="algo-name">{algo.label}</h3>
                <p className="algo-desc">{meta.description}</p>
              </div>

              <div className="algo-card-footer">
                <span className="status-label">
                  {isSelected ? '✓ Modèle activé' : '+ Cliquez pour activer'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="algo-selection-footer">
        {selectedAlgos.length === 0 ? (
          <div className="selection-warning">
            <ShieldAlert size={16} />
            <span>Veuillez sélectionner au moins un algorithme pour pouvoir lancer la simulation.</span>
          </div>
        ) : (
          <div className="selection-info">
            <span className="badge-count">{selectedAlgos.length} / {algorithms.length}</span>
            <span>
              {selectedAlgos.length >= 2
                ? 'Mode comparatif activé : graphiques et tableau comparatif générés après simulation.'
                : 'Mode unitaire : résultat détaillé du modèle sélectionné.'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
