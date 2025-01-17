interface AnimationEffect {
  x: number;
  y: number;
  type: 'damage' | 'heal' | 'pickup' | 'drop' | 'map' | 'wrap' | 'secretDoor';
  value?: string | number;
  duration?: number;
}

const activeAnimations = new Set<AnimationEffect>();

export function addAnimation(effect: AnimationEffect) {
  console.assert(effect && typeof effect.x === 'number' && typeof effect.y === 'number', 'effect must have valid coordinates');
  console.assert(effect.type, 'effect must have a type');
  console.assert(effect.duration === undefined || effect.duration > 0, 'duration must be positive if specified');

  activeAnimations.add(effect);
  setTimeout(() => {
    activeAnimations.delete(effect);
  }, effect.duration || 1000);
}

export function getActiveAnimations(): AnimationEffect[] {
  return Array.from(activeAnimations);
}

export function createDamageAnimation(x: number, y: number, damage: number) {
  console.assert(typeof x === 'number' && typeof y === 'number', 'coordinates must be numbers');
  console.assert(damage >= 0, 'damage must be non-negative');

  addAnimation({
    x,
    y,
    type: 'damage',
    value: damage,
    duration: 800
  });
}

export function createHealAnimation(x: number, y: number, amount: number) {
  addAnimation({
    x,
    y,
    type: 'heal',
    value: amount,
    duration: 800
  });
}

export function createItemAnimation(x: number, y: number, isPickup: boolean) {
  addAnimation({
    x,
    y,
    type: isPickup ? 'pickup' : 'drop',
    duration: 500
  });
}

export function createMapAnimation(x: number, y: number) {
  addAnimation({
    x,
    y,
    type: 'secretDoor',
    duration: 500,
    value: direction
  });
}

export function createWrapAnimation(fromX: number, fromY: number, toX: number, toY: number) {
  console.assert(typeof fromX === 'number' && typeof fromY === 'number', 'from coordinates must be numbers');
  console.assert(typeof toX === 'number' && typeof toY === 'number', 'to coordinates must be numbers');

  addAnimation({
    x: fromX,
    y: fromY,
    type: 'wrap',
    duration: 300,
    value: { toX, toY }
  });
}

export function createSecretDoorAnimation(x: number, y: number, direction: string) {
  addAnimation({
    x,
    y,
    type: 'map',
    duration: 1000
  });
}
