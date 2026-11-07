import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DEV_PLAN_SWITCH, setPlan, usePlan } from '../billing/planStore';
import { ScoreCard } from '../components/ScoreCard';
import { filterScores, sortScores, type LibrarySort } from '../library/format';
import { ImportError } from '../library/importFile';
import { pickAndImportScore } from '../library/importScore';
import { FREE_SCORE_LIMIT, isPro, remainingSlots } from '../library/plan';
import { getScoreRepository } from '../library/repositoryInstance';
import type { ScoreSummary } from '../library/types';
import { colors, MIN_TOUCH_TARGET, spacing } from '../theme';

export default function LibraryScreen() {
  const plan = usePlan();
  const [scores, setScores] = useState<readonly ScoreSummary[]>([]);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<LibrarySort>('recent');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  const loadScores = useCallback(async (showSpinner: boolean) => {
    if (showSpinner) setLoading(true);

    try {
      const repository = await getScoreRepository();
      setScores(await repository.list());
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível abrir a biblioteca.');
    } finally {
      hasLoadedRef.current = true;
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Recarrega ao voltar do visualizador, sem piscar a galeria já carregada.
  useFocusEffect(
    useCallback(() => {
      void loadScores(!hasLoadedRef.current);
    }, [loadScores]),
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    void loadScores(false);
  }, [loadScores]);

  const handleImport = useCallback(async () => {
    if (importing) return;
    setImporting(true);

    try {
      const repository = await getScoreRepository();
      const result = await pickAndImportScore(repository, plan);
      if (!result) return;

      await loadScores(false);

      const warningNote =
        result.warningCount > 0
          ? ` ${result.warningCount} aviso(s) do arquivo foram ignorados.`
          : '';
      Alert.alert(
        'Partitura importada',
        `"${result.score.title}" já está na biblioteca.${warningNote}`,
      );
    } catch (cause) {
      if (cause instanceof ImportError) {
        Alert.alert('Não foi possível importar', cause.message);
      } else {
        Alert.alert('Não foi possível importar', 'Ocorreu um erro inesperado ao ler o arquivo.');
      }
    } finally {
      setImporting(false);
    }
  }, [importing, loadScores, plan]);

  const visibleScores = sortScores(filterScores(scores, query), sort);
  const slots = remainingSlots(plan, scores.length);
  const planLabel = isPro(plan)
    ? 'Pro'
    : `Grátis · ${Math.min(scores.length, FREE_SCORE_LIMIT)}/${FREE_SCORE_LIMIT}`;

  const emptyState = renderEmptyState({
    loading,
    error,
    hasScores: scores.length > 0,
    importing,
    onRetry: () => void loadScores(true),
    onImport: handleImport,
  });

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <FlatList
        data={visibleScores}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ScoreCard score={item} onPress={() => router.push(`/score/${item.id}`)} />
        )}
        ItemSeparatorComponent={Separator}
        ListHeaderComponent={
          <View>
            <View style={styles.brandRow}>
              <View style={styles.logo}>
                <Text style={styles.logoGlyph}>♪</Text>
              </View>
              <View style={styles.brandText}>
                <Text style={styles.brandTitle}>
                  Shir<Text style={styles.brandAccent}>Note</Text>
                </Text>
                <Text style={styles.tagline}>Sua biblioteca de partituras, offline.</Text>
              </View>
            </View>

            <View style={styles.actionRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Importar partitura"
                accessibilityState={{ busy: importing, disabled: importing }}
                disabled={importing}
                onPress={handleImport}
                style={({ pressed }) => [
                  styles.importButton,
                  (pressed || importing) && styles.importButtonPressed,
                ]}
              >
                {importing ? (
                  <ActivityIndicator color={colors.accentInk} />
                ) : (
                  <Text style={styles.importButtonText}>Importar partitura</Text>
                )}
              </Pressable>

              <Pressable
                accessibilityRole={DEV_PLAN_SWITCH ? 'button' : undefined}
                accessibilityLabel={
                  DEV_PLAN_SWITCH ? 'Alternar plano de teste' : `Plano ${planLabel}`
                }
                accessibilityHint={
                  DEV_PLAN_SWITCH
                    ? 'Alterna entre o plano grátis e o Pro neste build de desenvolvimento.'
                    : undefined
                }
                disabled={!DEV_PLAN_SWITCH}
                onPress={() => setPlan(isPro(plan) ? 'free' : 'pro')}
                style={({ pressed }) => [
                  styles.planPill,
                  DEV_PLAN_SWITCH && styles.planPillDev,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.planPillText}>{planLabel}</Text>
              </Pressable>
            </View>

            {DEV_PLAN_SWITCH ? (
              <Text style={styles.devNote}>
                Modo de teste: toque no plano para alternar entre grátis e Pro.
              </Text>
            ) : null}

            {slots === 0 ? (
              <Text style={styles.limitNote}>
                Limite do plano grátis atingido. Exclua um item ou conheça o Pro.
              </Text>
            ) : null}

            {error && scores.length > 0 ? <Text style={styles.inlineError}>{error}</Text> : null}

            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar por título ou autor"
              placeholderTextColor={colors.inkMuted}
              accessibilityLabel="Buscar partituras"
              autoCorrect={false}
              returnKeyType="search"
              clearButtonMode="while-editing"
              style={styles.search}
            />

            <View style={styles.sortRow}>
              <Text style={styles.sortLabel}>Ordenar</Text>
              <SortButton
                label="Recentes"
                active={sort === 'recent'}
                onPress={() => setSort('recent')}
              />
              <SortButton
                label="Título"
                active={sort === 'title'}
                onPress={() => setSort('title')}
              />
            </View>
          </View>
        }
        ListEmptyComponent={emptyState}
        contentContainerStyle={[
          styles.content,
          visibleScores.length === 0 ? styles.contentEmpty : null,
        ]}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        keyboardShouldPersistTaps="handled"
      />
    </SafeAreaView>
  );
}

interface EmptyStateOptions {
  readonly loading: boolean;
  readonly error: string | null;
  readonly hasScores: boolean;
  readonly importing: boolean;
  readonly onRetry: () => void;
  readonly onImport: () => void;
}

function renderEmptyState({
  loading,
  error,
  hasScores,
  importing,
  onRetry,
  onImport,
}: EmptyStateOptions) {
  if (loading) {
    return (
      <View style={styles.empty}>
        <ActivityIndicator color={colors.accent} />
        <Text style={styles.emptyBody}>Abrindo a biblioteca...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>Não foi possível abrir a biblioteca</Text>
        <Text style={styles.emptyBody}>{error}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={onRetry}
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
        >
          <Text style={styles.secondaryButtonText}>Tentar de novo</Text>
        </Pressable>
      </View>
    );
  }

  if (!hasScores) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>Sua biblioteca está vazia</Text>
        <Text style={styles.emptyBody}>
          Importe um arquivo .enc ou MusicXML para começar. Tudo fica no aparelho e abre sem
          internet.
        </Text>
        <Pressable
          accessibilityRole="button"
          disabled={importing}
          onPress={onImport}
          style={({ pressed }) => [
            styles.secondaryButton,
            (pressed || importing) && styles.pressed,
          ]}
        >
          <Text style={styles.secondaryButtonText}>Importar a primeira partitura</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>Nenhuma partitura encontrada</Text>
      <Text style={styles.emptyBody}>Tente outro título ou nome de autor.</Text>
    </View>
  );
}

function SortButton({
  label,
  active,
  onPress,
}: {
  readonly label: string;
  readonly active: boolean;
  readonly onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.sortButton,
        active && styles.sortButtonActive,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.sortButtonText, active && styles.sortButtonTextActive]}>{label}</Text>
    </Pressable>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.page,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  contentEmpty: {
    flexGrow: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.lg,
  },
  logo: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: colors.brand,
  },
  logoGlyph: {
    color: colors.accentInk,
    fontSize: 30,
    lineHeight: 34,
  },
  brandText: {
    flex: 1,
  },
  brandTitle: {
    color: colors.ink,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  brandAccent: {
    color: colors.brand,
  },
  tagline: {
    color: colors.inkMuted,
    fontSize: 14,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  importButton: {
    minHeight: MIN_TOUCH_TARGET,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.lg,
  },
  importButtonPressed: {
    opacity: 0.78,
  },
  importButtonText: {
    color: colors.accentInk,
    fontSize: 16,
    fontWeight: '700',
  },
  planPill: {
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
  },
  planPillText: {
    color: colors.inkMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  planPillDev: {
    borderStyle: 'dashed',
    borderColor: colors.accent,
  },
  devNote: {
    marginTop: spacing.xs,
    color: colors.inkMuted,
    fontSize: 12,
  },
  limitNote: {
    marginTop: spacing.sm,
    color: colors.error,
    fontSize: 13,
  },
  inlineError: {
    marginTop: spacing.sm,
    color: colors.error,
    fontSize: 13,
  },
  search: {
    minHeight: MIN_TOUCH_TARGET,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.controlBorder,
    borderRadius: 12,
    backgroundColor: colors.surface,
    color: colors.ink,
    fontSize: 16,
    paddingHorizontal: spacing.md,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  sortLabel: {
    color: colors.inkMuted,
    fontSize: 13,
    marginRight: spacing.xs,
  },
  sortButton: {
    minHeight: 36,
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
  },
  sortButtonActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  sortButtonText: {
    color: colors.inkMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  sortButtonTextActive: {
    color: colors.accentInk,
  },
  separator: {
    height: spacing.md,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyBody: {
    maxWidth: 420,
    color: colors.inkMuted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  secondaryButton: {
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    marginTop: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accent,
    paddingHorizontal: spacing.lg,
  },
  secondaryButtonText: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.72,
  },
});
