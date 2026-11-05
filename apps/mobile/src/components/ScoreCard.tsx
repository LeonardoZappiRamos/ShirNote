import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatUpdatedAt, kindLabel, transpositionLabel } from '../library/format';
import type { ScoreSummary } from '../library/types';
import { colors, spacing } from '../theme';

interface ScoreCardProps {
  readonly score: ScoreSummary;
  readonly onPress: () => void;
}

const KIND_BADGE: Record<ScoreSummary['kind'], { background: string; text: string }> = {
  enc: { background: '#fde8e7', text: '#8c1d18' },
  musicxml: { background: '#e7eefc', text: '#1e3a8a' },
  pdf: { background: '#ece9e2', text: '#55524b' },
};

const KIND_BAR: Record<ScoreSummary['kind'], string> = {
  enc: colors.brand,
  musicxml: '#3b5bdb',
  pdf: colors.controlBorder,
};

/** Cartão da galeria: título, autor, tipo e data (RFM-04). */
export function ScoreCard({ score, onPress }: ScoreCardProps) {
  const badge = KIND_BADGE[score.kind];
  const accessibilityLabel = score.composer
    ? `Abrir ${score.title}, de ${score.composer}`
    : `Abrir ${score.title}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={[styles.kindBar, { backgroundColor: KIND_BAR[score.kind] }]} />
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>
            {score.title}
          </Text>
          <View style={[styles.badge, { backgroundColor: badge.background }]}>
            <Text style={[styles.badgeText, { color: badge.text }]}>{kindLabel(score.kind)}</Text>
          </View>
        </View>

        <Text style={styles.composer} numberOfLines={1}>
          {score.composer ?? 'Autor não informado'}
        </Text>

        <View style={styles.metaRow}>
          <Text style={styles.meta}>{formatUpdatedAt(score.updatedAt)}</Text>
          {score.transposition !== 0 ? (
            <Text style={styles.meta}>{transpositionLabel(score.transposition)}</Text>
          ) : null}
        </View>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 96,
    flexDirection: 'row',
    alignItems: 'stretch',
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    elevation: 1,
  },
  pressed: {
    opacity: 0.82,
  },
  kindBar: {
    width: 6,
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    color: colors.ink,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  composer: {
    color: colors.inkMuted,
    fontSize: 14,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  meta: {
    color: colors.inkMuted,
    fontSize: 12,
  },
  chevron: {
    alignSelf: 'center',
    paddingRight: spacing.md,
    color: colors.inkMuted,
    fontSize: 30,
    lineHeight: 30,
  },
});
