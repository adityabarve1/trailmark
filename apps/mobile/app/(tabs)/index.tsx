import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Link } from "expo-router";
import {
  addDays, canEditLog, dayOfMonth, dayPlan, diffDays, DOWS, fmtH, mondayIndex, nice, phaseColor, streak, studied,
  todayISO, weekIndexOf, weekStart,
} from "@trailmark/core";
import { useTracker } from "../../src/lib/tracker";
import { Banner, Button, Card, Check, H1, H2, Input, Ring, Row, Screen, T, Tag } from "../../src/components/ui";
import { font, radius, useTheme } from "../../src/theme";

/** Number input that keeps what you type (e.g. "2.") while saving the parsed value. */
function NumField({ label, value, onChange, editable, decimal, max }: { label: string; value?: number; onChange: (n: number | undefined) => void; editable: boolean; decimal?: boolean; max: number }) {
  const [txt, setTxt] = useState(value != null ? String(value) : "");
  return (
    <Input label={label} editable={editable} keyboardType={decimal ? "decimal-pad" : "number-pad"} value={txt} placeholder="0"
      onChangeText={(v) => {
        const clean = v.replace(",", ".");
        setTxt(clean);
        const n = decimal ? parseFloat(clean) : parseInt(clean, 10);
        onChange(clean === "" || Number.isNaN(n) ? undefined : Math.max(0, Math.min(max, decimal ? n : Math.round(n))));
      }} />
  );
}

export default function Today() {
  const th = useTheme();
  const { roadmap, weeks, logs, setLog, save } = useTracker();
  const t = todayISO();
  const [day, setDay] = useState(t);
  if (!roadmap) return null;

  const p = dayPlan(roadmap, weeks, day);
  const l = logs[day] ?? {};
  const editable = canEditLog(day, t);
  const color = p.row ? phaseColor(roadmap, p.row.phase) : th.accent;
  const slots = roadmap.schedule.slots;
  const done = slots.filter((s) => l.slots?.[s.id]).length;
  const wi = weekIndexOf(roadmap, day);
  const ws = wi < 0 || wi >= weeks.length ? addDays(day, -mondayIndex(day)) : weekStart(roadmap, wi);
  const y1 = addDays(t, -1), y2 = addDays(t, -2);
  const started = diffDays(roadmap.startDate, y1) >= 0;
  const warn = started && !studied(logs[y1]) && diffDays(roadmap.startDate, y2) >= 0 && !studied(logs[y2])
    ? "Two days missed in a row. Get back today, even with one short slot."
    : started && !studied(logs[y1]) ? "You missed yesterday. That’s fine — just don’t miss twice. You can still log yesterday today." : "";
  const s = streak(logs);
  const saveText = save.kind === "saving" ? "Saving…" : save.kind === "saved" ? "Saved" : save.kind === "error" ? `Not saved: ${save.message}` : "";

  return (
    <Screen>
      {!!warn && <Banner text={warn} />}
      <Row between style={{ alignItems: "center", flexWrap: "nowrap" }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ color, fontWeight: "700" }}>{p.row ? `Week ${(p.w ?? 0) + 1} of ${weeks.length}` : p.before ? `${p.daysUntil} days to go` : "Plan complete"}</Text>
          <H1>{day === t ? "Today" : nice(day)}</H1>
          <T muted small>{p.row ? p.row.month : p.before ? `Week 1 starts ${nice(roadmap.startDate)}` : "Plan what’s next."}</T>
        </View>
        <Ring pct={slots.length ? (done * 100) / slots.length : 0} color={color} value={`${done}/${slots.length}`} label="slots" size={96} />
      </Row>

      <View style={{ flexDirection: "row", gap: 5 }}>
        {Array.from({ length: 7 }, (_, i) => {
          const d = addDays(ws, i), lg = logs[d], sel = d === day, hit = studied(lg);
          return (
            <Pressable key={d} onPress={() => setDay(d)} accessibilityRole="button" accessibilityState={{ selected: sel }} accessibilityLabel={nice(d)}
              style={{ flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 14, borderWidth: sel ? 2 : 1,
                borderColor: sel ? color : th.line, backgroundColor: hit ? color + "26" : th.surface }}>
              <Text style={{ color: th.muted, fontSize: 11 }}>{DOWS[i]}</Text>
              <Text style={{ color: d === t ? color : th.ink, fontSize: 17, ...font.display }}>{dayOfMonth(d)}</Text>
              <Text style={{ color: th.muted, fontSize: 10 }}>{lg?.hours ? `${fmtH(lg.hours)}h` : "·"}</Text>
            </Pressable>
          );
        })}
      </View>
      <Row between>
        <Row>
          <Button small title="‹ Week" onPress={() => setDay(addDays(day, -7))} />
          <Button small title="Week ›" onPress={() => setDay(addDays(day, 7))} />
          {day !== t && <Button small title="Today" onPress={() => setDay(t)} />}
        </Row>
        <T muted small>{`Streak ${s} ${s === 1 ? "day" : "days"}`}</T>
      </Row>

      <Card accent={color}>
        {p.before && <><H2>Before your plan starts</H2><T muted>{`Week 1: ${weeks[0]?.days.join("; ")}.`}</T></>}
        {p.after && <H2>{`All ${weeks.length} weeks are done`}</H2>}
        {p.row && (
          <View style={{ gap: 12 }}>
            {p.buffer && <Tag text="Buffer week" color={th.amber} />}
            {slots.map((slot) => (
              <View key={slot.id} style={{ flexDirection: "row", gap: 12 }}>
                <Text style={{ width: 52, color, ...font.display }}>{slot.time || "—"}</Text>
                <View style={{ flex: 1, borderLeftWidth: 3, borderLeftColor: color, paddingLeft: 10, gap: 2 }}>
                  <T muted small>{`${slot.label} · ${slot.minutes} min`}</T>
                  <T bold>{(p.dow ?? 0) >= 5 ? p.weekend ?? "" : slot.kind === "practice" ? `${roadmap.practiceTrack.name}: ${p.practice}` : p.topic ?? ""}</T>
                  {!!slot.note && <T muted small>{slot.note}</T>}
                </View>
              </View>
            ))}
            {(p.dow ?? 0) >= 5 && !!roadmap.schedule.weekend && <T muted small>{roadmap.schedule.weekend}</T>}
            {p.dow === 6 && <Link href="/review"><Text style={{ color: th.accent, fontWeight: "600" }}>Do this week’s review →</Text></Link>}
          </View>
        )}
      </Card>

      <Card>
        <Row between><H2>{day === t ? "Log today" : `Log ${nice(day)}`}</H2>{!editable && <Tag text="Locked" />}</Row>
        {!editable && <T muted small>You can log today and yesterday. Older days are locked so your record stays honest.</T>}
        {slots.map((slot) => (
          <Check key={slot.id} color={color} disabled={!editable} checked={!!l.slots?.[slot.id]} label={`${slot.label} done`}
            onToggle={() => setLog(day, { slots: { ...(l.slots ?? {}), [slot.id]: !l.slots?.[slot.id] } })} />
        ))}
        {roadmap.schedule.habits.map((h) => (
          <Check key={h} color={color} disabled={!editable} checked={!!l.habits?.[h]} label={h}
            onToggle={() => setLog(day, { habits: { ...(l.habits ?? {}), [h]: !l.habits?.[h] } })} />
        ))}
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}><NumField key={"h" + day} label="Hours studied" editable={editable} decimal max={16} value={l.hours} onChange={(n) => setLog(day, { hours: n })} /></View>
          <View style={{ flex: 1 }}><NumField key={"p" + day} label={`${roadmap.practiceTrack.name} ${roadmap.practiceTrack.unit}`} editable={editable} max={50} value={l.practice} onChange={(n) => setLog(day, { practice: n })} /></View>
        </View>
        <Input label="Done" editable={editable} multiline value={l.done ?? ""} onChangeText={(v) => setLog(day, { done: v })} placeholder="What you finished" />
        <Input label="Stuck on" editable={editable} multiline value={l.stuck ?? ""} onChangeText={(v) => setLog(day, { stuck: v })} placeholder="What blocked you" />
        <Input label="Tomorrow" editable={editable} value={l.tomorrow ?? ""} onChangeText={(v) => setLog(day, { tomorrow: v })} placeholder="First thing to do tomorrow" />
        {!!saveText && <T muted small style={{ color: save.kind === "error" ? th.danger : th.muted }}>{saveText}</T>}
      </Card>
      <View style={{ height: 4, borderRadius: radius.s }} />
    </Screen>
  );
}
