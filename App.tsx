import React, { useState, useRef, useEffect, useCallback } from 'react';
import { INITIAL_ELEMENTS, BASE_RECIPES, KNOWN_ELEMENTS_DATA } from './constants';
import { ElementType, WorkspaceElement } from './types';
import { combineElementsWithAI, getRecipeKey } from './services/gemini';
import { audio } from './services/audio';
import { BackgroundScene } from './components/ThreeVisuals';
import { ElementIcon } from './components/ElementIcon';

export default function App() {
  // Library of discovered elements
  const [library, setLibrary] = useState<ElementType[]>(INITIAL_ELEMENTS);
  
  // Elements currently on the "table"
  const [workspace, setWorkspace] = useState<WorkspaceElement[]>([]);
  
  // Cache of recipes found in this session to avoid re-querying AI
  const [recipeCache, setRecipeCache] = useState<Record<string, string>>(BASE_RECIPES);
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [lastCreatedColor, setLastCreatedColor] = useState<string[]>(['#ef4444', '#3b82f6']);
  const [notification, setNotification] = useState<{text: string, sub: string} | null>(null);

  // Refs for Drag and Drop Logic
  const dragItemRef = useRef<{ type: 'library' | 'workspace'; id: string; instanceId?: string } | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const workspaceRef = useRef<HTMLDivElement>(null);

  // ----- Game Logic Helpers -----

  const addToWorkspace = (elementId: string, x: number, y: number) => {
    const newEl: WorkspaceElement = {
      instanceId: Math.random().toString(36).substr(2, 9),
      elementId,
      x,
      y
    };
    setWorkspace(prev => [...prev, newEl]);
    audio.playPop();
  };

  const updateWorkspacePosition = (instanceId: string, x: number, y: number) => {
    setWorkspace(prev => prev.map(el => 
      el.instanceId === instanceId ? { ...el, x, y } : el
    ));
  };

  const removeFromWorkspace = (instanceId: string) => {
    setWorkspace(prev => prev.filter(el => el.instanceId !== instanceId));
  };

  const clearWorkspace = () => {
    setWorkspace([]);
    audio.playFail(); // Little sound feedback
  };

  // ----- The Core Alchemy Loop -----

  const checkCollisions = async (targetInstanceId: string, x: number, y: number) => {
    const THRESHOLD = 60; // Distance in pixels to trigger merge
    
    const targetEl = workspace.find(el => el.instanceId === targetInstanceId);
    if (!targetEl) return;

    // Find closest neighbor
    const neighbor = workspace.find(el => 
      el.instanceId !== targetInstanceId &&
      Math.sqrt(Math.pow(el.x - x, 2) + Math.pow(el.y - y, 2)) < THRESHOLD
    );

    if (neighbor) {
      await mergeElements(targetEl, neighbor);
    }
  };

  const mergeElements = async (el1: WorkspaceElement, el2: WorkspaceElement) => {
    // Prevent double merging if state updates are slow
    removeFromWorkspace(el1.instanceId);
    removeFromWorkspace(el2.instanceId);

    const elem1Data = library.find(e => e.id === el1.elementId);
    const elem2Data = library.find(e => e.id === el2.elementId);

    if (!elem1Data || !elem2Data) return;

    // Determine the result
    const key = getRecipeKey(elem1Data.id, elem2Data.id);
    let resultId = recipeCache[key];

    // Calculate center point for the new element
    const centerX = (el1.x + el2.x) / 2;
    const centerY = (el1.y + el2.y) / 2;

    if (resultId) {
      // Recipe known
      handleSuccessfulMerge(resultId, centerX, centerY);
    } else {
      // Recipe unknown -> Ask AI
      setLoading(true);
      setNotification({ text: "Analyzing...", sub: "The universe is thinking" });
      
      const newElement = await combineElementsWithAI(elem1Data, elem2Data);
      
      setLoading(false);
      setNotification(null);

      if (newElement) {
        // New discovery!
        setRecipeCache(prev => ({ ...prev, [key]: newElement.id }));
        
        // Check if we already have this element (maybe discovered via different recipe)
        const existing = library.find(e => e.id === newElement.id);
        if (!existing) {
            setLibrary(prev => [...prev, newElement]);
            setNotification({ text: "New Discovery!", sub: `${newElement.name}` });
            setTimeout(() => setNotification(null), 3000);
        }
        
        handleSuccessfulMerge(newElement.id, centerX, centerY);
      } else {
        // Failed merge - bounce them back? Or just respawn them apart?
        // For simplicity, let's just respawn them slightly apart to indicate failure
        audio.playFail();
        addToWorkspace(el1.elementId, centerX - 40, centerY);
        addToWorkspace(el2.elementId, centerX + 40, centerY);
      }
    }
  };

  const handleSuccessfulMerge = (resultId: string, x: number, y: number) => {
    // Visuals
    audio.playSuccess();
    const resultData = library.find(e => e.id === resultId) || 
                       Object.entries(KNOWN_ELEMENTS_DATA).find(([k]) => k === resultId) && 
                       { id: resultId, ...KNOWN_ELEMENTS_DATA[resultId as keyof typeof KNOWN_ELEMENTS_DATA] };

    // If it was a base recipe not yet in library (lazy loading base data)
    if (resultData && !library.find(e => e.id === resultId)) {
        setLibrary(prev => [...prev, resultData as ElementType]);
    }
    
    if (resultData) {
        setLastCreatedColor(prev => [...prev.slice(-4), resultData.color]);
    }

    // Add new element to board
    addToWorkspace(resultId, x, y);
  };

  // ----- Mouse / Drag Handling -----

  const handleMouseDown = (e: React.MouseEvent, type: 'library' | 'workspace', id: string, instanceId?: string) => {
    e.preventDefault(); // prevent text selection
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    
    dragItemRef.current = { type, id, instanceId };
    dragOffsetRef.current = {
      x: e.clientX - rect.left - (rect.width / 2), // Center the grab
      y: e.clientY - rect.top - (rect.height / 2)
    };

    if (type === 'library') {
        // If dragging from library, immediately spawn a ghost in workspace tracking mouse?
        // For simplicity, we'll spawn it on MouseUp if dropped in valid zone.
        // But to feel responsive, we usually want a "ghost".
        // Let's use a simple "dragging" state for visual feedback.
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragItemRef.current) return;

    const { type, instanceId } = dragItemRef.current;
    
    if (type === 'workspace' && instanceId && workspaceRef.current) {
      const containerRect = workspaceRef.current.getBoundingClientRect();
      const x = e.clientX - containerRect.left - dragOffsetRef.current.x;
      const y = e.clientY - containerRect.top - dragOffsetRef.current.y;
      updateWorkspacePosition(instanceId, x, y);
    }
  }, []);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!dragItemRef.current) return;
    
    const { type, id, instanceId } = dragItemRef.current;

    if (type === 'workspace' && instanceId) {
       // Check for drops
       const containerRect = workspaceRef.current?.getBoundingClientRect();
       if (containerRect) {
           const x = e.clientX - containerRect.left - dragOffsetRef.current.x;
           const y = e.clientY - containerRect.top - dragOffsetRef.current.y;
           checkCollisions(instanceId, x, y);
       }
    } else if (type === 'library') {
        // If dropped on workspace
        const containerRect = workspaceRef.current?.getBoundingClientRect();
        if (containerRect && 
            e.clientX > containerRect.left && e.clientX < containerRect.right &&
            e.clientY > containerRect.top && e.clientY < containerRect.bottom) {
            
            const x = e.clientX - containerRect.left;
            const y = e.clientY - containerRect.top;
            addToWorkspace(id, x, y);
        }
    }

    dragItemRef.current = null;
  }, [workspace, library, recipeCache]); // Dependencies important for checkCollisions closure

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);


  // ----- Render -----

  return (
    <div className="relative w-full h-screen overflow-hidden text-white select-none">
      
      {/* 3D Background */}
      <BackgroundScene activeColors={lastCreatedColor} />

      {/* Top Bar */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-10 pointer-events-none">
        <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 drop-shadow-lg">
            Aether Alchemy
            </h1>
            <p className="text-sm text-white/60">Discovered: {library.length} / ∞</p>
        </div>
        
        <div className="pointer-events-auto flex gap-4">
            <button 
                onClick={clearWorkspace}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 px-4 py-2 rounded-lg text-sm transition-all"
            >
                Clear Table
            </button>
            <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="md:hidden bg-white/10 p-2 rounded-lg"
            >
                {isSidebarOpen ? 'Close' : 'Elements'}
            </button>
        </div>
      </div>

      {/* Loading / Notification Overlay */}
      {notification && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 text-center pointer-events-none">
              <div className="bg-black/60 backdrop-blur-xl border border-white/20 px-8 py-4 rounded-2xl shadow-2xl animate-fade-in-up">
                  <h2 className="text-2xl font-bold text-white">{notification.text}</h2>
                  <p className="text-purple-300">{notification.sub}</p>
              </div>
          </div>
      )}
      
      {/* Main Layout */}
      <div className="flex h-full pt-20">
        
        {/* Workspace Area */}
        <div 
            ref={workspaceRef}
            className="flex-1 relative z-0"
        >
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
                <p className="text-6xl font-cinzel tracking-widest">WORKSPACE</p>
            </div>

            {workspace.map((el) => {
                const data = library.find(e => e.id === el.elementId);
                if (!data) return null;
                return (
                    <div
                        key={el.instanceId}
                        style={{
                            position: 'absolute',
                            left: el.x,
                            top: el.y,
                            transform: 'translate(-50%, -50%)'
                        }}
                    >
                        <ElementIcon 
                            name={data.name} 
                            emoji={data.emoji} 
                            color={data.color}
                            onMouseDown={(e) => handleMouseDown(e, 'workspace', data.id, el.instanceId)}
                        />
                    </div>
                );
            })}
        </div>

        {/* Sidebar Library */}
        <div 
            className={`
                fixed md:relative right-0 top-0 h-full w-80 
                bg-black/40 backdrop-blur-xl border-l border-white/10
                transition-transform duration-300 z-20 flex flex-col pt-20 pb-4
                ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
            `}
        >
            <div className="px-6 mb-4">
                <h2 className="text-xl font-cinzel border-b border-white/20 pb-2">Elements</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-3 gap-4 content-start no-scrollbar">
                {library.map((el) => (
                    <div key={el.id} className="flex justify-center">
                        <ElementIcon 
                            name={el.name} 
                            emoji={el.emoji} 
                            color={el.color} 
                            size="sm"
                            onMouseDown={(e) => handleMouseDown(e, 'library', el.id)}
                        />
                    </div>
                ))}
            </div>
        </div>

      </div>
    </div>
  );
}
