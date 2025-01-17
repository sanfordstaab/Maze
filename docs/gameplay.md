# Gameplay Documentation

## Game Rules

### Movement
- Use arrow keys or WASD for movement
- PageUp/PageDown for level transitions at stairs
- Walls block movement unless there's a secret door
- Map edges wrap around to opposite side

### Combat
- Automatic when moving into monster/player space
- Damage is randomized based on difficulty
- Health regenerates slowly during movement
- Death occurs at 0 health

### Items
- Key: Required to win, reach exit with key
- Flashlight: Doubles visibility range
- Potions: Restore health when used
- Maps: Show explored areas, can be stolen

### Difficulty Effects
1. Easy (1-3):
   - More visibility
   - Stronger healing
   - No PvP
   - Few monsters

2. Medium (4-7):
   - Balanced visibility
   - Normal healing
   - PvP enabled
   - More monsters

3. Hard (8-10):
   - Limited visibility
   - Weak healing
   - Aggressive monsters
   - Dragons possible

### Winning
- Find the key
- Reach the exit door
- Must have key in inventory
- First player to exit wins
