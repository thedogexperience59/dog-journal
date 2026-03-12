import { useState, useEffect, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

// ─── SUPABASE CONFIG ──────────────────────────────────────────────────────────
// ⚠️  Replace these with YOUR Supabase values (see setup guide below)
const SUPABASE_URL = "https://YOUR_PROJECT.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttbGZrdnlkaW90bmttdGthYWZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTQwOTAsImV4cCI6MjA4ODg5MDA5MH0.qcujyvv2gUaBIcEpFx20VJR-BxepJE4P8shgMrE2G0c";

async function supaFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: options.prefer || "return=representation",
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const ADMIN_PASSWORD = "qci35rd7";

const EMOTIONS = [
  { id: "serein", label: "Serein", emoji: "😌", color: "#2B9E8E" },
  { id: "peu_tendu", label: "Un peu tendu", emoji: "😐", color: "#F2C94C" },
  { id: "stresse", label: "Stressé", emoji: "😰", color: "#F2994A" },
  { id: "anxieux", label: "Anxieux-Hypervigilant", emoji: "😱", color: "#EB5757" },
];

const EMOTION_SCORE = { serein: 1, peu_tendu: 2, stresse: 3, anxieux: 4 };

// ─── THEME COLORS (from logo) ────────────────────────────────────────────────
const colors = {
  teal: "#2B9E8E",
  gold: "#E8B84B",
  dark: "#1A1A2E",
  bg: "#FAFAF8",
  card: "#FFFFFF",
  text: "#2C2C2C",
  muted: "#888",
  border: "#E8E8E4",
};

// ─── LOGO ─────────────────────────────────────────────────────────────────────
function Logo({ size = 80 }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
      <img
        src="/logo.png"
        alt="The Dog Experience"
        style={{ width: size, height: size, objectFit: "contain" }}
        onError={(e) => { e.target.style.display = "none"; }}
      />
    </div>
  );
}

// ─── COUNTER ─────────────────────────────────────────────────────────────────
function Counter({ label, value, onChange }) {
  return (
    <div style={{
      background: colors.bg,
      border: `2px solid ${colors.border}`,
      borderRadius: 16,
      padding: "16px 20px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    }}>
      <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 600, color: colors.text, fontSize: 15 }}>
        {label}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          style={{
            width: 44, height: 44, borderRadius: "50%",
            background: colors.border, border: "none",
            fontSize: 22, cursor: "pointer", fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: colors.text,
          }}
        >−</button>
        <span style={{
          fontFamily: "'Nunito', sans-serif", fontWeight: 800,
          fontSize: 24, minWidth: 32, textAlign: "center", color: colors.dark
        }}>{value}</span>
        <button
          onClick={() => onChange(value + 1)}
          style={{
            width: 44, height: 44, borderRadius: "50%",
            background: colors.teal, border: "none",
            fontSize: 22, cursor: "pointer", fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff",
          }}
        >+</button>
      </div>
    </div>
  );
}

// ─── EMOTION PICKER ──────────────────────────────────────────────────────────
function EmotionPicker({ value, onChange, label }) {
  return (
    <div>
      <p style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, color: colors.text, marginBottom: 10, fontSize: 15 }}>
        {label}
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {EMOTIONS.map(e => (
          <button
            key={e.id}
            onClick={() => onChange(e.id)}
            style={{
              padding: "14px 10px",
              borderRadius: 14,
              border: `3px solid ${value === e.id ? e.color : colors.border}`,
              background: value === e.id ? e.color + "22" : colors.card,
              cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              transition: "all 0.18s",
            }}
          >
            <span style={{ fontSize: 28 }}>{e.emoji}</span>
            <span style={{
              fontFamily: "'Nunito', sans-serif", fontWeight: 700,
              fontSize: 12, color: value === e.id ? e.color : colors.muted,
              textAlign: "center", lineHeight: 1.2,
            }}>{e.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── PROGRESS CHART ──────────────────────────────────────────────────────────
function ProgressChart({ entries, title = "Progression sur 90 jours" }) {
  const data = entries
    .slice(-90)
    .map(e => ({
      date: new Date(e.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
      "État (maison)": EMOTION_SCORE[e.emotion_home] || null,
      "État (extérieur)": e.no_walk ? null : (EMOTION_SCORE[e.emotion_outside] || null),
      "Déclenchements": e.triggers,
      "Aboiements": e.barks,
      "Stimuli": e.stimuli,
    }));

  if (data.length === 0) {
    return (
      <div style={{ textAlign: "center", color: colors.muted, padding: 40, fontFamily: "'Nunito', sans-serif" }}>
        Aucune donnée pour le moment 📊
      </div>
    );
  }

  return (
    <div style={{ background: colors.card, borderRadius: 20, padding: 20, border: `1px solid ${colors.border}` }}>
      <p style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, color: colors.dark, marginBottom: 16, fontSize: 15 }}>
        📈 {title}
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ left: -20, right: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
          <XAxis dataKey="date" tick={{ fontSize: 10, fontFamily: "'Nunito', sans-serif" }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 10, fontFamily: "'Nunito', sans-serif" }} />
          <Tooltip contentStyle={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, borderRadius: 10 }} />
          <Legend wrapperStyle={{ fontSize: 11, fontFamily: "'Nunito', sans-serif" }} />
          <Line type="monotone" dataKey="État (maison)" stroke={colors.teal} strokeWidth={2} dot={false} connectNulls />
          <Line type="monotone" dataKey="État (extérieur)" stroke={colors.gold} strokeWidth={2} dot={false} connectNulls />
          <Line type="monotone" dataKey="Déclenchements" stroke="#EB5757" strokeWidth={1.5} dot={false} />
          <Line type="monotone" dataKey="Aboiements" stroke="#9B59B6" strokeWidth={1.5} dot={false} />
          <Line type="monotone" dataKey="Stimuli" stroke="#3498DB" strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
      <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, color: colors.muted, marginTop: 8 }}>
        États : 1 = Serein → 4 = Anxieux
      </p>
    </div>
  );
}

// ─── CLIENT FORM ─────────────────────────────────────────────────────────────
function ClientView() {
  const [step, setStep] = useState("identify"); // identify | journal | chart
  const [humanName, setHumanName] = useState("");
  const [dogName, setDogName] = useState("");
  const [noWalk, setNoWalk] = useState(false);
  const [emotionHome, setEmotionHome] = useState("");
  const [emotionOutside, setEmotionOutside] = useState("");
  const [stimuli, setStimuli] = useState(0);
  const [triggers, setTriggers] = useState(0);
  const [barks, setBarks] = useState(0);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [myEntries, setMyEntries] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const handleIdentify = async () => {
    if (!humanName.trim() || !dogName.trim()) {
      setError("Merci de renseigner votre prénom et le nom de votre chien.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const data = await supaFetch(
        `/journal_entries?human_name=ilike.${encodeURIComponent(humanName.trim())}&dog_name=ilike.${encodeURIComponent(dogName.trim())}&order=date.asc`
      );
      setMyEntries(data);
      setStep("journal");
    } catch (e) {
      setError("Erreur de connexion. Vérifiez votre connexion internet.");
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!emotionHome) { setError("Choisissez un état émotionnel à la maison."); return; }
    if (!noWalk && !emotionOutside) { setError("Choisissez un état émotionnel en extérieur."); return; }
    setError("");
    setLoading(true);
    try {
      const payload = {
        human_name: humanName.trim(),
        dog_name: dogName.trim(),
        date: today,
        emotion_home: emotionHome,
        emotion_outside: noWalk ? null : emotionOutside,
        no_walk: noWalk,
        stimuli, triggers, barks,
        notes: notes.trim(),
      };
      await supaFetch("/journal_entries", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const updated = await supaFetch(
        `/journal_entries?human_name=ilike.${encodeURIComponent(humanName.trim())}&dog_name=ilike.${encodeURIComponent(dogName.trim())}&order=date.asc`
      );
      setMyEntries(updated);
      setSuccess(true);
      setStep("chart");
    } catch (e) {
      setError("Erreur lors de l'enregistrement : " + e.message);
    }
    setLoading(false);
  };

  const todayEntry = myEntries.find(e => e.date === today);

  if (step === "identify") {
    return (
      <div style={styles.card}>
        <Logo />
        <h1 style={styles.h1}>Mon Journal de Bord</h1>
        <p style={styles.subtitle}>Suivi quotidien · The Dog Experience</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 24 }}>
          <input
            style={styles.input}
            placeholder="Votre prénom 👤"
            value={humanName}
            onChange={e => setHumanName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleIdentify()}
          />
          <input
            style={styles.input}
            placeholder="Nom de votre chien 🐕"
            value={dogName}
            onChange={e => setDogName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleIdentify()}
          />
          {error && <p style={styles.error}>{error}</p>}
          <button style={styles.btnPrimary} onClick={handleIdentify} disabled={loading}>
            {loading ? "Chargement..." : "Commencer →"}
          </button>
        </div>
      </div>
    );
  }

  if (step === "chart") {
    return (
      <div style={styles.card}>
        <Logo size={56} />
        {success && (
          <div style={{ background: colors.teal + "22", border: `2px solid ${colors.teal}`, borderRadius: 14, padding: 16, textAlign: "center", marginBottom: 20 }}>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, color: colors.teal, fontSize: 16 }}>
              ✅ Entrée enregistrée avec succès !
            </p>
          </div>
        )}
        <h2 style={{ ...styles.h2, marginBottom: 16 }}>Bonjour, {humanName} 👋</h2>
        <p style={{ ...styles.subtitle, marginBottom: 20 }}>Progression de {dogName}</p>
        <ProgressChart entries={myEntries} title={`Progression de ${dogName} · 90 jours`} />
        <button style={{ ...styles.btnSecondary, marginTop: 20 }} onClick={() => { setStep("journal"); setSuccess(false); }}>
          ← Nouvelle saisie
        </button>
      </div>
    );
  }

  // Journal form
  return (
    <div style={styles.card}>
      <Logo size={56} />
      <h2 style={styles.h2}>Bonjour, {humanName} ! 🐾</h2>
      <p style={styles.subtitle}>
        Journal de <strong>{dogName}</strong> · {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
      </p>

      {todayEntry && (
        <div style={{ background: colors.gold + "22", border: `2px solid ${colors.gold}`, borderRadius: 14, padding: 14, marginBottom: 16 }}>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, color: "#B8860B", fontSize: 14, margin: 0 }}>
            ⚠️ Vous avez déjà saisi une entrée aujourd'hui. Elle sera remplacée.
          </p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <EmotionPicker label="😌 État émotionnel à la maison" value={emotionHome} onChange={setEmotionHome} />

        <label style={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={noWalk}
            onChange={e => setNoWalk(e.target.checked)}
            style={{ width: 20, height: 20, accentColor: colors.teal }}
          />
          <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 600, fontSize: 15, color: colors.text }}>
            🏡 Mise au vert — Pas de balade aujourd'hui
          </span>
        </label>

        {!noWalk && (
          <EmotionPicker label="🌳 État émotionnel en extérieur" value={emotionOutside} onChange={setEmotionOutside} />
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, color: colors.text, fontSize: 15, margin: 0 }}>
            🔢 Compteurs
          </p>
          <Counter label="👀 Stimuli croisés" value={stimuli} onChange={setStimuli} />
          <Counter label="⚡ Déclenchements" value={triggers} onChange={setTriggers} />
          <Counter label="🗣️ Aboiements" value={barks} onChange={setBarks} />
        </div>

        <div>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, color: colors.text, fontSize: 15, marginBottom: 8 }}>
            📝 Notes du jour
          </p>
          <textarea
            style={{ ...styles.input, minHeight: 100, resize: "vertical" }}
            placeholder="Comment s'est passée la journée ? Des observations particulières ?"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <button style={styles.btnPrimary} onClick={handleSubmit} disabled={loading}>
          {loading ? "Enregistrement..." : "✅ Enregistrer la journée"}
        </button>

        {myEntries.length > 0 && (
          <button style={styles.btnSecondary} onClick={() => setStep("chart")}>
            📈 Voir ma progression
          </button>
        )}

        <button style={{ ...styles.btnSecondary, background: "transparent", border: "none", color: colors.muted, fontSize: 13 }}
          onClick={() => setStep("identify")}>
          ← Changer de compte
        </button>
      </div>
    </div>
  );
}

// ─── ADMIN VIEW ───────────────────────────────────────────────────────────────
function AdminView({ onLogout }) {
  const [dogs, setDogs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [dogEntries, setDogEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDogs();
  }, []);

  async function loadDogs() {
    setLoading(true);
    try {
      const data = await supaFetch("/journal_entries?select=human_name,dog_name&order=dog_name.asc");
      const unique = {};
      data.forEach(e => {
        const key = `${e.human_name}|||${e.dog_name}`;
        if (!unique[key]) unique[key] = { human_name: e.human_name, dog_name: e.dog_name };
      });
      setDogs(Object.values(unique));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  async function selectDog(human, dog) {
    setSelected({ human, dog });
    const data = await supaFetch(
      `/journal_entries?human_name=ilike.${encodeURIComponent(human)}&dog_name=ilike.${encodeURIComponent(dog)}&order=date.desc`
    );
    setDogEntries(data);
  }

  const emotionLabel = (id) => EMOTIONS.find(e => e.id === id)?.label || "—";
  const emotionEmoji = (id) => EMOTIONS.find(e => e.id === id)?.emoji || "";

  return (
    <div style={styles.card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Logo size={48} />
          <div>
            <h2 style={{ ...styles.h2, margin: 0 }}>Espace Admin</h2>
            <p style={{ fontFamily: "'Nunito', sans-serif", color: colors.muted, fontSize: 13, margin: 0 }}>The Dog Experience</p>
          </div>
        </div>
        <button onClick={onLogout} style={{ ...styles.btnSecondary, padding: "8px 16px", fontSize: 13 }}>
          Déconnexion
        </button>
      </div>

      {!selected ? (
        <>
          <h3 style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, color: colors.dark, fontSize: 16, marginBottom: 14 }}>
            🐕 Mes clients ({dogs.length})
          </h3>
          {loading ? (
            <p style={{ fontFamily: "'Nunito', sans-serif", color: colors.muted, textAlign: "center", padding: 40 }}>Chargement...</p>
          ) : dogs.length === 0 ? (
            <p style={{ fontFamily: "'Nunito', sans-serif", color: colors.muted, textAlign: "center", padding: 40 }}>Aucun client pour le moment.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {dogs.map(({ human_name, dog_name }) => (
                <button
                  key={`${human_name}|||${dog_name}`}
                  onClick={() => selectDog(human_name, dog_name)}
                  style={{
                    background: colors.bg, border: `2px solid ${colors.border}`,
                    borderRadius: 14, padding: "16px 18px",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    cursor: "pointer", transition: "all 0.15s",
                    fontFamily: "'Nunito', sans-serif",
                  }}
                >
                  <div style={{ textAlign: "left" }}>
                    <p style={{ fontWeight: 800, color: colors.dark, fontSize: 16, margin: 0 }}>🐾 {dog_name}</p>
                    <p style={{ fontWeight: 500, color: colors.muted, fontSize: 13, margin: 0 }}>{human_name}</p>
                  </div>
                  <span style={{ color: colors.teal, fontSize: 20 }}>→</span>
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <button onClick={() => setSelected(null)} style={{ ...styles.btnSecondary, marginBottom: 20 }}>
            ← Retour à la liste
          </button>
          <h3 style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, color: colors.dark, fontSize: 18, marginBottom: 4 }}>
            🐾 {selected.dog}
          </h3>
          <p style={{ fontFamily: "'Nunito', sans-serif", color: colors.muted, fontSize: 14, marginBottom: 20 }}>
            Humain : {selected.human} · {dogEntries.length} entrées
          </p>

          <ProgressChart entries={[...dogEntries].reverse()} title={`Évolution de ${selected.dog}`} />

          <h4 style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, color: colors.dark, fontSize: 15, marginTop: 24, marginBottom: 12 }}>
            📋 Historique des notes
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {dogEntries.map(e => (
              <div key={e.id} style={{
                background: colors.bg, border: `1px solid ${colors.border}`,
                borderRadius: 14, padding: 16,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, color: colors.dark, fontSize: 14 }}>
                    {new Date(e.date).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "long" })}
                  </span>
                  {e.no_walk && (
                    <span style={{ background: colors.gold + "33", color: "#B8860B", borderRadius: 8, padding: "2px 10px", fontSize: 12, fontFamily: "'Nunito', sans-serif", fontWeight: 700 }}>
                      🏡 Mise au vert
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                  <Chip label={`Maison: ${emotionEmoji(e.emotion_home)} ${emotionLabel(e.emotion_home)}`} color={colors.teal} />
                  {!e.no_walk && e.emotion_outside && (
                    <Chip label={`Extérieur: ${emotionEmoji(e.emotion_outside)} ${emotionLabel(e.emotion_outside)}`} color={colors.gold} />
                  )}
                  <Chip label={`👀 Stimuli: ${e.stimuli}`} color="#3498DB" />
                  <Chip label={`⚡ Décl.: ${e.triggers}`} color="#EB5757" />
                  <Chip label={`🗣️ Aboiem.: ${e.barks}`} color="#9B59B6" />
                </div>
                {e.notes && (
                  <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: colors.text, background: colors.card, borderRadius: 10, padding: "8px 12px", margin: 0, fontStyle: "italic" }}>
                    "{e.notes}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Chip({ label, color }) {
  return (
    <span style={{
      background: color + "18",
      color: color,
      border: `1px solid ${color}44`,
      borderRadius: 20,
      padding: "3px 10px",
      fontSize: 12,
      fontFamily: "'Nunito', sans-serif",
      fontWeight: 700,
    }}>{label}</span>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function AdminLogin({ onLogin }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");

  const handle = () => {
    if (pw === ADMIN_PASSWORD) onLogin();
    else setError("Mot de passe incorrect.");
  };

  return (
    <div style={styles.card}>
      <Logo />
      <h2 style={styles.h2}>Accès Administrateur</h2>
      <p style={styles.subtitle}>Réservé au comportementaliste</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 24 }}>
        <input
          style={styles.input}
          type="password"
          placeholder="Mot de passe"
          value={pw}
          onChange={e => setPw(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handle()}
        />
        {error && <p style={styles.error}>{error}</p>}
        <button style={styles.btnPrimary} onClick={handle}>Entrer →</button>
      </div>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [mode, setMode] = useState("client"); // client | admin_login | admin
  const [adminAuth, setAdminAuth] = useState(false);

  const isConfigured = !SUPABASE_URL.includes("YOUR_PROJECT");

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(135deg, ${colors.teal}15 0%, ${colors.gold}15 100%)`,
      padding: "20px 0 60px",
      fontFamily: "'Nunito', sans-serif",
    }}>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${colors.bg}; }
      `}</style>

      {/* Top nav */}
      <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 24, padding: "0 20px" }}>
        <button
          onClick={() => setMode("client")}
          style={{
            ...styles.navBtn,
            background: mode === "client" ? colors.teal : colors.card,
            color: mode === "client" ? "#fff" : colors.muted,
            border: `2px solid ${mode === "client" ? colors.teal : colors.border}`,
          }}
        >
          🐾 Mon Journal
        </button>
        <button
          onClick={() => mode === "admin" ? setMode("client") : setMode("admin_login")}
          style={{
            ...styles.navBtn,
            background: mode === "admin" ? colors.dark : colors.card,
            color: mode === "admin" ? "#fff" : colors.muted,
            border: `2px solid ${mode === "admin" ? colors.dark : colors.border}`,
          }}
        >
          🔒 Admin
        </button>
      </div>

      {/* Config warning */}
      {!isConfigured && (
        <div style={{ maxWidth: 480, margin: "0 auto 20px", padding: "0 20px" }}>
          <div style={{
            background: "#FFF3CD", border: "2px solid #F2C94C",
            borderRadius: 14, padding: 16,
          }}>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, color: "#856404", fontSize: 14 }}>
              ⚠️ Configuration requise — Voir le guide de déploiement pour connecter Supabase.
            </p>
          </div>
        </div>
      )}

      {/* Views */}
      {mode === "client" && <ClientView />}
      {mode === "admin_login" && !adminAuth && (
        <AdminLogin onLogin={() => { setAdminAuth(true); setMode("admin"); }} />
      )}
      {mode === "admin" && adminAuth && (
        <AdminView onLogout={() => { setAdminAuth(false); setMode("client"); }} />
      )}
    </div>
  );
}

// ─── SHARED STYLES ────────────────────────────────────────────────────────────
const styles = {
  card: {
    maxWidth: 480,
    margin: "0 auto",
    background: colors.card,
    borderRadius: 24,
    padding: "28px 24px",
    boxShadow: "0 4px 40px rgba(0,0,0,0.08)",
    marginLeft: "auto",
    marginRight: "auto",
    marginTop: 0,
    width: "calc(100% - 40px)",
  },
  h1: {
    fontFamily: "'Nunito', sans-serif",
    fontWeight: 900,
    fontSize: 26,
    color: colors.dark,
    textAlign: "center",
    marginBottom: 4,
  },
  h2: {
    fontFamily: "'Nunito', sans-serif",
    fontWeight: 800,
    fontSize: 22,
    color: colors.dark,
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: "'Nunito', sans-serif",
    fontWeight: 500,
    fontSize: 14,
    color: colors.muted,
    textAlign: "center",
    marginBottom: 0,
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 14,
    border: `2px solid ${colors.border}`,
    fontFamily: "'Nunito', sans-serif",
    fontSize: 15,
    color: colors.text,
    outline: "none",
    background: colors.bg,
    transition: "border-color 0.15s",
  },
  btnPrimary: {
    width: "100%",
    padding: "16px",
    borderRadius: 14,
    background: colors.teal,
    color: "#fff",
    border: "none",
    fontFamily: "'Nunito', sans-serif",
    fontWeight: 800,
    fontSize: 16,
    cursor: "pointer",
    transition: "opacity 0.15s",
  },
  btnSecondary: {
    width: "100%",
    padding: "14px",
    borderRadius: 14,
    background: colors.bg,
    color: colors.dark,
    border: `2px solid ${colors.border}`,
    fontFamily: "'Nunito', sans-serif",
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
  },
  navBtn: {
    padding: "10px 20px",
    borderRadius: 50,
    fontFamily: "'Nunito', sans-serif",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    transition: "all 0.15s",
  },
  error: {
    fontFamily: "'Nunito', sans-serif",
    color: "#EB5757",
    fontSize: 13,
    fontWeight: 600,
    background: "#EB575718",
    borderRadius: 10,
    padding: "10px 14px",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "14px 16px",
    background: colors.bg,
    borderRadius: 14,
    border: `2px solid ${colors.border}`,
    cursor: "pointer",
  },
};
