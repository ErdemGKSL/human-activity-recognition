package com.example.hardemo

/** Standard gravity: TYPE_ACCELEROMETER reports m/s^2 including gravity, HAPT uses g. */
const val STANDARD_GRAVITY = 9.80665f

/**
 * Maps Android device axes (a) to the HAPT frame (h) with a 3x3 matrix M (row-major [matrix]).
 * Acceleration (a polar vector) maps as h = M a. Angular rate is an axial vector, so it maps as
 * h = det(M) M w: for proper rotations (det +1) this is the same matrix; for a mirror (det -1)
 * the gyro sign flips so that it stays consistent with the accelerometer in the same frame.
 *
 * Two kinds exist. The eight presets ([ALL]) always use x_h = +y_a, because a phone held upright
 * (portrait) reads gravity on +y while HAPT reads it on +x when standing; the (y_h, z_h) pair is
 * picked by the user. Four of them are mirrors (det -1), the only case where the gyro flips.
 * [calibrated] wraps the rotation R found by the calibration (always det +1).
 */
class AxisMapping private constructor(val id: Int, m: DoubleArray, private val presetLabel: String?) {
    /** Row-major M as floats, used on the sensor thread every 20 ms. */
    val matrix: FloatArray = FloatArray(9) { m[it].toFloat() }
    val det: Int
    private val gyroMatrix: FloatArray

    init {
        require(m.size == 9 && m.all { it.isFinite() }) { "axis mapping $id needs 9 finite entries" }
        require(Mat3.orthonormalityError(m) < 1e-3) { "axis mapping $id is not orthonormal" }
        det = if (Mat3.det(m) > 0) 1 else -1
        gyroMatrix = FloatArray(9) { matrix[it] * det }
    }

    val isCalibrated: Boolean get() = id == CALIBRATED_ID

    /** Writes the mapped acc (g) into out[offset..offset+2] from raw m/s^2 values in [v]. */
    fun mapAcc(v: FloatArray, out: FloatArray, offset: Int) {
        map(matrix, v, out, offset, 1f / STANDARD_GRAVITY)
    }

    /** Writes the mapped gyro (rad/s, no unit change) into out[offset..offset+2]. */
    fun mapGyro(v: FloatArray, out: FloatArray, offset: Int) {
        map(gyroMatrix, v, out, offset, 1f)
    }

    // The sum is formed before scaling, so presets (entries 0/±1) give exactly ±v[k] * scale.
    private fun map(mm: FloatArray, v: FloatArray, out: FloatArray, offset: Int, scale: Float) {
        val x = v[0]
        val y = v[1]
        val z = v[2]
        for (r in 0 until 3) out[offset + r] = (mm[r * 3] * x + mm[r * 3 + 1] * y + mm[r * 3 + 2] * z) * scale
    }

    val label: String
        get() = when {
            presetLabel == null -> MappingChoices.CALIBRATED_LABEL
            id == 1 -> "$presetLabel (varsayılan)"
            det < 0 -> "$presetLabel (ayna)"
            else -> presetLabel
        }

    companion object {
        const val CALIBRATED_ID = 0
        private const val X = 0
        private const val Z = 2

        /** Preset: x_h = +y_a, y_h = ySign * a[yAxis], z_h = zSign * a[zAxis]. */
        fun preset(id: Int, yAxis: Int, ySign: Int, zAxis: Int, zSign: Int): AxisMapping {
            val m = DoubleArray(9)
            m[1] = 1.0
            m[3 + yAxis] = ySign.toDouble()
            m[6 + zAxis] = zSign.toDouble()
            fun term(sign: Int, axis: Int) = (if (sign > 0) "+" else "−") + "xyz"[axis]
            return AxisMapping(id, m, "[$id] x=+y, y=${term(ySign, yAxis)}, z=${term(zSign, zAxis)}")
        }

        /** The calibration result R (a_hapt = R a_app); must be a proper rotation. */
        fun calibrated(r: DoubleArray): AxisMapping {
            require(Mat3.isProperRotation(r)) { "calibration matrix is not a proper rotation" }
            return AxisMapping(CALIBRATED_ID, r, null)
        }

        /** The eight (y_h, z_h) options, numbered as in the README; [1] is the default. */
        val ALL: List<AxisMapping> = listOf(
            preset(1, X, -1, Z, +1),
            preset(2, X, +1, Z, +1),
            preset(3, X, +1, Z, -1),
            preset(4, X, -1, Z, -1),
            preset(5, Z, +1, X, +1),
            preset(6, Z, -1, X, +1),
            preset(7, Z, +1, X, -1),
            preset(8, Z, -1, X, -1),
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
