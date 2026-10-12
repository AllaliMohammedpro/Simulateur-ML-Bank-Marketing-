import React, { useState } from 'react';
import {
  User,
  Wallet,
  PhoneCall,
  History,
  Sparkles,
  RotateCcw,
  Play,
  Check,
  XCircle,
  HelpCircle,
} from 'lucide-react';

const FIELD_LABELS = {
  age: { label: 'Âge', hint: 'Entre 18 et 95 ans', unit: 'ans' },
  job: { label: 'Emploi / Métier', hint: 'Secteur d’activité du client' },
  marital: { label: 'Statut marital', hint: 'Situation matrimoniale' },
  education: { label: 'Niveau d’études', hint: 'Niveau d’éducation validé' },
  default: { label: 'Défaut de crédit', hint: 'A déjà eu un impayé ?' },
  balance: { label: 'Solde annuel moyen', hint: 'Solde du compte en euros', unit: '€' },
  housing: { label: 'Prêt immobilier', hint: 'Crédit habitat en cours ?' },
  loan: { label: 'Prêt personnel', hint: 'Crédit consommation en cours ?' },
  contact: { label: 'Moyen de contact', hint: 'Canal de communication utilisé' },
  day: { label: 'Jour du contact', hint: 'Jour du mois (1 à 31)' },
  month: { label: 'Mois du contact', hint: 'Mois du dernier appel' },
  duration: { label: 'Durée de l’appel', hint: 'Durée en secondes de la communication', unit: 's' },
  campaign: { label: 'Nb contacts campagne', hint: 'Appels passés lors de cette campagne' },
  pdays: { label: 'Délai depuis dernier contact', hint: 'Jours écoulés (-1 si jamais contacté)', unit: 'j' },
  previous: { label: 'Nb contacts antérieurs', hint: 'Nombre d’appels avant cette campagne' },
  poutcome: { label: 'Issue campagne précédente', hint: 'Résultat de la campagne marketing précédente' },
};

export default function FeatureForm({
  meta,
  formValues,
  onChange,
  onSimulate,
  onLoadSample,
  isLoading,
  canSimulate,
}) {
  const [activeTab, setActiveTab] = useState('all');

  const handleInputChange = (field, val, isNumeric = false) => {
    let parsedVal = val;
    if (isNumeric) {
      parsedVal = val === '' ? 0 : parseInt(val, 10);
      if (isNaN(parsedVal)) parsedVal = 0;
    }
    onChange({ ...formValues, [field]: parsedVal });
  };

  const categoricalOptions = meta?.categorical_options || {};

  return (
    <div className="card feature-form-card">
      <div className="card-header">
        <div className="card-title-group">
          <div className="badge-pill">Étape 2</div>
          <h2 className="card-title">Caractéristiques du Client</h2>
        </div>

        <div className="sample-presets">
          <span className="preset-label">Exemples réels :</span>
          <button
            type="button"
            className="btn-preset btn-preset-yes"
            onClick={() => onLoadSample('yes')}
            title="Charger un profil réel qui a souscrit (y=yes)"
          >
            <Sparkles size={14} />
            <span>Client Souscripteur (Oui)</span>
          </button>
          <button
            type="button"
            className="btn-preset btn-preset-no"
            onClick={() => onLoadSample('no')}
            title="Charger un profil réel qui a refusé (y=no)"
          >
            <RotateCcw size={14} />
            <span>Client Réfractaire (Non)</span>
          </button>
        </div>
      </div>

      <p className="card-subtitle">
        Renseignez les données sociodémographiques, bancaires et marketing pour prédire
        la propension à souscrire un dépôt à terme.
      </p>

      {/* Grid of Sections */}
      <div className="form-sections-grid">
        {/* Section 1: Profil Sociodémographique */}
        <div className="form-group-box">
          <div className="group-box-header">
            <User size={18} className="icon-accent" />
            <h3 className="group-box-title">1. Profil Sociodémographique</h3>
          </div>
          <div className="fields-grid">
            <div className="field-control">
              <label htmlFor="input-age">
                {FIELD_LABELS.age.label} <span className="unit-tag">({FIELD_LABELS.age.unit})</span>
              </label>
              <input
                id="input-age"
                type="number"
                min="18"
                max="100"
                value={formValues.age ?? 35}
                onChange={(e) => handleInputChange('age', e.target.value, true)}
                className="input-text"
              />
              <span className="field-hint">{FIELD_LABELS.age.hint}</span>
            </div>

            <div className="field-control">
              <label htmlFor="select-job">{FIELD_LABELS.job.label}</label>
              <select
                id="select-job"
                value={formValues.job || ''}
                onChange={(e) => handleInputChange('job', e.target.value)}
                className="select-dropdown"
              >
                {(categoricalOptions.job || []).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <span className="field-hint">{FIELD_LABELS.job.hint}</span>
            </div>

            <div className="field-control">
              <label htmlFor="select-marital">{FIELD_LABELS.marital.label}</label>
              <select
                id="select-marital"
                value={formValues.marital || ''}
                onChange={(e) => handleInputChange('marital', e.target.value)}
                className="select-dropdown"
              >
                {(categoricalOptions.marital || []).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <span className="field-hint">{FIELD_LABELS.marital.hint}</span>
            </div>

            <div className="field-control">
              <label htmlFor="select-education">{FIELD_LABELS.education.label}</label>
              <select
                id="select-education"
                value={formValues.education || ''}
                onChange={(e) => handleInputChange('education', e.target.value)}
                className="select-dropdown"
              >
                {(categoricalOptions.education || []).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <span className="field-hint">{FIELD_LABELS.education.hint}</span>
            </div>
          </div>
        </div>

        {/* Section 2: Situation Financière */}
        <div className="form-group-box">
          <div className="group-box-header">
            <Wallet size={18} className="icon-accent" />
            <h3 className="group-box-title">2. Situation Financière</h3>
          </div>
          <div className="fields-grid">
            <div className="field-control">
              <label htmlFor="input-balance">
                {FIELD_LABELS.balance.label} <span className="unit-tag">({FIELD_LABELS.balance.unit})</span>
              </label>
              <input
                id="input-balance"
                type="number"
                value={formValues.balance ?? 1500}
                onChange={(e) => handleInputChange('balance', e.target.value, true)}
                className="input-text"
              />
              <span className="field-hint">{FIELD_LABELS.balance.hint}</span>
            </div>

            <div className="field-control">
              <label htmlFor="select-default">{FIELD_LABELS.default.label}</label>
              <select
                id="select-default"
                value={formValues.default || 'no'}
                onChange={(e) => handleInputChange('default', e.target.value)}
                className="select-dropdown"
              >
                {(categoricalOptions.default || ['no', 'yes']).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt === 'yes' ? 'Oui (Défaillant)' : 'Non (Sain)'}
                  </option>
                ))}
              </select>
              <span className="field-hint">{FIELD_LABELS.default.hint}</span>
            </div>

            <div className="field-control">
              <label htmlFor="select-housing">{FIELD_LABELS.housing.label}</label>
              <select
                id="select-housing"
                value={formValues.housing || 'no'}
                onChange={(e) => handleInputChange('housing', e.target.value)}
                className="select-dropdown"
              >
                {(categoricalOptions.housing || ['no', 'yes']).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt === 'yes' ? 'Oui (Prêt en cours)' : 'Non (Aucun)'}
                  </option>
                ))}
              </select>
              <span className="field-hint">{FIELD_LABELS.housing.hint}</span>
            </div>

            <div className="field-control">
              <label htmlFor="select-loan">{FIELD_LABELS.loan.label}</label>
              <select
                id="select-loan"
                value={formValues.loan || 'no'}
                onChange={(e) => handleInputChange('loan', e.target.value)}
                className="select-dropdown"
              >
                {(categoricalOptions.loan || ['no', 'yes']).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt === 'yes' ? 'Oui (Crédit conso)' : 'Non (Aucun)'}
                  </option>
                ))}
              </select>
              <span className="field-hint">{FIELD_LABELS.loan.hint}</span>
            </div>
          </div>
        </div>

        {/* Section 3: Dernier Contact */}
        <div className="form-group-box">
          <div className="group-box-header">
            <PhoneCall size={18} className="icon-accent" />
            <h3 className="group-box-title">3. Dernier Contact de la Campagne</h3>
          </div>
          <div className="fields-grid">
            <div className="field-control">
              <label htmlFor="select-contact">{FIELD_LABELS.contact.label}</label>
              <select
                id="select-contact"
                value={formValues.contact || ''}
                onChange={(e) => handleInputChange('contact', e.target.value)}
                className="select-dropdown"
              >
                {(categoricalOptions.contact || []).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <span className="field-hint">{FIELD_LABELS.contact.hint}</span>
            </div>

            <div className="field-control">
              <label htmlFor="select-month">{FIELD_LABELS.month.label}</label>
              <select
                id="select-month"
                value={formValues.month || ''}
                onChange={(e) => handleInputChange('month', e.target.value)}
                className="select-dropdown"
              >
                {(categoricalOptions.month || []).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt.toUpperCase()}
                  </option>
                ))}
              </select>
              <span className="field-hint">{FIELD_LABELS.month.hint}</span>
            </div>

            <div className="field-control">
              <label htmlFor="input-day">{FIELD_LABELS.day.label}</label>
              <input
                id="input-day"
                type="number"
                min="1"
                max="31"
                value={formValues.day ?? 15}
                onChange={(e) => handleInputChange('day', e.target.value, true)}
                className="input-text"
              />
              <span className="field-hint">{FIELD_LABELS.day.hint}</span>
            </div>

            <div className="field-control">
              <label htmlFor="input-duration">
                {FIELD_LABELS.duration.label} <span className="unit-tag">({FIELD_LABELS.duration.unit})</span>
              </label>
              <input
                id="input-duration"
                type="number"
                min="0"
                value={formValues.duration ?? 250}
                onChange={(e) => handleInputChange('duration', e.target.value, true)}
                className="input-text"
              />
              <span className="field-hint">{FIELD_LABELS.duration.hint}</span>
            </div>
          </div>
        </div>

        {/* Section 4: Historique & Campagnes Précédentes */}
        <div className="form-group-box">
          <div className="group-box-header">
            <History size={18} className="icon-accent" />
            <h3 className="group-box-title">4. Historique Marketing</h3>
          </div>
          <div className="fields-grid">
            <div className="field-control">
              <label htmlFor="input-campaign">{FIELD_LABELS.campaign.label}</label>
              <input
                id="input-campaign"
                type="number"
                min="1"
                value={formValues.campaign ?? 1}
                onChange={(e) => handleInputChange('campaign', e.target.value, true)}
                className="input-text"
              />
              <span className="field-hint">{FIELD_LABELS.campaign.hint}</span>
            </div>

            <div className="field-control">
              <label htmlFor="input-pdays">
                {FIELD_LABELS.pdays.label} <span className="unit-tag">({FIELD_LABELS.pdays.unit})</span>
              </label>
              <input
                id="input-pdays"
                type="number"
                min="-1"
                value={formValues.pdays ?? -1}
                onChange={(e) => handleInputChange('pdays', e.target.value, true)}
                className="input-text"
              />
              <span className="field-hint">{FIELD_LABELS.pdays.hint}</span>
            </div>

            <div className="field-control">
              <label htmlFor="input-previous">{FIELD_LABELS.previous.label}</label>
              <input
                id="input-previous"
                type="number"
                min="0"
                value={formValues.previous ?? 0}
                onChange={(e) => handleInputChange('previous', e.target.value, true)}
                className="input-text"
              />
              <span className="field-hint">{FIELD_LABELS.previous.hint}</span>
            </div>

            <div className="field-control">
              <label htmlFor="select-poutcome">{FIELD_LABELS.poutcome.label}</label>
              <select
                id="select-poutcome"
                value={formValues.poutcome || 'unknown'}
                onChange={(e) => handleInputChange('poutcome', e.target.value)}
                className="select-dropdown"
              >
                {(categoricalOptions.poutcome || []).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <span className="field-hint">{FIELD_LABELS.poutcome.hint}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action footer */}
      <div className="form-action-footer">
        <button
          type="button"
          id="btn-simulate"
          className="btn-simulate"
          onClick={onSimulate}
          disabled={!canSimulate || isLoading}
        >
          {isLoading ? (
            <div className="spinner-wrapper">
              <div className="spinner"></div>
              <span>Calcul des prédictions en cours...</span>
            </div>
          ) : (
            <>
              <Play size={20} fill="currentColor" />
              <span>Simuler la Prédiction</span>
            </>
          )}
        </button>

        {!canSimulate && (
          <span className="simulate-disabled-reason">
            Cochez au moins 1 algorithme ci-dessus pour lancer la simulation.
          </span>
        )}
      </div>
    </div>
  );
}
