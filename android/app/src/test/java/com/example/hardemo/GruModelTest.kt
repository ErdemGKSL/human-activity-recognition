package com.example.hardemo

import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File
import kotlin.math.abs
import kotlin.math.sqrt

class GruModelTest {
    private fun modelFile(): File {
        val p = System.getProperty("har.model") ?: "src/main/assets/model.json"
        return File(p)
    }

    /** The exported test_vectors are PyTorch logits for raw-unit windows; Kotlin must match them. */
    @Test
    fun logitsMatchPyTorchTestVectors() {
        val json = JSONObject(modelFile().readText())
        val model = GruModel.fromJson(json)
        val tvs = json.getJSONArray("test_vectors")
        assertTrue("model.json has no test_vectors", tvs.length() > 0)
        var worst = 0.0
        for (i in 0 until tvs.length()) {
            val tv = tvs.getJSONObject(i)
            val rows = tv.getJSONArray("input")
            val x = FloatArray(model.window * model.channels)
            for (t in 0 until rows.length()) {
                val r = rows.getJSONArray(t)
                for (c in 0 until model.channels) x[t * model.channels + c] = r.getDouble(c).toFloat()
            }
            val expected = tv.getJSONArray("logits")
            val got = model.logits(x)
            assertEquals(expected.length(), got.size)
            for (k in got.indices) {
                val err = abs(got[k] - expected.getDouble(k))
                worst = maxOf(worst, err)
                assertTrue("vector $i logit $k: got ${got[k]} expected ${expected.getDouble(k)}", err < 1e-3)
            }
        }
        println("max |logit error| over ${tvs.length()} test vectors = $worst")
    }

    @Test
    fun repeatedCallsAreDeterministic() {
        val model = GruModel.fromJson(modelFile().readText())
        val x = FloatArray(model.window * model.channels) { (it % 7) * 0.1f - 0.3f }
        val a = model.logits(x).copyOf()
        model.logits(FloatArray(x.size)) // scratch buffers must not leak state between calls
        val b = model.logits(x)
        for (k in a.indices) assertEquals(a[k], b[k], 0f)
        val p = model.probabilities(x)
        assertEquals(1.0, p.sumOf { it.toDouble() }, 1e-5)
    }

    @Test
    fun uprightPhoneMapsGravityToHaptPlusX() {
        val upright = floatArrayOf(0f, STANDARD_GRAVITY, 0f)
        val out = FloatArray(3)
        for (m in AxisMapping.ALL) {
            m.mapAcc(upright, out, 0)
            assertEquals(1f, out[0], 1e-6f)
            assertEquals(0f, out[1], 1e-6f)
            assertEquals(0f, out[2], 1e-6f)
        }
    }

    @Test
    fun axisMappingsAreOrthonormalAndDefaultIsProper() {
        assertEquals(8, AxisMapping.ALL.size)
        assertEquals(1, AxisMapping.ALL[0].det)
        val proper = AxisMapping.ALL.filter { it.det == 1 }.map { it.id }
        assertEquals(listOf(1, 3, 5, 8), proper)
        // default [1]: (y_h, z_h) = (-x_a, +z_a); gyro uses the same matrix (det +1)
        val acc = FloatArray(3)
        val gyro = FloatArray(3)
        val v = floatArrayOf(1f, 2f, 3f)
        AxisMapping.ALL[0].mapAcc(floatArrayOf(STANDARD_GRAVITY, 2 * STANDARD_GRAVITY, 3 * STANDARD_GRAVITY), acc, 0)
        AxisMapping.ALL[0].mapGyro(v, gyro, 0)
        assertEquals(listOf(2f, -1f, 3f), acc.map { Math.round(it * 1e5f) / 1e5f })
        assertEquals(listOf(2f, -1f, 3f), gyro.toList())
        // every mapping preserves vector length
        for (m in AxisMapping.ALL) {
            m.mapGyro(v, gyro, 0)
            assertEquals(sqrt(14f), sqrt(gyro.sumOf { (it * it).toDouble() }).toFloat(), 1e-6f)
        }
    }

    @Test
    fun windowBufferEmitsAt128ThenEvery64InTimeOrder() {
        val wb = WindowBuffer(128, 64, 6)
        val s = FloatArray(6)
        val emitted = ArrayList<Pair<Int, FloatArray>>()
        for (n in 1..400) {
            s.fill(n.toFloat())
            wb.push(s)?.let { emitted.add(n to it) }
        }
        assertEquals(listOf(128, 192, 256, 320, 384), emitted.map { it.first })
        for ((n, w) in emitted) {
            for (t in 0 until 128) assertEquals((n - 127 + t).toFloat(), w[t * 6 + 5], 0f)
        }
        wb.clear()
        for (n in 1..127) assertNull(wb.push(s))
        assertNotNull(wb.push(s))
    }

    @Test
    fun smootherUsesMajorityOfLastThree() {
        val sm = MajoritySmoother(3, 3)
        fun p(vararg v: Float) = v
        assertEquals(0, sm.add(p(0.6f, 0.3f, 0.1f)).first)
        assertEquals(1, sm.add(p(0.1f, 0.8f, 0.1f)).first) // tie of 2: higher mean probability
        assertEquals(1, sm.add(p(0.2f, 0.7f, 0.1f)).first) // 2 of 3 vote class 1
        assertEquals(1, sm.add(p(0.1f, 0.2f, 0.7f)).first) // window 1 dropped; still 2 votes for 1
        val (idx, conf) = sm.add(p(0.1f, 0.1f, 0.8f))
        assertEquals(2, idx)
        assertEquals((0.1f + 0.7f + 0.8f) / 3f, conf, 1e-6f)
    }
}
