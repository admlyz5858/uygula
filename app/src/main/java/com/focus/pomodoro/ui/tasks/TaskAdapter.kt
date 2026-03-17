package com.focus.pomodoro.ui.tasks

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.focus.pomodoro.data.local.entity.TaskEntity
import com.focus.pomodoro.databinding.ItemTaskBinding

class TaskAdapter(
    private val onToggle: (TaskEntity, Boolean) -> Unit,
    private val onDelete: (TaskEntity) -> Unit,
) : RecyclerView.Adapter<TaskAdapter.TaskViewHolder>() {
    private val items = mutableListOf<TaskEntity>()

    fun submitList(newItems: List<TaskEntity>) {
        items.clear()
        items.addAll(newItems)
        notifyDataSetChanged()
    }

    fun moveItem(fromPosition: Int, toPosition: Int) {
        val item = items.removeAt(fromPosition)
        items.add(toPosition, item)
        notifyItemMoved(fromPosition, toPosition)
    }

    fun currentItems(): List<TaskEntity> = items.toList()

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): TaskViewHolder {
        val binding = ItemTaskBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return TaskViewHolder(binding)
    }

    override fun onBindViewHolder(holder: TaskViewHolder, position: Int) {
        holder.bind(items[position])
    }

    override fun getItemCount(): Int = items.size

    inner class TaskViewHolder(private val binding: ItemTaskBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(task: TaskEntity) {
            binding.textTitle.text = task.title
            binding.textSubtitle.text = task.description.ifBlank { "${task.estimatedSessions} Pomodoro session(s)" }
            binding.textPriority.text = "P${task.priority}"
            binding.checkComplete.setOnCheckedChangeListener(null)
            binding.checkComplete.isChecked = task.isCompleted
            binding.checkComplete.setOnCheckedChangeListener { _, checked -> onToggle(task, checked) }
            binding.buttonDelete.setOnClickListener { onDelete(task) }
            binding.root.alpha = if (task.isCompleted) 0.6f else 1f
        }
    }
}
