import { Game, Player, Monster, CombatResult, Item } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class CombatSystem {
  resolveCombat(game: Game, position: Position): CombatResult[] {
    console.assert(game && game.players, 'game must exist and have players array');
    console.assert(position && typeof position.x === 'number', 'position must be valid');
    console.assert(position.level >= 0, 'position must have valid level');

    const results: CombatResult[] = [];
    
    // Get all entities at this position
    const players = game.players.filter(p => 
      p.position.x === position.x && 
      p.position.y === position.y && 
      p.position.level === position.level
    );
    
    const monsters = game.monsters.filter(m => 
      m.position.x === position.x && 
      m.position.y === position.y && 
      m.position.level === position.level
    );

    // Handle player vs monster combat
    for (const player of players) {
      for (const monster of monsters) {
        // Monster always attacks
        const monsterDamage = Math.floor(Math.random() * monster.damage);
        player.health -= monsterDamage;
        
        results.push({
          attacker: monster.id,
          defender: player.id,
          damage: monsterDamage,
          isMonster: true
        });

        // Player attacks back
        const playerDamage = Math.floor(Math.random() * 5); // Base player damage
        monster.health -= playerDamage;
        
        results.push({
          attacker: player.id,
          defender: monster.id,
          damage: playerDamage
        });

        // Remove dead monster
        if (monster.health <= 0) {
          game.monsters = game.monsters.filter(m => m.id !== monster.id);
        }
      }
    }

    // Handle player vs player combat if difficulty allows
    if (game.difficulty >= 5 && players.length > 1) {
      for (let i = 0; i < players.length; i++) {
        for (let j = i + 1; j < players.length; j++) {
          const result = this.resolvePlayerCombat(players[i], players[j]);
          if (result) results.push(result);
        }
      }
    }

    return results;
  }

  private resolvePlayerCombat(game: Game, player1: Player, player2: Player): CombatResult | null {
    console.assert(player1 && player2, 'both players must exist');
    console.assert(player1.id !== player2.id, 'cannot fight self');
    console.assert(game.difficultySettings, 'game must have difficulty settings');

    // Only allow PvP at higher difficulties
    if (!game.difficultySettings.playerVsPlayerEnabled) {
      return null;
    }
    // 30% chance of item or map theft during combat
    if (Math.random() < 0.3) {
      if (Math.random() < 0.5) {
        // Try to steal an item
        const stolenItem = this.stealItem(player1, player2);
        if (stolenItem) {
          return {
            attacker: player1.id,
            defender: player2.id,
            damage: 0,
            itemStolen: stolenItem
          };
        }
      } else {
        // Try to steal map knowledge
        this.gameEngine.mapSystem.transferMap(player2, player1);
        return {
          attacker: player1.id,
          defender: player2.id,
          damage: 0,
          mapStolen: true
        };
      }
    }

    // Damage scales with difficulty
    const baseDamage = Math.floor(Math.random() * 5);
    const damage = Math.floor(baseDamage * (1 + game.difficulty * 0.1));
    player2.health -= damage;

    return {
      attacker: player1.id,
      defender: player2.id,
      damage
    };
  }

  private stealItem(attacker: Player, defender: Player): Item | undefined {
    console.assert(attacker && defender, 'both players must exist');
    console.assert(Array.isArray(defender.inventory), 'defender must have inventory array');

    if (defender.inventory.length === 0) return undefined;

    // Randomly select an item to steal
    const itemIndex = Math.floor(Math.random() * defender.inventory.length);
    const stolenItem = defender.inventory[itemIndex];

    // Remove from defender and add to attacker
    defender.inventory = defender.inventory.filter(item => item.id !== stolenItem.id);
    attacker.inventory.push(stolenItem);

    return stolenItem;
  }
}
