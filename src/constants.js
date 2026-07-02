export const MAP_W = 1600;
export const MAP_H = 1200;
export const PSIZE = 22;
export const SPEED = 2.8;
export const UPDATE_MS = 40;

export const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F0B27A', '#82E0AA',
  '#E5989B', '#B5838D', '#6D597A', '#B56576',
];

export const BUILDINGS = [
  { x: 120, y: 100, w: 100, h: 80, color: '#8B7355', name: 'Shop' },
  { x: 440, y: 80,  w: 120, h: 90, color: '#A0522D', name: 'Cafe' },
  { x: 700, y: 120, w: 90,  h: 100, color: '#6B8E6B', name: 'Library' },
  { x: 1000, y: 90, w: 110, h: 80, color: '#8B4513', name: 'Inn' },
  { x: 1300, y: 100, w: 100, h: 90, color: '#CD853F', name: 'Market' },
  { x: 80,  y: 400, w: 90,  h: 100, color: '#7B68AE', name: 'Guild' },
  { x: 350, y: 450, w: 100, h: 80, color: '#B8860B', name: 'Tavern' },
  { x: 600, y: 420, w: 110, h: 90, color: '#556B2F', name: 'Park' },
  { x: 850, y: 460, w: 80,  h: 100, color: '#8B7D6B', name: 'Bank' },
  { x: 1100, y: 430, w: 100, h: 80, color: '#A0522D', name: 'Bakery' },
  { x: 1350, y: 450, w: 90,  h: 90, color: '#6A5ACD', name: 'Tower' },
  { x: 200, y: 700, w: 100, h: 80, color: '#8B4513', name: 'Forge' },
  { x: 450, y: 720, w: 90,  h: 90, color: '#CD853F', name: 'Mill' },
  { x: 700, y: 680, w: 100, h: 80, color: '#7B68AE', name: 'Temple' },
  { x: 950, y: 730, w: 110, h: 80, color: '#556B2F', name: 'Stable' },
  { x: 1200, y: 700, w: 90, h: 100, color: '#B8860B', name: 'Pub' },
];

export const TREES = [
  { x: 50, y: 50 }, { x: 290, y: 50 }, { x: 580, y: 50 },
  { x: 870, y: 50 }, { x: 1160, y: 50 }, { x: 1450, y: 50 },
  { x: 50, y: 290 }, { x: 1450, y: 290 },
  { x: 50, y: 580 }, { x: 1450, y: 580 },
  { x: 50, y: 870 }, { x: 1450, y: 870 },
  { x: 50, y: 1060 }, { x: 290, y: 1060 }, { x: 580, y: 1060 },
  { x: 870, y: 1060 }, { x: 1160, y: 1060 }, { x: 1450, y: 1060 },
  { x: 250, y: 250 }, { x: 1200, y: 250 },
  { x: 250, y: 900 }, { x: 1200, y: 900 },
];

export const FENCE_POSTS = [
  { x: 0, y: 0 }, { x: 80, y: 0 }, { x: 160, y: 0 },
  { x: 0, y: 0 }, { x: 0, y: 80 }, { x: 0, y: 160 },
  { x: MAP_W - 80, y: 0 }, { x: MAP_W, y: 0 },
  { x: MAP_W, y: 0 }, { x: MAP_W, y: 80 }, { x: MAP_W, y: 160 },
  { x: 0, y: MAP_H - 80 }, { x: 0, y: MAP_H },
  { x: 80, y: MAP_H }, { x: 160, y: MAP_H },
  { x: MAP_W - 80, y: MAP_H }, { x: MAP_W, y: MAP_H },
  { x: MAP_W, y: MAP_H - 80 }, { x: MAP_W, y: MAP_H },
];