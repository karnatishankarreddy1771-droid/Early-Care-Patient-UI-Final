import { useEffect, useRef, useState } from "react";
import "./App.css";

const seedPatients = [
  {
    id: "p1",
    patientCode: "ICU-04",
    name: "Arjun Rao",
    age: 58,
    gender: "Male",
    ward: "ICU",
    condition: "Post-operative monitoring",
    contact: "Family / Volunteer",
    baseline: {
      hr: 82,
      spo2: 96,
      sbp: 122,
      dbp: 78,
      rr: 18,
      temp: 36.8,
    },
    vital: {
      hr: 82,
      spo2: 96,
      sbp: 122,
      dbp: 78,
      rr: 18,
      temp: 36.8,
    },
    history: [],
  },
  {
    id: "p2",
    patientCode: "ICU-07",
    name: "Meena Sharma",
    age: 65,
    gender: "Female",
    ward: "ICU",
    condition: "Respiratory observation",
    contact: "Family / Volunteer",
    baseline: {
      hr: 88,
      spo2: 94,
      sbp: 116,
      dbp: 74,
      rr: 20,
      temp: 37.0,
    },
    vital: {
      hr: 106,
      spo2: 91,
      sbp: 104,
      dbp: 68,
      rr: 26,
      temp: 37.5,
    },
    history: [],
  },
  {
    id: "p3",
    patientCode: "MED-02",
    name: "Ravi Kumar",
    age: 44,
    gender: "Male",
    ward: "Medical",
    condition: "General observation",
    contact: "Family / Volunteer",
    baseline: {
      hr: 74,
      spo2: 98,
      sbp: 126,
      dbp: 80,
      rr: 16,
      temp: 36.7,
    },
    vital: {
      hr: 76,
      spo2: 98,
      sbp: 126,
      dbp: 80,
      rr: 16,
      temp: 36.7,
    },
    history: [],
  },
];

function load(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch (error) {
    void error;
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function scorePatient(p, prev) {
  const v = {
    hr: Number(p?.vital?.hr ?? 0),
    spo2: Number(p?.vital?.spo2 ?? 0),
    sbp: Number(p?.vital?.sbp ?? 0),
    dbp: Number(p?.vital?.dbp ?? 0),
    rr: Number(p?.vital?.rr ?? 0),
    temp: Number(p?.vital?.temp ?? 0),
  };

  const b = {
    hr: Number(p?.baseline?.hr ?? v.hr),
    spo2: Number(p?.baseline?.spo2 ?? v.spo2),
    sbp: Number(p?.baseline?.sbp ?? v.sbp),
    dbp: Number(p?.baseline?.dbp ?? v.dbp),
    rr: Number(p?.baseline?.rr ?? v.rr),
    temp: Number(p?.baseline?.temp ?? v.temp),
  };

  let score = 0;
  const reasons = [];

  const add = (amount, reason) => {
    score += amount;
    reasons.push(reason);
  };

  if (v.spo2 < 90) {
    add(32, `SpO2 ${v.spo2}% is severely low`);
  } else if (v.spo2 < 94) {
    add(20, `SpO2 ${v.spo2}% is below baseline`);
  } else if (v.spo2 < b.spo2 - 2) {
    add(
      10,
      `SpO2 is ${Math.round(b.spo2 - v.spo2)}% below baseline`
    );
  }

  if (v.hr > 120) {
    add(20, `Heart rate ${v.hr} bpm is high`);
  } else if (v.hr > 105) {
    add(12, `Heart rate ${v.hr} bpm is rising`);
  } else if (v.hr > b.hr + 15) {
    add(8, "Heart rate is above personal baseline");
  }

  if (v.rr > 28) {
    add(20, `Respiratory rate ${v.rr}/min is high`);
  } else if (v.rr > 22) {
    add(12, "Respiratory rate is elevated");
  }

  if (v.sbp < 90) {
    add(22, `Systolic BP ${v.sbp} mmHg is low`);
  } else if (v.sbp < 100) {
    add(12, "Systolic BP is low");
  }

  if (v.temp >= 39) {
    add(18, `Temperature ${v.temp.toFixed(1)}°C is high`);
  } else if (v.temp >= 38) {
    add(10, "Temperature is elevated");
  }

  if (
    v.hr > b.hr + 15 &&
    v.rr > b.rr + 5 &&
    v.spo2 < b.spo2 - 3
  ) {
    add(
      18,
      "HR ↑ + RR ↑ + SpO2 ↓ multi-vital pattern"
    );
  }

  if (prev) {
    if (v.spo2 < prev.spo2 - 2) {
      add(
        10,
        `SpO2 dropped ${prev.spo2} → ${v.spo2}%`
      );
    }

    if (v.hr > prev.hr + 12) {
      add(
        8,
        `Heart rate increased ${prev.hr} → ${v.hr} bpm`
      );
    }

    if (v.rr > prev.rr + 4) {
      add(
        8,
        `Respiratory rate increased ${prev.rr} → ${v.rr}/min`
      );
    }
  }

  score = Math.min(100, score);

  const level =
    score >= 80
      ? "CRITICAL"
      : score >= 65
        ? "HIGH"
        : score >= 50
          ? "MEDIUM"
          : "LOW";

  let trend = "Stable";

  if (prev) {
    const deteriorating =
      v.spo2 < prev.spo2 - 1 ||
      v.hr > prev.hr + 5 ||
      v.rr > prev.rr + 2;

    if (deteriorating) {
      trend = "Deteriorating";
    } else if (v.spo2 > prev.spo2 + 1) {
      trend = "Improving";
    }
  }

  return {
    score,
    level,
    reasons: reasons.slice(0, 5),
    trend,
  };
}

function beep() {
  try {
    const AudioCtx =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioCtx) return;

    const context = new AudioCtx();
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.frequency.value = 880;
    oscillator.type = "sine";

    gain.gain.value = 0.08;

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start();

    setTimeout(() => {
      oscillator.stop();
      context.close();
    }, 700);
  } catch (error) {
    // Audio may be blocked until user interaction.
    void error;
  }
}

function notify(title, body, enabled = true) {
  if (!enabled) return;

  beep();

  if (
    "Notification" in window &&
    Notification.permission === "granted"
  ) {
    new Notification(title, {
      body,
    });
  }

  fetch("http://127.0.0.1:5001/notify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      body: `${title}: ${body}`,
      channel: "sms",
    }),
  }).catch((error) => {
    void error;
  });
}

function normalizeVital(vital = {}) {
  return {
    hr: Number(vital.hr ?? 0),
    spo2: Number(vital.spo2 ?? 0),
    sbp: Number(vital.sbp ?? 0),
    dbp: Number(vital.dbp ?? 0),
    rr: Number(vital.rr ?? 0),
    temp: Number(vital.temp ?? 0),
  };
}

function normalizePatient(patient) {
  const vital = normalizeVital(patient?.vital);
  const baseline = normalizeVital(patient?.baseline ?? vital);
  const history = Array.isArray(patient?.history)
    ? patient.history
        .filter((item) => item && item.vital)
        .map((item) => ({
          ...item,
          vital: normalizeVital(item.vital),
        }))
    : [];

  return {
    ...patient,
    vital,
    baseline,
    history,
  };
}

export default function App() {
  const [session, setSession] = useState(() =>
    load("ec_session", null)
  );

  const [accounts, setAccounts] = useState(() =>
    load("ec_accounts", [
      {
        username: "doctor",
        password: "doctor123",
        role: "DOCTOR",
        name: "Dr. Ananya Reddy",
      },
      {
        username: "patient",
        password: "patient123",
        role: "PATIENT",
        name: "Arjun Rao",
        patientId: "p1",
      },
    ])
  );

  const [patients, setPatients] = useState(() => {
    const stored = load("ec_patients", seedPatients);
    return Array.isArray(stored)
      ? stored.map(normalizePatient)
      : seedPatients.map(normalizePatient);
  });

  const [alerts, setAlerts] = useState(() =>
    load("ec_alerts", [])
  );

  const [tab, setTab] = useState("overview");
  const [selected, setSelected] = useState(null);

  const [camera, setCamera] = useState(false);
  const [motion, setMotion] = useState(false);
  const motionRef = useRef(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const lastFrame = useRef(null);

  const [alertsEnabled, setAlertsEnabled] = useState(() => {
    const currentSession = load("ec_session", null);
    return currentSession
      ? load(
          `ec_alerts_enabled_${currentSession.username}`,
          true
        )
      : true;
  });
  const alertsEnabledRef = useRef(true);

  useEffect(() => {
    alertsEnabledRef.current = alertsEnabled;
  }, [alertsEnabled]);

  useEffect(() => {
    save("ec_accounts", accounts);
  }, [accounts]);

  useEffect(() => {
    save("ec_patients", patients);
  }, [patients]);

  useEffect(() => {
    save("ec_alerts", alerts);
  }, [alerts]);

  useEffect(() => {
    if (!session) return;

    const timer = setInterval(() => {
      setPatients((old) =>
        old.map((p) => {
          const safePatient = normalizePatient(p);
          const prev = {
            ...safePatient.vital,
          };

          const v = {
            ...safePatient.vital,
          };

          const drift =
            p.id === "p2"
              ? {
                  hr: 3,
                  spo2: -0.7,
                  rr: 1,
                  temp: 0.08,
                }
              : {
                  hr: (Math.random() - 0.5) * 8,
                  spo2: (Math.random() - 0.5) * 0.8,
                  rr: (Math.random() - 0.5) * 2,
                  temp: (Math.random() - 0.5) * 0.08,
                };

          v.hr = Math.round(
            Math.max(
              45,
              Math.min(160, v.hr + drift.hr)
            )
          );

          v.spo2 = Math.round(
            Math.max(
              75,
              Math.min(100, v.spo2 + drift.spo2)
            )
          );

          v.rr = Math.round(
            Math.max(
              8,
              Math.min(40, v.rr + drift.rr)
            )
          );

          v.temp = +(
            Math.max(
              35,
              Math.min(41, v.temp + drift.temp)
            )
          ).toFixed(1);

          v.sbp = Math.round(
            Math.max(
              70,
              Math.min(
                190,
                v.sbp + (Math.random() - 0.5) * 6
              )
            )
          );

          v.dbp = Math.round(
            Math.max(
              40,
              Math.min(
                120,
                v.dbp + (Math.random() - 0.5) * 4
              )
            )
          );

          const next = {
            ...safePatient,
            vital: v,
            history: [
              ...(safePatient.history || []).slice(-39),
              {
                ...v,
                time: new Date().toISOString(),
              },
            ],
          };

          const risk = scorePatient(next, prev);

          if (
            risk.score >= 50 &&
            (
              risk.level === "CRITICAL" ||
              Math.random() < 0.12
            )
          ) {
            setAlerts((currentAlerts) => {
              const recent = currentAlerts.find(
                (x) =>
                  x.patientId === p.id &&
                  Date.now() -
                    new Date(x.time).getTime() <
                    12000
              );

              if (recent) return currentAlerts;

              const alert = {
                id: crypto.randomUUID(),
                patientId: p.id,
                patientCode: p.patientCode,
                name: p.name,
                score: risk.score,
                level: risk.level,
                reasons: risk.reasons,
                time: new Date().toISOString(),
                status: "NEW",
              };

              notify(
                `Early Care: ${risk.level}`,
                `${p.patientCode} risk ${risk.score}/100. ${
                  risk.reasons[0] || "Risk increased"
                }`,
                alertsEnabledRef.current
              );

              return [
                alert,
                ...currentAlerts,
              ].slice(0, 80);
            });
          }

          return next;
        })
      );
    }, 3000);

    return () => clearInterval(timer);
  }, [session]);

  useEffect(() => {
    if (!camera) return;

    let cancelled = false;

    navigator.mediaDevices
      ?.getUserMedia({
        video: true,
        audio: true,
      })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) =>
            track.stop()
          );
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((error) => {
            void error;
          });
        }

        const canvas = canvasRef.current;
        const context = canvas?.getContext("2d");

        const loop = () => {
          if (
            cancelled ||
            !videoRef.current ||
            !context
          ) {
            return;
          }

          const video = videoRef.current;

          canvas.width = 160;
          canvas.height = 120;

          context.drawImage(
            video,
            0,
            0,
            160,
            120
          );

          const data = context.getImageData(
            0,
            0,
            160,
            120
          ).data;

          if (lastFrame.current) {
            let difference = 0;

            for (
              let i = 0;
              i < data.length;
              i += 16
            ) {
              difference += Math.abs(
                data[i] - lastFrame.current[i]
              );
            }

            difference /= data.length / 16;

            const active = difference > 18;

            if (active && !motionRef.current) {
              motionRef.current = true;
              setMotion(true);

              notify(
                "Early Care camera alert",
                "Significant room movement detected. Check bed/exit status.",
                alertsEnabledRef.current
              );

              setTimeout(() => {
                motionRef.current = false;
                setMotion(false);
              }, 5000);
            }
          }

          lastFrame.current = data;

          requestAnimationFrame(loop);
        };

        requestAnimationFrame(loop);
      })
      .catch((error) => {
        motionRef.current = false;
        void error;
      });

    return () => {
      cancelled = true;

      streamRef.current
        ?.getTracks()
        .forEach((track) => track.stop());

      streamRef.current = null;
      lastFrame.current = null;
    };
  }, [camera]);

  if (!session) {
    return (
      <Login
        accounts={accounts}
        setAccounts={setAccounts}
        setSession={setSession}
        setAlertsEnabled={setAlertsEnabled}
        alertsEnabledRef={alertsEnabledRef}
      />
    );
  }

  const visible = patients.filter(
    (p) =>
      session.role === "DOCTOR" ||
      p.id === session.patientId
  );

  const scored = visible
    .map((p) => ({
      ...p,
      risk: scorePatient(
        p,
        Array.isArray(p.history) && p.history.length >= 2
          ? p.history[p.history.length - 2]?.vital
          : null
      ),
    }))
    .sort(
      (a, b) =>
        b.risk.score - a.risk.score
    );

  const critical = scored.filter(
    (p) => p.risk.score >= 80
  ).length;

  const high = scored.filter(
    (p) =>
      p.risk.score >= 65 &&
      p.risk.score < 80
  ).length;

  const patient =
    session.role === "PATIENT"
      ? patients.find(
          (p) => p.id === session.patientId
        )
      : selected
        ? patients.find(
            (p) => p.id === selected
          )
        : scored[0];

  function logout() {
    localStorage.removeItem("ec_session");
    alertsEnabledRef.current = true;
    setAlertsEnabled(true);
    setSelected(null);
    setSession(null);
  }

  function addPatient(data) {
    const patientId = crypto.randomUUID();

    const newPatient = {
      id: patientId,
      patientCode: `WARD-${String(
        patients.length + 1
      ).padStart(2, "0")}`,
      ...data,
      baseline: {
        ...data.vital,
      },
      history: [],
    };

    setPatients((current) => [
      ...current,
      newPatient,
    ]);

    setAccounts((current) => [
      ...current,
      {
        username: data.username,
        password: data.password,
        role: "PATIENT",
        name: data.name,
        patientId,
      },
    ]);

    setSelected(patientId);
    setTab("patients");
  }

  function acknowledge(id) {
    setAlerts((current) =>
      current.map((alert) =>
        alert.id === id
          ? {
              ...alert,
              status: "ACKNOWLEDGED",
              ackBy: session.name,
              ackTime:
                new Date().toISOString(),
            }
          : alert
      )
    );
  }

  async function toggleAlerts() {
    const next = !alertsEnabled;

    if (
      next &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      try {
        await Notification.requestPermission();
      } catch (error) {
        // Permission request may be unavailable.
        void error;
      }
    }

    setAlertsEnabled(next);

    save(
      `ec_alerts_enabled_${session.username}`,
      next
    );
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="cross">+</div>

          <div>
            <b>EARLY CARE</b>
            <small>
              Clinical deterioration intelligence
            </small>
          </div>
        </div>

        <div className="role">
          {session.role === "DOCTOR"
            ? "DOCTOR PORTAL"
            : "PATIENT PORTAL"}
        </div>

        {session.role === "DOCTOR" ? (
          <Nav
            active={tab}
            set={setTab}
            items={[
              ["overview", "◈", "Command Center"],
              ["patients", "♙", "Patients"],
              ["alerts", "!", "Alert Queue"],
              ["camera", "◉", "Room Camera"],
              ["audit", "▤", "Audit Trail"],
            ]}
          />
        ) : (
          <Nav
            active={tab}
            set={setTab}
            items={[
              ["overview", "♥", "My Health"],
              ["alerts", "!", "My Alerts"],
              ["camera", "◉", "Room Safety"],
            ]}
          />
        )}

        <div className="sidebarBottom">
          <div>
            <span className="online"></span>
            System online
          </div>

          <div className="user">
            <b>{session.name}</b>
            <small>{session.role}</small>
          </div>

          <button onClick={logout}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="top">
          <div>
            <span className="crumb">
              HOSPITAL MONITORING /
            </span>

            <h1>
              {session.role === "DOCTOR"
                ? "Clinical Command Center"
                : "My Health Status"}
            </h1>
          </div>

          <div className="topRight">
            <button
              className={`notifyBtn ${
                alertsEnabled
                  ? "enabled"
                  : "disabled"
              }`}
              onClick={toggleAlerts}
            >
              {alertsEnabled
                ? "🔔 Alerts enabled"
                : "🔕 Alerts disabled"}
            </button>

            <span className="avatar">
              {session.name
                .split(" ")
                .map((x) => x[0])
                .slice(0, 2)
                .join("")}
            </span>

            <b>{session.name}</b>
          </div>
        </header>

        {tab === "overview" &&
          (session.role === "PATIENT" ? (
            <PatientOverview
              patient={patient}
              alerts={alerts
                .filter(
                  (a) =>
                    a.patientId ===
                    session.patientId
                )
                .slice(0, 5)}
              alertsEnabled={alertsEnabled}
            />
          ) : (
            <Overview
              scored={scored}
              critical={critical}
              high={high}
              alerts={alerts}
              session={session}
              onSelect={(p) =>
                setSelected(p.id)
              }
            />
          ))}

        {tab === "patients" &&
          session.role === "DOCTOR" && (
            <Patients
              scored={scored}
              onSelect={(p) =>
                setSelected(p.id)
              }
              onAdd={addPatient}
            />
          )}

        {tab === "alerts" && (
          <Alerts
            alerts={alerts.filter(
              (a) =>
                session.role === "DOCTOR" ||
                a.patientId ===
                  session.patientId
            )}
            acknowledge={acknowledge}
          />
        )}

        {tab === "camera" && (
          <Camera
            videoRef={videoRef}
            canvasRef={canvasRef}
            camera={camera}
            setCamera={setCamera}
            motion={motion}
          />
        )}

        {tab === "audit" &&
          session.role === "DOCTOR" && (
            <Audit alerts={alerts} />
          )}

        {selected &&
          session.role === "DOCTOR" &&
          patient && (
            <PatientModal
              p={patient}
              onClose={() =>
                setSelected(null)
              }
              session={session}
            />
          )}
      </main>
    </div>
  );
}

function Login({
  accounts,
  setAccounts,
  setSession,
  setAlertsEnabled,
  alertsEnabledRef,
}) {
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("DOCTOR");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  function submit(event) {
    event.preventDefault();
    setError("");

    if (mode === "signup") {
      if (
        accounts.some(
          (account) =>
            account.username === username
        )
      ) {
        setError(
          "Username already exists."
        );
        return;
      }

      if (password.length < 6) {
        setError(
          "Password must contain at least 6 characters."
        );
        return;
      }

      const account = {
        username,
        password,
        role,
        name: name || username,
      };

      setAccounts([
        ...accounts,
        account,
      ]);

      setAlertsEnabled(true);
      alertsEnabledRef.current = true;
      setSession(account);
      save("ec_session", account);

      return;
    }

    const account = accounts.find(
      (item) =>
        item.username === username &&
        item.password === password &&
        item.role === role
    );

    if (!account) {
      setError(
        "Invalid username, password, or role."
      );
      return;
    }

    const enabled = load(
      `ec_alerts_enabled_${account.username}`,
      true
    );

    setAlertsEnabled(enabled);
    alertsEnabledRef.current = enabled;
    setSession(account);
    save("ec_session", account);
  }

  return (
    <div className="loginPage">
      <div className="loginHero">
        <div className="brand big">
          <div className="cross">+</div>

          <div>
            <b>EARLY CARE</b>
            <small>
              Continuous deterioration monitoring
            </small>
          </div>
        </div>

        <h1>
          See the patient.
          <br />
          <em>See the trend.</em>
          <br />
          Act sooner.
        </h1>

        <p>
          Personalized baseline analysis,
          trend intelligence and alert
          prioritization for hospital teams.
        </p>

        <div className="featureLine">
          <span>●</span>
          Multi-vital deterioration engine
        </div>

        <div className="featureLine">
          <span>●</span>
          Smart alarm suppression
        </div>

        <div className="featureLine">
          <span>●</span>
          Explainable clinical alerts
        </div>
      </div>

      <div className="loginCard">
        <div className="switch">
          <button
            className={
              mode === "login"
                ? "active"
                : ""
            }
            onClick={() =>
              setMode("login")
            }
          >
            Sign in
          </button>

          <button
            className={
              mode === "signup"
                ? "active"
                : ""
            }
            onClick={() =>
              setMode("signup")
            }
          >
            Create account
          </button>
        </div>

        <h2>
          {mode === "login"
            ? "Welcome back"
            : "Create your Early Care account"}
        </h2>

        <p className="muted">
          Choose your secure portal
        </p>

        <div className="roleTabs">
          <button
            className={
              role === "DOCTOR"
                ? "sel"
                : ""
            }
            onClick={() =>
              setRole("DOCTOR")
            }
            type="button"
          >
            Doctor
          </button>

          <button
            className={
              role === "PATIENT"
                ? "sel"
                : ""
            }
            onClick={() =>
              setRole("PATIENT")
            }
            type="button"
          >
            Patient
          </button>
        </div>

        <form onSubmit={submit}>
          {mode === "signup" && (
            <label>
              Full name
              <input
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                required
              />
            </label>
          )}

          <label>
            Username
            <input
              value={username}
              onChange={(event) =>
                setUsername(
                  event.target.value
                )
              }
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              required
            />
          </label>

          {error && (
            <div className="formErr">
              {error}
            </div>
          )}

          <button
            className="primary"
            type="submit"
          >
            {mode === "login"
              ? "Sign in securely"
              : "Create account"}
          </button>
        </form>

        <div className="security">
          🔒 Demo-ready local
          authentication. Connect hospital
          SSO/JWT before production.
        </div>

        <p className="hint">
          Doctor account:{" "}
          <b>doctor / doctor123</b>
          <br />
          Patient account:{" "}
          <b>patient / patient123</b>
        </p>
      </div>
    </div>
  );
}

function Nav({
  items,
  active,
  set,
}) {
  return (
    <nav>
      {items.map(
        ([id, icon, label]) => (
          <button
            className={
              active === id
                ? "navActive"
                : ""
            }
            key={id}
            onClick={() => set(id)}
          >
            <span>{icon}</span>
            {label}
          </button>
        )
      )}
    </nav>
  );
}

function Overview({
  scored,
  critical,
  high,
  alerts,
  session,
  onSelect,
}) {
  return (
    <>
      <div className="kpis">
        <Kpi
          label="PATIENTS MONITORED"
          value={scored.length}
          sub="Live streams"
          icon="♙"
        />

        <Kpi
          label="CRITICAL"
          value={critical}
          sub="Immediate attention"
          icon="!"
          red
        />

        <Kpi
          label="HIGH RISK"
          value={high}
          sub="Review now"
          icon="↗"
          orange
        />

        <Kpi
          label="ACTIVE ALERTS"
          value={
            alerts.filter(
              (a) =>
                a.status !==
                "ACKNOWLEDGED"
            ).length
          }
          sub="Prioritized queue"
          icon="◉"
          blue
        />
      </div>

      <section className="grid2">
        <div className="panel">
          <Head
            title={
              session.role === "DOCTOR"
                ? "Alert Intelligence Queue"
                : "My current risk"
            }
            sub="Risk = baseline + trend + multi-vital interaction"
          />

          <div className="queue">
            {scored.map((p, index) => (
              <div
                className="queueRow"
                key={p.id}
                onClick={() =>
                  onSelect(p)
                }
              >
                <span
                  className={`rank ${
                    index < 2
                      ? "hot"
                      : ""
                  }`}
                >
                  {index + 1}
                </span>

                <div className="patientMini">
                  <b>
                    {p.patientCode} ·{" "}
                    {p.name}
                  </b>
                  <small>
                    {p.ward} ·{" "}
                    {p.risk.trend}
                  </small>
                </div>

                <div className="miniVitals">
                  <span>
                    ♥ {p.vital.hr}
                  </span>
                  <span>
                    O2 {p.vital.spo2}%
                  </span>
                  <span>
                    RR {p.vital.rr}
                  </span>
                </div>

                <Risk
                  score={p.risk.score}
                  level={p.risk.level}
                />

                <span className="arrow">
                  →
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <Head
            title="What changed?"
            sub="Latest clinically relevant movement"
          />

          <div className="changeList">
            {scored[0] && (
              <>
                <Change
                  label="SpO2"
                  value={`${scored[0].vital.spo2}%`}
                  trend={
                    scored[0].vital.spo2 <
                    scored[0].baseline.spo2
                      ? "↓"
                      : "→"
                  }
                />

                <Change
                  label="Heart rate"
                  value={`${scored[0].vital.hr} bpm`}
                  trend={
                    scored[0].vital.hr >
                    scored[0].baseline.hr
                      ? "↑"
                      : "→"
                  }
                />

                <Change
                  label="Respiratory rate"
                  value={`${scored[0].vital.rr}/min`}
                  trend={
                    scored[0].vital.rr >
                    scored[0].baseline.rr
                      ? "↑"
                      : "→"
                  }
                />

                <Change
                  label="Temperature"
                  value={`${scored[0].vital.temp} °C`}
                  trend="→"
                />
              </>
            )}
          </div>

          <div className="note">
            The engine suppresses a brief
            single-vital excursion when
            duration, trend and other
            vitals do not support
            deterioration.
          </div>
        </div>
      </section>
    </>
  );
}

function Sparkline({
  values,
  className = "",
}) {
  const safe = (values || []).filter(
    (value) => Number.isFinite(value)
  );

  if (safe.length < 2) {
    return (
      <div
        className={`sparkEmpty ${className}`}
      >
        Collecting live history…
      </div>
    );
  }

  const min = Math.min(...safe);
  const max = Math.max(...safe);
  const range = max - min || 1;

  const points = safe
    .map(
      (value, index) =>
        `${(index / (safe.length - 1)) * 100},${
          92 -
          ((value - min) / range) * 78
        }`
    )
    .join(" ");

  return (
    <svg
      className={`spark ${className}`}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-label="Live vital trend"
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PatientOverview({
  patient,
  alerts,
  alertsEnabled,
}) {
  if (!patient) {
    return (
      <div className="emptyState">
        <b>No patient profile linked</b>
        <span>
          Please ask a doctor to link
          your account to a patient
          record.
        </span>
      </div>
    );
  }

  const safePatient = normalizePatient(patient);
  const safeHistory = safePatient.history;
  const risk = scorePatient(
    safePatient,
    safeHistory.length >= 2
      ? safeHistory[safeHistory.length - 2].vital
      : null
  );

  const history = safeHistory.slice(-18);

  const delta = (
    value,
    baseline,
    unit = ""
  ) => {
    const difference =
      Number(value) - Number(baseline);

    if (
      Math.abs(difference) < 0.05
    ) {
      return "At baseline";
    }

    return `${
      difference > 0 ? "+" : ""
    }${Number(
      difference.toFixed(1)
    )}${unit}`;
  };

  const cards = [
    {
      key: "hr",
      label: "Heart Rate",
      value: safePatient.vital.hr,
      unit: "bpm",
      icon: "♥",
      tone: "red",
      baseline: safePatient.baseline.hr,
      series: history.map((item) => item?.vital?.hr).filter(Number.isFinite),
    },
    {
      key: "spo2",
      label: "Oxygen Saturation",
      value: safePatient.vital.spo2,
      unit: "%",
      icon: "O2",
      tone: "blue",
      baseline: safePatient.baseline.spo2,
      series: history.map((item) => item?.vital?.spo2).filter(Number.isFinite),
    },
    {
      key: "bp",
      label: "Blood Pressure",
      value: `${safePatient.vital.sbp}/${safePatient.vital.dbp}`,
      unit: "mmHg",
      icon: "◉",
      tone: "blue",
      baseline: `${safePatient.baseline.sbp}/${safePatient.baseline.dbp}`,
      series: history.map((item) => item?.vital?.sbp).filter(Number.isFinite),
    },
    {
      key: "rr",
      label: "Respiratory Rate",
      value: safePatient.vital.rr,
      unit: "/min",
      icon: "≈",
      tone: "purple",
      baseline: safePatient.baseline.rr,
      series: history.map((item) => item?.vital?.rr).filter(Number.isFinite),
    },
    {
      key: "temp",
      label: "Temperature",
      value: safePatient.vital.temp,
      unit: "°C",
      icon: "◌",
      tone: "orange",
      baseline: safePatient.baseline.temp,
      series: history.map((item) => item?.vital?.temp).filter(Number.isFinite),
    },
  ];

  return (
    <div className="patientDashboard">
      <section className="patientWelcome">
        <div className="welcomeText">
          <span className="livePill">
            <i></i>
            LIVE HEALTH MONITORING
          </span>

          <h2>
            Hello,{" "}
            {safePatient.name.split(" ")[0]} 👋
          </h2>

          <p>
            Your health information is
            being updated automatically.
            This view contains only your
            personal hospital record.
          </p>

          <div className="patientMeta">
            <span>
              {safePatient.patientCode}
            </span>
            <span>{safePatient.ward}</span>
            <span>
              {safePatient.condition}
            </span>
            <span>
              Updated{" "}
              {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>

        <div
          className={`healthStatus ${risk.level.toLowerCase()}`}
        >
          <small>
            CURRENT HEALTH STATUS
          </small>

          <strong>{risk.level}</strong>

          <b>
            {risk.score}
            <em>/100</em>
          </b>

          <span>{risk.trend}</span>
        </div>
      </section>

      <section className="patientSectionHead">
        <div>
          <h3>Live vital signs</h3>
          <p>
            Current readings from the
            monitoring stream
          </p>
        </div>

        <span className="refreshBadge">
          ● Updating every few seconds
        </span>
      </section>

      <section className="patientVitalsGrid">
        {cards.map((card) => (
          <div
            className={`patientVitalCard ${card.tone}`}
            key={card.key}
          >
            <div className="pvHead">
              <span className="pvIcon">
                {card.icon}
              </span>

              <span className="pvLabel">
                {card.label}
              </span>

              <span className="pvDot"></span>
            </div>

            <div className="pvValue">
              {card.value}
              <small>
                {card.unit}
              </small>
            </div>

            <div className="pvBase">
              Baseline: {card.baseline}
            </div>

            <Sparkline
              values={card.series}
            />
          </div>
        ))}

        <div className="patientVitalCard riskCard">
          <div className="pvHead">
            <span className="pvIcon">
              !
            </span>

            <span className="pvLabel">
              Early deterioration risk
            </span>

            <span className="pvDot"></span>
          </div>

          <div className="riskBig">
            {risk.score}
            <small>/100</small>
          </div>

          <div className="riskBar">
            <i
              style={{
                width: `${risk.score}%`,
              }}
            ></i>
          </div>

          <div className="riskCaption">
            {risk.level} · {risk.trend}
          </div>
        </div>
      </section>

      <section className="patientLowerGrid">
        <div className="patientPanel">
          <div className="patientPanelHead">
            <div>
              <h3>What changed?</h3>
              <p>
                Compared with your
                personal baseline
              </p>
            </div>

            <span className="insightBadge">
              PERSONALIZED
            </span>
          </div>

          <div className="whatChanged">
            {[
              [
                "SpO2",
                `${delta(
                  safePatient.vital.spo2,
                  safePatient.baseline.spo2,
                  "%"
                )}`,
                safePatient.vital.spo2 <
                safePatient.baseline.spo2
                  ? "down"
                  : "steady",
              ],
              [
                "Heart rate",
                `${delta(
                  safePatient.vital.hr,
                  safePatient.baseline.hr,
                  " bpm"
                )}`,
                safePatient.vital.hr >
                safePatient.baseline.hr
                  ? "up"
                  : "steady",
              ],
              [
                "Respiratory rate",
                `${delta(
                  safePatient.vital.rr,
                  safePatient.baseline.rr,
                  " /min"
                )}`,
                safePatient.vital.rr >
                safePatient.baseline.rr
                  ? "up"
                  : "steady",
              ],
              [
                "Temperature",
                `${delta(
                  safePatient.vital.temp,
                  safePatient.baseline.temp,
                  " °C"
                )}`,
                safePatient.vital.temp >
                safePatient.baseline.temp
                  ? "up"
                  : "steady",
              ],
            ].map(
              ([
                label,
                value,
                state,
              ]) => (
                <div key={label}>
                  <span>{label}</span>
                  <b>{value}</b>

                  <strong
                    className={state}
                  >
                    {state === "up"
                      ? "↑"
                      : state === "down"
                        ? "↓"
                        : "→"}
                  </strong>
                </div>
              )
            )}
          </div>

          <div className="patientSafetyNote">
            The system compares your
            current readings with your
            recent personal baseline
            rather than relying only on
            generic limits.
          </div>
        </div>

        <div className="patientPanel">
          <div className="patientPanelHead">
            <div>
              <h3>My alerts</h3>
              <p>
                Only alerts associated with
                your profile
              </p>
            </div>

            <span
              className={`alertState ${
                alertsEnabled
                  ? "on"
                  : "off"
              }`}
            >
              {alertsEnabled
                ? "NOTIFICATIONS ON"
                : "NOTIFICATIONS OFF"}
            </span>
          </div>

          {alerts.length ? (
            alerts.map((alert) => (
              <div
                className={`miniAlert ${alert.level.toLowerCase()}`}
                key={alert.id}
              >
                <div>
                  <b>
                    {alert.level} ·{" "}
                    {alert.score}/100
                  </b>

                  <span>
                    {alert.reasons?.[0] ||
                      "Risk changed"}
                  </span>
                </div>

                <time>
                  {new Date(
                    alert.time
                  ).toLocaleTimeString()}
                </time>
              </div>
            ))
          ) : (
            <div className="noAlerts">
              <span>✓</span>

              <b>No active alerts</b>

              <p>
                Your monitoring stream is
                active and no alert is
                currently assigned to your
                profile.
              </p>
            </div>
          )}
        </div>
      </section>

      <div className="patientDisclaimer">
        Clinical decision-support
        information only. For symptoms,
        discomfort, or an emergency,
        contact your nurse or doctor
        immediately.
      </div>
    </div>
  );
}

const Kpi = ({
  label,
  value,
  sub,
  icon,
  red,
  orange,
  blue,
}) => (
  <div
    className={`kpi ${
      red
        ? "red"
        : orange
          ? "orange"
          : blue
            ? "blue"
            : ""
    }`}
  >
    <span className="kpiIcon">
      {icon}
    </span>

    <div>
      <small>{label}</small>
      <b>{value}</b>
      <em>{sub}</em>
    </div>
  </div>
);

const Head = ({
  title,
  sub,
  children,
}) => (
  <div className="panelHead">
    <div>
      <h2>{title}</h2>
      <small>{sub}</small>
    </div>

    {children}
  </div>
);

const Change = ({
  label,
  value,
  trend,
}) => (
  <div className="change">
    <span>{label}</span>
    <b>{value}</b>
    <strong>{trend}</strong>
  </div>
);

function Risk({ score, level }) {
  return (
    <span
      className={`risk ${level.toLowerCase()}`}
    >
      <b>{score}</b> {level}
    </span>
  );
}

function Patients({
  scored,
  onSelect,
  onAdd,
}) {
  const [show, setShow] =
    useState(false);

  return (
    <>
      <div className="pageTitle">
        <div>
          <h2>Patient registry</h2>
          <p>
            Doctor-only access · current
            vitals and individualized risk
          </p>
        </div>

        <button
          className="primary small"
          onClick={() => setShow(true)}
        >
          + Add patient
        </button>
      </div>

      <div className="patientGrid">
        {scored.map((patient) => (
          <div
            className="patientCard"
            key={patient.id}
            onClick={() =>
              onSelect(patient)
            }
          >
            <div className="cardTop">
              <div className="avatar patient">
                {patient.name
                  .split(" ")
                  .map((x) => x[0])
                  .slice(0, 2)
                  .join("")}
              </div>

              <div>
                <b>{patient.name}</b>
                <small>
                  {patient.patientCode} ·{" "}
                  {patient.ward}
                </small>
              </div>
            </div>

            <Risk
              score={patient.risk.score}
              level={patient.risk.level}
            />

            <div className="vitalStrip">
              <Metric
                label="HR"
                value={patient.vital.hr}
                unit="bpm"
              />

              <Metric
                label="SpO2"
                value={patient.vital.spo2}
                unit="%"
              />

              <Metric
                label="BP"
                value={`${patient.vital.sbp}/${patient.vital.dbp}`}
                unit="mmHg"
              />

              <Metric
                label="RR"
                value={patient.vital.rr}
                unit="/min"
              />

              <Metric
                label="Temp"
                value={patient.vital.temp}
                unit="°C"
              />
            </div>

            <div className="trend">
              {patient.risk.trend ===
              "Deteriorating"
                ? "↘ Deteriorating"
                : patient.risk.trend ===
                    "Improving"
                  ? "↗ Improving"
                  : "→ Stable"}

              <span>
                Open profile →
              </span>
            </div>
          </div>
        ))}
      </div>

      {show && (
        <AddPatient
          onAdd={(patient) => {
            onAdd(patient);
            setShow(false);
          }}
          onClose={() =>
            setShow(false)
          }
        />
      )}
    </>
  );
}

const Metric = ({
  label,
  value,
  unit,
}) => (
  <div>
    <small>{label}</small>
    <b>{value}</b>
    <em>{unit}</em>
  </div>
);

function AddPatient({
  onAdd,
  onClose,
}) {
  const [form, setForm] = useState({
    name: "",
    age: 45,
    gender: "Female",
    ward: "ICU",
    condition: "Observation",
    username: "",
    password: "",
  });

  const setField = (key, value) => {
    setForm({
      ...form,
      [key]: value,
    });
  };

  function submit(event) {
    event.preventDefault();

    onAdd({
      ...form,
      vital: {
        hr: 80,
        spo2: 97,
        sbp: 120,
        dbp: 78,
        rr: 18,
        temp: 36.8,
      },
    });
  }

  return (
    <div className="modal">
      <form
        className="modalCard"
        onSubmit={submit}
      >
        <div className="modalHead">
          <h2>
            Register patient
          </h2>

          <button
            type="button"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="formGrid">
          {[
            "name",
            "age",
            "ward",
            "condition",
            "username",
            "password",
          ].map((key) => (
            <label key={key}>
              {key === "username"
                ? "Patient username"
                : key === "password"
                  ? "Temporary password"
                  : key.replace(
                      /^./,
                      (char) =>
                        char.toUpperCase()
                    )}

              <input
                type={
                  key === "password"
                    ? "password"
                    : "text"
                }
                value={form[key]}
                onChange={(event) =>
                  setField(
                    key,
                    event.target.value
                  )
                }
                required
              />
            </label>
          ))}

          <label>
            Gender

            <select
              value={form.gender}
              onChange={(event) =>
                setField(
                  "gender",
                  event.target.value
                )
              }
            >
              <option>
                Female
              </option>
              <option>Male</option>
              <option>
                Other
              </option>
            </select>
          </label>
        </div>

        <div className="modalActions">
          <button
            type="button"
            onClick={onClose}
          >
            Cancel
          </button>

          <button className="primary">
            Create patient + account
          </button>
        </div>
      </form>
    </div>
  );
}

function Alerts({
  alerts,
  acknowledge,
}) {
  return (
    <div className="panel">
      <Head
        title="Alert priority queue"
        sub="Alerts above risk 50 are surfaced and escalated"
      >
        <span className="badge">
          LIVE
        </span>
      </Head>

      <div className="alertsList">
        {alerts.map((alert) => (
          <div
            className={`alert ${alert.level.toLowerCase()}`}
            key={alert.id}
          >
            <div className="alertLevel">
              <b>{alert.level}</b>
              <strong>
                {alert.score}/100
              </strong>
            </div>

            <div>
              <b>
                {alert.patientCode} ·{" "}
                {alert.name}
              </b>

              <p>
                {alert.reasons.join(
                  " · "
                )}
              </p>

              <small>
                {new Date(
                  alert.time
                ).toLocaleTimeString()}{" "}
                · {alert.status}
              </small>
            </div>

            <button
              disabled={
                alert.status ===
                "ACKNOWLEDGED"
              }
              onClick={() =>
                acknowledge(alert.id)
              }
            >
              {alert.status ===
              "ACKNOWLEDGED"
                ? "Acknowledged"
                : "Acknowledge"}
            </button>
          </div>
        ))}

        {!alerts.length && (
          <div className="empty">
            No active alerts. The system
            is watching.
          </div>
        )}
      </div>
    </div>
  );
}

function Camera({
  videoRef,
  canvasRef,
  camera,
  setCamera,
  motion,
}) {
  return (
    <div className="cameraPage">
      <div className="pageTitle">
        <div>
          <h2>
            Room safety camera
          </h2>

          <p>
            Browser camera permission
            required · movement detection
            for demonstration and human
            review
          </p>
        </div>

        <button
          className="primary small"
          onClick={() =>
            setCamera(!camera)
          }
        >
          {camera
            ? "Stop camera"
            : "Start live camera"}
        </button>
      </div>

      <div className="cameraPanel">
        <div className="videoWrap">
          <video
            ref={videoRef}
            muted
            playsInline
          />

          <canvas
            ref={canvasRef}
            className="hiddenCanvas"
          />

          {!camera && (
            <div className="cameraOff">
              <span>◉</span>
              <b>Camera off</b>
              <span>
                Start camera to monitor
                movement.
              </span>
            </div>
          )}

          {motion && (
            <div className="motionAlert">
              ⚠ Significant movement
              detected — check bed /
              exit
            </div>
          )}
        </div>

        <div className="cameraCards">
          <div>
            <b>Bed / Exit</b>
            <span>
              {motion
                ? "REVIEW NOW"
                : "Watching"}
            </span>
          </div>

          <div>
            <b>Restlessness</b>
            <span>
              Motion index:{" "}
              {motion
                ? "High"
                : "Normal"}
            </span>
          </div>

          <div>
            <b>Pressure care</b>
            <span>
              Turn reminder requires
              staff confirmation
            </span>
          </div>

          <div>
            <b>
              Seizure / tremor
            </b>
            <span>
              Movement signal only; not
              a diagnosis
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Audit({ alerts }) {
  return (
    <div className="panel">
      <Head
        title="Audit trail"
        sub="Alert lifecycle: received → acknowledged → resolved"
      />

      <div className="audit">
        {alerts.map((alert) => (
          <div key={alert.id}>
            <b>
              {alert.patientCode}
            </b>

            <span>
              {alert.level} ·{" "}
              {alert.score}/100
            </span>

            <span>
              {new Date(
                alert.time
              ).toLocaleString()}
            </span>

            <span>{alert.status}</span>

            <span>
              {alert.ackBy || "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PatientModal({
  p,
  onClose,
}) {
  const safePatient = normalizePatient(p);
  const risk = scorePatient(
    safePatient,
    safePatient.history.length >= 2
      ? safePatient.history[safePatient.history.length - 2]?.vital
      : null
  );

  return (
    <div className="modal">
      <div className="modalCard wide">
        <div className="modalHead">
          <div>
            <h2>{safePatient.name}</h2>

            <small>
              {safePatient.patientCode} ·{" "}
              {safePatient.ward} · {safePatient.condition}
            </small>
          </div>

          <button onClick={onClose}>
            ×
          </button>
        </div>

        <div className="profileHero">
          <div>
            <small>
              EARLY DETERIORATION RISK
            </small>

            <b>
              {risk.score}
              <span>/100</span>
            </b>

            <Risk
              score={risk.score}
              level={risk.level}
            />
          </div>

          <div>
            <strong>
              {risk.trend}
            </strong>

            <p>
              Urgency indicator:{" "}
              {risk.score >= 80
                ? "Rapid review"
                : "Continue observation and reassess trend"}
            </p>
          </div>
        </div>

        <div className="vitalGrid">
          {Object.entries({
            HeartRate: `${safePatient.vital.hr} bpm`,
            SpO2: `${safePatient.vital.spo2}%`,
            BloodPressure: `${safePatient.vital.sbp}/${safePatient.vital.dbp} mmHg`,
            RespiratoryRate: `${safePatient.vital.rr}/min`,
            Temperature: `${safePatient.vital.temp} °C`,
          }).map(
            ([key, value]) => (
              <div key={key}>
                <small>{key}</small>
                <b>{value}</b>
              </div>
            )
          )}
        </div>

        <div className="reasonBox">
          <h3>
            Why this risk?
          </h3>

          {risk.reasons.length ? (
            risk.reasons.map(
              (reason, index) => (
                <p key={index}>
                  • {reason}
                </p>
              )
            )
          ) : (
            <p>
              • No significant
              deterioration signal.
            </p>
          )}
        </div>

        <div className="disclaimer">
          Clinical decision-support
          only. It does not diagnose,
          prescribe, or replace clinician
          judgment. Medication/treatment
          decisions must be made by
          qualified healthcare
          professionals.
        </div>
      </div>
    </div>
  );
}