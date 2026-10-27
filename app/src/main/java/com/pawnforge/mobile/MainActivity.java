package com.pawnforge.mobile;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;
import android.widget.Toast;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

public class MainActivity extends Activity {
    private static final int CREATE_FILE_REQUEST = 701;
    private ValueCallback<Uri[]> fileChooserCallback;
    private String pendingContent = "";
    private boolean pendingBase64 = false;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WebView webView = new WebView(this);
        webView.setBackgroundColor(0xFF0B1020);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setDefaultTextEncodingName("UTF-8");
        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback,
                    FileChooserParams params) {
                if (fileChooserCallback != null) fileChooserCallback.onReceiveValue(null);
                fileChooserCallback = callback;
                try {
                    startActivityForResult(params.createIntent(), 702);
                    return true;
                } catch (Exception e) {
                    fileChooserCallback = null;
                    Toast.makeText(MainActivity.this, "Unable to open file picker", Toast.LENGTH_SHORT).show();
                    return false;
                }
            }
        });
        webView.addJavascriptInterface(new AndroidBridge(), "AndroidBridge");
        setContentView(webView);
        webView.loadUrl("file:///android_asset/index.html");
    }

    private class AndroidBridge {
        @JavascriptInterface
        public void saveTextFile(String filename, String content, String mime) {
            runOnUiThread(() -> startSave(filename, content, false));
        }
        @JavascriptInterface
        public void saveBase64File(String filename, String content) {
            runOnUiThread(() -> startSave(filename, content, true));
        }
    }

    private void startSave(String filename, String content, boolean base64) {
        pendingContent = content;
        pendingBase64 = base64;
        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("application/octet-stream");
        intent.putExtra(Intent.EXTRA_TITLE, filename);
        try {
            startActivityForResult(intent, CREATE_FILE_REQUEST);
        } catch (Exception e) {
            Toast.makeText(this, "Could not open save dialog", Toast.LENGTH_LONG).show();
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == 702 && fileChooserCallback != null) {
            Uri[] results = null;
            if (resultCode == RESULT_OK && data != null && data.getData() != null) {
                results = new Uri[]{data.getData()};
            }
            fileChooserCallback.onReceiveValue(results);
            fileChooserCallback = null;
            return;
        }
        if (requestCode == CREATE_FILE_REQUEST && resultCode == RESULT_OK && data != null) {
            Uri uri = data.getData();
            try (OutputStream out = getContentResolver().openOutputStream(uri)) {
                byte[] bytes = pendingBase64
                        ? Base64.decode(pendingContent, Base64.DEFAULT)
                        : pendingContent.getBytes(StandardCharsets.UTF_8);
                if (out != null) out.write(bytes);
                Toast.makeText(this, "File saved successfully", Toast.LENGTH_SHORT).show();
            } catch (Exception e) {
                Toast.makeText(this, "Save failed: " + e.getMessage(), Toast.LENGTH_LONG).show();
            }
            pendingContent = "";
            pendingBase64 = false;
        }
    }

    @Override
    public void onBackPressed() {
        // Keep the editor open rather than unexpectedly exiting while editing.
        Toast.makeText(this, "Use the app switcher to leave PawnForge", Toast.LENGTH_SHORT).show();
    }
}
