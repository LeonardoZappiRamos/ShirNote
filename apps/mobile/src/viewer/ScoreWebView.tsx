import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import viewerHtmlAsset from '../../assets/viewer.html';
import { colors, spacing } from '../theme';
import {
  serializeViewerMessage,
  type ViewerInboundMessage,
  type ViewerOutboundMessage,
} from './protocol';

interface ScoreWebViewProps {
  readonly musicXml: string;
  readonly label: string;
  readonly zoom: number;
  /** Posição salva, restaurada no primeiro desenho e depois de cada transposição. */
  readonly initialScrollRatio?: number;
  readonly onScrollRatioChange?: (ratio: number) => void;
  readonly onRendered?: () => void;
  readonly onError?: (message: string) => void;
}

/**
 * RFM-05: desenha o MusicXML no OSMD dentro da WebView.
 * O HTML é gerado por `npm run viewer:build` e carregado do pacote do app, sem rede.
 */
export function ScoreWebView({
  musicXml,
  label,
  zoom,
  initialScrollRatio = 0,
  onScrollRatioChange,
  onRendered,
  onError,
}: ScoreWebViewProps) {
  const webViewRef = useRef<WebView<unknown>>(null);
  const [html, setHtml] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Refs evitam redesenhar a partitura a cada evento de rolagem ou toque de zoom.
  const scrollRatioRef = useRef(initialScrollRatio);
  const zoomRef = useRef(zoom);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const asset = Asset.fromModule(viewerHtmlAsset);
        await asset.downloadAsync();

        if (!asset.localUri) {
          throw new Error('O visualizador não foi encontrado no pacote do app.');
        }

        const content = await new File(asset.localUri).text();
        if (!cancelled) setHtml(content);
      } catch (cause) {
        if (!cancelled) {
          setLoadError(cause instanceof Error ? cause.message : 'Falha ao abrir o visualizador.');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const send = useCallback((message: ViewerInboundMessage) => {
    const payload = serializeViewerMessage(message);
    webViewRef.current?.injectJavaScript(
      `window.ShirNoteViewer && window.ShirNoteViewer.handle(${payload}); true;`,
    );
  }, []);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      let message: ViewerOutboundMessage;

      try {
        message = JSON.parse(event.nativeEvent.data) as ViewerOutboundMessage;
      } catch {
        return;
      }

      switch (message.type) {
        case 'ready':
          setReady(true);
          break;
        case 'rendered':
          onRendered?.();
          break;
        case 'scroll':
          if (typeof message.ratio === 'number') {
            scrollRatioRef.current = message.ratio;
            onScrollRatioChange?.(message.ratio);
          }
          break;
        case 'error':
          onError?.(message.message);
          break;
      }
    },
    [onError, onRendered, onScrollRatioChange],
  );

  useEffect(() => {
    if (!ready) return;
    send({
      type: 'render',
      musicXml,
      label,
      zoom: zoomRef.current,
      scrollRatio: scrollRatioRef.current,
    });
  }, [label, musicXml, ready, send]);

  useEffect(() => {
    if (!ready) return;
    send({ type: 'zoom', zoom });
  }, [ready, send, zoom]);

  if (loadError) {
    return (
      <View style={styles.message}>
        <Text style={styles.messageTitle}>Visualizador indisponível</Text>
        <Text style={styles.messageBody}>{loadError}</Text>
        <Text style={styles.messageBody}>
          Gere o visualizador com <Text style={styles.code}>npm run viewer:build</Text>.
        </Text>
      </View>
    );
  }

  if (!html) {
    return (
      <View style={styles.message}>
        <ActivityIndicator color={colors.accent} />
        <Text style={styles.messageBody}>Preparando o visualizador...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView<unknown>
        ref={webViewRef}
        source={{ html }}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled={false}
        allowFileAccess={false}
        setSupportMultipleWindows={false}
        mixedContentMode="never"
        onMessage={handleMessage}
        onError={(event) => onError?.(event.nativeEvent.description)}
        style={styles.webview}
        accessible
        accessibilityLabel={`Partitura: ${label}`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.page,
  },
  webview: {
    flex: 1,
    backgroundColor: colors.page,
  },
  message: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
    backgroundColor: colors.page,
  },
  messageTitle: {
    color: colors.error,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  messageBody: {
    color: colors.inkMuted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  code: {
    fontFamily: 'monospace',
    color: colors.ink,
  },
});
