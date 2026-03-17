package com.focus.pomodoro.ui.history

import android.app.DatePickerDialog
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import androidx.recyclerview.widget.LinearLayoutManager
import com.focus.pomodoro.SimpleViewModelFactory
import com.focus.pomodoro.appContainer
import com.focus.pomodoro.databinding.FragmentHistoryBinding
import java.time.LocalDate

class HistoryFragment : Fragment() {
    private var _binding: FragmentHistoryBinding? = null
    private val binding get() = _binding!!
    private val adapter = HistoryAdapter()
    private val viewModel by lazy {
        ViewModelProvider(this, SimpleViewModelFactory {
            HistoryViewModel(requireContext().applicationContext.appContainer.sessionRepository)
        })[HistoryViewModel::class.java]
    }
    private var selectedDate: LocalDate? = null

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentHistoryBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        binding.recyclerHistory.layoutManager = LinearLayoutManager(requireContext())
        binding.recyclerHistory.adapter = adapter

        binding.buttonPickDate.setOnClickListener { showDatePicker() }
        binding.buttonClearDate.setOnClickListener {
            selectedDate = null
            binding.textHistoryFilter.text = "All sessions"
            viewModel.setDate(null)
        }

        viewModel.sessions.observe(viewLifecycleOwner) { sessions ->
            adapter.submitList(sessions)
        }
    }

    private fun showDatePicker() {
        val today = selectedDate ?: LocalDate.now()
        DatePickerDialog(requireContext(), { _, year, month, dayOfMonth ->
            selectedDate = LocalDate.of(year, month + 1, dayOfMonth)
            binding.textHistoryFilter.text = selectedDate.toString()
            viewModel.setDate(selectedDate)
        }, today.year, today.monthValue - 1, today.dayOfMonth).show()
    }

    override fun onDestroyView() {
        _binding = null
        super.onDestroyView()
    }
}
