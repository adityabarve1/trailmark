import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { useTracker } from "../lib/tracker";
import { Link, useRouter } from "../lib/router";
import { PROVIDERS, providerInfo, testKey, type ProviderId } from "@trailmark/core";
import { loadKey, maskKey, removeKey, saveKey } from "../lib/ai/keyVault";
import type { RoadmapRow } from "@trailmark/core";
import { api } from "../lib/api";

function KeyRow({ userId, id }: { userId: string; id: ProviderId }) {
  const info = providerInfo(id);
  const [saved, setSaved] = useState<string | null>(null);
  const [value, setValue] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { loadKey(userId, id).then(setSaved); }, [userId, id]);
  return (
    <li className="key-row">
      <div className="key-head">
        <b>{info.name}</b>
        {saved ? <span className="tag tag-green">Saved · {maskKey(saved)}</span> : <span className="tag">Not set</span>}
      </div>
      <div className="row">
        <input type="password" autoComplete="off" spellCheck={false} placeholder={info.keyHint} value={value} onChange={(e) => setValue(e.target.value)} aria-label={`${info.name} API key`} />
        <button className="btn btn-primary btn-sm" disabled={!value.trim() || busy} onClick={async () => {
          setBusy(true); setMsg("Checking the key with the provider…");
          try { await testKey(id, value.trim(), info.defaultModel); await saveKey(userId, id, value.trim()); setSaved(value.trim()); setValue(""); setMsg("Key works and is saved on this device."); }
          catch (e) { setMsg((e as Error).message + " The key was not saved."); }
          finally { setBusy(false); }
        }}>Test and save</button>
        {saved && <button className="btn btn-ghost btn-sm" onClick={async () => { await removeKey(userId, id); setSaved(null); setMsg("Key removed from this device."); }}>Remove</button>}
      </div>
      <p className="muted small">{msg || <>Get a key at <a href={info.keyUrl} target="_blank" rel="noreferrer">{new URL(info.keyUrl).host}</a>.</>}</p>
    </li>
  );
}

export function Settings() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const { row, reload } = useTracker();
  const { go } = useRouter();
  const [name, setName] = useState(profile?.display_name ?? "");
  const [headline, setHeadline] = useState(profile?.headline ?? "");
  const [maps, setMaps] = useState<RoadmapRow[]>([]);
  const [msg, setMsg] = useState("");
  useEffect(() => { api.listRoadmaps().then(setMaps).catch(() => setMaps([])); }, [row?.id]);
  if (!user) return null;

  return (
    <div className="page">
      <h1>Settings</h1>

      <section className="card">
        <h2>Profile</h2>
        <div className="two-col">
          <div className="field"><label htmlFor="sn">Name</label><input id="sn" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="field"><label htmlFor="sh">Headline</label><input id="sh" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="e.g. Frontend developer, Pune" /></div>
        </div>
        <p className="muted small">Email: {user.email} · Time zone: {profile?.timezone}</p>
        <div className="row"><button className="btn btn-primary btn-sm" onClick={async () => { await api.updateProfile(user.id, { display_name: name, headline }); await refreshProfile(); setMsg("Profile saved."); }}>Save profile</button><span className="muted small" role="status">{msg}</span></div>
      </section>

      <section className="card">
        <h2>AI keys</h2>
        <p className="muted small">Used only by the roadmap builder. Keys are encrypted and stored on this device only. They go straight from this device to the provider and are never sent to Trailmark’s servers, so nobody running the app can read them. Add the key again on each device you use.</p>
        <ul className="key-list">{PROVIDERS.map((p) => <KeyRow key={p.id} userId={user.id} id={p.id} />)}</ul>
      </section>

      <section className="card">
        <div className="row between"><h2>Roadmaps</h2><Link to="/start" className="btn btn-sm btn-primary">New roadmap</Link></div>
        <ul className="map-list">
          {maps.map((m) => (
            <li key={m.id}>
              <div><b>{m.title}</b><p className="muted small">Created {new Date(m.created_at).toLocaleDateString()}</p></div>
              {m.id === profile?.active_roadmap_id ? <span className="tag tag-green">Active</span> : (
                <div className="row">
                  <button className="btn btn-sm" onClick={async () => { await api.updateProfile(user.id, { active_roadmap_id: m.id }); await refreshProfile(); await reload(); }}>Make active</button>
                  <button className="btn btn-sm btn-ghost" onClick={async () => { if (confirm(`Delete “${m.title}” and all its progress?`)) { await api.deleteRoadmap(m.id); setMaps((x) => x.filter((y) => y.id !== m.id)); } }}>Delete</button>
                </div>
              )}
            </li>
          ))}
        </ul>
        {row && <button className="btn btn-sm btn-outline" onClick={() => {
          const blob = new Blob([JSON.stringify(row.doc, null, 2)], { type: "application/json" });
          const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "roadmap.v1.json"; a.click(); URL.revokeObjectURL(a.href);
        }}>Download active roadmap document</button>}
      </section>

      <section className="card danger">
        <h2>Account</h2>
        <div className="row">
          <button className="btn" onClick={async () => { await signOut(); go("/login", true); }}>Sign out</button>
          <button className="btn btn-danger" onClick={async () => {
            if (!confirm("Delete your account and all your data? This can’t be undone.")) return;
            try { await api.deleteAccount(); go("/login", true); } catch (e) { alert((e as Error).message); }
          }}>Delete account</button>
        </div>
        <p className="muted small"><a href="/privacy.html">Privacy policy</a></p>
      </section>
    </div>
  );
}
