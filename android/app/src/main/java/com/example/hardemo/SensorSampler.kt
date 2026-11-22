package com.example.hardemo

import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Handler
import android.os.HandlerThread
import android.os.SystemClock

/**
 * Resamples accelerometer + gyroscope to a fixed 50 Hz grid. Sensor events arrive irregularly,
 * so a 20 ms tick takes the latest value of each sensor (zero-order hold) and pushes one
 * 6-channel HAPT-frame sample into a [WindowBuffer].
 *
 * Threading: sensor callbacks, the tick and every piece of mutable state live on one
 * HandlerThread, so the buffer needs no locks. [start]/[stop]/[setMapping] only post to it.
 * Callbacks ([onWindow], [onStats]) run on that thread; the caller hands work off from there.
 */
class SensorSampler(
    private val sm: SensorManager,
    private val acc: Sensor,
    private val gyro: Sensor,
    window: Int,
    stride: Int,
    private val onWindow: (generation: Int, window: FloatArray) -> Unit,
    private val onStats: (Stats) -> Unit,
) {
    data class Stats(val tickHz: Float, val accHz: Float, val gyroHz: Float, val samples: Long, val catchUps: Int)

    private val thread = HandlerThread("har-sensors").apply { start() }
    private val handler = Handler(thread.looper)

    private val buffer = WindowBuffer(window, stride, 6)
    private val lastAcc = FloatArray(3)
    private val lastGyro = FloatArray(3)
    private val sample = FloatArray(6)
    private var haveAcc = false
    private var haveGyro = false
    private var running = false
    private var mapping = AxisMapping.ALL[0]
    private var generation = 0

    private var nextTick = 0L
    private var statsStart = 0L
    private var ticks = 0
    private var accEvents = 0
    private var gyroEvents = 0
    private var catchUps = 0

    private val listener = object : SensorEventListener {
        override fun onSensorChanged(e: SensorEvent) {
            if (!running) return
            when (e.sensor.type) {
                Sensor.TYPE_ACCELEROMETER -> {
                    System.arraycopy(e.values, 0, lastAcc, 0, 3)
                    haveAcc = true
                    accEvents++
                }
                Sensor.TYPE_GYROSCOPE -> {
                    System.arraycopy(e.values, 0, lastGyro, 0, 3)
                    haveGyro = true
                    gyroEvents++
                }
            }
        }

        override fun onAccuracyChanged(sensor: Sensor, accuracy: Int) = Unit
    }

    private val tick = object : Runnable {
        override fun run() {
            if (!running) return
            val now = SystemClock.uptimeMillis()
            // Start the grid only once both sensors have reported, so no window starts with zeros.
            if (haveAcc && haveGyro) {
                mapping.mapAcc(lastAcc, sample, 0)
                mapping.mapGyro(lastGyro, sample, 3)
                val w = buffer.push(sample)
                if (w != null) onWindow(generation, w)
                ticks++
            }
            if (now - statsStart >= 1000) {
                val dt = (now - statsStart) / 1000f
                onStats(Stats(ticks / dt, accEvents / dt, gyroEvents / dt, buffer.samples, catchUps))
                statsStart = now
                ticks = 0
                accEvents = 0
                gyroEvents = 0
            }
            nextTick += PERIOD_MS
            // If the thread stalled for long, re-anchor instead of bursting many duplicate samples.
            if (now - nextTick > MAX_LAG_MS) {
                nextTick = now + PERIOD_MS
                catchUps++
            }
            handler.postAtTime(this, nextTick)
        }
    }

    fun start(newGeneration: Int) = handler.post {
        if (running) return@post
        generation = newGeneration
        resetState()
        running = true
        sm.registerListener(listener, acc, SAMPLING_US, 0, handler)
        sm.registerListener(listener, gyro, SAMPLING_US, 0, handler)
        val now = SystemClock.uptimeMillis()
        statsStart = now
        nextTick = now + PERIOD_MS
        handler.postAtTime(tick, nextTick)
    }

    fun stop() = handler.post {
        running = false
        sm.unregisterListener(listener)
        handler.removeCallbacks(tick)
        resetState()
    }

    /** Switching axes mid-window would mix two frames in one window, so the window restarts. */
    fun setMapping(m: AxisMapping, newGeneration: Int) = handler.post {
        mapping = m
        generation = newGeneration
        buffer.clear()
    }

    fun quit() {
        stop()
        thread.quitSafely()
    }

    private fun resetState() {
        buffer.clear()
        haveAcc = false
        haveGyro = false
        ticks = 0
        accEvents = 0
        gyroEvents = 0
        catchUps = 0
    }

    companion object {
        const val PERIOD_MS = 20L
        const val SAMPLING_US = 20_000
        private const val MAX_LAG_MS = 200L
    }
}
