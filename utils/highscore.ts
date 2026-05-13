import { HighscoreEntry } from '../types';

const HIGHSCORE_KEY = 'starCrawlerHighscores';
const LEGACY_HIGHSCORE_KEYS = ['cosmicAsciiAdventureHighscores'];
const MAX_SCORES = 10;

const sortHighscores = (scores: HighscoreEntry[]) => {
    return scores.sort((a, b) => {
        if (b.score !== a.score) {
            return b.score - a.score;
        }
        return b.depth - a.depth;
    });
};

const parseHighscores = (scoresJson: string | null) => {
    if (!scoresJson) return [];
    const parsedScores = JSON.parse(scoresJson) as HighscoreEntry[];
    return Array.isArray(parsedScores) ? parsedScores : [];
};

export const getHighscores = (): HighscoreEntry[] => {
    try {
        const currentScores = parseHighscores(localStorage.getItem(HIGHSCORE_KEY));
        if (currentScores.length > 0) {
            return sortHighscores(currentScores);
        }

        for (const legacyKey of LEGACY_HIGHSCORE_KEYS) {
            const legacyScores = parseHighscores(localStorage.getItem(legacyKey));
            if (legacyScores.length > 0) {
                const migratedScores = sortHighscores(legacyScores).slice(0, MAX_SCORES);
                localStorage.setItem(HIGHSCORE_KEY, JSON.stringify(migratedScores));
                return migratedScores;
            }
        }

        return [];
    } catch (error) {
        console.error("Failed to retrieve highscores:", error);
        return [];
    }
};

export const saveHighscore = (newEntry: HighscoreEntry) => {
    try {
        const scores = getHighscores();
        scores.push(newEntry);

        const sortedScores = sortHighscores(scores);
        const topScores = sortedScores.slice(0, MAX_SCORES);

        localStorage.setItem(HIGHSCORE_KEY, JSON.stringify(topScores));

    } catch (error) {
        console.error("Failed to save highscore:", error);
    }
};
