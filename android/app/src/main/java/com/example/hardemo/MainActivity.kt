package com.example.hardemo

import android.app.Activity
import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import android.hardware.Sensor
import android.hardware.SensorManager
import android.os.Bundle
import android.os.Handler
import android.os.HandlerThread
import android.os.Looper
import android.os.SystemClock
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.widget.AdapterView
import android.widget.ArrayAdapter
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.ScrollView
import android.widget.Spinner
import android.widget.TextView
import java.util.Locale
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicInteger

class MainActivity : Activity() {
    private val tr = Locale.forLanguageTag("tr-TR")
    private val main = Handler(Looper.getMainLooper())

    private lateinit var inferThread: HandlerThread
    private lateinit var inferHandler: Handler
    private var model: GruModel? = null // touched only on the inference thread after load
    private val inferBusy = AtomicBoolean(false)
    private val generation = AtomicInteger(0)
    private var sampler: SensorSampler? = null
    private var running = false

    // UI-thread state, valid once the model is loaded
    private var labels: List<String> = emptyList()
    private var smoother: MajoritySmoother? = null
    private var windows = 0
    private var dropped = 0

    private lateinit var bigLabel: TextView
    private lateinit var bigConf: TextView
    private lateinit var rawLine: TextView
    private lateinit var smoothLine: TextView
    private lateinit var rateLine: TextView
    private lateinit var inferLine: TextView
    private lateinit var modelLine: TextView
    private lateinit var startButton: Button
    private lateinit var axisSpinner: Spinner
    private lateinit var barsBox: LinearLayout
    private val bars = ArrayList<ProgressBar>()
    private val barPct = ArrayList<TextView>()
    private val barName = ArrayList<TextView>()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        setContentView(buildUi())

        inferThread = HandlerThread("har-infer").apply { start() }
        inferHandler = Handler(inferThread.looper)
        inferHandler.post { loadModel() }

        val sm = getSystemService(Context.SENSOR_SERVICE) as SensorManager
        val acc = sm.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
        val gyro = sm.getDefaultSensor(Sensor.TYPE_GYROSCOPE)
        if (acc == null || gyro == null) {
            val missing = listOfNotNull(if (acc == null) "ivmeölçer" else null, if (gyro == null) "jiroskop" else null)
            rateLine.text = "Bu cihazda ${missing.joinToString(" ve ")} yok; demo çalışamaz."
            startButton.isEnabled = false
        } else {
            sampler = SensorSampler(sm, acc, gyro, WINDOW, STRIDE, ::onWindowReady) { s -> main.post { showStats(s) } }.also {
                it.setMapping(AxisMapping.ALL[axisSpinner.selectedItemPosition], generation.get())
            }
        }
    }

    override fun onPause() {
        super.onPause()
        // Sensors are released whenever the activity leaves the foreground.
        if (running) stopSampling()
    }

    override fun onDestroy() {
        super.onDestroy()
        generation.incrementAndGet()
        sampler?.quit()
        inferThread.quitSafely()
        main.removeCallbacksAndMessages(null)
    }

    // ---- model -------------------------------------------------------------------------

    private fun loadModel() {
        try {
            val t0 = SystemClock.elapsedRealtime()
            val text = assets.open("model.json").bufferedReader(Charsets.UTF_8).use { it.readText() }
            val m = GruModel.fromJson(text)
            require(m.window == WINDOW && m.channels == 6) { "model window/channels must be $WINDOW x 6" }
            model = m
            // warm-up so the first live window does not pay JIT cost
            m.logits(FloatArray(WINDOW * 6))
            val ms = SystemClock.elapsedRealtime() - t0
            main.post { onModelLoaded(m.labels, m.looksLikeDummy, m.rateHz, ms) }
        } catch (e: Exception) {
            main.post {
                modelLine.text = "Model yüklenemedi: ${e.message}"
                modelLine.setTextColor(Color.rgb(176, 0, 32))
                startButton.isEnabled = false
            }
        }
    }

    private fun onModelLoaded(l: List<String>, dummy: Boolean, rate: Int, ms: Long) {
        labels = l
        smoother = MajoritySmoother(3, l.size)
        buildBars(l)
        val sb = StringBuilder("Model: ${GruModel.FORMAT}, ${l.size} sınıf, $rate Hz, yükleme $ms ms.")
        if (rate != 50) sb.append(" UYARI: uygulama 50 Hz örnekliyor.")
        if (dummy) {
            sb.append(" UYARI: yüklü model rastgele ağırlıklı geliştirme modeli; tahminler anlamsızdır.")
            modelLine.setTextColor(Color.rgb(176, 0, 32))
        }
        modelLine.text = sb.toString()
        if (sampler != null) startButton.isEnabled = true
    }

    /** Runs on the sensor thread; hands the window to the inference thread, dropping it if busy. */
    private fun onWindowReady(gen: Int, w: FloatArray) {
        if (!inferBusy.compareAndSet(false, true)) {
            main.post { if (gen == generation.get()) dropped++ }
            return
        }
        inferHandler.post {
            try {
                val m = model ?: return@post
                val t0 = SystemClock.elapsedRealtimeNanos()
                val p = m.probabilities(w)
                val ms = (SystemClock.elapsedRealtimeNanos() - t0) / 1e6
                main.post { showResult(gen, p, ms) }
            } finally {
                inferBusy.set(false)
            }
        }
    }

    // ---- control -----------------------------------------------------------------------

    private fun startSampling() {
        val s = sampler ?: return
        running = true
        smoother?.clear()
        windows = 0
        dropped = 0
        s.start(generation.incrementAndGet())
        startButton.text = "Durdur"
        bigLabel.text = "Bekleniyor…"
        bigConf.text = "ilk pencere 2,56 sn sonra"
        rawLine.text = "Ham: -"
        smoothLine.text = "Yumuşatılmış: -"
    }

    private fun stopSampling() {
        running = false
        generation.incrementAndGet()
        sampler?.stop()
        startButton.text = "Başlat"
        rateLine.text = "Durduruldu."
    }

    private fun onMappingChanged(pos: Int) {
        getPreferences(MODE_PRIVATE).edit().putInt(PREF_AXIS, pos).apply()
        smoother?.clear()
        val s = sampler ?: return
        // A new generation discards results from windows recorded with the old mapping.
        s.setMapping(AxisMapping.ALL[pos], generation.incrementAndGet())
        if (running) {
            bigLabel.text = "Bekleniyor…"
            bigConf.text = "eksen değişti, pencere yeniden doluyor"
        }
    }

    // ---- display -----------------------------------------------------------------------

    private fun showResult(gen: Int, p: FloatArray, ms: Double) {
        if (gen != generation.get() || !running) return
        val sm = smoother ?: return
        windows++
        val raw = MajoritySmoother.argmax(p)
        val (sIdx, sConf) = sm.add(p)
        bigLabel.text = TurkishLabels.of(labels[sIdx])
        bigConf.text = "güven %${pct(sConf)} · ${labels[sIdx]}"
        rawLine.text = "Ham (son pencere): ${TurkishLabels.of(labels[raw])} · %${pct(p[raw])}"
        smoothLine.text = "Yumuşatılmış (son 3 pencere, çoğunluk oyu): ${TurkishLabels.of(labels[sIdx])} · %${pct(sConf)}"
        inferLine.text = String.format(tr, "Çıkarım: %.1f ms · pencere: %d · atlanan: %d", ms, windows, dropped)
        for (i in p.indices) {
            if (i >= bars.size) break
            bars[i].progress = (p[i] * 1000).toInt()
            barPct[i].text = "%${pct(p[i])}"
            barName[i].setTypeface(null, if (i == raw) Typeface.BOLD else Typeface.NORMAL)
        }
    }

    private fun showStats(s: SensorSampler.Stats) {
        if (!running) return
        val sb = StringBuilder(
            String.format(
                tr, "Örnekleme: %.1f Hz (hedef 50) · ivme olayı %.1f Hz · gyro olayı %.1f Hz · örnek %d",
                s.tickHz, s.accHz, s.gyroHz, s.samples,
            ),
        )
        if (s.accHz < 45f || s.gyroHz < 45f) sb.append("\nUYARI: sensör 50 Hz'den yavaş; son değer tekrarlanıyor.")
        if (s.catchUps > 0) sb.append("\nZamanlayıcı ${s.catchUps} kez gecikti.")
        rateLine.text = sb.toString()
    }

    private fun pct(v: Float): String = String.format(tr, "%.0f", v * 100f)

    // ---- views -------------------------------------------------------------------------

    private fun dp(v: Int): Int = (v * resources.displayMetrics.density + 0.5f).toInt()

    private fun text(sizeSp: Float, bold: Boolean = false): TextView = TextView(this).apply {
        textSize = sizeSp
        if (bold) setTypeface(typeface, Typeface.BOLD)
        setPadding(0, dp(2), 0, dp(2))
    }

    private fun buildUi(): View {
        val col = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(16), dp(16), dp(16), dp(24))
        }
        col.addView(text(14f).apply { text = "Canlı insan aktivitesi tanıma (GRU demo)" })
        bigLabel = text(34f, bold = true).apply {
            text = "-"
            gravity = Gravity.CENTER_HORIZONTAL
        }
        bigConf = text(18f).apply {
            text = "Başlat'a basın"
            gravity = Gravity.CENTER_HORIZONTAL
        }
        col.addView(bigLabel)
        col.addView(bigConf)
        rawLine = text(15f).apply { text = "Ham: -" }
        smoothLine = text(15f).apply { text = "Yumuşatılmış: -" }
        col.addView(rawLine)
        col.addView(smoothLine)

        startButton = Button(this).apply {
            text = "Başlat"
            isEnabled = false
            setOnClickListener { if (running) stopSampling() else startSampling() }
        }
        col.addView(startButton, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT))

        rateLine = text(13f).apply { text = "Örnekleme: -" }
        inferLine = text(13f).apply { text = "Çıkarım: -" }
        col.addView(rateLine)
        col.addView(inferLine)

        col.addView(text(14f, bold = true).apply { text = "Eksen eşleme (telefon → HAPT)" })
        axisSpinner = Spinner(this).apply {
            adapter = ArrayAdapter(this@MainActivity, android.R.layout.simple_spinner_item, AxisMapping.ALL.map { it.label }).apply {
                setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
            }
        }
        col.addView(axisSpinner)
        val saved = getPreferences(MODE_PRIVATE).getInt(PREF_AXIS, 0).coerceIn(0, AxisMapping.ALL.size - 1)
        axisSpinner.setSelection(saved, false)
        axisSpinner.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            private var current = saved
            override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                if (position != current) {
                    current = position
                    onMappingChanged(position)
                }
            }

            override fun onNothingSelected(parent: AdapterView<*>?) = Unit
        }

        col.addView(text(14f, bold = true).apply { text = "Sınıf olasılıkları (son pencere)" })
        barsBox = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        col.addView(barsBox)

        modelLine = text(12f).apply { text = "Model yükleniyor…" }
        col.addView(modelLine)

        col.addView(text(16f, bold = true).apply { text = "Nasıl kullanılır" })
        col.addView(text(14f).apply { text = HELP })
        col.addView(text(16f, bold = true).apply { text = "Sınırlılıklar" })
        col.addView(text(14f).apply { text = LIMITS })

        return ScrollView(this).apply { addView(col) }
    }

    private fun buildBars(l: List<String>) {
        barsBox.removeAllViews()
        bars.clear()
        barPct.clear()
        barName.clear()
        for (label in l) {
            val row = LinearLayout(this).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER_VERTICAL
            }
            val name = text(13f).apply { text = TurkishLabels.of(label) }
            val bar = ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal).apply {
                max = 1000
                progress = 0
            }
            val pctView = text(13f).apply {
                text = "%0"
                gravity = Gravity.END
            }
            row.addView(name, LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 4f))
            row.addView(bar, LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 5f))
            row.addView(pctView, LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1.4f))
            barsBox.addView(row)
            bars.add(bar)
            barPct.add(pctView)
            barName.add(name)
        }
    }

    companion object {
        const val WINDOW = 128
        const val STRIDE = 64
        private const val PREF_AXIS = "axis_mapping"

        private val HELP = """
            1. Telefonu belinize dik (portrait) takın, ekran dışa baksın.
            2. Başlat'a basın. İlk tahmin 2,56 sn (128 örnek, 50 Hz) sonra gelir, sonra her 1,28 sn'de (64 örnek) yenilenir.
            3. Eksen eşlemeyi deneyerek seçin. [1] varsayılandır, ama telefonun gerçek duruşuna hangi seçeneğin uyduğu ancak denemeyle bulunur: ayakta dururken Ayakta durma (STANDING), otururken Oturma (SITTING) görmelisiniz. Görmüyorsanız başka bir seçeneğe geçip birkaç pencere bekleyin. Seçim değişince pencere sıfırdan dolar.
            4. Büyük etiket, son 3 pencerenin çoğunluk oyuyla yumuşatılmış tahmindir. Ham satırı tek pencerenin tahminini gösterir.
        """.trimIndent()

        private val LIMITS = """
            • Model UCI HAPT veri setiyle eğitildi: bele takılı Samsung Galaxy S II, 50 Hz. Farklı konumda, farklı cihazda ve farklı sensörlerle doğruluk düşebilir.
            • Projede ölçülen test sonucu bu telefon için geçerli değildir. Uygulama doğruluk ölçmez, yalnızca tahmin gösterir.
            • Sensör olayları 50 Hz'den seyrek gelirse son değer tekrarlanır (zero-order hold). Örnekleme satırı gerçek olay hızını gösterir.
            • Postural transition'lar birkaç saniye sürer. Tek pencerede kaçabilir, yumuşatma da onları bastırabilir.
            • Uygulama arka plana geçince ölçüm durur, sensörler kapanır.
        """.trimIndent()
    }
}
