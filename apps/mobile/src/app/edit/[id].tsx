import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { usePlan } from '../../billing/planStore';
import { canEditMetadata, proFeatureMessage } from '../../library/plan';
import { getScoreRepository } from '../../library/repositoryInstance';
import type { ScoreRecord } from '../../library/types';
import { colors, MIN_TOUCH_TARGET, spacing } from '../../theme';

const TITLE_MAX_LENGTH = 200;
const COMPOSER_MAX_LENGTH = 200;

/** RFM-07: título e autor são metadados da biblioteca, não do arquivo original. */
export default function EditScoreScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const plan = usePlan();

  const [score, setScore] = useState<ScoreRecord | null>(null);
  const [title, setTitle] = useState('');
  const [composer, setComposer] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const repository = await getScoreRepository();
        const found = await repository.get(id);
        if (cancelled) return;

        if (!found) {
          setError('Partitura não encontrada na biblioteca.');
          return;
        }

        setScore(found);
        setTitle(found.title);
        setComposer(found.composer ?? '');
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : 'Falha ao abrir a partitura.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const save = useCallback(async () => {
    if (!score || saving) return;

    const nextTitle = title.trim();
    if (nextTitle.length === 0) {
      Alert.alert('Título obrigatório', 'A partitura precisa de um título para aparecer na busca.');
      return;
    }

    setSaving(true);

    try {
      const repository = await getScoreRepository();
      const nextComposer = composer.trim();
      await repository.updateMetadata(
        score.id,
        nextTitle,
        nextComposer.length > 0 ? nextComposer : null,
      );
      router.back();
    } catch (cause) {
      Alert.alert(
        'Não foi possível salvar',
        cause instanceof Error ? cause.message : 'Tente novamente.',
      );
    } finally {
      setSaving(false);
    }
  }, [composer, saving, score, title]);

  const screenTitle = score?.title ?? 'Editar partitura';

  if (!canEditMetadata(plan)) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: screenTitle }} />
        <Text style={styles.errorTitle}>Recurso do ShirNote Pro</Text>
        <Text style={styles.muted}>{proFeatureMessage('metadata')}</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: screenTitle }} />
        <ActivityIndicator color={colors.accent} />
        <Text style={styles.muted}>Abrindo a partitura...</Text>
      </View>
    );
  }

  if (error || !score) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: screenTitle }} />
        <Text style={styles.errorTitle}>Não foi possível editar</Text>
        <Text style={styles.muted}>{error ?? 'Partitura não encontrada.'}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ title: 'Editar partitura' }} />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Título</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Nome da partitura"
          placeholderTextColor={colors.inkMuted}
          accessibilityLabel="Título da partitura"
          autoCorrect
          maxLength={TITLE_MAX_LENGTH}
          returnKeyType="next"
          style={styles.input}
        />

        <Text style={styles.label}>Autor</Text>
        <TextInput
          value={composer}
          onChangeText={setComposer}
          placeholder="Opcional"
          placeholderTextColor={colors.inkMuted}
          accessibilityLabel="Autor da partitura"
          autoCorrect
          maxLength={COMPOSER_MAX_LENGTH}
          returnKeyType="done"
          onSubmitEditing={() => {
            void save();
          }}
          style={styles.input}
        />

        <Text style={styles.hint}>
          O arquivo original não muda: o novo nome aparece só na sua biblioteca.
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Salvar alterações"
          accessibilityState={{ busy: saving, disabled: saving }}
          disabled={saving}
          onPress={() => {
            void save();
          }}
          style={({ pressed }) => [styles.saveButton, (pressed || saving) && styles.pressed]}
        >
          {saving ? (
            <ActivityIndicator color={colors.accentInk} />
          ) : (
            <Text style={styles.saveButtonText}>Salvar</Text>
          )}
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cancelar edição"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.page,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
    backgroundColor: colors.page,
  },
  label: {
    marginTop: spacing.md,
    color: colors.ink,
    fontSize: 15,
    fontWeight: '700',
  },
  input: {
    minHeight: MIN_TOUCH_TARGET,
    borderWidth: 1,
    borderColor: colors.controlBorder,
    borderRadius: 12,
    backgroundColor: colors.surface,
    color: colors.ink,
    fontSize: 16,
    paddingHorizontal: spacing.md,
  },
  hint: {
    marginTop: spacing.xs,
    color: colors.inkMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  saveButton: {
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    borderRadius: 12,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.lg,
  },
  saveButtonText: {
    color: colors.accentInk,
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  cancelButtonText: {
    color: colors.inkMuted,
    fontSize: 15,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.72,
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
});
