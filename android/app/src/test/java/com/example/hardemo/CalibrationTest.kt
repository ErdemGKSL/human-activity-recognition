package com.example.hardemo

import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File
import java.util.Random
import kotlin.math.cos
import kotlin.math.sin
import kotlin.math.sqrt

class CalibrationTest {
    private fun modelFile(): File = File(System.getProperty("har.model") ?: "src/main/assets/model.json")

    private fun axisAngle(axis: DoubleArray, deg: Double): DoubleArray {
        val n = Mat3.norm(axis)
        val x = axis[0] / n
        val y = axis[1] / n
        val z = axis[2] / n
        val t = Math.toRadians(deg)
        val c = cos(t)
        val s = sin(t)
        val k = 1 - c
        return doubleArrayOf(
            c + x * x * k, x * y * k - z * s, x * z * k + y * s,
            y * x * k + z * s, c + y * y * k, y * z * k - x * s,
            z * x * k - y * s, z * y * k + x * s, c + z * z * k,
        )
    }

    private fun randomRotation(rng: Random): DoubleArray =
        axisAngle(doubleArrayOf(rng.nextGaussian(), rng.nextGaussian(), rng.nextGaussian()), rng.nextDouble() * 180.0)

    private fun assertProper(r: DoubleArray) {
        assertTrue("orthonormal, err ${Mat3.orthonormalityError(r)}", Mat3.orthonormalityError(r) < 1e-9)
        assertEquals(1.0, Mat3.det(r), 1e-9)
    }

    private val pop = Posture.entries.map { it.haptGravity }

    /** u_i = R0ᵀ v_i: the phone frame that a rotation R0 (phone -> HAPT) would produce. */
    private fun phoneVectors(r0: DoubleArray) = pop.map { Mat3.apply(Mat3.transpose(r0), it) }

    @Test
    fun wahbaRecoversKnownRotationWithoutNoise() {
        val r0 = axisAngle(doubleArrayOf(1.0, 2.0, 3.0), 100.0)
        val u = phoneVectors(r0)
        val r = Calibration.solve(u[0], u[1], u[2])
        assertProper(r)
        val err = Mat3.angleBetweenDeg(r, r0)
        assertTrue("angle error $err deg", err <= 0.01)
    }

    @Test
    fun wahbaRandomRotationsExactAndNoisy() {
        val rng = Random(7)
        // edge cases for the eigen-solver: identity, 180 deg turns, a mirror-like preset that is a rotation
        val cases = mutableListOf(Mat3.identity(), axisAngle(doubleArrayOf(0.0, 0.0, 1.0), 180.0), axisAngle(doubleArrayOf(1.0, 1.0, 0.0), 180.0))
        repeat(50) { cases.add(randomRotation(rng)) }
        var worstNoisy = 0.0
        for (r0 in cases) {
            val u = phoneVectors(r0)
            val r = Calibration.solve(u[0], u[1], u[2])
            assertProper(r)
            assertTrue(Mat3.angleBetweenDeg(r, r0) <= 0.01)
            // 0.02 g of noise per axis, about what a still phone plus small posture differences give
            val noisy = u.map { v -> DoubleArray(3) { v[it] + 0.02 * rng.nextGaussian() } }
            val rn = Calibration.solve(noisy[0], noisy[1], noisy[2])
            assertProper(rn)
            worstNoisy = maxOf(worstNoisy, Mat3.angleBetweenDeg(rn, r0))
        }
        println("worst noisy Wahba error = $worstNoisy deg")
        assertTrue("noisy error $worstNoisy deg", worstNoisy < 5.0)
    }

    @Test
    fun wahbaMatchesSvdFormulaOnGeneralInput() {
        // Unequal lengths and directions (not an exact rotation): compare with a brute check that
        // no small perturbation of R lowers the Wahba loss.
        val u = listOf(doubleArrayOf(0.1, 0.98, 0.05), doubleArrayOf(-0.3, 0.9, 0.2), doubleArrayOf(0.2, 0.1, 0.95))
        val r = Calibration.solve(u[0], u[1], u[2])
        fun loss(m: DoubleArray) = Posture.entries.indices.sumOf { i ->
            val d = Mat3.apply(m, u[i])
            val v = pop[i]
            Posture.entries[i].weight * ((d[0] - v[0]) * (d[0] - v[0]) + (d[1] - v[1]) * (d[1] - v[1]) + (d[2] - v[2]) * (d[2] - v[2]))
        }
        val base = loss(r)
        val rng = Random(3)
        repeat(200) {
            val p = Mat3.mul(axisAngle(doubleArrayOf(rng.nextGaussian(), rng.nextGaussian(), rng.nextGaussian()), 0.5), r)
            assertTrue(loss(p) >= base - 1e-12)
        }
    }

    // ---- real HAPT data (experiments/make_calib_testdata.py) -------------------------------

    private fun doubles(a: JSONArray) = DoubleArray(a.length()) { a.getDouble(it) }

    private fun windows(a: JSONArray): List<FloatArray> = List(a.length()) { i ->
        val w = a.getJSONArray(i)
        val out = FloatArray(w.length() * 6)
        for (t in 0 until w.length()) {
            val row = w.getJSONArray(t)
            for (c in 0 until 6) out[t * 6 + c] = row.getDouble(c).toFloat()
        }
        out
    }

    private fun meanAcc(ws: List<FloatArray>): DoubleArray {
        val s = DoubleArray(3)
        var n = 0
        for (w in ws) for (t in 0 until w.size / 6) {
            for (c in 0 until 3) s[c] += w[t * 6 + c]
            n++
        }
        return DoubleArray(3) { s[it] / n }
    }

    @Test
    fun realHaptDataCalibratesAndClassifies() {
        val text = javaClass.classLoader!!.getResource("calib_testdata.json")!!.readText()
        val d = JSONObject(text)
        val p = doubles(d.getJSONArray("P"))
        val expectedR = doubles(d.getJSONArray("expected_R"))
        val wj = d.getJSONObject("windows")
        val ws = mapOf(
            Posture.STANDING to windows(wj.getJSONArray("standing")),
            Posture.SITTING to windows(wj.getJSONArray("sitting")),
            Posture.LAYING to windows(wj.getJSONArray("laying")),
        )
        // the population vectors in the file must be the ones the app uses
        val pg = d.getJSONObject("population_gravity")
        for ((p0, key) in listOf(Posture.STANDING to "standing", Posture.SITTING to "sitting", Posture.LAYING to "laying")) {
            val v = doubles(pg.getJSONArray(key))
            for (i in 0 until 3) assertEquals(v[i], p0.haptGravity[i], 1e-4)
        }
        val r = Calibration.solve(meanAcc(ws.getValue(Posture.STANDING)), meanAcc(ws.getValue(Posture.SITTING)), meanAcc(ws.getValue(Posture.LAYING)))
        assertProper(r)
        val vsExpected = Mat3.angleBetweenDeg(r, expectedR)
        val err = Mat3.angleDeg(Mat3.mul(r, p))
        println("R vs expected_R = $vsExpected deg; R·P vs I = $err deg (expected ${d.getDouble("expected_angle_error_deg")})")
        assertTrue("R vs expected_R $vsExpected deg", vsExpected < 0.5)
        assertEquals(d.getDouble("expected_angle_error_deg"), err, 1.0)

        val model = GruModel.fromJson(modelFile().readText())
        val ef = d.getJSONObject("expected_correct_fraction")
        for ((posture, key) in listOf(Posture.STANDING to "standing", Posture.SITTING to "sitting", Posture.LAYING to "laying")) {
            val list = ws.getValue(posture)
            val c = Calibration.correctCount(model, list, r, model.labels.indexOf(posture.haptLabel))
            val frac = c.toDouble() / list.size
            println("$key: $c/${list.size} windows correct")
            assertTrue("$key fraction $frac", frac >= ef.getDouble(key) - 0.1)
        }
    }

    @Test
    fun analyzeOnConcatenatedRealRecordingIsGood() {
        // Rebuild a continuous 6 x 64 + 64 sample stream per posture from the 50 %-overlapping
        // windows, which is how the app records, and run the full app analysis.
        val d = JSONObject(javaClass.classLoader!!.getResource("calib_testdata.json")!!.readText())
        val wj = d.getJSONObject("windows")
        fun stream(key: String): FloatArray {
            val ws = windows(wj.getJSONArray(key))
            val n = 128 + 64 * (ws.size - 1)
            val out = FloatArray(n * 6)
            for ((i, w) in ws.withIndex()) System.arraycopy(w, 0, out, i * 64 * 6, w.size)
            return out
        }
        val rec = mapOf(Posture.STANDING to stream("standing"), Posture.SITTING to stream("sitting"), Posture.LAYING to stream("laying"))
        val model = GruModel.fromJson(modelFile().readText())
        val res = Calibration.analyze(model, rec, discard = 0)
        assertProper(res.r)
        for (pr in res.postures) assertEquals(5, pr.total)
        assertTrue(res.quality.reasons.joinToString(), res.quality.good)
    }

    // ---- quality rule, stats, store, spinner ----------------------------------------------

    @Test
    fun qualityRule() {
        val ok = listOf(4 to 4, 3 to 4, 3 to 5)
        assertTrue(CalibrationQuality.isGood(ok, 1.0))
        assertTrue(CalibrationQuality.isGood(listOf(3 to 5, 3 to 5, 3 to 5), 0.8)) // 60 % and 0.8 g are inclusive
        assertTrue(CalibrationQuality.isGood(ok, 1.2))
        assertFalse(CalibrationQuality.isGood(listOf(4 to 4, 2 to 4, 4 to 4), 1.0)) // one posture at 50 %
        assertFalse(CalibrationQuality.isGood(ok, 0.79))
        assertFalse(CalibrationQuality.isGood(ok, 1.21))
        assertFalse(CalibrationQuality.isGood(listOf(4 to 4, 0 to 0, 4 to 4), 1.0)) // no windows
    }

    private fun stillRecording(n: Int, acc: DoubleArray, jitter: Double = 0.0, seed: Long = 1): FloatArray {
        val rng = Random(seed)
        return FloatArray(n * 6) { i -> if (i % 6 < 3) (acc[i % 6] + jitter * rng.nextGaussian()).toFloat() else 0f }
    }

    @Test
    fun postureStatsDropsTheStartAndFlagsMotion() {
        val rec = stillRecording(400, doubleArrayOf(0.0, 1.0, 0.0))
        for (t in 0 until 75) rec[t * 6] = 5f // settling at the start must not count
        val s = PostureStats.of(rec, 75)
        assertEquals(325, s.samples)
        assertEquals(0.0, s.meanAcc[0], 1e-9)
        assertEquals(1.0, s.accNorm, 1e-6)
        assertTrue(s.maxAccStd < 1e-6)
        assertEquals(4, Calibration.windows(rec, 75).size) // (325 - 128) / 64 + 1
        val moving = PostureStats.of(stillRecording(400, doubleArrayOf(0.0, 1.0, 0.0), jitter = 0.2), 75)
        assertTrue(moving.maxAccStd > CalibrationQuality.MOTION_ACC_STD)
    }

    @Test
    fun lowConfidenceExplainsWhy() {
        // laying recorded while still standing: the model will not see LAYING, and the hint says so
        val stand = stillRecording(400, doubleArrayOf(0.0, 1.0, 0.0))
        val sit = stillRecording(400, doubleArrayOf(0.1, 0.98, 0.15))
        val model = GruModel.fromJson(modelFile().readText())
        val res = Calibration.analyze(model, mapOf(Posture.STANDING to stand, Posture.SITTING to sit, Posture.LAYING to stand.copyOf()), 75)
        assertFalse(res.quality.good)
        assertTrue(res.quality.text.startsWith("Düşük güven"))
        assertTrue(res.quality.reasons.joinToString(), res.quality.reasons.any { "sırtüstü" in it })
    }

    @Test
    fun storeRoundTripsAndRejectsBadValues() {
        val r = axisAngle(doubleArrayOf(1.0, -2.0, 0.5), 73.0)
        val back = CalibrationStore.decode(CalibrationStore.encode(r))
        assertNotNull(back)
        for (i in 0 until 9) assertEquals(r[i], back!![i], 0.0)
        assertNull(CalibrationStore.decode(null))
        assertNull(CalibrationStore.decode(""))
        assertNull(CalibrationStore.decode("1,0,0,0,1,0,0,0"))
        assertNull(CalibrationStore.decode("1,0,0,0,1,0,0,0,x"))
        assertNull(CalibrationStore.decode("1,0,0,0,1,0,0,0,-1")) // mirror
        assertNull(CalibrationStore.decode("2,0,0,0,1,0,0,0,1")) // not orthonormal
    }

    @Test
    fun spinnerChoices() {
        val none = MappingChoices.options(null)
        assertEquals(8, none.size)
        assertEquals(AxisMapping.ALL.map { it.label }, none.map { it.label })
        val r = axisAngle(doubleArrayOf(0.0, 1.0, 0.0), 30.0)
        val with = MappingChoices.options(r)
        assertEquals(9, with.size)
        assertEquals(MappingChoices.CALIBRATED_KEY, with[0].key)
        assertEquals("Kalibre edilmiş", with[0].label)
        assertTrue(with[0].mapping.isCalibrated)

        assertEquals(MappingChoices.CALIBRATED_KEY, MappingChoices.initialKey(true, "preset:3", 2))
        assertEquals("preset:3", MappingChoices.initialKey(false, "preset:3", 5))
        assertEquals("preset:6", MappingChoices.initialKey(false, null, 5)) // legacy position 5 = [6]
        assertEquals("preset:1", MappingChoices.initialKey(false, MappingChoices.CALIBRATED_KEY, null)) // calibration was deleted
        assertEquals("preset:1", MappingChoices.initialKey(false, "preset:99", 42))

        assertEquals(0, MappingChoices.indexOf(with, MappingChoices.CALIBRATED_KEY))
        assertEquals(3, MappingChoices.indexOf(with, "preset:3"))
        assertEquals(0, MappingChoices.indexOf(none, MappingChoices.CALIBRATED_KEY)) // falls back to [1]
    }

    @Test
    fun calibratedMappingRotatesAccAndGyroAlike() {
        val r = axisAngle(doubleArrayOf(1.0, 2.0, 3.0), 100.0)
        val m = AxisMapping.calibrated(r)
        assertEquals(1, m.det)
        val v = floatArrayOf(0.3f, -1.2f, 2.0f)
        val acc = FloatArray(3)
        val gyro = FloatArray(3)
        m.mapAcc(FloatArray(3) { v[it] * STANDARD_GRAVITY }, acc, 0)
        m.mapGyro(v, gyro, 0)
        val exp = Mat3.apply(r, DoubleArray(3) { v[it].toDouble() })
        for (i in 0 until 3) {
            assertEquals(exp[i], acc[i].toDouble(), 1e-5)
            assertEquals(exp[i], gyro[i].toDouble(), 1e-5)
        }
        // presets expressed as matrices keep their determinant (mirror gyro rule only for det -1)
        assertEquals(listOf(1, -1, 1, -1, 1, -1, -1, 1), AxisMapping.ALL.map { it.det })
        assertEquals(sqrt(14.0), Mat3.norm(Mat3.apply(r, doubleArrayOf(1.0, 2.0, 3.0))), 1e-12)
    }
}
