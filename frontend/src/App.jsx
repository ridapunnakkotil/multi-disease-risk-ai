import { useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import "./App.css";

function App() {
  const [form, setForm] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const fields = [
    { name: "age", label: "Age", type: "number", placeholder: "Enter age" },

    {
      name: "sex",
      label: "Gender",
      type: "select",
      options: [
        ["", "Select gender"],
        [0, "Female"],
        [1, "Male"],
      ],
    },

    { name: "trestbps", label: "Blood Pressure", type: "number", placeholder: "mm Hg" },
    { name: "chol", label: "Cholesterol", type: "number", placeholder: "mg/dL" },
    { name: "glucose", label: "Glucose Level", type: "number", placeholder: "mg/dL" },
    { name: "bmi", label: "BMI", type: "number", placeholder: "e.g. 28.5" },
    { name: "hgb", label: "Hemoglobin", type: "number", placeholder: "g/dL" },
    { name: "rbc", label: "RBC Count", type: "number", placeholder: "million cells/mcL" },
    { name: "pcv", label: "PCV", type: "number", placeholder: "%" },
    { name: "creatinine", label: "Creatinine", type: "number", placeholder: "mg/dL" },

    {
      name: "fbs",
      label: "Fasting Blood Sugar",
      type: "select",
      options: [
        ["", "Select option"],
        [0, "No"],
        [1, "Yes"],
      ],
    },

    { name: "thalach", label: "Max Heart Rate", type: "number", placeholder: "bpm" },

    {
      name: "cp",
      label: "Chest Pain Type",
      type: "select",
      options: [
        ["", "Select chest pain"],
        [0, "Typical Angina"],
        [1, "Atypical Angina"],
        [2, "Non-anginal Pain"],
        [3, "Asymptomatic"],
      ],
    },

    {
      name: "restecg",
      label: "Resting ECG",
      type: "select",
      options: [
        ["", "Select ECG"],
        [0, "Normal"],
        [1, "ST-T Abnormality"],
        [2, "LV Hypertrophy"],
      ],
    },

    {
      name: "exang",
      label: "Exercise Angina",
      type: "select",
      options: [
        ["", "Select option"],
        [0, "No"],
        [1, "Yes"],
      ],
    },

    { name: "oldpeak", label: "Old Peak", type: "number", placeholder: "ST depression" },

    {
      name: "slope",
      label: "ST Slope",
      type: "select",
      options: [
        ["", "Select slope"],
        [0, "Upsloping"],
        [1, "Flat"],
        [2, "Downsloping"],
      ],
    },

    {
      name: "ca",
      label: "Major Vessels",
      type: "select",
      options: [
        ["", "Select vessels"],
        [0, "0 Vessels"],
        [1, "1 Vessel"],
        [2, "2 Vessels"],
        [3, "3 Vessels"],
        [4, "4 Vessels"],
      ],
    },

    {
      name: "thal",
      label: "Thalassemia",
      type: "select",
      options: [
        ["", "Select result"],
        [1, "Normal"],
        [2, "Fixed Defect"],
        [3, "Reversible Defect"],
      ],
    },
  ];

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const predict = async () => {
    if (!form.age || form.sex === "") {
      alert("Please fill Age and Gender.");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post("http://127.0.0.1:5000/predict", form);
      setResult(res.data);
    } catch {
      alert("Backend not connected. Make sure Flask is running.");
    } finally {
      setLoading(false);
    }
  };

  const chartData = result
    ? Object.entries(result.results).map(([name, data]) => ({
        name: name.toUpperCase(),
        risk: Number(data.risk_percent),
        level: data.risk_level,
      }))
    : [];

  const pieData = result
    ? [
        { name: "Health Score", value: result.health_score },
        { name: "Risk Gap", value: 100 - result.health_score },
      ]
    : [];

  const riskColor = (level) => {
    const value = level.toLowerCase();
    if (value === "high") return "#ef4444";
    if (value === "moderate") return "#f59e0b";
    return "#22c55e";
  };

  return (
    <main className="app">
      <header className="topbar">
        <div className="brand-block">
          <div className="brand-icon">✦</div>
          <div>
            <div className="brand">Multi-Disease Risk Intelligence System</div>
            <div className="brand-subtitle">
              AI-powered preventive health assessment
            </div>
          </div>
        </div>

        <div className="header-actions">
          <span className="status-dot"></span>
          <span>Live Model</span>
          <div className="dashboard-badge">Clinical AI Dashboard</div>
        </div>
      </header>

      <section className="dashboard">
        <section className="input-card">
          <div className="section-heading">
            <h2>Enter Your Health Parameters</h2>
            <p>Use medical values and dropdowns for clinical categories.</p>
          </div>

          <div className="form-grid">
            {fields.map((field) => (
              <label key={field.name}>
                <span>{field.label}</span>

                {field.type === "select" ? (
                  <select
                    name={field.name}
                    value={form[field.name] || ""}
                    onChange={handleChange}
                  >
                    {field.options.map(([value, label]) => (
                      <option key={`${field.name}-${value}`} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="number"
                    name={field.name}
                    value={form[field.name] || ""}
                    placeholder={field.placeholder}
                    onChange={handleChange}
                  />
                )}
              </label>
            ))}
          </div>

          <button className="predict-btn" onClick={predict} disabled={loading}>
            {loading ? "Analyzing..." : "Predict Risk"}
          </button>
        </section>

        <section className="output-card">
          <div className="section-heading">
            <h2>Health Risk Assessment Output</h2>
            <p>Model-generated multi-condition risk analysis.</p>
          </div>

          {!result && (
            <div className="empty-state">
              <strong>No assessment yet</strong>
              <p>Fill the form and click Predict Risk.</p>
            </div>
          )}

          {result && (
            <>
              <div className="risk-summary">
                {Object.entries(result.results).map(([disease, data]) => (
                  <div
                    className="risk-pill"
                    key={disease}
                    style={{ borderTopColor: riskColor(data.risk_level) }}
                  >
                    <h4>{disease.toUpperCase()}</h4>
                    <strong>{data.risk_percent}%</strong>
                    <span>{data.risk_level} Risk</span>
                  </div>
                ))}
              </div>

              <p className="model-note">
                * Some predictions, especially anemia, may require detailed lab
                data such as hemoglobin, RBC, and PCV for higher accuracy.
              </p>

              <div className="insight-grid">
                <div className="chart-panel">
                  <h3>Risk Distribution</h3>

                  <ResponsiveContainer width="100%" height={230}>
                    <BarChart data={chartData}>
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Bar dataKey="risk" radius={[10, 10, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={index} fill={riskColor(entry.level)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="score-panel">
                  <h3>Overall Health Score</h3>

                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        innerRadius={58}
                        outerRadius={84}
                        startAngle={90}
                        endAngle={-270}
                      >
                        <Cell fill="#0f766e" />
                        <Cell fill="#e5e7eb" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="score-number">{result.health_score}</div>

                  <p>
                    {result.health_score >= 70
                      ? "Low Overall Risk"
                      : result.health_score >= 40
                      ? "Moderate Overall Risk"
                      : "High Overall Risk"}
                  </p>
                </div>
              </div>

              <div className="bottom-grid">
                <div className="explain-panel">
                  <h3>Explanations</h3>
                  <ul>
                    <li>High cholesterol and blood pressure can increase heart risk.</li>
                    <li>Glucose and BMI indicators can influence diabetes risk.</li>
                    <li>Kidney risk is affected by pressure and creatinine markers.</li>
                    <li>
                      Anemia prediction is more accurate with hemoglobin, RBC,
                      and PCV values.
                    </li>
                  </ul>
                </div>

                <div className="recommend-panel">
                  <h3>Actionable Recommendations</h3>
                  <div>✓ Reduce sugar intake</div>
                  <div>✓ Exercise at least 30 minutes daily</div>
                  <div>✓ Monitor blood pressure regularly</div>
                  <div>✓ Consult a physician for high-risk output</div>
                </div>
              </div>
            </>
          )}
        </section>
      </section>
    </main>
  );
}

export default App;