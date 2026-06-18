"use client";

import { useEffect, useState, useCallback } from "react";

function Logo() {
  return (
    <svg viewBox="5750 -2679.9 12500 4447.2" role="img" aria-label="boko">
      <path fill="#111213" d="M7218.1-1163.5h-880.7v-1237.2c0-203.6-103-279.3-230-279.3H5750v1516.3l293.1,0.1H5750V302c0,809.2,657.3,1465.3,1468.1,1465.3s1468.1-656,1468.1-1465.3S8029-1163.5,7218.1-1163.5z M7218.2,1181.3c-486.5,0-880.8-393.6-880.8-879.3v-879.3h880.8c486.5,0,880.8,393.6,880.8,879.3C8099.1,787.5,7704.7,1181.3,7218.2,1181.3z" />
      <path fill="#111213" d="M11286.9,302c0-485.6-394.3-879.3-880.8-879.3c-486.5,0-880.9,393.6-880.9,879.3s394.3,879.3,880.9,879.3C10892.6,1181.1,11286.9,787.5,11286.9,302z M11874.2,302c0,809.3-657.3,1465.3-1468.1,1465.3S8938,1111.2,8938,302c0-809.3,657.3-1465.3,1468.1-1465.3C11216.9-1163.5,11874.2-507.3,11874.2,302z" />
      <path fill="#BFFC00" d="M13174.5,1181.1c-14.8,0-29.6-0.7-44.1-2.1l1927.5-1923.7l-415.3-414.4L12715.2,764.6c-1.4-14.5-2.1-29.2-2.1-44v-1884.1h-587.3V720.6c0,578.1,469.4,1046.7,1048.6,1046.7H15062v-586.2H13174.5L13174.5,1181.1z" />
      <path fill="#111213" d="M17662.7,302c0-485.6-394.3-879.3-880.8-879.3s-880.9,393.6-880.9,879.3s394.5,879.3,880.9,879.3C17268.4,1181.3,17662.7,787.5,17662.7,302z M18250,302c0,809.3-657.3,1465.3-1468.1,1465.3c-810.9,0-1468.1-656.1-1468.1-1465.3c0-809.3,657.3-1465.3,1468.1-1465.3C17592.7-1163.5,18250-507.3,18250,302z" />
    </svg>
  );
}
function Topbar() {
  return (<div className="topbar"><div className="brand"><div className="logo"><Logo /></div></div><span className="navlabel">Meta Auto-Post Scheduler</span></div>);
}

const emptyTopic = () => ({ title: "", keyword: "", context: "" });
const fmt = (iso) => { try { return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }); } catch (e) { return iso; } };

export default function Page() {
  const [status, setStatus] = useState(null);
  const [authed, setAuthed] = useState(null); // null=checking, true, false(needs pw)
  const [pw, setPw] = useState("");
  const [pwInput, setPwInput] = useState("");
  const [toast, setToast] = useState("");

  const [topics, setTopics] = useState([emptyTopic()]);
  const [perMonth, setPerMonth] = useState(8);
  const [platforms, setPlatforms] = useState([]);
  const [plan, setPlan] = useState(null);
  const [posts, setPosts] = useState([]);
  const [busy, setBusy] = useState(false);

  const showToast = useCallback((m) => { setToast(m); clearTimeout(window.__t); window.__t = setTimeout(() => setToast(""), 3200); }, []);

  const api = useCallback((path, opts = {}) => fetch(path, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(opts.headers || {}), ...(pw ? { "x-app-password": pw } : {}) },
  }), [pw]);

  const loadStatus = useCallback(async () => {
    try {
      const s = await (await fetch("/api/status")).json();
      setStatus(s);
      const def = [];
      if (s.meta && s.meta.facebook) def.push("facebook");
      if (s.meta && s.meta.instagram) def.push("instagram");
      setPlatforms(def);
    } catch (e) {}
  }, []);

  const loadPosts = useCallback(async () => {
    const res = await api("/api/posts");
    if (res.status === 401) { setAuthed(false); return; }
    const d = await res.json();
    setAuthed(true);
    setPosts(d.posts || []);
  }, [api]);

  useEffect(() => { loadStatus(); loadPosts(); /* eslint-disable-next-line */ }, []);
  useEffect(() => { if (pw) loadPosts(); /* eslint-disable-next-line */ }, [pw]);

  const setTopic = (i, k, v) => setTopics((t) => t.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  const togglePlatform = (p) => setPlatforms((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : cur.concat(p)));

  const generate = async () => {
    setBusy(true);
    try {
      const res = await api("/api/generate", { method: "POST", body: JSON.stringify({ topics, postsPerMonth: perMonth, platforms }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed");
      setPlan(d.plan);
      showToast(`Drafted ${d.plan.length} posts. Review &amp; schedule.`);
    } catch (e) { showToast(e.message || String(e)); } finally { setBusy(false); }
  };

  const scheduleAll = async () => {
    if (!plan) return;
    setBusy(true);
    try {
      const res = await api("/api/schedule", { method: "POST", body: JSON.stringify({ plan }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed");
      setPlan(null);
      await loadPosts();
      showToast(`Scheduled ${d.added} posts.`);
    } catch (e) { showToast(e.message || String(e)); } finally { setBusy(false); }
  };

  const delPost = async (id) => {
    await api("/api/posts?id=" + encodeURIComponent(id), { method: "DELETE" });
    await loadPosts();
  };

  // ---- password gate ----
  if (authed === false) {
    return (<>
      <Topbar />
      <div className="gate">
        <span className="badge">Meta Auto-Post</span>
        <h2>Enter password</h2>
        <p>This scheduler is password protected.</p>
        <input className="inp" type="password" value={pwInput} placeholder="Password" onChange={(e) => setPwInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") setPw(pwInput); }} />
        <div style={{ height: 10 }} />
        <button className="btn primary" style={{ width: "100%" }} onClick={() => setPw(pwInput)}>Unlock</button>
      </div>
    </>);
  }

  const fbOn = status && status.meta && status.meta.facebook;
  const igOn = status && status.meta && status.meta.instagram;

  return (<>
    <Topbar />
    <div className="wrap">
      <div className="panel">
        <div className="intro">
          <span className="badge">Meta Auto-Post</span>
          <div className="intro-top">
            <div>
              <h1>Schedule posts to Facebook &amp; Instagram</h1>
              <p>Add your topics (title, keyword, context), pick how many posts per month, and the app generates captions, creates an image per post, and auto-publishes on schedule.</p>
            </div>
            <div className="store-box">
              <div className="store-chip">
                <span className="dotg" style={{ background: (fbOn || igOn) ? "#BFFC00" : "#9aa1ad" }} />
                {fbOn || igOn ? [fbOn && "Facebook", igOn && "Instagram"].filter(Boolean).join(" + ") : "Not connected"}
              </div>
            </div>
          </div>
          <div className="chips">
            <span className={"chip " + (fbOn ? "on" : "")}>{fbOn ? "✓" : "✗"} Facebook</span>
            <span className={"chip " + (igOn ? "on" : "")}>{igOn ? "✓" : "✗"} Instagram</span>
            <span className={"chip " + (status && status.images ? "on" : "")}>{status && status.images ? "✓" : "✗"} Image API</span>
            <span className={"chip " + (status && status.kv ? "on" : "")}>{status && status.kv ? "✓" : "✗"} Storage</span>
          </div>
        </div>
        {status && (!status.kv || (!fbOn && !igOn) || !status.images) && (
          <div className="summary issues" style={{ marginBottom: 16 }}>⚠ <span>Some services aren&apos;t configured yet — see the README env vars. Scheduling works once Storage + at least one platform + Image API are set.</span></div>
        )}

        <h3 style={{ fontSize: 14, textTransform: "uppercase", letterSpacing: ".5px", margin: "18px 0 8px" }}>Topics</h3>
        <div className="rowset">
          {topics.map((t, i) => (
            <div className="topicrow" key={i}>
              {topics.length > 1 && <button className="xbtn" onClick={() => setTopics((x) => x.filter((_, j) => j !== i))}>×</button>}
              <label className="fld">Title</label>
              <input className="inp" value={t.title} onChange={(e) => setTopic(i, "title", e.target.value)} placeholder="e.g. 5 ways to style winter knits" />
              <div className="grid2">
                <div><label className="fld">Keyword(s)</label><input className="inp" value={t.keyword} onChange={(e) => setTopic(i, "keyword", e.target.value)} placeholder="winter, knitwear, fashion" /></div>
                <div><label className="fld">Context</label><input className="inp" value={t.context} onChange={(e) => setTopic(i, "context", e.target.value)} placeholder="short brief / angle" /></div>
              </div>
            </div>
          ))}
        </div>
        <button className="btn ghost sm" onClick={() => setTopics((t) => t.concat(emptyTopic()))}>+ Add topic</button>

        <div className="row" style={{ marginTop: 18 }}>
          <div>
            <label className="fld">Posts per month</label>
            <select className="inp" value={perMonth} onChange={(e) => setPerMonth(parseInt(e.target.value, 10))} style={{ width: 140 }}>
              {[4, 8, 12, 16, 20, 30].map((n) => <option key={n} value={n}>{n} / month</option>)}
            </select>
          </div>
          <div>
            <label className="fld">Publish to</label>
            <div className="row">
              <span className={"pf " + (platforms.includes("facebook") ? "sel" : "")} onClick={() => fbOn && togglePlatform("facebook")} style={{ opacity: fbOn ? 1 : .4 }}>{platforms.includes("facebook") ? "☑" : "☐"} Facebook</span>
              <span className={"pf " + (platforms.includes("instagram") ? "sel" : "")} onClick={() => igOn && togglePlatform("instagram")} style={{ opacity: igOn ? 1 : .4 }}>{platforms.includes("instagram") ? "☑" : "☐"} Instagram</span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <button className="btn primary" onClick={generate} disabled={busy || !platforms.length}>⚡ Generate schedule</button>
        </div>

        {plan && (
          <div style={{ marginTop: 20 }}>
            <div className="summary clean" style={{ marginBottom: 12 }}>✓ <span><b>{plan.length}</b> posts drafted across the next 30 days. Edit captions if needed, then schedule. Images are generated automatically when each post publishes.</span></div>
            {plan.map((p, i) => (
              <div className="card" key={p.id}>
                <div className="card-head"><div><p className="card-title">{p.title || "(untitled)"}</p><div className="card-handle">{fmt(p.scheduledAt)} · {(p.platforms || []).join(", ")}</div></div></div>
                <div className="field"><label>Caption</label><textarea className="desc" value={p.caption} onChange={(e) => setPlan((pl) => pl.map((x, j) => j === i ? { ...x, caption: e.target.value } : x))} /></div>
              </div>
            ))}
            <div className="row" style={{ marginTop: 12 }}>
              <button className="btn dark" onClick={scheduleAll} disabled={busy}>Schedule all {plan.length} ▸</button>
              <button className="btn ghost" onClick={() => setPlan(null)}>Cancel</button>
            </div>
          </div>
        )}

        <h3 style={{ fontSize: 14, textTransform: "uppercase", letterSpacing: ".5px", margin: "26px 0 8px" }}>Queue ({posts.length})</h3>
        {!posts.length && <div className="empty">No scheduled posts yet.</div>}
        {posts.map((p) => {
          const st = { scheduled: ["st-ready", "Scheduled"], published: ["st-imported", "Published ✓"], error: ["st-error", "Error"] }[p.status] || ["st-idle", p.status];
          return (
            <div className="card" key={p.id}>
              <div className="card-head">
                <div className="row">
                  {p.imageUrl && <img className="thumb" src={p.imageUrl} alt="" />}
                  <div><p className="card-title">{p.title || "(untitled)"}</p><div className="card-handle">{fmt(p.scheduledAt)} · {(p.platforms || []).join(", ")}</div></div>
                </div>
                <span className={"status-pill " + st[0]}>{st[1]}</span>
              </div>
              <div className="current" style={{ whiteSpace: "pre-wrap" }}>{p.caption}</div>
              {p.status === "error" && p.error && <div className="err">⚠ {p.error}</div>}
              <div className="card-actions"><button className="btn ghost sm" onClick={() => delPost(p.id)}>Delete</button></div>
            </div>
          );
        })}

        <div className="foot">Boko Digital · Strategize. Execute. Deliver. — posts publish automatically via the daily scheduler.</div>
      </div>
    </div>
    {toast && <div className="toast" dangerouslySetInnerHTML={{ __html: toast }} />}
  </>);
}
