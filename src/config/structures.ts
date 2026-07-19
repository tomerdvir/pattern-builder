export interface BlockPosition {
  x: number;
  y: number;
}

export interface StructureTemplate {
  name: string;
  slots: BlockPosition[];
  color: number; // tint color as hex
  pastelBg: string; // light background hex string for theming
}

// Positions are relative to the center of the build area (640x360 canvas half-size)
// Each block is 64x64px. Positions offset from center of structure anchor.
export const STRUCTURE_TEMPLATES: StructureTemplate[] = [
  {
    name: 'tower',
    color: 0xff6b6b,
    pastelBg: '#FFF0F0',
    slots: [
      { x: 0, y: 0 },
      { x: 0, y: -68 },
      { x: 0, y: -136 },
      { x: 0, y: -204 },
      { x: 0, y: -272 },
    ],
  },
  {
    name: 'house',
    color: 0x4ecdc4,
    pastelBg: '#EAFAF8',
    slots: [
      { x: -68, y: 0 },
      { x: 0, y: 0 },
      { x: 68, y: 0 },
      { x: -68, y: -68 },
      { x: 0, y: -68 },
      { x: 68, y: -68 },
      { x: -34, y: -136 },
      { x: 34, y: -136 },
    ],
  },
  {
    name: 'car',
    color: 0xffe66d,
    pastelBg: '#FFFBE6',
    slots: [
      { x: -68, y: 0 },
      { x: 0, y: 0 },
      { x: 68, y: 0 },
      { x: -34, y: -68 },
      { x: 34, y: -68 },
      { x: 0, y: -68 },
    ],
  },
  {
    name: 'robot',
    color: 0xa29bfe,
    pastelBg: '#F0EFFF',
    slots: [
      { x: 0, y: 0 },
      { x: -68, y: -68 },
      { x: 0, y: -68 },
      { x: 68, y: -68 },
      { x: -34, y: -136 },
      { x: 34, y: -136 },
      { x: 0, y: -204 },
      { x: -68, y: -204 },
      { x: 68, y: -204 },
      { x: 0, y: -272 },
    ],
  },
  {
    name: 'rocket',
    color: 0xff9f43,
    pastelBg: '#FFF4E6',
    slots: [
      { x: -68, y: 0 },  // left fin
      { x: 68, y: 0 },   // right fin
      { x: 0, y: 0 },    // engine
      { x: 0, y: -68 },  // body
      { x: 0, y: -136 }, // body
      { x: 0, y: -204 }, // body
      { x: 0, y: -272 }, // nose
    ],
  },
  {
    name: 'castle',
    color: 0x74b9ff,
    pastelBg: '#EAF4FF',
    slots: [
      { x: -102, y: 0 },
      { x: -34, y: 0 },
      { x: 34, y: 0 },
      { x: 102, y: 0 },
      { x: -102, y: -68 },
      { x: 102, y: -68 },
      { x: -102, y: -136 }, // left tower top
      { x: 102, y: -136 },  // right tower top
      { x: 0, y: -68 },     // gate top
    ],
  },
];
