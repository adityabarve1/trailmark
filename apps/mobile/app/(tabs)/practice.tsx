import { useState } from "react";
import { Alert, View } from "react-native";
import { diffDays, nice, todayISO, type PracticeItem } from "@trailmark/core";
import { useTracker } from "../../src/lib/tracker";
import { Banner, Button, Card, Chips, H1, H2, Input, Row, Seg, Screen, T } from "../../src/components/ui";
import { useTheme } from "../../src/theme";

const due = (it: PracticeItem, t = todayISO()) => (!it.r7 && diffDays(it.solved_on, t) >= 7 ? 7 : !it.r30 && diffDays(it.solved_on, t) >= 30 ? 30 : 0);
type St = "g" | "a" | "r";

export default function Practice() {
  const th = useTheme();
  const { roadmap, practice, addPractice, updatePractice, removePractice } = useTracker();
  const [name, setName] = useState("");
  const [pattern, setPattern] = useState("");
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium");
  const [status, setStatus] = useState<St>("a");
  const [date, setDate] = useState(todayISO());
  const [filter, setFilter] = useState<"all" | St>("all");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  if (!roadmap) return null;
  const pt = roadmap.practiceTrack;
  const pat = pattern || pt.patterns[0];
  const dueList = practice.filter((x) => due(x));
  const shown = practice.filter((x) => filter === "all" || x.status === filter);
  const dot = (s: St) => (s === "g" ? th.good : s === "a" ? th.amber : th.red);

  async function add() {
    if (!name.trim()) { setMsg("Type a name first."); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > todayISO()) { setMsg("Use a date like 2026-12-01, not in the future."); return; }
    setBusy(true);
    try { await addPractice({ name: name.trim(), pattern: pat, difficulty, status, solved_on: date }); setMsg(`Added “${name.trim()}”. It comes back for a re-solve in 7 days.`); setName(""); }
    catch (e) { setMsg((e as Error).message); }
    finally { setBusy(false); }
  }

  const Item = ({ it }: { it: PracticeItem }) => {
    const d = due(it);
    return (
      <View style={{ borderTopWidth: 1, borderTopColor: th.line, paddingTop: 10, gap: 6 }}>
        <Row style={{ flexWrap: "nowrap" }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: dot(it.status) }} />
          <T bold style={{ flex: 1 }}>{it.name}</T>
        </Row>
        <T muted small>{`${it.pattern}, ${it.difficulty}, ${nice(it.solved_on)}${it.r7 ? ", re-solved at 7 days" : ""}${it.r30 ? ", at 30 days" : ""}`}</T>
        <Row>
          {d > 0 && <Button small kind="accent" title={`Re-solved (${d}-day)`} onPress={() => updatePractice(it.id, d === 7 ? { r7: todayISO() } : { r30: todayISO() })} />}
          <Button small title="Confidence" onPress={() => updatePractice(it.id, { status: ({ r: "a", a: "g", g: "r" } as const)[it.status] })} />
          <Button small kind="ghost" title="Delete" onPress={() => Alert.alert(`Delete “${it.name}”?`, undefined, [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => void removePractice(it.id) }])} />
        </Row>
      </View>
    );
  };

  return (
    <Screen>
      <H1>{`${pt.name} log`}</H1>
      <Card>
        <Input label="Name" value={name} onChangeText={setName} placeholder="e.g. Two Sum" returnKeyType="done" />
        <T muted small>Pattern</T>
        <Chips value={pat} options={pt.patterns} onChange={setPattern} />
        <T muted small>Difficulty</T>
        <Seg value={difficulty} onChange={setDifficulty} options={[["Easy", "Easy"], ["Medium", "Medium"], ["Hard", "Hard"]]} />
        <T muted small>How did it go?</T>
        <Seg value={status} onChange={setStatus} options={[["g", "Solo", th.good], ["a", "Hint", th.amber], ["r", "Solution", th.red]]} />
        <Input label="Date" value={date} onChangeText={setDate} autoCapitalize="none" placeholder="YYYY-MM-DD" />
        <Button title="Add" kind="primary" onPress={add} busy={busy} />
        {!!msg && <Banner kind="ok" text={msg} />}
      </Card>
      <Card>
        <H2>{`Due for re-solving (${dueList.length})`}</H2>
        {dueList.length ? dueList.map((it) => <Item key={it.id} it={it} />) : <T muted>Nothing due. Items come back here 7 and 30 days after you log them.</T>}
      </Card>
      <Card>
        <Row between><H2>{`All (${practice.length})`}</H2></Row>
        <Seg value={filter} onChange={setFilter} options={[["all", "All"], ["g", "Green", th.good], ["a", "Amber", th.amber], ["r", "Red", th.red]]} />
        {shown.length ? shown.map((it) => <Item key={it.id} it={it} />) : <T muted>Nothing logged yet.</T>}
      </Card>
    </Screen>
  );
}
