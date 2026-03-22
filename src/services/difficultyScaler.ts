/**
 * Dynamic Difficulty Scaling Service
 * 
 * CRITICAL FEATURE: Tracks user performance and automatically scales difficulty
 * after 3 consecutive correct answers.
 */

interface PerformanceTracker {
    consecutiveCorrect: number
    currentDifficulty: number // 1-5 scale
    answeredQuestions: string[]
}

export class DifficultyScaler {
    private tracker: PerformanceTracker = {
        consecutiveCorrect: 0,
        currentDifficulty: 1,
        answeredQuestions: []
    }

    /**
     * CRITICAL: Call this after EVERY answer
     * @param isCorrect - Whether the user answered correctly
     * @param questionId - ID of the answered question
     * @returns boolean - Whether difficulty was increased
     */
    updatePerformance(isCorrect: boolean, questionId: string): boolean {
        this.tracker.answeredQuestions.push(questionId)
        let difficultyIncreased = false

        if (isCorrect) {
            this.tracker.consecutiveCorrect++

            // 3 correct in a row = difficulty increase
            if (this.tracker.consecutiveCorrect >= 3 && this.tracker.currentDifficulty < 5) {
                this.tracker.currentDifficulty++
                this.tracker.consecutiveCorrect = 0 // Reset streak
                difficultyIncreased = true

                console.log(`🔥 Difficulty scaled to Level ${this.tracker.currentDifficulty}`)
            }
        } else {
            // Reset streak on incorrect answer
            this.tracker.consecutiveCorrect = 0
        }

        return difficultyIncreased
    }

    getCurrentDifficulty(): number {
        return this.tracker.currentDifficulty
    }

    getConsecutiveCorrect(): number {
        return this.tracker.consecutiveCorrect
    }

    getAnsweredQuestions(): string[] {
        return this.tracker.answeredQuestions
    }

    reset(): void {
        this.tracker = {
            consecutiveCorrect: 0,
            currentDifficulty: 1,
            answeredQuestions: []
        }
    }
}
