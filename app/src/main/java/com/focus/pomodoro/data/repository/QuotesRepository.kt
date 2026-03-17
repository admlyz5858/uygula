package com.focus.pomodoro.data.repository

class QuotesRepository {
    private val quotes = listOf(
        "Small sessions build extraordinary results.",
        "Protect your attention like it is your sharpest tool.",
        "Deep work begins when distractions lose the negotiation.",
        "Progress compounds when you return to the task with intention.",
        "One focused interval can move a whole project forward.",
    )

    fun quoteForDay(daySeed: Int): String = quotes[daySeed % quotes.size]
}
