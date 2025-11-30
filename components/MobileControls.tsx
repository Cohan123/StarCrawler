
import React from 'react';

interface MobileControlsProps {
    onMove: (dx: number, dy: number) => void;
    onInteract: () => void;
    onToggleMap: () => void;
    onFire?: () => void;
}

const MobileControls: React.FC<MobileControlsProps> = ({ onMove, onInteract, onToggleMap, onFire }) => {
    const btnClass = "w-12 h-12 bg-gray-800/80 backdrop-blur-sm border-2 border-gray-600 active:bg-green-900 active:border-green-500 rounded-full text-green-400 font-bold flex items-center justify-center select-none touch-manipulation hover:bg-gray-700/80 shadow-lg";

    return (
        <>
            {/* D-Pad - Bottom Left */}
            <div 
                className="fixed bottom-4 left-4 z-50 xl:hidden pointer-events-auto"
                style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            >
                <div className="grid grid-cols-3 gap-1">
                    <div />
                    <button className={btnClass} onClick={() => onMove(0, -1)}>▲</button>
                    <div />
                    <button className={btnClass} onClick={() => onMove(-1, 0)}>◀</button>
                    <button className={btnClass} onClick={() => onMove(0, 1)}>▼</button>
                    <button className={btnClass} onClick={() => onMove(1, 0)}>▶</button>
                </div>
            </div>

            {/* Actions - Bottom Right */}
            <div 
                className="fixed bottom-4 right-4 z-50 xl:hidden pointer-events-auto flex flex-col gap-4 items-end"
                style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            >
                <button className={`${btnClass} text-yellow-400 border-yellow-700`} onClick={() => onFire && onFire()}>F</button>
                <button className={btnClass} onClick={onToggleMap}>M</button>
                <button 
                    className={`${btnClass} w-16 h-16 text-xl border-green-600 text-green-300 bg-gray-900/90 active:bg-green-800`} 
                    onClick={onInteract}
                >
                    E
                </button>
            </div>
        </>
    );
};

export default MobileControls;
