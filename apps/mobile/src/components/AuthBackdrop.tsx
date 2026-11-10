import { useEffect, useRef } from "react";
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from "react-native";
import { useTheme } from "../theme";

const COLS = 9, ROWS = 16;

/** A field of day-cells that light up in a slow diagonal wave — one animation driver for all cells. */
export function AuthBackdrop() {
  const t = useTheme();
  const wave = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (reduce) return;
      loop = Animated.loop(Animated.timing(wave, { toValue: 1, duration: 7000, easing: Easing.linear, useNativeDriver: true }));
      loop.start();
    });
    return () => loop?.stop();
  }, [wave]);
  const cells = [];
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    const p = 0.08 + ((x + y) / (COLS + ROWS)) * 0.84;
    const opacity = wave.interpolate({ inputRange: [0, p - 0.07, p, p + 0.07, 1], outputRange: [0, 0, 0.75, 0, 0] });
    cells.push(
      <View key={`${x}-${y}`} style={[s.cell, { backgroundColor: t.track }]}>
        <Animated.View style={[StyleSheet.absoluteFill, { borderRadius: 5, backgroundColor: (x + y) % 3 ? t.accent : "#22C55E", opacity }]} />
      </View>,
    );
  }
  return <View pointerEvents="none" style={[StyleSheet.absoluteFill, s.field]}>{cells}</View>;
}

const s = StyleSheet.create({
  field: { flexDirection: "row", flexWrap: "wrap", gap: 7, padding: 7, transform: [{ rotate: "-8deg" }, { scale: 1.25 }], opacity: 0.9 },
  cell: { width: "9.6%", aspectRatio: 1, borderRadius: 5, overflow: "hidden" },
});
