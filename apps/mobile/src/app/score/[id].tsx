import { Stack, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePlan } from '../../billing/planStore';
import { transpositionLabel } from '../../library/format';
import { canEditMetadata, canTranspose, isPro, proFeatureMessage } from '../../library/plan';
import {
  clampScrollRatio,
  clampZoom,
  DEFAULT_READING_POSITION,
  MAX_READING_ZOOM,
  MIN_READING_ZOOM,
  type ReadingPosition,
} from '../../library/reading';
import type { ScoreRepository } from '../../library/repository';
import { getScoreRepository } from '../../library/repositoryInstance';
import { isTransposable, transposeRecord } from '../../library/transposition';
import type { ScoreRecord } from '../../library/types';
import { colors, MIN_TOUCH_TARGET, spacing } from '../../theme';
import { ScoreWebView } from '../../viewer/ScoreWebView';

const ZOOM_STEP = 0.25;
const SAVE_DELAY_MS = 1200;

export default function ScoreScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const plan = usePlan();

  const [score, setScore] = useState<ScoreRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewerError, setViewerError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(DEFAULT_READING_POSITION.zoom);
  const [initialScrollRatio, setInitialScrollRatio] = useState(
    DEFAULT_READING_POSITION.scrollRatio,
  );
  const [transposing, setTransposing] = useState(false);
  const [focusMode, setFocusMode] = useState(false);

  const hasLoadedRef = useRef(false);
  const hasScoreRef = useRef(false);
  const repositoryRef = useRef<ScoreRepository | null>(null);
  const positionRef = useRef<ReadingPosition>(DEFAULT_READING_POSITION);
  const zoomRef = useRef(DEFAULT_READING_POSITION.zoom);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipSaveRef = useRef(false);

  const flushReadingPosition = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    if (skipSaveRef.current) return;
    if (!hasScoreRef.current) return;

    const repository = repositoryRef.current;
    if (!repository) return;

    void repository.saveReadingPosition(id, positionRef.current).catch(() => {
      // Perder a posição não pode interromper a leitura.
    });
  }, [id]);

  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      flushReadingPosition();
    }, SAVE_DELAY_MS);
  }, [flushReadingPosition]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const repository = await getScoreRepository();
        repositoryRef.current = repository;

        const [found, position] = await Promise.all([
          repository.get(id),
          repository.getReadingPosition(id),
        ]);
        if (cancelled) return;

        positionRef.current = position;
        zoomRef.current = position.zoom;
        setZoom(position.zoom);
        setInitialScrollRatio(position.scrollRatio);

        if (found) {
          hasScoreRef.current = true;
          setScore(found);
        } else {
          setError('Partitura não encontrada na biblioteca.');
        }
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : 'Falha ao abrir a partitura.');
        }
      } finally {
        if (!cancelled) {
          hasLoadedRef.current = true;
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // Salva ao sair da tela, mesmo que o último evento de rolagem ainda esteja no debounce.
  useEffect(() => {
    return () => {
      flushReadingPosition();
    };
  }, [flushReadingPosition]);

  // Volta da edição de metadados com o título e o autor atualizados.
  useFocusEffect(
    useCallback(() => {
      if (!hasLoadedRef.current) return;

      let cancelled = false;

      void (async () => {
        try {
          const repository = await getScoreRepository();
          const found = await repository.get(id);
          if (!cancelled && found) setScore(found);
        } catch {
          // Mantém o que já está na tela; a próxima abertura tenta de novo.
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [id]),
  );

  const changeZoom = useCallback(
    (delta: number) => {
      const next = clampZoom(zoomRef.current + delta);
      if (next === zoomRef.current) return;

      zoomRef.current = next;
      setZoom(next);
      positionRef.current = { ...positionRef.current, zoom: next };
      scheduleSave();
    },
    [scheduleSave],
  );

  const handleScrollRatioChange = useCallback(
    (ratio: number) => {
      positionRef.current = {
        ...positionRef.current,
        scrollRatio: clampScrollRatio(ratio),
      };
      scheduleSave();
    },
    [scheduleSave],
  );

  const changeTransposition = useCallback(
    async (delta: number) => {
      if (!score || transposing) return;

      setTransposing(true);

      try {
        const result = transposeRecord(score, delta);
        const repository = await getScoreRepository();
        await repository.updateTransposition(
          score.id,
          result.transposition,
          result.musicXml,
          score.scoreJson,
        );

        setScore((current) =>
          current
            ? {
                ...current,
                transposition: result.transposition,
                musicXml: result.musicXml,
                updatedAt: new Date().toISOString(),
              }
            : current,
        );
      } catch (cause) {
        Alert.alert(
          'Não foi possível transpor',
          cause instanceof Error ? cause.message : 'Tente novamente.',
        );
      } finally {
        setTransposing(false);
      }
    },
    [score, transposing],
  );

  const handleTranspose = useCallback(
    (delta: number) => {
      if (!canTranspose(plan)) {
        Alert.alert('ShirNote Pro', proFeatureMessage('transpose'));
        return;
      }

      void changeTransposition(delta);
    },
    [changeTransposition, plan],
  );

  const openMetadataEditor = useCallback(() => {
    if (!score) return;

    if (!canEditMetadata(plan)) {
      Alert.alert('ShirNote Pro', proFeatureMessage('metadata'));
      return;
    }

    router.push(`/edit/${score.id}`);
  }, [plan, score]);

  const deleteCurrentScore = useCallback(async () => {
    if (!score) return;

    try {
      skipSaveRef.current = true;
      const repository = await getScoreRepository();
      await repository.remove(score.id);
      router.back();
    } catch (cause) {
      skipSaveRef.current = false;
      Alert.alert(
        'Não foi possível excluir',
        cause instanceof Error ? cause.message : 'Tente novamente.',
      );
    }
  }, [score]);

  const confirmDelete = useCallback(() => {
    if (!score) return;

    Alert.alert('Excluir partitura', `"${score.title}" será removida da biblioteca.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          void deleteCurrentScore();
        },
      },
    ]);
  }, [deleteCurrentScore, score]);

  // O voltar do Android sai da tela cheia antes de fechar a partitura.
  useEffect(() => {
    if (!focusMode) return;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setFocusMode(false);
      return true;
    });

    return () => subscription.remove();
  }, [focusMode]);

  const title = score?.title ?? 'Partitura';
  const transposable = score ? isTransposable(score) : false;
  const canChangeTransposition = transposable && !transposing;
  const zoomOutDisabled = zoom <= MIN_READING_ZOOM;
  const zoomInDisabled = zoom >= MAX_READING_ZOOM;

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          title,
          headerShown: !focusMode,
          headerRight: focusMode
            ? undefined
            : () => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Entrar em tela cheia"
                  onPress={() => setFocusMode(true)}
                  style={({ pressed }) => [styles.headerButton, pressed && styles.buttonPressed]}
                >
                  <Text style={styles.headerButtonText}>⛶</Text>
                </Pressable>
              ),
        }}
      />
      <StatusBar hidden={focusMode} style="dark" />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.muted}>Abrindo a partitura...</Text>
        </View>
      ) : null}

      {!loading && error ? (
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Não foi possível abrir</Text>
          <Text style={styles.muted}>{error}</Text>
        </View>
      ) : null}

      {!loading && !error && score ? (
        <>
          {score.musicXml ? (
            <ScoreWebView
              musicXml={score.musicXml}
              label={score.title}
              zoom={zoom}
              initialScrollRatio={initialScrollRatio}
              onScrollRatioChange={handleScrollRatioChange}
              onError={setViewerError}
            />
          ) : (
            <View style={styles.center}>
              <Text style={styles.errorTitle}>Formato sem visualizador</Text>
              <Text style={styles.muted}>A leitura de PDF chega na próxima fase do app.</Text>
            </View>
          )}

          {viewerError ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{viewerError}</Text>
            </View>
          ) : null}

          {focusMode ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sair da tela cheia"
              onPress={() => setFocusMode(false)}
              style={({ pressed }) => [
                styles.exitFocus,
                { top: insets.top + spacing.sm },
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.exitFocusText}>Sair da tela cheia</Text>
            </Pressable>
          ) : null}

          {!focusMode ? (
            <View style={[styles.toolbar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
              {!transposable ? (
                <Text style={styles.toolbarNote}>
                  A transposição está disponível apenas para partituras importadas de .enc.
                </Text>
              ) : null}

              <View style={styles.toolbarRow}>
                <Text style={styles.toolLabel}>Tom</Text>

                <ToolButton
                  glyph="−"
                  label="Diminuir meio tom"
                  disabled={!canChangeTransposition}
                  onPress={() => handleTranspose(-1)}
                />

                <Text
                  style={styles.valueLabel}
                  accessibilityLabel={
                    transposable
                      ? `Transposição: ${transpositionLabel(score.transposition)}`
                      : 'Transposição indisponível para este formato'
                  }
                >
                  {transposable ? formatSemitones(score.transposition) : '—'}
                </Text>

                <ToolButton
                  glyph="+"
                  label="Aumentar meio tom"
                  disabled={!canChangeTransposition}
                  onPress={() => handleTranspose(1)}
                />

                {transposable && !isPro(plan) ? <Text style={styles.proBadge}>Pro</Text> : null}

                <View style={styles.toolbarSpacer} />

                <TextButton
                  label="Editar título e autor"
                  text="Editar"
                  onPress={openMetadataEditor}
                />
              </View>

              <View style={styles.toolbarRow}>
                <Text style={styles.toolLabel}>Zoom</Text>

                <ToolButton
                  glyph="−"
                  label="Diminuir zoom"
                  disabled={zoomOutDisabled}
                  onPress={() => changeZoom(-ZOOM_STEP)}
                />

                <Text
                  style={styles.valueLabel}
                  accessibilityLabel={`Zoom em ${Math.round(zoom * 100)} por cento`}
                >
                  {Math.round(zoom * 100)}%
                </Text>

                <ToolButton
                  glyph="+"
                  label="Aumentar zoom"
                  disabled={zoomInDisabled}
                  onPress={() => changeZoom(ZOOM_STEP)}
                />

                <View style={styles.toolbarSpacer} />

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Excluir partitura"
                  onPress={confirmDelete}
                  style={({ pressed }) => [styles.deleteButton, pressed && styles.buttonPressed]}
                >
                  <Text style={styles.deleteButtonText}>Excluir</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </>
      ) : null}
    </View>
  );
}

function formatSemitones(semitones: number): string {
  if (semitones === 0) return '0';
  return semitones > 0 ? `+${semitones}` : String(semitones);
}

function ToolButton({
  glyph,
  label,
  disabled,
  onPress,
}: {
  readonly glyph: string;
  readonly label: string;
  readonly disabled: boolean;
  readonly onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.toolButton, (pressed || disabled) && styles.buttonMuted]}
    >
      <Text style={styles.toolButtonText}>{glyph}</Text>
    </Pressable>
  );
}

function TextButton({
  label,
  text,
  onPress,
}: {
  readonly label: string;
  readonly text: string;
  readonly onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.textButton, pressed && styles.buttonPressed]}
    >
      <Text style={styles.textButtonText}>{text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.page,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
  },
  errorTitle: {
    color: colors.error,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  muted: {
    color: colors.inkMuted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  errorBanner: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.errorSurface,
  },
  errorBannerText: {
    color: colors.error,
    fontSize: 13,
    textAlign: 'center',
  },
  toolbar: {
    gap: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  toolbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  toolLabel: {
    minWidth: 34,
    color: colors.inkMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  toolButton: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.controlBorder,
    borderRadius: 12,
  },
  toolButtonText: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 28,
  },
  buttonMuted: {
    opacity: 0.4,
  },
  valueLabel: {
    minWidth: 48,
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  toolbarNote: {
    color: colors.inkMuted,
    fontSize: 12,
    lineHeight: 16,
  },
  proBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: colors.proSurface,
    color: colors.proInk,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  toolbarSpacer: {
    flex: 1,
  },
  textButton: {
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.controlBorder,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
  },
  textButtonText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.65,
  },
  headerButton: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonText: {
    color: colors.ink,
    fontSize: 22,
    lineHeight: 26,
  },
  exitFocus: {
    position: 'absolute',
    right: spacing.md,
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: colors.ink,
    paddingHorizontal: spacing.lg,
    opacity: 0.86,
  },
  exitFocusText: {
    color: colors.accentInk,
    fontSize: 13,
    fontWeight: '700',
  },
  deleteButton: {
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
  },
  deleteButtonText: {
    color: colors.error,
    fontSize: 15,
    fontWeight: '700',
  },
});
