package br.casoaberto.jogo;

import android.app.Activity;
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
        web.setWebChromeClient(new WebChromeClient());
        web.addJavascriptInterface(new Ponte(), "Android");

        setContentView(web);
        if (estado != null) {
            web.restoreState(estado);
        } else {
            web.loadUrl(ENDERECO);
        }
    }

    /** Funções do Android que o jogo pode chamar pelo JavaScript (window.Android). */
    private class Ponte {
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
