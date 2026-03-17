package com.focus.pomodoro.ui.history

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.focus.pomodoro.data.local.entity.FocusSessionEntity
import com.focus.pomodoro.databinding.ItemHistoryBinding
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter

class HistoryAdapter : RecyclerView.Adapter<HistoryAdapter.HistoryViewHolder>() {
    private val items = mutableListOf<FocusSessionEntity>()
    private val formatter = DateTimeFormatter.ofPattern("EEE, MMM d • HH:mm").withZone(ZoneId.systemDefault())

    fun submitList(newItems: List<FocusSessionEntity>) {
        items.clear()
        items.addAll(newItems)
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): HistoryViewHolder {
        val binding = ItemHistoryBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return HistoryViewHolder(binding)
    }

    override fun onBindViewHolder(holder: HistoryViewHolder, position: Int) = holder.bind(items[position])
    override fun getItemCount(): Int = items.size

    inner class HistoryViewHolder(private val binding: ItemHistoryBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(item: FocusSessionEntity) {
            binding.textHistoryTitle.text = "${item.phase.replace('_', ' ')} • ${item.durationMinutes} min"
            binding.textHistoryTime.text = "${formatter.format(Instant.ofEpochMilli(item.startedAt))} • ${if (item.completed) "Completed" else "Skipped"}"
        }
    }
}
