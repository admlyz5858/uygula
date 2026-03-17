package com.focus.pomodoro.ui.tasks

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import androidx.recyclerview.widget.ItemTouchHelper
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.focus.pomodoro.SimpleViewModelFactory
import com.focus.pomodoro.appContainer
import com.focus.pomodoro.databinding.DialogAddTaskBinding
import com.focus.pomodoro.databinding.FragmentTasksBinding

class TasksFragment : Fragment() {
    private var _binding: FragmentTasksBinding? = null
    private val binding get() = _binding!!
    private lateinit var adapter: TaskAdapter
    private val viewModel by lazy {
        ViewModelProvider(this, SimpleViewModelFactory {
            TasksViewModel(requireContext().applicationContext.appContainer.taskRepository)
        })[TasksViewModel::class.java]
    }

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentTasksBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        adapter = TaskAdapter(
            onToggle = viewModel::toggleTask,
            onDelete = viewModel::deleteTask,
        )
        binding.recyclerTasks.layoutManager = LinearLayoutManager(requireContext())
        binding.recyclerTasks.adapter = adapter
        ItemTouchHelper(object : ItemTouchHelper.SimpleCallback(ItemTouchHelper.UP or ItemTouchHelper.DOWN, 0) {
            override fun onMove(recyclerView: RecyclerView, viewHolder: RecyclerView.ViewHolder, target: RecyclerView.ViewHolder): Boolean {
                adapter.moveItem(viewHolder.bindingAdapterPosition, target.bindingAdapterPosition)
                return true
            }
            override fun onSwiped(viewHolder: RecyclerView.ViewHolder, direction: Int) = Unit
            override fun clearView(recyclerView: RecyclerView, viewHolder: RecyclerView.ViewHolder) {
                super.clearView(recyclerView, viewHolder)
                viewModel.reorder(adapter.currentItems())
            }
        }).attachToRecyclerView(binding.recyclerTasks)

        binding.fabAddTask.setOnClickListener { showAddTaskDialog() }

        viewModel.tasks.observe(viewLifecycleOwner) { tasks ->
            adapter.submitList(tasks)
            val remaining = tasks.count { !it.isCompleted }
            binding.textTasksSummary.text = "$remaining remaining • ${tasks.size} total"
            binding.textEmpty.visibility = if (tasks.isEmpty()) View.VISIBLE else View.GONE
        }
    }

    private fun showAddTaskDialog() {
        val dialogBinding = DialogAddTaskBinding.inflate(layoutInflater)
        MaterialAlertDialogBuilder(requireContext())
            .setTitle("Add task")
            .setView(dialogBinding.root)
            .setPositiveButton("Save") { _, _ ->
                viewModel.addTask(
                    title = dialogBinding.inputTitle.text?.toString().orEmpty(),
                    description = dialogBinding.inputDescription.text?.toString().orEmpty(),
                    priority = dialogBinding.inputPriority.text?.toString()?.toIntOrNull() ?: 3,
                    sessions = dialogBinding.inputSessions.text?.toString()?.toIntOrNull() ?: 1,
                )
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    override fun onDestroyView() {
        _binding = null
        super.onDestroyView()
    }
}
