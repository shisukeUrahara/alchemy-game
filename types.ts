export interface ElementType {
  id: string;
  name: string;
  emoji: string;
  description: string;
  color: string; // Hex code
  isNew?: boolean; // For animation triggers
}

export interface WorkspaceElement {
  instanceId: string; // Unique ID for this specific instance on the board
  elementId: string;
  x: number;
  y: number;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  velocity: { x: number; y: number };
  life: number;
}

export interface Recipe {
  parents: [string, string]; // Sorted array of element IDs
  result: string; // Element ID
}
