package br.casoaberto.jogo;

import android.Manifest;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.webkit.WebViewAssetLoader;

/**
 * Caso Aberto — o jogo roda numa WebView carregando os arquivos de assets/www.
 * Os arquivos são servidos em https://appassets.androidplatform.net (origem segura),
 * o que permite a conexão direta entre celulares (WebRTC) e o armazenamento local.
 */
public class MainActivity extends Activity {

    private static final String ENDERECO = "https://appassets.androidplatform.net/assets/www/index.html";
    private WebView web;
    private String convitePendente = null;
    private PermissionRequest pedidoMicrofone = null;
    private ValueCallback<Uri[]> escolhaArquivos = null;
    private static final int PEDIDO_MIC = 41, PEDIDO_ARQUIVO = 42;

    /** Lê o código da sala de um link de convite (casoaberto://entrar?c=ABCD). */
    private static String codigoDoConvite(Intent i) {
        if (i == null || i.getData() == null) return null;
        Uri u = i.getData();
        if (!"casoaberto".equals(u.getScheme())) return null;
        String c = u.getQueryParameter("c");
        if (c == null && u.getPathSegments().size() > 0) c = u.getLastPathSegment();
        if (c == null) return null;
        c = c.toUpperCase().replaceAll("[^A-Z]", "");
        if (c.length() != 4) return null;
        // convite para a mesa de truco: casoaberto://entrar?c=ABCD&j=truco
        return "truco".equals(u.getQueryParameter("j")) ? "truco:" + c : c;
    }

    @Override
    protected void onCreate(Bundle estado) {
        super.onCreate(estado);
        // Mantém a tela acesa: se o anfitrião bloquear o celular, a sala pode cair.
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        final WebViewAssetLoader carregador = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        web = new WebView(this);
        web.setBackgroundColor(0xFF121419);
        web.setOverScrollMode(WebView.OVER_SCROLL_NEVER);

        WebSettings cfg = web.getSettings();
        cfg.setJavaScriptEnabled(true);
        cfg.setDomStorageEnabled(true);
        cfg.setMediaPlaybackRequiresUserGesture(false);
        cfg.setAllowFileAccess(false);
        cfg.setAllowContentAccess(false);
        cfg.setTextZoom(100);

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest req) {
                return carregador.shouldInterceptRequest(req.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
                Uri u = req.getUrl();
                if ("appassets.androidplatform.net".equals(u.getHost())) return false;
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, u));
                } catch (Exception ignorado) { }
                return true;
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            // microfone: para gravar a voz do personagem no truco
            @Override
            public void onPermissionRequest(final PermissionRequest pedido) {
                runOnUiThread(() -> {
                    boolean querAudio = false;
                    for (String r : pedido.getResources()) if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(r)) querAudio = true;
                    if (!querAudio) { pedido.deny(); return; }
                    if (Build.VERSION.SDK_INT < 23 || checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
                        pedido.grant(new String[]{PermissionRequest.RESOURCE_AUDIO_CAPTURE});
                    } else {
                        pedidoMicrofone = pedido;
                        requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, PEDIDO_MIC);
                    }
                });
            }

            // escolher arquivos: para as músicas do próprio celular no truco
            @Override
            public boolean onShowFileChooser(WebView w, ValueCallback<Uri[]> cb, FileChooserParams params) {
                if (escolhaArquivos != null) escolhaArquivos.onReceiveValue(null);
                escolhaArquivos = cb;
                try {
                    Intent i = params.createIntent();
                    if (params.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE) i.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
                    startActivityForResult(i, PEDIDO_ARQUIVO);
                } catch (Exception e) {
                    escolhaArquivos = null;
                    return false;
                }
                return true;
            }
        });
        web.addJavascriptInterface(new Ponte(), "Android");

        convitePendente = codigoDoConvite(getIntent());
        setContentView(web);
        if (estado != null) {
            web.restoreState(estado);
        } else {
            web.loadUrl(ENDERECO);
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        final String c = codigoDoConvite(intent);
        if (c != null && web != null) {
            convitePendente = c;
            web.evaluateJavascript("window.abrirConvite && window.abrirConvite('" + c + "')", null);
        }
    }

    /** Funções do Android que o jogo pode chamar pelo JavaScript (window.Android). */
    private class Ponte {
        /** Código de sala que veio de um link de convite (entregue uma vez só). */
        @JavascriptInterface
        public String convite() {
            String c = convitePendente;
            convitePendente = null;
            return c == null ? "" : c;
        }

        /** Número da versão instalada (o mesmo número das versões no GitHub). */
        @JavascriptInterface
        @SuppressWarnings("deprecation")
        public int versao() {
            try {
                return getPackageManager().getPackageInfo(getPackageName(), 0).versionCode;
            } catch (Exception e) {
                return 0;
            }
        }

        /** Abre um endereço fora do jogo (navegador), por exemplo para baixar a versão nova. */
        @JavascriptInterface
        public void abrirLink(final String url) {
            if (url == null || !url.startsWith("https://")) return;
            runOnUiThread(() -> {
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
                } catch (Exception ignorado) { }
            });
        }

        @JavascriptInterface
        public void compartilhar(final String texto) {
            runOnUiThread(() -> {
                Intent i = new Intent(Intent.ACTION_SEND);
                i.setType("text/plain");
                i.putExtra(Intent.EXTRA_TEXT, texto);
                startActivity(Intent.createChooser(i, "Convidar para o Caso Aberto"));
            });
        }

        @JavascriptInterface
        @SuppressWarnings("deprecation")
        public void vibrar(int ms) {
            try {
                Vibrator v = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
                if (v == null || !v.hasVibrator()) return;
                if (Build.VERSION.SDK_INT >= 26) {
                    v.vibrate(VibrationEffect.createOneShot(Math.max(10, ms), VibrationEffect.DEFAULT_AMPLITUDE));
                } else {
                    v.vibrate(Math.max(10, ms));
                }
            } catch (Exception ignorado) { }
        }
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        // Pergunta ao jogo se ele quer tratar o "voltar" (fechar janela, trocar de aba).
        web.evaluateJavascript("(window.voltarAndroid && window.voltarAndroid()) ? 'sim' : 'nao'", valor -> {
            if (valor == null || !valor.contains("sim")) {
                // Não fecha o jogo: só manda para segundo plano, para a sala não cair.
                moveTaskToBack(true);
            }
        });
    }

    @Override
    public void onRequestPermissionsResult(int codigo, String[] permissoes, int[] resultados) {
        super.onRequestPermissionsResult(codigo, permissoes, resultados);
        if (codigo == PEDIDO_MIC && pedidoMicrofone != null) {
            if (resultados.length > 0 && resultados[0] == PackageManager.PERMISSION_GRANTED) {
                pedidoMicrofone.grant(new String[]{PermissionRequest.RESOURCE_AUDIO_CAPTURE});
            } else {
                pedidoMicrofone.deny();
            }
            pedidoMicrofone = null;
        }
    }

    @Override
    protected void onActivityResult(int codigo, int resultado, Intent dados) {
        super.onActivityResult(codigo, resultado, dados);
        if (codigo != PEDIDO_ARQUIVO || escolhaArquivos == null) return;
        Uri[] uris = null;
        if (resultado == RESULT_OK && dados != null) {
            if (dados.getClipData() != null) {
                int n = dados.getClipData().getItemCount();
                uris = new Uri[n];
                for (int i = 0; i < n; i++) uris[i] = dados.getClipData().getItemAt(i).getUri();
            } else if (dados.getData() != null) {
                uris = new Uri[]{dados.getData()};
            }
        }
        escolhaArquivos.onReceiveValue(uris);
        escolhaArquivos = null;
    }

    @Override
    protected void onSaveInstanceState(Bundle estado) {
        super.onSaveInstanceState(estado);
        web.saveState(estado);
    }

    @Override
    protected void onDestroy() {
        if (web != null) {
            web.destroy();
        }
        super.onDestroy();
    }
}
