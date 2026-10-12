import React from 'react';
import {
  Trophy,
  BarChart3,
  Table as TableIcon,
  TrendingUp,
  Sparkles,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const MODEL_COLORS = {
  'SVM': '#6366f1',
  'Random Forest': '#10b981',
  'MLP (Perceptron multicouche)': '#ec4899',
};

// Fallback colors
const PALETTE = ['#6366f1', '#10b981', '#ec4899', '#f59e0b', '#06b6d4'];

export default function ComparisonPanel({ results = [] }) {
  if (!results || results.length < 2) return null;

  // Determine best model by F1-Score
  const bestModel = [...results].sort((a, b) => b.f1_score - a.f1_score)[0];

  // Best accuracy, precision, recall, f1 for highlighting in table
  const maxAcc = Math.max(...results.map((r) => r.accuracy));
  const maxPrec = Math.max(...results.map((r) => r.precision));
  const maxRec = Math.max(...results.map((r) => r.recall));
  const maxF1 = Math.max(...results.map((r) => r.f1_score));

  // Prepare chart data grouped by Metric:
  // [{ metric: 'Accuracy', 'SVM': 89.6, 'Random Forest': 89.0, ... }, ...]
  const chartData = [
    {
      metric: 'Accuracy',
      ...results.reduce((acc, r) => {
        acc[r.algorithm] = +(r.accuracy * 100).toFixed(1);
        return acc;
      }, {}),
    },
    {
      metric: 'Precision',
      ...results.reduce((acc, r) => {
        acc[r.algorithm] = +(r.precision * 100).toFixed(1);
        return acc;
      }, {}),
    },
    {
      metric: 'Recall',
      ...results.reduce((acc, r) => {
        acc[r.algorithm] = +(r.recall * 100).toFixed(1);
        return acc;
      }, {}),
    },
    {
      metric: 'F1-Score',
      ...results.reduce((acc, r) => {
        acc[r.algorithm] = +(r.f1_score * 100).toFixed(1);
        return acc;
      }, {}),
    },
  ];

  return (
    <div className="card comparison-card" id="comparison-panel">
      <div className="card-header">
        <div className="card-title-group">
          <div className="badge-pill pill-gradient">Synthèse & Comparatif</div>
          <h2 className="card-title">Comparaison des Algorithmes</h2>
        </div>
      </div>

      {/* Best Model Callout Banner */}
      {bestModel && (
        <div className="best-model-banner">
          <div className="trophy-wrapper">
            <Trophy size={28} className="trophy-icon" />
          </div>
          <div className="best-model-info">
            <div className="best-model-tag">Meilleur F1 sur le test fixe :</div>
            <div className="best-model-title">
              <strong>{bestModel.algorithm}</strong> est le modèle le plus performant avec un F1-Score de{' '}
              <span className="best-score">{(bestModel.f1_score * 100).toFixed(2)}%</span>
            </div>
            <div className="best-model-desc">
              Dans un contexte de marketing bancaire déséquilibré, le F1-score mesure le compromis
              entre cibler les vrais souscripteurs (rappel) sans trop solliciter de clients non intéressés (précision).
            </div>
          </div>
        </div>
      )}

      {/* Comparative Table */}
      <div className="comparison-section">
        <div className="sub-header">
          <TableIcon size={18} />
          <h3>Tableau Récapitulatif des Performances</h3>
        </div>

        <div className="table-responsive">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Modèle</th>
                <th>Prédiction</th>
                <th>Prob. oui</th>
                <th>Accuracy</th>
                <th>Précision</th>
                <th>Rappel</th>
                <th>F1-Score</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => {
                const isYes = r.prediction.toLowerCase() === 'yes';
                const isBestF1 = r.f1_score === maxF1;
                const isBestAcc = r.accuracy === maxAcc;
                const isBestPrec = r.precision === maxPrec;
                const isBestRec = r.recall === maxRec;

                return (
                  <tr key={r.algorithm} className={isBestF1 ? 'row-best' : ''}>
                    <td className="algo-cell">
                      <span
                        className="color-dot"
                        style={{ backgroundColor: MODEL_COLORS[r.algorithm] || PALETTE[i % PALETTE.length] }}
                      />
                      <span className="algo-cell-name">{r.algorithm}</span>
                      {isBestF1 && <span className="winner-badge">🏆 Meilleur F1</span>}
                    </td>
                    <td>
                      <span className={`table-pred-badge ${isYes ? 'pred-yes' : 'pred-no'}`}>
                        {isYes ? 'OUI' : 'NON'}
                      </span>
                    </td>
                    <td className="cell-num">
                      {r.prediction_proba != null ? `${(r.prediction_proba * 100).toFixed(1)}%` : 'N/A'}
                    </td>
                    <td className={`cell-num ${isBestAcc ? 'cell-best' : ''}`}>
                      {(r.accuracy * 100).toFixed(2)}%
                    </td>
                    <td className={`cell-num ${isBestPrec ? 'cell-best' : ''}`}>
                      {(r.precision * 100).toFixed(2)}%
                    </td>
                    <td className={`cell-num ${isBestRec ? 'cell-best' : ''}`}>
                      {(r.recall * 100).toFixed(2)}%
                    </td>
                    <td className={`cell-num ${isBestF1 ? 'cell-best cell-f1' : ''}`}>
                      {(r.f1_score * 100).toFixed(2)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comparison Chart */}
      <div className="comparison-section">
        <div className="sub-header">
          <BarChart3 size={18} />
          <h3>Graphique Comparatif des Métriques (%)</h3>
        </div>

        <div className="chart-container">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
              <XAxis dataKey="metric" stroke="#94a3b8" tick={{ fill: '#cbd5e1' }} />
              <YAxis
                stroke="#94a3b8"
                domain={[0, 100]}
                unit="%"
                tick={{ fill: '#cbd5e1' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  borderColor: '#334155',
                  borderRadius: '8px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                  color: '#fff',
                }}
                formatter={(value) => [`${value}%`]}
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              {results.map((r, i) => (
                <Bar
                  key={r.algorithm}
                  dataKey={r.algorithm}
                  fill={MODEL_COLORS[r.algorithm] || PALETTE[i % PALETTE.length]}
                  radius={[4, 4, 0, 0]}
                  name={r.algorithm}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
