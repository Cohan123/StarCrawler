

import React, { useRef, useEffect } from 'react';
import { GameMessage } from '../types';

interface MessageLogProps {
    messages: GameMessage[];
}

const MessageLog: React.FC<MessageLogProps> = ({ messages }) => {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const getMessageClass = (type: string) => {
        switch(type) {
            case 'combat-player': return 'text-green-400';
            case 'combat-enemy': return 'text-red-400';
            case 'warning': return 'text-yellow-500 font-bold';
            case 'victory': return 'text-purple-400 font-bold';
            case 'flavor': return 'text-gray-500 italic';
            case 'loot': return 'text-fuchsia-400';
            default: return 'text-gray-300';
        }
    }

    return (
        <div className="h-48 bg-black border-t-2 border-gray-800 p-4 overflow-y-auto font-mono text-sm relative">
             <div className="absolute top-2 right-2 text-xs text-gray-700 uppercase tracking-widest pointer-events-none">
                 Adventure Log
             </div>
             <div className="flex flex-col gap-1">
                 {messages.map((msg) => (
                     <div key={msg.id} className={`${getMessageClass(msg.type)} break-words animate-fadeIn`}>
                         <span className="text-gray-700 text-xs mr-2">[{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}]</span>
                         {msg.text}
                     </div>
                 ))}
                 <div ref={bottomRef} />
             </div>
        </div>
    );
};

export default MessageLog;