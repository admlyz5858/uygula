import { Bar } from 'react-chartjs-2'
import { CategoryScale, Chart as ChartJS, LinearScale, BarElement, Tooltip, Legend } from 'chart.js'
import { useMemo } from 'react'
import { useStats } from '../features/stats/useStats'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

export function StatsPanel(): JSX.Element {
  const stats = useStats()

  const chartData = useMemo(
    () => ({
      labels: stats.dailyMinutes.map((item) => item.day),
      datasets: [
        {
          label: 'Focus minutes',
          data: stats.dailyMinutes.map((item) => item.minutes),
          borderRadius: 8,
          backgroundColor: 'rgba(141, 231, 202, 0.78)',
        },
      ],
    }),
    [stats.dailyMinutes],
  )

  return (
    <section className="rounded-3xl border border-white/15 bg-slate-900/45 p-5 text-white backdrop-blur-md">
      <h3 className="text-lg font-semibold">Performance Observatory</h3>
      <p className="text-sm text-white/70">Productivity score: {stats.productivityScore}</p>
      <div className="mt-3 rounded-2xl bg-slate-950/50 p-3">
        <Bar
          data={chartData}
          options={{
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
              x: { ticks: { color: '#c3d6db' }, grid: { color: 'rgba(255,255,255,0.08)' } },
              y: { ticks: { color: '#c3d6db' }, grid: { color: 'rgba(255,255,255,0.08)' } },
            },
          }}
        />
      </div>
      <div className="mt-4">
        <p className="mb-2 text-xs uppercase tracking-[0.26em] text-white/60">Focus Heatmap</p>
        <div className="grid grid-cols-14 gap-1">
          {stats.heatmap.map((cell) => (
            <div
              key={cell.date}
              title={`${cell.date} intensity ${cell.intensity}`}
              className="h-3 rounded-sm"
              style={{ backgroundColor: ['#1e293b', '#245f5b', '#1a9b8e', '#4dd8b8', '#a8ffe8'][cell.intensity] }}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
