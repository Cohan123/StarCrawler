
import React, { useState, useEffect, useRef } from 'react';
import { Consumable } from '../types';

interface MobileControlsProps {
    onMove: (dx: number, dy: number) => void;
    onInteract: () => void;
    onToggleMap: () => void;
    onFire?: () => void;
    onQuickSlot?: (slot: 0 | 1) => void;
    quickSlots?: [Consumable | null, Consumable | null];
}

interface ControlGroupConfig {
    scale: number;
    opacity: number;
    x: number; // Offset X
    y: number; // Offset Y
    visible: boolean;
}

interface MobileConfig {
    dpad: ControlGroupConfig;
    actions: ControlGroupConfig;
}

const STORAGE_KEY = 'star_crawler_mobile_config_v2';

const defaultConfig: MobileConfig = {
    dpad: { scale: 1.0, opacity: 0.8, x: 0, y: 0, visible: true },
    actions: { scale: 1.0, opacity: 0.8, x: 0, y: 0, visible: true }
};

const MobileControls: React.FC<MobileControlsProps> = ({ onMove, onInteract, onToggleMap, onFire, onQuickSlot, quickSlots }) => {
    // --- Configuration State ---
    const [config, setConfig] = useState<MobileConfig>(defaultConfig);
    const [showSettings, setShowSettings] = useState(false);
    const [activeTab, setActiveTab] = useState<'dpad' | 'actions'>('dpad');
    
    // Load config on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Merge with default to ensure new fields exist if migrating
                setConfig({ ...defaultConfig, ...parsed });
            } catch (e) {
                console.error("Failed to parse mobile config");
            }
        }
    }, []);

    // Save config on change
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    }, [config]);

    // --- Drag Logic ---
    const dragStartRef = useRef<{x: number, y: number} | null>(null);
    const initialPosRef = useRef<{x: number, y: number} | null>(null);
    const activeDragGroupRef = useRef<'dpad' | 'actions' | null>(null);

    const handleTouchStart = (e: React.TouchEvent, group: 'dpad' | 'actions') => {
        if (!showSettings) return;
        const touch = e.touches[0];
        dragStartRef.current = { x: touch.clientX, y: touch.clientY };
        initialPosRef.current = { x: config[group].x, y: config[group].y };
        activeDragGroupRef.current = group;
        setActiveTab(group); // Switch settings tab to the one being dragged
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!showSettings || !dragStartRef.current || !initialPosRef.current || !activeDragGroupRef.current) return;
        
        const group = activeDragGroupRef.current;
        const touch = e.touches[0];
        const dx = touch.clientX - dragStartRef.current.x;
        const dy = touch.clientY - dragStartRef.current.y;
        
        // Fix: Capture values synchronously to avoid stale ref usage in setConfig callback
        const initialX = initialPosRef.current.x;
        const initialY = initialPosRef.current.y;
        
        setConfig(prev => ({
            ...prev,
            [group]: {
                ...prev[group],
                x: initialX + dx,
                y: initialY + dy
            }
        }));
    };

    const handleTouchEnd = () => {
        dragStartRef.current = null;
        initialPosRef.current = null;
        activeDragGroupRef.current = null;
    };

    const updateConfig = (key: keyof ControlGroupConfig, value: any) => {
        setConfig(prev => ({
            ...prev,
            [activeTab]: {
                ...prev[activeTab],
                [key]: value
            }
        }));
    };

    // --- Styling ---
    const btnClass = "w-12 h-12 bg-gray-800/80 backdrop-blur-sm border-2 border-gray-600 active:bg-green-900 active:border-green-500 rounded-full text-green-400 font-bold flex items-center justify-center select-none touch-manipulation hover:bg-gray-700/80 shadow-lg";
    const qsBtnClass = "w-10 h-10 bg-gray-900/90 border border-gray-500 active:bg-yellow-900 active:border-yellow-500 rounded text-yellow-400 font-bold text-xs flex flex-col items-center justify-center select-none shadow-lg";

    // Common style for draggable containers
    const getContainerStyle = (group: 'dpad' | 'actions'): React.CSSProperties => ({
        transform: `translate(${config[group].x}px, ${config[group].y}px) scale(${config[group].scale})`,
        opacity: config[group].opacity,
        cursor: showSettings ? 'move' : 'default',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        touchAction: 'none' // Critical for dragging
    });

    return (
        <>
            {/* Settings Toggle Button */}
            <button 
                onClick={() => setShowSettings(!showSettings)}
                className="fixed top-20 right-4 z-[70] p-2 bg-gray-900/80 text-gray-400 border border-gray-700 rounded-full hover:text-white shadow-xl backdrop-blur"
            >
                <span className="text-xl">{showSettings ? '✕' : '⚙'}</span>
            </button>

            {/* Settings Panel (Floating, non-blocking) */}
            {showSettings && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[70] w-full max-w-xs px-4 pointer-events-auto">
                    <div className="bg-gray-900/95 border-2 border-green-600 p-4 rounded-lg shadow-2xl backdrop-blur-md">
                        <div className="flex border-b border-gray-700 mb-4">
                            <button 
                                onClick={() => setActiveTab('dpad')}
                                className={`flex-1 pb-2 font-bold text-sm ${activeTab === 'dpad' ? 'text-green-400 border-b-2 border-green-400' : 'text-gray-500'}`}
                            >
                                D-Pad (Links)
                            </button>
                            <button 
                                onClick={() => setActiveTab('actions')}
                                className={`flex-1 pb-2 font-bold text-sm ${activeTab === 'actions' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-gray-500'}`}
                            >
                                Tasten (Rechts)
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-gray-300 text-xs flex justify-between">
                                    <span>Größe</span>
                                    <span>{config[activeTab].scale.toFixed(1)}x</span>
                                </label>
                                <input 
                                    type="range" min="0.5" max="2.0" step="0.1"
                                    value={config[activeTab].scale}
                                    onChange={(e) => updateConfig('scale', parseFloat(e.target.value))}
                                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-gray-300 text-xs flex justify-between">
                                    <span>Transparenz</span>
                                    <span>{Math.round(config[activeTab].opacity * 100)}%</span>
                                </label>
                                <input 
                                    type="range" min="0.1" max="1.0" step="0.1"
                                    value={config[activeTab].opacity}
                                    onChange={(e) => updateConfig('opacity', parseFloat(e.target.value))}
                                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-gray-300 text-xs">Anzeigen</span>
                                <button 
                                    onClick={() => updateConfig('visible', !config[activeTab].visible)}
                                    className={`w-10 h-5 rounded-full p-0.5 transition-colors ${config[activeTab].visible ? 'bg-green-600' : 'bg-gray-600'}`}
                                >
                                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${config[activeTab].visible ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            <div className="pt-2 flex gap-2">
                                <button 
                                    onClick={() => { updateConfig('x', 0); updateConfig('y', 0); }}
                                    className="flex-1 py-1.5 bg-gray-700 text-white text-xs rounded hover:bg-gray-600"
                                >
                                    Pos. Reset
                                </button>
                                <button 
                                    onClick={() => setConfig(defaultConfig)}
                                    className="flex-1 py-1.5 bg-red-900 text-white text-xs rounded hover:bg-red-700"
                                >
                                    Alles Reset
                                </button>
                            </div>
                        </div>
                        
                        <p className="text-[10px] text-yellow-500 text-center mt-3 animate-pulse">
                            Verschiebe die Elemente direkt auf dem Bildschirm.
                        </p>
                    </div>
                </div>
            )}

            {/* D-Pad (Left) */}
            {config.dpad.visible && (
                <div 
                    className="fixed z-50 xl:hidden touch-none"
                    style={{ 
                        bottom: '20px', 
                        left: '20px',
                        transformOrigin: 'bottom left',
                        ...getContainerStyle('dpad')
                    }}
                    onTouchStart={(e) => handleTouchStart(e, 'dpad')}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    {showSettings && (
                        <div className="absolute -inset-4 border-2 border-dashed border-green-500 rounded-xl bg-green-500/10 animate-pulse pointer-events-none" />
                    )}
                    
                    <div className="grid grid-cols-3 gap-1">
                        <div />
                        <button className={btnClass} onTouchStart={(e) => { e.stopPropagation(); onMove(0, -1); }}>▲</button>
                        <div />
                        <button className={btnClass} onTouchStart={(e) => { e.stopPropagation(); onMove(-1, 0); }}>◀</button>
                        <button className={btnClass} onTouchStart={(e) => { e.stopPropagation(); onMove(0, 1); }}>▼</button>
                        <button className={btnClass} onTouchStart={(e) => { e.stopPropagation(); onMove(1, 0); }}>▶</button>
                    </div>
                </div>
            )}

            {/* Actions (Right) */}
            {config.actions.visible && (
                <div 
                    className="fixed z-50 xl:hidden flex flex-col items-end gap-2 touch-none"
                    style={{ 
                        bottom: '20px', 
                        right: '20px',
                        transformOrigin: 'bottom right',
                        ...getContainerStyle('actions')
                    }}
                    onTouchStart={(e) => handleTouchStart(e, 'actions')}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    {showSettings && (
                        <div className="absolute -inset-4 border-2 border-dashed border-yellow-500 rounded-xl bg-yellow-500/10 animate-pulse pointer-events-none" />
                    )}

                    {/* Quick Slots Row */}
                    {(onQuickSlot && quickSlots) && (
                        <div className="flex gap-2 mb-2 mr-1">
                            <button 
                                className={qsBtnClass} 
                                onTouchStart={(e) => { e.stopPropagation(); onQuickSlot(0); }}
                            >
                                <span className="text-[10px] text-gray-400">1</span>
                                <span className="truncate w-full text-center px-0.5">{quickSlots[0] ? (quickSlots[0].name.slice(0, 3) + '..') : '-'}</span>
                            </button>
                            <button 
                                className={qsBtnClass} 
                                onTouchStart={(e) => { e.stopPropagation(); onQuickSlot(1); }}
                            >
                                <span className="text-[10px] text-gray-400">2</span>
                                <span className="truncate w-full text-center px-0.5">{quickSlots[1] ? (quickSlots[1].name.slice(0, 3) + '..') : '-'}</span>
                            </button>
                        </div>
                    )}

                    {/* Main Actions */}
                    <div className="flex flex-col gap-4 items-end">
                        <button className={`${btnClass} text-yellow-400 border-yellow-700`} onTouchStart={(e) => { e.stopPropagation(); onFire && onFire(); }}>F</button>
                        <button className={btnClass} onTouchStart={(e) => { e.stopPropagation(); onToggleMap(); }}>M</button>
                        <button 
                            className={`${btnClass} w-16 h-16 text-xl border-green-600 text-green-300 bg-gray-900/90 active:bg-green-800`} 
                            onTouchStart={(e) => { e.stopPropagation(); onInteract(); }}
                        >
                            E
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default MobileControls;
