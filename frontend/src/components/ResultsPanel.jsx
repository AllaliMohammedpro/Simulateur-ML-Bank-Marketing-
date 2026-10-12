import React from 'react';
import {
  CheckCircle,
  XCircle,
  Target,
  Percent,
  Activity,
  Layers,
  Award,
  Grid,
} from 'lucide-react';

export default function ResultsPanel({ results = [] }) {
  if (!results || results.length === 0) return null;

  return (
    <div className="results-container">
      <div className="section-title-bar">
        <h2 className="section-title">
          <Activity size={24} className="icon-title" />
          Résultats Individuels par Modèle
        </h2>
        <span className="results-count-badge">
          {results.length} algorithme{results.length > 1 ? 's' : ''} simulé{results.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className={`results-grid ${results.length === 1 ? 'single-col' : results.length === 2 ? 'two-col' : 'three-col'}`}>
        {results.map((res, index) => {
          const isYes = res.prediction.toLowerCase() === 'yes';
          const probaPercent = res.prediction_proba != null ? (res.prediction_proba * 100).toFixed(1) : null;
          
          const cm = res.confusion_matrix || [[0, 0], [0, 0]];
          const tn = cm[0]?.[0] ?? 0;
          const fp = cm[0]?.[1] ?? 0;
          const fn = cm[1]?.[0] ?? 0;
          const tp = cm[1]?.[1] ?? 0;
          const totalTest = tn + fp + fn + tp;

          return (
            <div key={res.algorithm || index} className="algo-result-card">
              {/* Algorithm Title & Prediction Badge */}
              <div className="result-card-header">
                <div className="algo-header-title">
                  <Layers size={18} className="algo-badge-icon" />
                  <span className="algo-name">{res.algorithm}</span>
                </div>
                <div className={`prediction-pill ${isYes ? 'pill-success' : 'pill-danger'}`}>
                  {isYes ? <CheckCircle size={16} /> : <XCircle size={16} />}
                  <span>{isYes ? 'Souscription : OUI' : 'Souscription : NON'}</span>
                </div>
              </div>

              {/* Prediction Probability */}
              <div className="prediction-statement">
                <div className="prob-info">
                  <span className="prob-label">Probabilité de souscription (oui) :</span>
                  <span className="prob-value">{probaPercent != null ? `${probaPercent}%` : 'N/A'}</span>
                </div>
                {probaPercent != null && (
                  <div className="progress-bar-bg">
                    <div
                      className={`progress-bar-fill ${isYes ? 'fill-success' : 'fill-warning'}`}
                      style={{ width: `${probaPercent}%` }}
                    />
                  </div>
                )}
                <span className="prob-label">Seuil de décision : {(res.decision_threshold * 100).toFixed(1)}%</span>
              </div>

              {/* Metrics Grid */}
              <div className="metrics-section">
                <h4 className="sub-title">Métriques sur Test Set (fixe) :</h4>
                <div className="metrics-grid">
                  <div className="metric-box">
                    <span className="metric-name">Accuracy</span>
                    <span className="metric-val">{(res.accuracy * 100).toFixed(2)}%</span>
                  </div>
                  <div className="metric-box">
                    <span className="metric-name">Precision</span>
                    <span className="metric-val">{(res.precision * 100).toFixed(2)}%</span>
                  </div>
                  <div className="metric-box">
                    <span className="metric-name">Recall</span>
                    <span className="metric-val">{(res.recall * 100).toFixed(2)}%</span>
                  </div>
                  <div className="metric-box highlight-f1">
                    <span className="metric-name">F1-Score</span>
                    <span className="metric-val">{(res.f1_score * 100).toFixed(2)}%</span>
                  </div>
                </div>
              </div>

              {/* Confusion Matrix */}
              <div className="cm-section">
                <div className="cm-header">
                  <Grid size={15} />
                  <h4 className="sub-title">Matrice de Confusion (N={totalTest})</h4>
                </div>
                
                <div className="cm-table-wrapper">
                  <table className="cm-table">
                    <thead>
                      <tr>
                        <th className="cm-corner">Réel \ Prédit</th>
                        <th>Prédit Non</th>
                        <th>Prédit Oui</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <th className="cm-row-header">Réel Non</th>
                        <td className="cm-cell cm-tn" title={`Vrais Négatifs: ${tn}`}>
                          <div className="cm-cell-val">{tn}</div>
                          <div className="cm-cell-tag">VN</div>
                        </td>
                        <td className="cm-cell cm-fp" title={`Faux Positifs: ${fp}`}>
                          <div className="cm-cell-val">{fp}</div>
                          <div className="cm-cell-tag">FP</div>
                        </td>
                      </tr>
                      <tr>
                        <th className="cm-row-header">Réel Oui</th>
                        <td className="cm-cell cm-fn" title={`Faux Négatifs: ${fn}`}>
                          <div className="cm-cell-val">{fn}</div>
                          <div className="cm-cell-tag">FN</div>
                        </td>
                        <td className="cm-cell cm-tp" title={`Vrais Positifs: ${tp}`}>
                          <div className="cm-cell-val">{tp}</div>
                          <div className="cm-cell-tag">VP</div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
