import { HighscoreEntry } from '../types';

const HIGHSCORE_KEY = 'cosmicAsciiAdventureHighscores';
const MAX_SCORES = 10;

export const getHighscores = (): HighscoreEntry[] => {
    try {
        const scoresJson = localStorage.getItem(HIGHSCORE_KEY);
        if (!scoresJson) {
            return [];
        }
        const scores = JSON.parse(scoresJson) as HighscoreEntry[];
        // Sort by score descending, then by depth descending
        return scores.sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            return b.depth - a.depth;
        });
    } catch (error) {
        console.error("Failed to retrieve highscores:", error);
        return [];
    }
};

export const saveHighscore = (newEntry: HighscoreEntry) => {
    try {
        const scores = getHighscores();
        scores.push(newEntry);

        const sortedScores = scores.sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            return b.depth - a.depth;
        });
        
        const topScores = sortedScores.slice(0, MAX_SCORES);

        localStorage.setItem(HIGHSCORE_KEY, JSON.stringify(topScores));

    } catch (error) {
        console.error("Failed to save highscore:", error);
    }
};