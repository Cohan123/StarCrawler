
import React, { useState, useEffect } from 'react';
import { getHighscores } from '../utils/highscore';
import { HighscoreEntry } from '../types';

interface HighscoreScreenProps {
  onBack: () => void;
}

const HighscoreScreen: React.FC<HighscoreScreenProps> = ({ onBack }) => {
    const [scores, setScores] = useState<HighscoreEntry[]>([]);

    useEffect(() => {
        setScores(getHighscores());
    }, []);

    return (
        <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-50 p-4">
            <div className="w-full h-full max-w-4xl border-4 border-gray-700 bg-gray-900 p-6 flex flex-col">
                <div className="flex justify-between items-center border-b-2 border-gray-700 pb-2 mb-4">
                    <h2 className="text-3xl text-green-400 tracking-widest">HIGHSCORE</h2>
                    <button onClick={onBack} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white border border-gray-600">Zurück zum Hauptmenü</button>
                </div>
                <div className="flex-grow overflow-y-auto">
                    {scores.length === 0 ? (
                        <p className="text-center text-gray-500 italic mt-8">Noch keine Highscores. Sei der Erste!</p>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-green-400 border-b border-gray-700">
                                    <th className="p-2">Rang</th>
                                    <th className="p-2">Pilot</th>
                                    <th className="p-2 text-right">Score</th>
                                    <th className="p-2 text-right">Tiefe</th>
                                    <th className="p-2">Todesursache</th>
                                    <th className="p-2">Datum</th>
                                </tr>
                            </thead>
                            <tbody>
                                {scores.map((score, index) => (
                                    <tr key={index} className="border-b border-gray-800 hover:bg-gray-800">
                                        <td className="p-2 text-yellow-400">{index + 1}</td>
                                        <td className="p-2">{score.name}</td>
                                        <td className="p-2 text-right">{score.score}</td>
                                        <td className="p-2 text-right">{score.depth}</td>
                                        <td className="p-2 text-sm text-red-400">{score.killedBy || "-"}</td>
                                        <td className="p-2 text-sm text-gray-500">{new Date(score.date).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HighscoreScreen;
