package com.focus.pomodoro.ui.stats

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.content.FileProvider
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.lifecycleScope
import com.focus.pomodoro.SimpleViewModelFactory
import com.focus.pomodoro.appContainer
import com.focus.pomodoro.databinding.FragmentStatsBinding
import com.focus.pomodoro.utils.CsvExporter
import com.github.mikephil.charting.components.XAxis
import com.github.mikephil.charting.data.BarData
import com.github.mikephil.charting.data.BarDataSet
import com.github.mikephil.charting.data.BarEntry
import com.github.mikephil.charting.data.Entry
import com.github.mikephil.charting.data.LineData
import com.github.mikephil.charting.data.LineDataSet
import com.github.mikephil.charting.formatter.IndexAxisValueFormatter
import kotlinx.coroutines.launch

class StatsFragment : Fragment() {
    private var _binding: FragmentStatsBinding? = null
    private val binding get() = _binding!!
    private val exporter = CsvExporter()
    private val viewModel by lazy {
        ViewModelProvider(this, SimpleViewModelFactory {
            StatsViewModel(requireContext().applicationContext.appContainer.sessionRepository)
        })[StatsViewModel::class.java]
    }
    private var lastSessions = emptyList<com.focus.pomodoro.data.local.entity.FocusSessionEntity>()

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentStatsBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        configureChart(binding.chartDaily)
        configureChart(binding.chartWeekly)

        viewModel.sessions.observe(viewLifecycleOwner) { lastSessions = it }
        viewModel.stats.observe(viewLifecycleOwner) { stats ->
            binding.textTotalFocus.text = "${stats.totalFocusMinutes} min focused"
            binding.textStreak.text = "${stats.completedSessions} sessions • ${stats.currentStreakDays}-day streak"

            val dailyEntries = stats.dailyMinutes.mapIndexed { index, value -> BarEntry(index.toFloat(), value.toFloat()) }
            binding.chartDaily.data = BarData(BarDataSet(dailyEntries, "Daily focus").apply { color = android.graphics.Color.parseColor("#5066FF") })
            binding.chartDaily.xAxis.valueFormatter = IndexAxisValueFormatter(stats.dailyLabels)
            binding.chartDaily.invalidate()

            val weeklyEntries = stats.weeklyMinutes.mapIndexed { index, value -> Entry(index.toFloat(), value.toFloat()) }
            binding.chartWeekly.data = LineData(LineDataSet(weeklyEntries, "Weekly focus").apply {
                color = android.graphics.Color.parseColor("#73D9BA")
                lineWidth = 3f
                setCircleColor(android.graphics.Color.parseColor("#73D9BA"))
                valueTextColor = android.graphics.Color.WHITE
            })
            binding.chartWeekly.xAxis.valueFormatter = IndexAxisValueFormatter(stats.weeklyLabels)
            binding.chartWeekly.invalidate()
        }

        binding.buttonExportCsv.setOnClickListener {
            lifecycleScope.launch {
                exporter.export(requireContext(), lastSessions)
            }
        }
        binding.buttonShareStats.setOnClickListener {
            lifecycleScope.launch {
                val file = exporter.export(requireContext(), lastSessions)
                val uri = FileProvider.getUriForFile(requireContext(), "${requireContext().packageName}.fileprovider", file)
                startActivity(
                    Intent.createChooser(
                        Intent(Intent.ACTION_SEND)
                            .setType("text/csv")
                            .putExtra(Intent.EXTRA_STREAM, uri)
                            .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION),
                        "Share focus stats",
                    )
                )
            }
        }
    }

    private fun configureChart(chart: com.github.mikephil.charting.charts.BarLineChartBase<*>) {
        chart.description.isEnabled = false
        chart.legend.isEnabled = false
        chart.axisRight.isEnabled = false
        chart.axisLeft.granularity = 1f
        chart.xAxis.position = XAxis.XAxisPosition.BOTTOM
        chart.xAxis.granularity = 1f
        chart.setTouchEnabled(false)
    }

    override fun onDestroyView() {
        _binding = null
        super.onDestroyView()
    }
}
