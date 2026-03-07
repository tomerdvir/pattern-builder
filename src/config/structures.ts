export interface BlockPosition {
  x: number;
  y: number;
}

export interface StructureTemplate {
  name: string;
  slots: BlockPosition[];
  color: number; // tint color as hex
}

// Positions are relative to the center of the build area (640x360 canvas half-size)
// Each block is 64x64px. Positions offset from center of structure anchor.
export const STRUCTURE_TEMPLATES: StructureTemplate[] = [
  {
    name: 'tower',
    color: 0xff6b6b,
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
];
