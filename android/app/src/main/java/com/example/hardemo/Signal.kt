package com.example.hardemo

/** Standard gravity: TYPE_ACCELEROMETER reports m/s^2 including gravity, HAPT uses g. */
const val STANDARD_GRAVITY = 9.80665f

/**
 * Maps Android device axes (a) to the HAPT frame (h). Always x_h = +y_a, because a phone held
 * upright (portrait) reads gravity on +y while HAPT reads it on +x when standing. The (y_h, z_h)
 * pair is chosen by the user, since the real mounting is unknown.
 *
 * Each row of [m] says which device axis (0=x, 1=y, 2=z) and sign feeds that HAPT axis.
 * Acceleration (a polar vector) maps as h = M a. Angular rate is an axial vector, so it maps as
 * h = det(M) M w: for the four proper rotations (det +1, the default among them) this is the same
 * matrix; for the four mirror options (det -1) the gyro sign flips so that it stays consistent
 * with the accelerometer under the same mirrored frame.
 */
class AxisMapping(val id: Int, private val yAxis: Int, private val ySign: Int, private val zAxis: Int, private val zSign: Int) {
    val det: Int

    init {
        // rows: r1 = e_y, r2 = ySign * e_yAxis, r3 = zSign * e_zAxis
        val r1 = intArrayOf(0, 1, 0)
        val r2 = IntArray(3).also { it[yAxis] = ySign }
        val r3 = IntArray(3).also { it[zAxis] = zSign }
        val cx = r2[1] * r3[2] - r2[2] * r3[1]
        val cy = r2[2] * r3[0] - r2[0] * r3[2]
        val cz = r2[0] * r3[1] - r2[1] * r3[0]
        det = r1[0] * cx + r1[1] * cy + r1[2] * cz
        require(det == 1 || det == -1) { "axis mapping $id is not orthonormal" }
    }

    /** Writes the mapped acc (g) into out[offset..offset+2] from raw m/s^2 values in [v]. */
    fun mapAcc(v: FloatArray, out: FloatArray, offset: Int) {
        map(v, out, offset, 1f / STANDARD_GRAVITY)
    }

    /** Writes the mapped gyro (rad/s, no unit change) into out[offset..offset+2]. */
    fun mapGyro(v: FloatArray, out: FloatArray, offset: Int) {
        map(v, out, offset, det.toFloat())
    }

    private fun map(v: FloatArray, out: FloatArray, offset: Int, scale: Float) {
        out[offset] = v[1] * scale
        out[offset + 1] = ySign * v[yAxis] * scale
        out[offset + 2] = zSign * v[zAxis] * scale
    }

    val label: String
        get() {
            fun term(sign: Int, axis: Int) = (if (sign > 0) "+" else "−") + "xyz"[axis]
            val base = "[$id] x=+y, y=${term(ySign, yAxis)}, z=${term(zSign, zAxis)}"
            return when {
                id == 1 -> "$base (varsayılan)"
                det < 0 -> "$base (ayna)"
                else -> base
            }
        }

    companion object {
        private const val X = 0
        private const val Z = 2

        /** The eight (y_h, z_h) options, numbered as in the README; [1] is the default. */
        val ALL: List<AxisMapping> = listOf(
            AxisMapping(1, X, -1, Z, +1),
            AxisMapping(2, X, +1, Z, +1),
            AxisMapping(3, X, +1, Z, -1),
            AxisMapping(4, X, -1, Z, -1),
            AxisMapping(5, Z, +1, X, +1),
            AxisMapping(6, Z, -1, X, +1),
            AxisMapping(7, Z, +1, X, -1),
            AxisMapping(8, Z, -1, X, -1),
        )
    }
}

/**
 * 50 Hz ring buffer of 6-channel samples. Emits a time-ordered window copy once [window]
 * samples exist, then every [stride] samples. Not thread-safe: used only on the sensor thread.
 */
class WindowBuffer(val window: Int = 128, val stride: Int = 64, val channels: Int = 6) {
    private val ring = FloatArray(window * channels)
    private var write = 0
    private var count = 0L
    private var sinceEmit = 0

    val samples: Long get() = count

    fun clear() {
        write = 0
        count = 0
        sinceEmit = 0
    }

    /** Appends one sample (channels values from [s]); returns a new window array when one is due. */
    fun push(s: FloatArray): FloatArray? {
        System.arraycopy(s, 0, ring, write * channels, channels)
        write = (write + 1) % window
        count++
        sinceEmit++
        if (count < window) return null
        if (count > window && sinceEmit < stride) return null
        sinceEmit = 0
        // oldest sample is at `write` now that the ring is full
        val out = FloatArray(window * channels)
        val head = (window - write) * channels
        System.arraycopy(ring, write * channels, out, 0, head)
        System.arraycopy(ring, 0, out, head, write * channels)
        return out
    }
}

/**
 * Majority vote over the last [n] windows' argmax. Without a majority (all different), the
 * class with the highest mean probability over those windows wins. The reported confidence
 * is the mean probability of the chosen class over the kept windows.
 */
class MajoritySmoother(private val n: Int = 3, private val classes: Int) {
    private val history = ArrayDeque<FloatArray>()

    fun clear() = history.clear()

    fun add(probs: FloatArray): Pair<Int, Float> {
        history.addLast(probs.copyOf())
        while (history.size > n) history.removeFirst()
        val votes = IntArray(classes)
        val meanP = FloatArray(classes)
        for (p in history) {
            votes[argmax(p)]++
            for (i in 0 until classes) meanP[i] += p[i] / history.size
        }
        val top = votes.max()
        val best = if (top * 2 > history.size) {
            votes.indexOfFirst { it == top }
        } else {
            argmax(meanP)
        }
        return best to meanP[best]
    }

    companion object {
        fun argmax(p: FloatArray): Int {
            var b = 0
            for (i in 1 until p.size) if (p[i] > p[b]) b = i
            return b
        }
    }
}

/** Turkish display names; the class order itself always comes from model.json `labels`. */
object TurkishLabels {
    private val names = mapOf(
        "WALKING" to "Yürüme",
        "WALKING_UPSTAIRS" to "Merdiven çıkma",
        "WALKING_DOWNSTAIRS" to "Merdiven inme",
        "SITTING" to "Oturma",
        "STANDING" to "Ayakta durma",
        "LAYING" to "Uzanma",
        "STAND_TO_SIT" to "Ayaktan oturmaya",
        "SIT_TO_STAND" to "Oturmadan kalkma",
        "SIT_TO_LIE" to "Oturmadan uzanmaya",
        "LIE_TO_SIT" to "Uzanmadan oturmaya",
        "STAND_TO_LIE" to "Ayaktan uzanmaya",
        "LIE_TO_STAND" to "Uzanmadan kalkma",
    )

    fun of(label: String): String = names[label] ?: label
}
