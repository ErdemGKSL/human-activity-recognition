package com.example.hardemo

import android.app.Activity
import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import android.hardware.Sensor
import android.hardware.SensorManager
import android.media.AudioManager
import android.media.ToneGenerator
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
import android.widget.FrameLayout
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

    // Axis mapping choice (UI thread). The calibrated entry exists only while a calibration is saved.
    private var calibrationR: DoubleArray? = null
    private var options: List<MappingChoices.Option> = emptyList()
    private var currentKey = MappingChoices.presetKey(1)

    // Calibration run (UI thread). [calibId] invalidates callbacks from a cancelled run.
    private enum class Phase { PREP, RECORD, COMPUTE, RESULT }
    private var calibId = 0
    private var calibActive = false
    private var calibStep = 0
    private var calibPhase = Phase.PREP
    private var phaseStart = 0L
    private val recordings = HashMap<Posture, FloatArray>()
    private var pendingResult: Calibration.Result? = null
    private var tone: ToneGenerator? = null

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

    private lateinit var mainView: View
    private lateinit var calibView: View
    private lateinit var calibButton: Button
    private lateinit var calibStatus: TextView
    private lateinit var calStepLine: TextView
    private lateinit var calInstruction: TextView
    private lateinit var calCountdown: TextView
    private lateinit var calProgress: ProgressBar
    private lateinit var calResult: TextView
    private lateinit var calMatrix: TextView
    private lateinit var calQuality: TextView
    private lateinit var calCancel: Button
    private lateinit var calUse: Button
    private lateinit var calRetry: Button
    private lateinit var calClose: Button

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
                it.setMapping(currentMapping(), generation.get())
            }
        }
    }

    override fun onPause() {
        super.onPause()
        // Sensors are released whenever the activity leaves the foreground; a calibration in
        // progress is dropped, since its recording would no longer match the posture.
        if (calibActive && calibPhase != Phase.RESULT) cancelCalibration("Kalibrasyon iptal edildi: uygulama arka plana geçti.")
        if (running) stopSampling()
    }

    // Back during a calibration returns to the main screen instead of closing the app.
    @Deprecated("Activity.onBackPressed is deprecated on API 33+, still called without a back callback")
    @Suppress("DEPRECATION")
    override fun onBackPressed() {
        if (calibActive) {
            if (calibPhase == Phase.RESULT) closeCalibration() else cancelCalibration("Kalibrasyon iptal edildi.")
        } else {
            super.onBackPressed()
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        calibId++
        tone?.release()
        tone = null
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
                calibButton.isEnabled = false
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
        if (sampler != null) {
            startButton.isEnabled = true
            calibButton.isEnabled = true
        }
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

    private fun currentMapping(): AxisMapping = options[MappingChoices.indexOf(options, currentKey)].mapping

    private fun onMappingChanged(key: String) {
        currentKey = key
        getPreferences(MODE_PRIVATE).edit().putString(PREF_AXIS_KEY, key).apply()
        smoother?.clear()
        val s = sampler ?: return
        // A new generation discards results from windows recorded with the old mapping.
        s.setMapping(currentMapping(), generation.incrementAndGet())
        if (running) {
            bigLabel.text = "Bekleniyor…"
            bigConf.text = "eksen değişti, pencere yeniden doluyor"
        }
    }

    /** Rebuilds the spinner for the current calibration and selects [key] without a callback loop. */
    private fun refreshSpinner(key: String) {
        options = MappingChoices.options(calibrationR)
        val idx = MappingChoices.indexOf(options, key)
        currentKey = options[idx].key
        axisSpinner.adapter = ArrayAdapter(this, android.R.layout.simple_spinner_item, options.map { it.label }).apply {
            setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        }
        axisSpinner.setSelection(idx, false)
    }

    private fun loadMappingPrefs() {
        val prefs = getPreferences(MODE_PRIVATE)
        calibrationR = CalibrationStore.decode(prefs.getString(PREF_CALIBRATION, null))
        val legacy = if (prefs.contains(PREF_AXIS)) runCatching { prefs.getInt(PREF_AXIS, 0) }.getOrNull() else null
        refreshSpinner(MappingChoices.initialKey(calibrationR != null, prefs.getString(PREF_AXIS_KEY, null), legacy))
    }

    // ---- calibration -------------------------------------------------------------------

    private fun beep() {
        try {
            if (tone == null) tone = ToneGenerator(AudioManager.STREAM_NOTIFICATION, 80)
            tone?.startTone(ToneGenerator.TONE_PROP_BEEP, 200)
        } catch (e: RuntimeException) {
            // ToneGenerator can fail on some devices (audio policy); the calibration works without sound.
            tone = null
        }
    }

    private fun startCalibration() {
        val s = sampler ?: return
        if (running) stopSampling() // live inference pauses for the whole calibration
        calibId++
        calibActive = true
        recordings.clear()
        pendingResult = null
        mainView.visibility = View.GONE
        calibView.visibility = View.VISIBLE
        // Same 50 Hz grid, but no live windows: only the raw recordings below.
        s.start(generation.incrementAndGet(), liveWindows = false)
        beginStep(0)
    }

    private fun beginStep(step: Int) {
        val p = Posture.entries[step]
        calibStep = step
        calibPhase = Phase.PREP
        phaseStart = SystemClock.uptimeMillis()
        calStepLine.text = "Adım ${step + 1}/3: ${p.title}"
        calInstruction.text = p.instruction
        calProgress.progress = 0
        setResultVisible(false)
        calCancel.visibility = View.VISIBLE
        main.removeCallbacks(calibTicker)
        calibTicker.run()
    }

    private val calibTicker = object : Runnable {
        override fun run() {
            if (!calibActive) return
            val el = SystemClock.uptimeMillis() - phaseStart
            when (calibPhase) {
                Phase.PREP -> {
                    val prepMs = PREP_MS_PER_STEP[calibStep]
                    if (el >= prepMs) {
                        beep()
                        calibPhase = Phase.RECORD
                        phaseStart = SystemClock.uptimeMillis()
                        val id = calibId
                        val step = calibStep
                        sampler?.record(RECORD_SAMPLES) { rec -> main.post { onStepRecorded(id, step, rec) } }
                    } else {
                        val left = (prepMs - el + 999) / 1000
                        calCountdown.text = "Hazırlan: $left"
                    }
                }
                Phase.RECORD -> {
                    // Completion comes from the sampler (400 samples); the clock only drives the bar.
                    val frac = (el.toFloat() / RECORD_MS).coerceAtMost(0.99f)
                    calProgress.progress = (frac * 1000).toInt()
                    val left = ((RECORD_MS - el + 999) / 1000).coerceAtLeast(0)
                    calCountdown.text = if (left > 0) "Kayıt: $left sn kaldı" else "Kayıt bitiyor…"
                    if (el > RECORD_MS + RECORD_TIMEOUT_MS) {
                        cancelCalibration("Kalibrasyon durdu: sensör verisi zamanında gelmedi.")
                        return
                    }
                }
                Phase.COMPUTE, Phase.RESULT -> return
            }
            main.postDelayed(this, 100)
        }
    }

    private fun onStepRecorded(id: Int, step: Int, rec: FloatArray) {
        if (id != calibId || !calibActive || calibPhase != Phase.RECORD || step != calibStep) return
        beep()
        recordings[Posture.entries[step]] = rec
        if (step + 1 < Posture.entries.size) {
            beginStep(step + 1)
            return
        }
        main.removeCallbacks(calibTicker)
        sampler?.stop()
        calibPhase = Phase.COMPUTE
        calProgress.progress = 1000
        calStepLine.text = "Hesaplanıyor…"
        calInstruction.text = "Kayıtlar HAPT çerçevesine döndürülüyor ve model ile doğrulanıyor."
        calCountdown.text = ""
        val recs = HashMap(recordings)
        inferHandler.post {
            val m = model
            val result = try {
                if (m == null) null else Calibration.analyze(m, recs, DISCARD_SAMPLES)
            } catch (e: Exception) {
                null
            }
            main.post { showCalibResult(id, result) }
        }
    }

    private fun showCalibResult(id: Int, r: Calibration.Result?) {
        if (id != calibId || !calibActive) return
        calibPhase = Phase.RESULT
        calCancel.visibility = View.GONE
        setResultVisible(true)
        if (r == null) {
            calStepLine.text = "Kalibrasyon başarısız"
            calInstruction.text = "Sonuç hesaplanamadı (model yüklenmemiş ya da kayıt geçersiz)."
            calResult.text = ""
            calMatrix.text = ""
            calQuality.text = ""
            calUse.visibility = View.GONE
            return
        }
        pendingResult = r
        calStepLine.text = "Kalibrasyon sonucu"
        calInstruction.text = ""
        calResult.text = r.postures.joinToString("\n") { "${it.posture.shortName}: ${it.correct}/${it.total} pencere doğru" }
        val m = r.r
        calMatrix.text = "R (telefon → HAPT):\n" + (0 until 3).joinToString("\n") { row ->
            String.format(Locale.ROOT, "%+.3f  %+.3f  %+.3f", m[row * 3], m[row * 3 + 1], m[row * 3 + 2])
        } + String.format(tr, "\n|u_ayakta| = %.3f g", r.postures.first { it.posture == Posture.STANDING }.stats.accNorm)
        if (r.quality.good) {
            applyCalibration(r.r)
            calQuality.text = "Kalite: İyi. Kalibrasyon kaydedildi ve uygulandı."
            calQuality.setTextColor(Color.rgb(0, 110, 40))
            calUse.visibility = View.GONE
        } else {
            calQuality.text = "Kalite: ${r.quality.text}\n" + r.quality.reasons.joinToString("\n") { "• $it" } +
                "\nSonuç uygulanmadı."
            calQuality.setTextColor(Color.rgb(176, 0, 32))
            calUse.visibility = View.VISIBLE
        }
    }

    private fun applyCalibration(r: DoubleArray) {
        calibrationR = r
        getPreferences(MODE_PRIVATE).edit().putString(PREF_CALIBRATION, CalibrationStore.encode(r)).apply()
        refreshSpinner(MappingChoices.CALIBRATED_KEY)
        onMappingChanged(MappingChoices.CALIBRATED_KEY)
    }

    private fun cancelCalibration(message: String) {
        calibId++
        calibActive = false
        main.removeCallbacks(calibTicker)
        sampler?.cancelRecording()
        sampler?.stop()
        recordings.clear()
        pendingResult = null
        calibView.visibility = View.GONE
        mainView.visibility = View.VISIBLE
        calibStatus.text = message
    }

    private fun closeCalibration() {
        // A good result was already applied in showCalibResult; a low-confidence one only via "Yine de kullan".
        val applied = calibPhase == Phase.RESULT && pendingResult?.quality?.good == true
        cancelCalibration(if (applied) "Kalibre edilmiş eşleme kullanılıyor. Başlat'a basın." else "Kalibrasyon uygulanmadı.")
    }

    private fun setResultVisible(v: Boolean) {
        val vis = if (v) View.VISIBLE else View.GONE
        calResult.visibility = vis
        calMatrix.visibility = vis
        calQuality.visibility = vis
        calRetry.visibility = vis
        calClose.visibility = vis
        calUse.visibility = vis
        calCountdown.visibility = if (v) View.GONE else View.VISIBLE
        calProgress.visibility = if (v) View.GONE else View.VISIBLE
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
        calibButton = Button(this).apply {
            text = "Kalibrasyon"
            isEnabled = false
            setOnClickListener { startCalibration() }
        }
        col.addView(calibButton, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT))
        calibStatus = text(13f).apply { text = "" }
        col.addView(calibStatus)

        rateLine = text(13f).apply { text = "Örnekleme: -" }
        inferLine = text(13f).apply { text = "Çıkarım: -" }
        col.addView(rateLine)
        col.addView(inferLine)

        col.addView(text(14f, bold = true).apply { text = "Eksen eşleme (telefon → HAPT)" })
        axisSpinner = Spinner(this)
        col.addView(axisSpinner)
        loadMappingPrefs()
        if (calibrationR != null) calibStatus.text = "Kayıtlı kalibrasyon yüklendi."
        axisSpinner.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                // refreshSpinner sets currentKey first, so its own selection is a no-op here.
                val key = options.getOrNull(position)?.key ?: return
                if (key != currentKey) onMappingChanged(key)
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

        mainView = ScrollView(this).apply { addView(col) }
        calibView = buildCalibrationUi().apply { visibility = View.GONE }
        return FrameLayout(this).apply {
            addView(mainView)
            addView(calibView)
        }
    }

    private fun buildCalibrationUi(): View {
        val col = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(16), dp(24), dp(16), dp(24))
        }
        fun full() = LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT)
        col.addView(text(14f).apply { text = "Kalibrasyon: 3 duruş, her biri 8 sn" })
        calStepLine = text(24f, bold = true)
        calInstruction = text(28f, bold = true)
        calCountdown = text(30f, bold = true).apply { gravity = Gravity.CENTER_HORIZONTAL }
        calProgress = ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal).apply {
            max = 1000
            progress = 0
        }
        calResult = text(18f)
        calMatrix = text(12f).apply { typeface = Typeface.MONOSPACE }
        calQuality = text(16f, bold = true)
        col.addView(calStepLine)
        col.addView(calInstruction)
        col.addView(calCountdown)
        col.addView(calProgress, full())
        col.addView(calResult)
        col.addView(calMatrix)
        col.addView(calQuality)
        calCancel = Button(this).apply {
            text = "İptal"
            setOnClickListener { cancelCalibration("Kalibrasyon iptal edildi.") }
        }
        calUse = Button(this).apply {
            text = "Yine de kullan"
            setOnClickListener {
                val r = pendingResult ?: return@setOnClickListener
                applyCalibration(r.r)
                cancelCalibration("Düşük güvenli kalibrasyon uygulandı. Sonuçları dikkatle yorumlayın.")
            }
        }
        calRetry = Button(this).apply {
            text = "Tekrarla"
            setOnClickListener { startCalibration() }
        }
        calClose = Button(this).apply {
            text = "Kapat"
            setOnClickListener { closeCalibration() }
        }
        for (b in listOf(calCancel, calUse, calRetry, calClose)) col.addView(b, full())
        return ScrollView(this).apply {
            addView(col)
            setBackgroundColor(Color.WHITE)
        }
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
        private const val PREF_AXIS = "axis_mapping" // old: spinner position as Int
        private const val PREF_AXIS_KEY = "axis_mapping_key"
        private const val PREF_CALIBRATION = "calibration_r"

        /** Hazırlık süresi adım başına: ayakta 5, oturma 6, sırtüstü yatma 12 sn (yatmaya geçmek zaman alır). */
        val PREP_MS_PER_STEP = longArrayOf(5_000L, 6_000L, 12_000L)
        const val RECORD_MS = 8_000L
        private const val RECORD_TIMEOUT_MS = 5_000L
        const val RECORD_SAMPLES = 400 // 8 s at 50 Hz
        const val DISCARD_SAMPLES = 75 // first 1.5 s of each recording

        private val HELP = """
            1. Telefonu belinize dik (portrait) takın, ekran dışa baksın. Kalibrasyon ve ölçüm boyunca aynı yerde kalsın.
            2. Önce Kalibrasyon'a basın. Uygulama üç duruşu sırayla ister: ayakta, otururken, sırtüstü yatarken. Hazırlık süresi adıma göre değişir (ayakta 5 sn, oturma 6 sn, yatma 12 sn), bip sesinden sonra 8 sn kayıt alınır ve kayıt bitince yine bip çalar. Kayıt sırasında hareket etmeyin. Yatma adımında sırtüstü uzanın.
            3. Sonuç ekranı her duruşta modelin kaç pencereyi doğru bulduğunu gösterir. Kalite İyi ise kalibrasyon kaydedilir ve eksen eşlemede "Kalibre edilmiş" seçilir. Düşük güven çıkarsa kalibrasyonu tekrarlayın; sonucu yine de kullanmak isterseniz "Yine de kullan" düğmesi vardır.
            4. Başlat'a basın. İlk tahmin 2,56 sn (128 örnek, 50 Hz) sonra gelir, sonra her 1,28 sn'de (64 örnek) yenilenir.
            5. Kalibrasyon işe yaramazsa eksen eşlemede 8 hazır seçenekten birini deneyin: ayakta dururken Ayakta durma (STANDING), otururken Oturma (SITTING) görmelisiniz. Seçim değişince pencere sıfırdan dolar.
            6. Büyük etiket, son 3 pencerenin çoğunluk oyuyla yumuşatılmış tahmindir. Ham satırı tek pencerenin tahminini gösterir.
        """.trimIndent()

        private val LIMITS = """
            • Model UCI HAPT veri setiyle eğitildi: bele takılı Samsung Galaxy S II, 50 Hz. Farklı konumda, farklı cihazda ve farklı sensörlerle doğruluk düşebilir.
            • Doğruluk bu telefonda ölçülmedi. Projede ölçülen test sonucu bu telefon için geçerli değildir; uygulama yalnızca tahmin gösterir.
            • Kalibrasyondaki "pencere doğru" sayısı yalnızca o kısa kayıtlar içindir, genel doğruluk değildir. Yatma adımı sırtüstü yatmayı varsayar; HAPT'taki yatma sınıfı farklı yatış pozlarının ortalamasıdır.
            • Sensör olayları 50 Hz'den seyrek gelirse son değer tekrarlanır (zero-order hold). Örnekleme satırı gerçek olay hızını gösterir.
            • Postural transition'lar birkaç saniye sürer. Tek pencerede kaçabilir, yumuşatma da onları bastırabilir.
            • Uygulama arka plana geçince ölçüm durur, sensörler kapanır.
        """.trimIndent()
    }
}
