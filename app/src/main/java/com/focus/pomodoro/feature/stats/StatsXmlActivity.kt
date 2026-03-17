package com.focus.pomodoro.feature.stats

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.focus.pomodoro.app.FocusPomodoroApplication
import com.focus.pomodoro.databinding.ActivityStatsXmlBinding
import com.github.mikephil.charting.components.XAxis
import com.github.mikephil.charting.data.Entry
import com.github.mikephil.charting.data.LineData
import com.github.mikephil.charting.data.LineDataSet
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

class StatsXmlActivity : AppCompatActivity() {
    private lateinit var binding: ActivityStatsXmlBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityStatsXmlBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val repo = (application as FocusPomodoroApplication).container.statsRepository

        binding.lineChart.description.isEnabled = false
        binding.lineChart.axisRight.isEnabled = false
        binding.lineChart.xAxis.position = XAxis.XAxisPosition.BOTTOM

        lifecycleScope.launch {
            repo.observeSessions().collectLatest { sessions ->
                val entries = sessions.take(30).reversed().mapIndexed { index, session ->
                    Entry(index.toFloat(), session.durationMinutes.toFloat())
                }
                val dataSet = LineDataSet(entries, "Focus Minutes").apply {
                    lineWidth = 2f
                    setDrawCircles(true)
                    setDrawValues(false)
                }
                binding.lineChart.data = LineData(dataSet)
                binding.lineChart.invalidate()
            }
        }
    }
}
