const API_BASE = "http://localhost:8000/api";

/**
 * Recupere la configuration des algorithmes et la structure des champs
 */
export async function getMeta() {
  try {
    const res = await fetch(`${API_BASE}/meta`);
    if (!res.ok) {
      throw new Error(`Erreur HTTP: ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.error("Erreur lors de la recuperation des métadonnées:", err);
    throw err;
  }
}

/**
 * Recupere une ligne reelle du dataset d'exemple (type: 'yes' ou 'no')
 */
export async function getSample(type = "yes") {
  try {
    const res = await fetch(`${API_BASE}/sample?type=${type}`);
    if (!res.ok) {
      throw new Error(`Erreur HTTP: ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.error("Erreur lors de la recuperation du sample:", err);
    throw err;
  }
}

/**
 * Lance la simulation avec les algorithmes et caracteristiques choisis
 */
export async function predict(payload) {
  try {
    const res = await fetch(`${API_BASE}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || `Erreur serveur (${res.status})`);
    }

    return await res.json();
  } catch (err) {
    console.error("Erreur lors de la prediction:", err);
    throw err;
  }
}
