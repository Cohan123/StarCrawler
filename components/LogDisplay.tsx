
import React, { useState } from 'react';
import { LogEntry } from '../types';

interface LogDisplayProps {
  logs: LogEntry[];
}

const LogDisplay: React.FC<LogDisplayProps> = ({ logs }) => {
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);

  const selectedLog = logs.find(log => log.id === selectedLogId);

  return (
    <div className="border border-gray-700 p-3 mt-4 flex-grow flex flex-col min-h-0">
      <h3 className="text-green-400 text-lg border-b border-gray-700 pb-2">SHIP'S LOGS</h3>
      {logs.length === 0 ? (
        <p className="text-gray-500 mt-2 italic">No logs recovered.</p>
      ) : (
        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow min-h-0">
          <ul className="space-y-1 overflow-y-auto pr-2">
            {logs.map(log => (
              <li key={log.id}>
                <button
                  onClick={() => setSelectedLogId(log.id)}
                  className={`w-full text-left p-1 text-sm transition-colors duration-200 ${
                    selectedLogId === log.id ? 'bg-green-800 text-white' : 'hover:bg-gray-800'
                  }`}
                >
                  &gt; {log.title}
                </button>
              </li>
            ))}
          </ul>
          <div className="border-l border-gray-700 pl-4 overflow-y-auto">
            {selectedLog ? (
              <div>
                <h4 className="text-green-300 font-bold">{selectedLog.title}</h4>
                <p className="text-gray-400 whitespace-pre-wrap mt-2 text-sm">{selectedLog.content}</p>
              </div>
            ) : (
              <p className="text-gray-600 italic">Select a log entry to read.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LogDisplay;
