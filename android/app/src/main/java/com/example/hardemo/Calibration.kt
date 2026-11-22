package com.example.hardemo

import java.util.Locale
import kotlin.math.abs
import kotlin.math.acos
import kotlin.math.sqrt

/**
 * The three calibration postures, in recording order. [haptGravity] is the mean gravity vector
 * (g, HAPT frame) of the HAPT training subjects in that posture (experiments/calib_sim2.py,
 * `pop_means`). LAYING is weighted twice because its vector is the most different from the
 * other two and fixes the rotation about the vertical axis.
 */
enum class Posture(
    val haptLabel: String,
    val title: String,
    val shortName: String,
    val instruction: String,
    val haptGravity: DoubleArray,
    val weight: Double,
) {
    STANDING(
        "STANDING", "AYAKTA", "Ayakta",
        "Telefon belinde dik takılı, ayakta dur ve kıpırdama",
        doubleArrayOf(1.0023, -0.1609, -0.0251), 1.0,
    ),
    SITTING(
        "SITTING", "OTURURKEN", "Oturma",
        "Telefon belinde dik takılı kalsın, sandalyeye otur ve kıpırdama",
        doubleArrayOf(0.9521, 0.1455, 0.1550), 1.0,
    ),
    LAYING(
        "LAYING", "SIRTÜSTÜ YATARKEN", "Yatma",
        "Telefon belinde kalsın, sırtüstü uzan ve kıpırdama",
        doubleArrayOf(0.0787, 0.6636, 0.5458), 2.0,
    ),
}

/** Row-major 3x3 helpers in double precision. */
object Mat3 {
    fun identity() = doubleArrayOf(1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0)

    fun mul(a: DoubleArray, b: DoubleArray): DoubleArray {
        val out = DoubleArray(9)
        for (r in 0 until 3) for (c in 0 until 3) {
            var s = 0.0
            for (k in 0 until 3) s += a[r * 3 + k] * b[k * 3 + c]
            out[r * 3 + c] = s
        }
        return out
    }

    fun transpose(a: DoubleArray) = DoubleArray(9) { a[(it % 3) * 3 + it / 3] }

    fun apply(a: DoubleArray, v: DoubleArray) = DoubleArray(3) { r -> a[r * 3] * v[0] + a[r * 3 + 1] * v[1] + a[r * 3 + 2] * v[2] }

    fun det(a: DoubleArray): Double =
        a[0] * (a[4] * a[8] - a[5] * a[7]) - a[1] * (a[3] * a[8] - a[5] * a[6]) + a[2] * (a[3] * a[7] - a[4] * a[6])

    /** Rotation angle of a rotation matrix, degrees. */
    fun angleDeg(r: DoubleArray): Double = Math.toDegrees(acos(((r[0] + r[4] + r[8] - 1.0) / 2.0).coerceIn(-1.0, 1.0)))

    /** Angle of the relative rotation between two rotation matrices, degrees. */
    fun angleBetweenDeg(a: DoubleArray, b: DoubleArray): Double = angleDeg(mul(transpose(a), b))

    /** max |RᵀR - I| entry; 0 for an exactly orthonormal matrix. */
    fun orthonormalityError(r: DoubleArray): Double {
        val g = mul(transpose(r), r)
        val i = identity()
        return g.indices.maxOf { abs(g[it] - i[it]) }
    }

    fun isProperRotation(r: DoubleArray, tol: Double = 1e-3): Boolean =
        r.size == 9 && r.all { it.isFinite() } && orthonormalityError(r) < tol && abs(det(r) - 1.0) < tol

    fun norm(v: DoubleArray) = sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2])

    fun angleBetweenVectorsDeg(a: DoubleArray, b: DoubleArray): Double {
        val na = norm(a)
        val nb = norm(b)
        if (na == 0.0 || nb == 0.0) return 180.0
        return Math.toDegrees(acos(((a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) / (na * nb)).coerceIn(-1.0, 1.0)))
    }
}

/**
 * Wahba's problem: the proper rotation R minimizing Σ w_i |R u_i - v_i|². Solved with
 * Davenport's q-method (the quaternion form of Horn's method): the optimal quaternion is the
 * eigenvector of the largest eigenvalue of a symmetric 4x4 matrix K built from
 * B = Σ w_i v_i u_iᵀ. This gives the same R as the SVD solution U diag(1, 1, det(U Vᵀ)) Vᵀ,
 * always with det +1, and needs only a symmetric eigensolver (Jacobi below).
 */
object Wahba {
    fun solve(u: List<DoubleArray>, v: List<DoubleArray>, w: DoubleArray): DoubleArray {
        require(u.size == v.size && u.size == w.size && u.isNotEmpty()) { "u, v, w must have the same non-zero length" }
        val b = DoubleArray(9)
        for (i in u.indices) for (r in 0 until 3) for (c in 0 until 3) b[r * 3 + c] += w[i] * v[i][r] * u[i][c]
        require(b.all { it.isFinite() }) { "non-finite input" }
        val tr = b[0] + b[4] + b[8]
        val z = doubleArrayOf(b[5] - b[7], b[6] - b[2], b[1] - b[3])
        val k = Array(4) { DoubleArray(4) }
        for (r in 0 until 3) {
            for (c in 0 until 3) k[r][c] = b[r * 3 + c] + b[c * 3 + r] - if (r == c) tr else 0.0
            k[r][3] = z[r]
            k[3][r] = z[r]
        }
        k[3][3] = tr
        val (values, vectors) = jacobiEigen(k)
        var best = 0
        for (i in 1 until 4) if (values[i] > values[best]) best = i
        val q1 = vectors[0][best]
        val q2 = vectors[1][best]
        val q3 = vectors[2][best]
        val q4 = vectors[3][best]
        val n = sqrt(q1 * q1 + q2 * q2 + q3 * q3 + q4 * q4)
        return quaternionToMatrix(q1 / n, q2 / n, q3 / n, q4 / n)
    }

    /** A(q) = (q4² - |q|²) I + 2 q qᵀ - 2 q4 [q×], the attitude matrix convention of the q-method. */
    private fun quaternionToMatrix(x: Double, y: Double, z: Double, s: Double): DoubleArray {
        val d = s * s - (x * x + y * y + z * z)
        return doubleArrayOf(
            d + 2 * x * x, 2 * x * y + 2 * s * z, 2 * x * z - 2 * s * y,
            2 * y * x - 2 * s * z, d + 2 * y * y, 2 * y * z + 2 * s * x,
            2 * z * x + 2 * s * y, 2 * z * y - 2 * s * x, d + 2 * z * z,
        )
    }

    /** Cyclic Jacobi for a small symmetric matrix. Returns eigenvalues and eigenvectors (columns). */
    fun jacobiEigen(input: Array<DoubleArray>): Pair<DoubleArray, Array<DoubleArray>> {
        val n = input.size
        val a = Array(n) { input[it].copyOf() }
        val v = Array(n) { r -> DoubleArray(n) { c -> if (r == c) 1.0 else 0.0 } }
        repeat(100) {
            var off = 0.0
            var scale = 0.0
            for (p in 0 until n) for (q in 0 until n) {
                if (p != q) off += a[p][q] * a[p][q]
                scale += a[p][q] * a[p][q]
            }
            if (off <= 1e-30 * maxOf(scale, 1e-300)) return DoubleArray(n) { a[it][it] } to v
            for (p in 0 until n - 1) for (q in p + 1 until n) {
                if (a[p][q] == 0.0) continue
                val theta = (a[q][q] - a[p][p]) / (2 * a[p][q])
                val t = (if (theta >= 0) 1.0 else -1.0) / (abs(theta) + sqrt(theta * theta + 1))
                val c = 1 / sqrt(t * t + 1)
                val s = t * c
                for (k in 0 until n) {
                    val akp = a[k][p]
                    val akq = a[k][q]
                    a[k][p] = c * akp - s * akq
                    a[k][q] = s * akp + c * akq
                }
                for (k in 0 until n) {
                    val apk = a[p][k]
                    val aqk = a[q][k]
                    a[p][k] = c * apk - s * aqk
                    a[q][k] = s * apk + c * aqk
                }
                for (k in 0 until n) {
                    val vkp = v[k][p]
                    val vkq = v[k][q]
                    v[k][p] = c * vkp - s * vkq
                    v[k][q] = s * vkp + c * vkq
                }
            }
        }
        return DoubleArray(n) { a[it][it] } to v
    }
}

/** Summary of one posture recording: raw phone-frame samples [acc g, gyro rad/s] x n. */
class PostureStats(val meanAcc: DoubleArray, val maxAccStd: Double, val meanGyroNorm: Double, val samples: Int) {
    val accNorm: Double get() = Mat3.norm(meanAcc)

    companion object {
        /** [rec] holds n x 6 samples; the first [discard] samples are left out of every statistic. */
        fun of(rec: FloatArray, discard: Int): PostureStats {
            val n = rec.size / 6 - discard
            require(n > 0) { "recording too short" }
            val sum = DoubleArray(3)
            val sq = DoubleArray(3)
            var gyro = 0.0
            for (t in discard until discard + n) {
                val o = t * 6
                for (c in 0 until 3) {
                    val x = rec[o + c].toDouble()
                    sum[c] += x
                    sq[c] += x * x
                }
                val gx = rec[o + 3].toDouble()
                val gy = rec[o + 4].toDouble()
                val gz = rec[o + 5].toDouble()
                gyro += sqrt(gx * gx + gy * gy + gz * gz)
            }
            val mean = DoubleArray(3) { sum[it] / n }
            val std = (0 until 3).maxOf { sqrt(maxOf(0.0, sq[it] / n - mean[it] * mean[it])) }
            return PostureStats(mean, std, gyro / n, n)
        }
    }
}

object Calibration {
    const val WINDOW = 128
    const val STRIDE = 64

    /** R with a_hapt = R a_app, from the mean phone-frame accelerations (g) of the three postures. */
    fun solve(uStand: DoubleArray, uSit: DoubleArray, uLay: DoubleArray): DoubleArray {
        val ps = Posture.entries
        val u = listOf(uStand, uSit, uLay)
        return Wahba.solve(u, ps.map { it.haptGravity }, DoubleArray(3) { ps[it].weight })
    }

    /** Windows of [window] samples every [stride] samples over [rec] (n x 6), starting at [from]. */
    fun windows(rec: FloatArray, from: Int = 0, window: Int = WINDOW, stride: Int = STRIDE): List<FloatArray> {
        val n = rec.size / 6
        val out = ArrayList<FloatArray>()
        var s = from
        while (s + window <= n) {
            out.add(rec.copyOfRange(s * 6, (s + window) * 6))
            s += stride
        }
        return out
    }

    /** Applies the same R to acc and gyro of every sample (R is a proper rotation, so no gyro sign change). */
    fun rotate(w: FloatArray, r: DoubleArray): FloatArray {
        val out = FloatArray(w.size)
        val n = w.size / 6
        for (t in 0 until n) for (part in 0 until 2) {
            val o = t * 6 + part * 3
            val x = w[o].toDouble()
            val y = w[o + 1].toDouble()
            val z = w[o + 2].toDouble()
            for (row in 0 until 3) out[o + row] = (r[row * 3] * x + r[row * 3 + 1] * y + r[row * 3 + 2] * z).toFloat()
        }
        return out
    }

    /** Number of [windows] (phone frame) that the model classifies as [labelIndex] after rotating by R. */
    fun correctCount(model: GruModel, windows: List<FloatArray>, r: DoubleArray, labelIndex: Int): Int {
        if (labelIndex < 0) return 0
        val p = FloatArray(model.numClasses)
        return windows.count { MajoritySmoother.argmax(model.probabilities(rotate(it, r), p)) == labelIndex }
    }

    class PostureResult(val posture: Posture, val stats: PostureStats, val correct: Int, val total: Int, val residualDeg: Double) {
        val fraction: Double get() = if (total == 0) 0.0 else correct.toDouble() / total
    }

    class Result(val r: DoubleArray, val postures: List<PostureResult>, val quality: CalibrationQuality.Verdict)

    /**
     * Full analysis for the app: per-posture means (first [discard] samples dropped), R, then the
     * GRU on 128/64 windows of the kept samples, rotated into the HAPT frame.
     */
    fun analyze(model: GruModel, recordings: Map<Posture, FloatArray>, discard: Int): Result {
        val stats = Posture.entries.associateWith { PostureStats.of(recordings.getValue(it), discard) }
        val r = solve(stats.getValue(Posture.STANDING).meanAcc, stats.getValue(Posture.SITTING).meanAcc, stats.getValue(Posture.LAYING).meanAcc)
        val results = Posture.entries.map { p ->
            val ws = windows(recordings.getValue(p), discard)
            val st = stats.getValue(p)
            val correct = correctCount(model, ws, r, model.labels.indexOf(p.haptLabel))
            PostureResult(p, st, correct, ws.size, Mat3.angleBetweenVectorsDeg(Mat3.apply(r, st.meanAcc), p.haptGravity))
        }
        return Result(r, results, CalibrationQuality.assess(results))
    }
}

/** The "İyi" / "Düşük güven" decision and the hints shown with a low-confidence result. */
object CalibrationQuality {
    const val MIN_FRACTION = 0.6
    const val MIN_STAND_NORM = 0.8
    const val MAX_STAND_NORM = 1.2

    // Hints only (they do not change the verdict). A still phone shows ~0.01 g / ~0.02 rad/s.
    const val MOTION_ACC_STD = 0.05
    const val MOTION_GYRO = 0.15
    const val RESIDUAL_DEG = 25.0

    class Verdict(val good: Boolean, val reasons: List<String>) {
        val text: String get() = if (good) "İyi" else "Düşük güven: kalibrasyonu tekrarla"
    }

    fun assess(results: List<Calibration.PostureResult>): Verdict {
        val stand = results.first { it.posture == Posture.STANDING }
        val good = isGood(results.map { it.correct to it.total }, stand.stats.accNorm)
        if (good) return Verdict(true, emptyList())
        val reasons = ArrayList<String>()
        val n = stand.stats.accNorm
        if (n < MIN_STAND_NORM || n > MAX_STAND_NORM) {
            reasons.add(String.format(Locale.ROOT, "Ayakta kaydında ivme %.2f g (beklenen yaklaşık 1 g): telefon hareket etti ya da sensör ölçeği hatalı.", n))
        }
        for (p in results) {
            if (p.stats.maxAccStd > MOTION_ACC_STD || p.stats.meanGyroNorm > MOTION_GYRO) {
                reasons.add("${p.posture.shortName} kaydında telefon hareket etti.")
            }
        }
        for (p in results) {
            if (p.fraction < MIN_FRACTION) {
                val extra = if (p.residualDeg > RESIDUAL_DEG) " Yerçekimi yönü HAPT ortalamasına uymuyor: duruş yanlış olabilir." else ""
                reasons.add("${p.posture.shortName}: model doğru duruşu az pencerede buldu.$extra")
            }
        }
        val s = results.first { it.posture == Posture.STANDING }.stats.meanAcc
        val sit = results.first { it.posture == Posture.SITTING }.stats.meanAcc
        val lay = results.first { it.posture == Posture.LAYING }.stats.meanAcc
        if (Mat3.angleBetweenVectorsDeg(s, lay) < 45.0) reasons.add("Yatma kaydı ayakta kaydına çok benziyor: sırtüstü yatılmamış olabilir.")
        if (Mat3.angleBetweenVectorsDeg(s, sit) < 3.0) reasons.add("Oturma kaydı ayakta kaydıyla neredeyse aynı: oturulmamış olabilir.")
        if (reasons.isEmpty()) reasons.add("Telefonun duruşu HAPT'tan çok farklı olabilir ya da duruşlardan biri yanlış yapıldı.")
        return Verdict(false, reasons)
    }

    /** Good iff every posture has ≥ 60 % correct windows and |u_stand| is within 0.8..1.2 g. */
    fun isGood(counts: List<Pair<Int, Int>>, standNorm: Double): Boolean =
        counts.all { (c, t) -> t > 0 && c.toDouble() / t >= MIN_FRACTION } && standNorm in MIN_STAND_NORM..MAX_STAND_NORM
}

/** SharedPreferences text form of R (9 numbers, row-major). Pure, so it can be unit-tested. */
object CalibrationStore {
    fun encode(r: DoubleArray): String {
        require(r.size == 9)
        return r.joinToString(",") { it.toString() }
    }

    /** Null for a missing, malformed or non-rotation value, so a bad entry is ignored rather than applied. */
    fun decode(s: String?): DoubleArray? {
        if (s.isNullOrBlank()) return null
        val parts = s.split(',')
        if (parts.size != 9) return null
        val r = DoubleArray(9)
        for (i in 0 until 9) r[i] = parts[i].trim().toDoubleOrNull() ?: return null
        return if (Mat3.isProperRotation(r)) r else null
    }
}

/** The axis-mapping spinner: "Kalibre edilmiş" on top when a calibration exists, then the 8 presets. */
object MappingChoices {
    const val CALIBRATED_KEY = "calibrated"
    const val CALIBRATED_LABEL = "Kalibre edilmiş"

    class Option(val key: String, val label: String, val mapping: AxisMapping)

    fun presetKey(id: Int) = "preset:$id"

    fun options(calibration: DoubleArray?): List<Option> {
        val out = ArrayList<Option>()
        if (calibration != null) out.add(Option(CALIBRATED_KEY, CALIBRATED_LABEL, AxisMapping.calibrated(calibration)))
        for (m in AxisMapping.ALL) out.add(Option(presetKey(m.id), m.label, m))
        return out
    }

    /**
     * Selection at app start: a saved calibration always wins. Otherwise the saved preset key,
     * then the old integer spinner position (pre-calibration versions), then preset [1].
     */
    fun initialKey(hasCalibration: Boolean, savedKey: String?, legacyPosition: Int?): String {
        if (hasCalibration) return CALIBRATED_KEY
        if (savedKey != null && savedKey != CALIBRATED_KEY && AxisMapping.ALL.any { presetKey(it.id) == savedKey }) return savedKey
        if (legacyPosition != null && legacyPosition in AxisMapping.ALL.indices) return presetKey(AxisMapping.ALL[legacyPosition].id)
        return presetKey(AxisMapping.ALL[0].id)
    }

    /** Index of [key] in [options], falling back to preset [1] when the key is not offered. */
    fun indexOf(options: List<Option>, key: String): Int {
        val i = options.indexOfFirst { it.key == key }
        return if (i >= 0) i else options.indexOfFirst { it.key == presetKey(AxisMapping.ALL[0].id) }
    }
}
