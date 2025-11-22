import { ElementType } from './types';

export const INITIAL_ELEMENTS: ElementType[] = [
  {
    id: 'fire',
    name: 'Fire',
    emoji: '🔥',
    description: 'Hot, bright, and consuming.',
    color: '#ef4444',
  },
  {
    id: 'water',
    name: 'Water',
    emoji: '💧',
    description: 'Fluid, clear, and life-giving.',
    color: '#3b82f6',
  },
  {
    id: 'earth',
    name: 'Earth',
    emoji: '🌍',
    description: 'Solid, stable, and grounding.',
    color: '#22c55e',
  },
  {
    id: 'air',
    name: 'Air',
    emoji: '💨',
    description: 'Invisible, gaseous, and free.',
    color: '#a8a29e',
  },
];

// Pre-baked recipes to save API calls for basics
export const BASE_RECIPES: Record<string, string> = {
  'fire+water': 'steam',
  'earth+fire': 'lava',
  'air+fire': 'energy',
  'air+water': 'rain',
  'earth+water': 'mud',
  'air+earth': 'dust',
  'earth+earth': 'mountain',
  'fire+fire': 'plasma',
  'water+water': 'ocean',
  'air+air': 'wind',
};

export const KNOWN_ELEMENTS_DATA: Record<string, Omit<ElementType, 'id'>> = {
  'steam': { name: 'Steam', emoji: '🌫️', description: 'Water in gas form.', color: '#e5e7eb' },
  'lava': { name: 'Lava', emoji: '🌋', description: 'Molten rock.', color: '#f97316' },
  'energy': { name: 'Energy', emoji: '⚡', description: 'Raw power.', color: '#eab308' },
  'rain': { name: 'Rain', emoji: '🌧️', description: 'Water falling from the sky.', color: '#60a5fa' },
  'mud': { name: 'Mud', emoji: '💩', description: 'Wet dirt.', color: '#78350f' },
  'dust': { name: 'Dust', emoji: '😶‍🌫️', description: 'Fine powder.', color: '#d6d3d1' },
  'mountain': { name: 'Mountain', emoji: '🏔️', description: 'A large landform.', color: '#57534e' },
  'plasma': { name: 'Plasma', emoji: '⚛️', description: 'Superheated gas.', color: '#a855f7' },
  'ocean': { name: 'Ocean', emoji: '🌊', description: 'A vast body of water.', color: '#1e3a8a' },
  'wind': { name: 'Wind', emoji: '🍃', description: 'Moving air.', color: '#ccfbf1' },
};
