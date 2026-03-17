package com.focus.pomodoro.ui.history

import androidx.lifecycle.ViewModel
import androidx.lifecycle.asLiveData
import com.focus.pomodoro.data.repository.SessionRepository
import java.time.LocalDate
import java.time.ZoneId
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.flatMapLatest

@OptIn(ExperimentalCoroutinesApi::class)
class HistoryViewModel(
    sessionRepository: SessionRepository,
) : ViewModel() {
    private val selectedDate = MutableStateFlow<LocalDate?>(null)

    val sessions = selectedDate.flatMapLatest { date ->
        if (date == null) {
            sessionRepository.observeAllSessions()
        } else {
            val start = date.atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli()
            val end = date.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli() - 1
            sessionRepository.observeSessionsForRange(start, end)
        }
    }.asLiveData()

    fun setDate(date: LocalDate?) {
        selectedDate.value = date
    }
}
