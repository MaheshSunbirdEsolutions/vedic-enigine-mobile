/** North and South Indian kundli drawings (react-native-svg). Pure presentation. */
import { memo } from "react";
import { View } from "react-native";
import Svg, { G as SvgGroup, Path, Rect, Text as SvgText } from "react-native-svg";
import { SIGNS } from "@/domain/chart";
import { labelPositions, NORTH_LINES, NORTH_PLANET_ANCHOR, NORTH_SIGN_ANCHOR, SOUTH_CELL } from "@/domain/chartGeometry";
import { makeStyles, useTheme } from "@/theme";

export type KundliChartProps = {
  variant: "north" | "south";
  /** 0-based sign of the ascendant. */
  lagna: number;
  /** Labels per sign (index 0..11). */
  bySign: string[][];
  ascLabel: string;
  centreLabel?: string;
  /** Sign name shown in South Indian cells. */
  signLabel?: (sign: string) => string;
  testID?: string;
};

export const KundliChart = memo(function KundliChart(p: KundliChartProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.box} testID={p.testID}>
      <Svg viewBox="-2 -2 404 404" width="100%" height="100%">
        <Rect x={0} y={0} width={400} height={400} fill={colors.chartBg} stroke={colors.chartLine} strokeWidth={2} />
        {p.variant === "north" ? <North {...p} /> : <South {...p} />}
      </Svg>
    </View>
  );
});

function North({ lagna, bySign, ascLabel }: KundliChartProps) {
  const { colors, fonts } = useTheme();
  return (
    <>
      <Path d={NORTH_LINES} fill="none" stroke={colors.chartLine} strokeWidth={1.5} />
      <SvgText x={200} y={62} fontSize={11} fill={colors.accent} textAnchor="middle" fontFamily={fonts.bold}>{ascLabel}</SvgText>
      {NORTH_PLANET_ANCHOR.map((anchor, house) => {
        const sign = (lagna + house) % 12;
        const labels = bySign[sign] ?? [];
        const [sx, sy] = NORTH_SIGN_ANCHOR[house];
        return (
          <SvgGroup key={house}>
            <SvgText x={sx} y={sy} fontSize={11} fill={colors.chartLabel} textAnchor="middle">{String(sign + 1)}</SvgText>
            {labelPositions(anchor, labels.length).map(([x, y], k) => (
              <SvgText key={k} x={x} y={y + 4} fontSize={13} fontFamily={fonts.semibold} fill={colors.ink} textAnchor="middle">{labels[k]}</SvgText>
            ))}
          </SvgGroup>
        );
      })}
    </>
  );
}

function South({ lagna, bySign, ascLabel, centreLabel, signLabel }: KundliChartProps) {
  const { colors, fonts } = useTheme();
  return (
    <>
      {Object.entries(SOUTH_CELL).map(([sg, [c, r]]) => {
        const s = Number(sg), x = c * 100, y = r * 100, labels = bySign[s] ?? [];
        return (
          <SvgGroup key={s}>
            <Rect x={x} y={y} width={100} height={100} fill={s === lagna ? colors.accentSoft : "none"} stroke={colors.chartLine} />
            <SvgText x={x + 6} y={y + 14} fontSize={10.5} fill={colors.chartLabel}>{signLabel ? signLabel(SIGNS[s]) : SIGNS[s].slice(0, 3)}</SvgText>
            {s === lagna && <SvgText x={x + 94} y={y + 14} fontSize={10.5} fill={colors.accent} textAnchor="end" fontFamily={fonts.bold}>{ascLabel}</SvgText>}
            {labels.map((l, k) => (
              <SvgText key={k} x={x + 50 + (labels.length > 1 ? (k % 2 ? 22 : -22) : 0)} y={y + 42 + Math.floor(k / 2) * 17}
                fontSize={13} fontFamily={fonts.semibold} fill={colors.ink} textAnchor="middle">{l}</SvgText>
            ))}
          </SvgGroup>
        );
      })}
      {centreLabel ? <SvgText x={200} y={204} fontSize={14} textAnchor="middle" fill={colors.muted}>{centreLabel}</SvgText> : null}
    </>
  );
}


const useStyles = makeStyles(() => ({
  box: { width: "100%", maxWidth: 420, aspectRatio: 1, alignSelf: "center" },
}));
