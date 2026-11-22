package com.example.hardemo

import org.json.JSONArray
import org.json.JSONObject
import kotlin.math.exp
import kotlin.math.max
import kotlin.math.tanh

/**
 * Dependency-free inference for the `har-gru-v1` export (experiments/har/export.py):
 * standardize, 2-layer bidirectional GRU (PyTorch gate order r, z, n), concat [fwd; bwd],
 * pool [mean over time; max over time], Linear(4H -> classes).
 *
 * Not thread-safe: all scratch buffers are preallocated and reused, so one instance belongs
 * to one thread (the app keeps it on the inference HandlerThread).
 */
class GruModel private constructor(
    val labels: List<String>,
    val window: Int,
    val rateHz: Int,
    private val mean: FloatArray,
    private val invStd: FloatArray,
    private val hidden: Int,
    private val dirs: Array<Direction>, // index = layer * 2 + (0 fwd, 1 bwd)
    private val headW: FloatArray,
    private val headB: FloatArray,
) {
    class Direction(val inDim: Int, val wih: FloatArray, val whh: FloatArray, val bih: FloatArray, val bhh: FloatArray)

    val channels = mean.size
    val numClasses = headB.size

    /** True for the random-weight development model (identity standardization). */
    val looksLikeDummy: Boolean = mean.all { it == 0f } && invStd.all { it == 1f }

    private val h2 = 2 * hidden
    private val xs = FloatArray(window * channels)
    private val out0 = FloatArray(window * h2)
    private val out1 = FloatArray(window * h2)
    private val h = FloatArray(hidden)
    private val hNew = FloatArray(hidden)
    private val gi = FloatArray(3 * hidden)
    private val gh = FloatArray(3 * hidden)
    private val feat = FloatArray(2 * h2)

    /**
     * [input] is window x channels, row-major (time-major), in raw units (acc g, gyro rad/s,
     * HAPT axis frame). Writes logits into [logits] (size [numClasses]) and returns it.
     */
    fun logits(input: FloatArray, logits: FloatArray = FloatArray(numClasses)): FloatArray {
        require(input.size == window * channels) { "input must be ${window}x$channels" }
        require(logits.size == numClasses)
        for (t in 0 until window) {
            val o = t * channels
            for (c in 0 until channels) xs[o + c] = (input[o + c] - mean[c]) * invStd[c]
        }
        runDirection(dirs[0], xs, out0, 0, reverse = false)
        runDirection(dirs[1], xs, out0, hidden, reverse = true)
        runDirection(dirs[2], out0, out1, 0, reverse = false)
        runDirection(dirs[3], out0, out1, hidden, reverse = true)

        // feat = [mean_t(out1) ; max_t(out1)], same order as torch.cat([out.mean(1), out.amax(1)], 1)
        for (j in 0 until h2) {
            var s = 0f
            var m = Float.NEGATIVE_INFINITY
            for (t in 0 until window) {
                val v = out1[t * h2 + j]
                s += v
                m = max(m, v)
            }
            feat[j] = s / window
            feat[h2 + j] = m
        }
        val fd = feat.size
        for (k in 0 until numClasses) {
            var s = headB[k]
            val row = k * fd
            for (j in 0 until fd) s += headW[row + j] * feat[j]
            logits[k] = s
        }
        return logits
    }

    /** Softmax probabilities for one window. */
    fun probabilities(input: FloatArray, out: FloatArray = FloatArray(numClasses)): FloatArray {
        logits(input, out)
        softmaxInPlace(out)
        return out
    }

    private fun runDirection(d: Direction, x: FloatArray, out: FloatArray, outOffset: Int, reverse: Boolean) {
        val hs = hidden
        val inDim = d.inDim
        val wih = d.wih
        val whh = d.whh
        h.fill(0f)
        for (step in 0 until window) {
            val t = if (reverse) window - 1 - step else step
            val xo = t * inDim
            for (row in 0 until 3 * hs) {
                var a = d.bih[row]
                val wo = row * inDim
                for (k in 0 until inDim) a += wih[wo + k] * x[xo + k]
                gi[row] = a
                var b = d.bhh[row]
                val ho = row * hs
                for (k in 0 until hs) b += whh[ho + k] * h[k]
                gh[row] = b
            }
            for (j in 0 until hs) {
                val r = sigmoid(gi[j] + gh[j])
                val z = sigmoid(gi[hs + j] + gh[hs + j])
                val n = tanh(gi[2 * hs + j] + r * gh[2 * hs + j])
                hNew[j] = (1f - z) * n + z * h[j]
            }
            val oo = t * h2 + outOffset
            for (j in 0 until hs) {
                h[j] = hNew[j]
                out[oo + j] = hNew[j]
            }
        }
    }

    companion object {
        const val FORMAT = "har-gru-v1"

        private fun sigmoid(v: Float): Float = 1f / (1f + exp(-v))

        fun softmaxInPlace(v: FloatArray) {
            var m = Float.NEGATIVE_INFINITY
            for (x in v) m = max(m, x)
            var s = 0f
            for (i in v.indices) {
                v[i] = exp(v[i] - m)
                s += v[i]
            }
            for (i in v.indices) v[i] /= s
        }

        fun fromJson(text: String): GruModel = fromJson(JSONObject(text))

        fun fromJson(o: JSONObject): GruModel {
            val format = o.getString("format")
            require(format == FORMAT) { "unsupported model format '$format' (expected $FORMAT)" }
            require(o.getBoolean("bidirectional")) { "only bidirectional GRU is supported" }
            require(o.getString("pool") == "meanmax") { "only meanmax pooling is supported" }
            val layersN = o.getInt("layers_n")
            require(layersN == 2) { "only 2 GRU layers are supported (got $layersN)" }
            val hidden = o.getInt("hidden")
            val window = o.getInt("window")
            val rate = o.getInt("rate_hz")
            val labelsJ = o.getJSONArray("labels")
            val labels = List(labelsJ.length()) { labelsJ.getString(it) }
            val mean = floats(o.getJSONArray("mean"))
            val std = floats(o.getJSONArray("std"))
            require(mean.size == std.size) { "mean/std length mismatch" }
            val invStd = FloatArray(std.size) { require(std[it] > 0f) { "std[$it] must be > 0" }; 1f / std[it] }
            val channels = mean.size

            val dirs = arrayOfNulls<Direction>(4)
            val gru = o.getJSONArray("gru")
            for (i in 0 until gru.length()) {
                val g = gru.getJSONObject(i)
                val layer = g.getInt("layer")
                val dirIdx = when (g.getString("dir")) {
                    "fwd" -> 0
                    "bwd" -> 1
                    else -> error("bad dir")
                }
                val inDim = if (layer == 0) channels else 2 * hidden
                val wih = matrix(g.getJSONArray("w_ih"), 3 * hidden, inDim, "w_ih l$layer")
                val whh = matrix(g.getJSONArray("w_hh"), 3 * hidden, hidden, "w_hh l$layer")
                val bih = floats(g.getJSONArray("b_ih")).also { require(it.size == 3 * hidden) }
                val bhh = floats(g.getJSONArray("b_hh")).also { require(it.size == 3 * hidden) }
                dirs[layer * 2 + dirIdx] = Direction(inDim, wih, whh, bih, bhh)
            }
            require(dirs.all { it != null }) { "missing GRU layer/direction weights" }
            val head = o.getJSONObject("head")
            val headB = floats(head.getJSONArray("b"))
            val headW = matrix(head.getJSONArray("w"), headB.size, 4 * hidden, "head.w")
            require(headB.size == labels.size) { "labels (${labels.size}) != head outputs (${headB.size})" }
            @Suppress("UNCHECKED_CAST")
            return GruModel(labels, window, rate, mean, invStd, hidden, dirs as Array<Direction>, headW, headB)
        }

        private fun floats(a: JSONArray): FloatArray = FloatArray(a.length()) { a.getDouble(it).toFloat() }

        private fun matrix(a: JSONArray, rows: Int, cols: Int, name: String): FloatArray {
            require(a.length() == rows) { "$name: expected $rows rows, got ${a.length()}" }
            val out = FloatArray(rows * cols)
            for (r in 0 until rows) {
                val row = a.getJSONArray(r)
                require(row.length() == cols) { "$name: expected $cols cols, got ${row.length()}" }
                for (c in 0 until cols) out[r * cols + c] = row.getDouble(c).toFloat()
            }
            return out
        }
    }
}
