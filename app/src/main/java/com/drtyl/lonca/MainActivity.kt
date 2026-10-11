package com.drtyl.lonca

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.util.Base64
import android.webkit.ConsoleMessage
import android.webkit.JavascriptInterface
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.util.Locale

/**
 * Lonca Core — Versiyon 0 (3D)
 *
 * Native taraf bilerek küçük. Görevleri:
 *  1) Evi (assets/www/index.html) bir WebView içinde açmak
 *  2) Evin dosya sistemini JS'ye açmak (window.LoncaNative)
 *  3) İnternet isteği (yapay zeka), dosya seçici
 *  4) Ses: konuşma (TextToSpeech) ve dinleme (SpeechRecognizer)
 * Ev, 3D karakter, Laboratuvar, Atölye: hepsi web katmanında.
 */
class MainActivity : Activity() {

    private lateinit var web: WebView
    private var fileCallback: ValueCallback<Array<Uri>>? = null
    private val main = Handler(Looper.getMainLooper())

    private var tts: TextToSpeech? = null
    private var ttsHazir = false
    private var recognizer: SpeechRecognizer? = null
    private var dinlemeBekliyor = false

    companion object {
        private const val PICK_FILES = 4242
        private const val MIC_IZNI = 4343
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        WebView.setWebContentsDebuggingEnabled(true)
        web = WebView(this)
        setContentView(web)

        with(web.settings) {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = true
            mediaPlaybackRequiresUserGesture = false
            textZoom = 100
        }

        web.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val url = request.url.toString()
                if (url.startsWith("http://") || url.startsWith("https://")) {
                    try { startActivity(Intent(Intent.ACTION_VIEW, request.url)) } catch (_: Exception) {}
                    return true
                }
                return false
            }
        }

        web.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(
                view: WebView,
                callback: ValueCallback<Array<Uri>>,
                params: FileChooserParams
            ): Boolean {
                fileCallback?.onReceiveValue(null)
                fileCallback = callback
                return try {
                    val intent = Intent(Intent.ACTION_GET_CONTENT).apply {
                        addCategory(Intent.CATEGORY_OPENABLE)
                        type = "*/*"
                        if (params.mode == FileChooserParams.MODE_OPEN_MULTIPLE) {
                            putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true)
                        }
                    }
                    startActivityForResult(Intent.createChooser(intent, "Dosya seç"), PICK_FILES)
                    true
                } catch (e: Exception) {
                    fileCallback = null
                    false
                }
            }

            override fun onConsoleMessage(msg: ConsoleMessage): Boolean {
                android.util.Log.d("LoncaJS", "${msg.message()} @${msg.sourceId()}:${msg.lineNumber()}")
                return true
            }
        }

        web.addJavascriptInterface(Bridge(File(filesDir, "lonca")), "LoncaNative")
        web.loadUrl("file:///android_asset/www/index.html")

        sesMotorunuBaslat()
    }

    // ---------------------------------------------------------------- SES

    /** JS'ye ses olayı gönder: window.__loncaSes(olay, veri) */
    private fun sesOlayi(olay: String, veri: String = "") {
        val q = JSONObject.quote(veri)
        main.post {
            web.evaluateJavascript("window.__loncaSes && window.__loncaSes('$olay',$q)", null)
        }
    }

    private fun sesMotorunuBaslat() {
        try {
            tts = TextToSpeech(this) { status ->
                if (status == TextToSpeech.SUCCESS) {
                    val t = tts ?: return@TextToSpeech
                    val r = t.setLanguage(Locale("tr", "TR"))
                    ttsHazir = r != TextToSpeech.LANG_MISSING_DATA && r != TextToSpeech.LANG_NOT_SUPPORTED
                    if (!ttsHazir) { t.setLanguage(Locale.getDefault()); ttsHazir = true }
                    t.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
                        override fun onStart(id: String?) { sesOlayi("konusmaBasladi") }
                        override fun onDone(id: String?) { sesOlayi("konusmaBitti") }
                        @Deprecated("eski imza")
                        override fun onError(id: String?) { sesOlayi("konusmaBitti") }
                        override fun onError(id: String?, code: Int) { sesOlayi("konusmaBitti") }
                    })
                }
            }
        } catch (e: Throwable) {
            tts = null
        }
    }

    private fun dinlemeyiBaslat() {
        if (!SpeechRecognizer.isRecognitionAvailable(this)) {
            sesOlayi("hata", "Bu telefonda konuşma tanıma servisi bulunamadı.")
            return
        }
        if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            dinlemeBekliyor = true
            requestPermissions(arrayOf(Manifest.permission.RECORD_AUDIO), MIC_IZNI)
            return
        }
        try {
            if (recognizer == null) {
                recognizer = SpeechRecognizer.createSpeechRecognizer(this).also { r ->
                    r.setRecognitionListener(object : RecognitionListener {
                        override fun onReadyForSpeech(params: Bundle?) { sesOlayi("dinliyor") }
                        override fun onBeginningOfSpeech() {}
                        override fun onRmsChanged(rmsdB: Float) { sesOlayi("seviye", rmsdB.toString()) }
                        override fun onBufferReceived(buffer: ByteArray?) {}
                        override fun onEndOfSpeech() { sesOlayi("dusunuyor") }
                        override fun onError(error: Int) { sesOlayi("dinlemeHatasi", error.toString()) }
                        override fun onResults(results: Bundle?) {
                            val list = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                            sesOlayi("sonuc", list?.firstOrNull() ?: "")
                        }
                        override fun onPartialResults(partial: Bundle?) {
                            val list = partial?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                            val t = list?.firstOrNull()
                            if (!t.isNullOrEmpty()) sesOlayi("kismi", t)
                        }
                        override fun onEvent(eventType: Int, params: Bundle?) {}
                    })
                }
            }
            val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                putExtra(RecognizerIntent.EXTRA_LANGUAGE, "tr-TR")
                putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
                putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
            }
            recognizer?.startListening(intent)
        } catch (e: Throwable) {
            sesOlayi("hata", e.message ?: "Dinleme başlatılamadı")
        }
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == MIC_IZNI) {
            val izin = grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED
            if (izin && dinlemeBekliyor) dinlemeyiBaslat()
            else if (!izin) sesOlayi("hata", "Mikrofon izni verilmedi.")
            dinlemeBekliyor = false
        }
    }

    // ---------------------------------------------------------------- DOSYA SEÇİCİ / YAŞAM DÖNGÜSÜ

    @Deprecated("Activity.onActivityResult")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode == PICK_FILES) {
            val cb = fileCallback
            fileCallback = null
            if (cb == null) return
            if (resultCode != RESULT_OK || data == null) {
                cb.onReceiveValue(null); return
            }
            val uris = mutableListOf<Uri>()
            val clip = data.clipData
            if (clip != null) {
                for (i in 0 until clip.itemCount) uris.add(clip.getItemAt(i).uri)
            } else {
                data.data?.let { uris.add(it) }
            }
            cb.onReceiveValue(if (uris.isEmpty()) null else uris.toTypedArray())
            return
        }
        @Suppress("DEPRECATION")
        super.onActivityResult(requestCode, resultCode, data)
    }

    @Deprecated("Activity.onBackPressed")
    override fun onBackPressed() {
        web.evaluateJavascript("(window.loncaBack ? window.loncaBack() : false)") { result ->
            if (result != "true") {
                @Suppress("DEPRECATION")
                super.onBackPressed()
            }
        }
    }

    override fun onPause() {
        super.onPause()
        web.evaluateJavascript("window.loncaPause && window.loncaPause()", null)
    }

    override fun onResume() {
        super.onResume()
        web.evaluateJavascript("window.loncaResume && window.loncaResume()", null)
    }

    override fun onDestroy() {
        try { tts?.stop(); tts?.shutdown() } catch (_: Throwable) {}
        try { recognizer?.destroy() } catch (_: Throwable) {}
        super.onDestroy()
    }

    // ---------------------------------------------------------------- KÖPRÜ

    /** JS'nin gördüğü köprü: window.LoncaNative */
    inner class Bridge(private val root: File) {

        init { root.mkdirs() }

        private fun safe(path: String): File {
            val f = File(root, path.trimStart('/')).canonicalFile
            val r = root.canonicalFile
            if (f != r && !f.path.startsWith(r.path + File.separator)) {
                throw SecurityException("Evin dışına çıkılamaz: $path")
            }
            return f
        }

        private fun ok(data: Any? = null): String =
            JSONObject().put("ok", true).put("data", data ?: JSONObject.NULL).toString()

        private fun fail(e: Throwable): String =
            JSONObject().put("ok", false).put("error", e.message ?: e.toString()).toString()

        @JavascriptInterface
        fun list(path: String): String = try {
            val dir = safe(path)
            val arr = JSONArray()
            dir.listFiles()?.sortedWith(compareBy({ !it.isDirectory }, { it.name.lowercase() }))?.forEach {
                arr.put(JSONObject()
                    .put("name", it.name)
                    .put("dir", it.isDirectory)
                    .put("size", if (it.isFile) it.length() else 0)
                    .put("mtime", it.lastModified()))
            }
            ok(arr)
        } catch (e: Throwable) { fail(e) }

        @JavascriptInterface
        fun exists(path: String): Boolean = try { safe(path).exists() } catch (e: Throwable) { false }

        @JavascriptInterface
        fun read(path: String): String = try {
            ok(safe(path).readText(Charsets.UTF_8))
        } catch (e: Throwable) { fail(e) }

        @JavascriptInterface
        fun readBase64(path: String): String = try {
            ok(Base64.encodeToString(safe(path).readBytes(), Base64.NO_WRAP))
        } catch (e: Throwable) { fail(e) }

        @JavascriptInterface
        fun write(path: String, text: String): String = try {
            val f = safe(path); f.parentFile?.mkdirs(); f.writeText(text, Charsets.UTF_8); ok()
        } catch (e: Throwable) { fail(e) }

        @JavascriptInterface
        fun writeBase64(path: String, b64: String): String = try {
            val f = safe(path); f.parentFile?.mkdirs()
            f.writeBytes(Base64.decode(b64, Base64.DEFAULT)); ok()
        } catch (e: Throwable) { fail(e) }

        @JavascriptInterface
        fun mkdir(path: String): String = try { safe(path).mkdirs(); ok() } catch (e: Throwable) { fail(e) }

        @JavascriptInterface
        fun remove(path: String): String = try {
            val f = safe(path)
            if (f.canonicalFile == root.canonicalFile) throw SecurityException("Kök silinemez")
            f.deleteRecursively(); ok()
        } catch (e: Throwable) { fail(e) }

        @JavascriptInterface
        fun rename(from: String, to: String): String = try {
            val a = safe(from); val b = safe(to); b.parentFile?.mkdirs()
            if (!a.renameTo(b)) throw Exception("Yeniden adlandırılamadı")
            ok()
        } catch (e: Throwable) { fail(e) }

        @JavascriptInterface
        fun http(id: String, url: String, method: String, headersJson: String, body: String) {
            Thread {
                var status = 0
                var text: String
                try {
                    val c = URL(url).openConnection() as HttpURLConnection
                    c.requestMethod = method
                    c.connectTimeout = 20000
                    c.readTimeout = 60000
                    val h = JSONObject(headersJson)
                    val keys = h.keys()
                    while (keys.hasNext()) { val k = keys.next(); c.setRequestProperty(k, h.getString(k)) }
                    if (method != "GET" && body.isNotEmpty()) {
                        c.doOutput = true
                        c.outputStream.use { it.write(body.toByteArray(Charsets.UTF_8)) }
                    }
                    status = c.responseCode
                    val stream = if (status in 200..299) c.inputStream else c.errorStream
                    text = stream?.bufferedReader(Charsets.UTF_8)?.use { it.readText() } ?: ""
                } catch (e: Throwable) {
                    text = e.message ?: e.toString()
                }
                val b64 = Base64.encodeToString(text.toByteArray(Charsets.UTF_8), Base64.NO_WRAP)
                main.post {
                    web.evaluateJavascript("window.__loncaHttpDone && window.__loncaHttpDone('$id',$status,'$b64')", null)
                }
            }.start()
        }

        // ---- ses
        @JavascriptInterface
        fun sesVar(): Boolean = tts != null

        @JavascriptInterface
        fun konus(metin: String, perde: Float, hiz: Float) {
            main.post {
                val t = tts
                if (t == null || !ttsHazir) { sesOlayi("konusmaBitti"); return@post }
                t.setPitch(perde)
                t.setSpeechRate(hiz)
                t.speak(metin, TextToSpeech.QUEUE_FLUSH, null, "lonca-" + System.currentTimeMillis())
            }
        }

        @JavascriptInterface
        fun sus() { main.post { try { tts?.stop() } catch (_: Throwable) {} } }

        @JavascriptInterface
        fun dinle() { main.post { dinlemeyiBaslat() } }

        @JavascriptInterface
        fun dinlemeyiBirak() { main.post { try { recognizer?.cancel() } catch (_: Throwable) {} } }
    }
}
