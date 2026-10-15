package com.maverick.torremv

import android.app.Activity
import android.os.Bundle
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import android.graphics.Color
import androidx.webkit.WebViewAssetLoader

/** WebView segura: JavaScript ES Modules y WebGL desde assets internos. */
class MainActivity : Activity() {
    private lateinit var browser: WebView
    private val localHost = "appassets.androidplatform.net"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.statusBarColor = Color.rgb(238, 244, 248)
        window.navigationBarColor = Color.rgb(238, 244, 248)
        window.decorView.systemUiVisibility = android.view.View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR or
            android.view.View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR

        val assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()
        browser = WebView(this).apply {
            setBackgroundColor(Color.rgb(238, 244, 248))
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.allowFileAccess = false
            settings.allowContentAccess = false
            settings.setSupportZoom(false)
            settings.mixedContentMode = android.webkit.WebSettings.MIXED_CONTENT_NEVER_ALLOW
            webViewClient = object : WebViewClient() {
                override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? {
                    return assetLoader.shouldInterceptRequest(request.url)
                }
                override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                    return request.url.scheme != "https" || request.url.host != localHost
                }
            }
            loadUrl("https://$localHost/assets/index.html")
        }
        setContentView(browser)
    }

    @Deprecated("Usar navegación tradicional de Android")
    override fun onBackPressed() {
        if (browser.canGoBack()) browser.goBack() else super.onBackPressed()
    }
    override fun onDestroy() {
        browser.stopLoading()
        browser.destroy()
        super.onDestroy()
    }
}
