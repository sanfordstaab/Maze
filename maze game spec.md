# Maze - the game.

## Rules and play
Maze is a fun multi-player game that pits players against each other trying to find the way out of the maze while fighting monsters, stealing from each other, and exploring the maze for the key that lets them out.

At the start of a game a player is placed in a random square of the maze with an empty map and can only see the squares that are near him based on his visibility.

The goal is to get out of the maze.
The first player out is considered the winner and ends the game.
There is only one way out of the maze and that is known as the door.
The first player to land on the door with the key wins.
The key is also randomly placed in tha maze and a player may pick up the key or drop it or another player may steal the key.

Players can enter and leave the game at anytime and the maze is destroyed once the last player has left the game or once one player has exited the maze via the door with the key.

At the end of the game, all players are notified who won the game.

### Maze wrapping
Tha maze can be small but seem large.  This is because left and right wrap, top and bottom wrap and the top and bottom levels wrap so it becomes easy to become disoriented.  There is no reference point except patterns in the maze you might remember.

### Movement
The arrow keys are used to move a player through the maze.  The player cannot cross a maze wall - unless it has a secret door in it.  All players move simultaneously and can only move as fast as the server can handle the events.

### Stairs
Mazes can have multiple levels.  A stairway appears with an up arrow to go up one level or a down arrow to go down one level.  When a player moves onto a stairway they switch levels.

### Maps
As a player moves, their map is expanded so they are allowed to see any part of the maze that they have seen in the past.  Locations of items or monsters seen are shown on the map but items or monsters that are not within sight will not change on the map till those squares are seen again by the player.  Maps always show where the player started the game at unless their current map does not include that square which can happen if their map is stolen or lost.

A player's map may be stolen by a monster or another player.
When a player lands on the same square as another player or a monster, the map or flashlight may be transfered between the players.  There is a chance of either item being transfered when players or monsters collide.

### Player map transfers
When a player's map is transfered to another player during fighting, the loosing player's map is reduced to his current view.  The receiving player integrates the new map into his own map so they will then have the union of both maps that can be seen.
Thus, fighting can quickly improve your map or you may lose your map.

### Loosing your map
When a player moves there is a small chance (which gets higher at higher difficulties) that they will drop their map.  The map will be shown so they can go back to it and reclaim it but of course if another player gets there first, they integrate that map into their own map.  
When a player drops his map or has it stolen in a fight, it will be instantly obvious because they will only see the parts of the maze within their visual line of sight.

### Flashlights
Flashlights may be placed randomly around the maze.  The number of flashlights available decreases with higher difficulty but there will always be at least one flashlight.  
Players may pick up a flashlight when they find one but can only hold one flashlight at a time.
A flashlight extends the player's visibilty by twice their normal normal range.  Normal visibility is determined by the difficulty level but will never be less than 3 squares away in a straight line.

### Monsters
Monsters may be randomly placed within the maze and can move over time.  At the lower difficulty levels there are no monsters.  Monstors move 1 square at a time randomly through the maze about every interval of time for difficulty's.  The difficulty level determines how long this interval is with harder difficultys moving the monsters more often.
On higher difficulty levels the monsters will persue any player within their visibility range.
At even higher difficulty levels monsters can move through secret doors.  
Monster visibility range increases with the difficulty level.

### Player Health
Players start with 100 health points.  If their health reaches 0 in a monster or player fight, they are removed from the game.  Each square a player moves, their health increases by 1 up to the limit of 100.

### Fighting Monsters and Players
When a player lands on the same square as a monster or another polayer, they do battle with it.
This consists of blows against each opponent on that square.
Each occupant of the square may strike another player or monster on the same square.  A strike may inflict 0-5 health points.  Monsters always strike while players may strike or flee.
Monsters strike at random while players can choose who to strike.
If a player chooses to flee they are moved in a random direction from the square they were one.
During fighting, players and monsters move in a cycle and must strike when it is their turn.  Fleeing can happen at any time by simply moving away from the fighting square.
While players are fighting, each turn has a percentage chance of stealing a map from another player.
At lower difficulty levels, players cannot fight each other but only monsters.

### Items kept by players
Items held by a player may include:
- their map
- up to one flashlight
- the key
- Any number of healing potions
Monsters to not keep any items.

### Potions
Healing potions are randomly placed in the maze at game creation time. Each potion, when taken will add a random number of health points when drunk. The "D" key causes a player to drink any one of the potions they may be holding.  Healing potions are weaker and fewer at higher difficulties.  No potions exist at lower difficulty levels because there are no monsters and players cannot fight.

### Secret doors
Normally a player cannot pass through a wall of the maze but on occasion there are secret doors in the walls.  If a player attempts to cross a wall and it contains a secret door there is a 50% probability they will pass through the wall.  Secret doors are one-way.  Players cannot go back through a secret door they just passed through.

### Difficulty Level Effects
![Table of effects of difficulty setting on various parameters](./DifficultyTable.png)

## UI Description:
Maze starts with a dropdown listing all the existing game names in alphabetical order.  Each game name shows how many players are in that game currently.
At the top of the dropdown list is the item "Create a New Game".
When the user selects the "Create a New Game" item, the new game form appears and waits for the user to fill in the game options.
The options include:
- Game Name
-- A unique name to identify the game.  (Cannot be "Create a New Game")
- Maze width
-- 10 - 1000 squares
- Maze height
-- 10 - 1000 squares
- Maze depth
-- 1 - 10 levels
- Difficulty
-- 1 - 10
- Max players allowed
.. 1 - 50 Players
- Create Game Submit Button

If the user selects an existing game, the client asks for their name, which must be unique for that game, and starts that player on that game.
If the game has disappeared between the time of rendering the game list and player selection, the player is notified via a status area and the game list is updated.
The game list is periodically updated until the player chooses a game to join or decides to create a new game.
New games that have no players added for over 5 minutes are automatically destroyed.
Games where the last player leaves the game by closing the application or dying causes the game to be destroyed.

Once a player has joined a game, a sidebar appears that shows all player names in that game and a chat window to send and recieved messages to any player in the game.

## Game architecture

The maze game consists of a client and a server.

### Client

The client:
- renders the maze based on the selected zoom level
- collects new game options
- creates new games
- adds players to existing games

#### Zoom levels
Each zoom level doubles the number of squares shown width and height wise.
Each square is rendered smaller as well so the user can see more of the maze (this is on his map or visible) in the same amount of UI space.
The lowest zoom level shows the entire maze with scrollbars used if it will not fit the viewport area.
The highest zoom level shows an area of 10x10 squares.

#### Maze visibility
A player can only see so far down a straight path that is not mapped.  This distance is determined by the dificulty level where easy can see up to half the average of the width and height of the maze and harder dificulties see a proportionally shorter distance.  The minimum distance seen down a straight path is 3 squares.
Visibility is doubled if the player has a flashlight.

#### Maps
As a plyer traverses the maze, they build up their personal maze map.  Mapped areas,
that is all the squares the player has seen so far, are shown.  Each time the player moves a square, more squares may be added to the map depending on the player's visibility.

#### Flashlights
There can be as many flashlights in the maze as half the player count + 1.  If a player captures a flashlight, their visibility range is doubled down straight halls.

When a game is created, the client generates the maze according to the options given.

The maze wraps around itself so going off the top moves the player to the botomm, goint off the maze to the left moves the player to the right edge and so on.  The same goes for levels.  Going above the top level places the player in the bottom level and going off the bottom level puts the player on the top level.
The maze is generated in such a way that there is only one path between any two squares.  

The generator should generate longer straight paths for lower dificulties and shorter ones for hight difficulties.



### Server
The server holds the entire game state for each game.
The game state consists of:
- The layout of the maze:
-- Each square of the maze indicates where walls are (N, S, E, W)
-- The game parameters set by the create game options form
-- The location of each player
-- The location of any monsters
-- The location of the maze door
-- The location of they key if not in posession of a player
-- The location of each level's stairway up and down
-- The location of any maze maps that were dropped
-- The location of any flashlights
-- The location of any potions
-- Each player's items in hand.

The server supports a REST api with the game name used to identify which maze is being played on.

#### REST APIs

FetchPlayer:
- Parameters
-- Player Name
-- Player location
- Returns
-- Player items
-- Player Map (list of square coordinatess seen, list of players, monsters and item locations seen)

FetchMaze:
- Parameters
-- Maze Level
-- Center coordinate
-- width
-- height
- Returns
-- Current Maze data for the given parameters

FetchGames:
- Parameters - none.
- Returns
-- A list of all existing game names and if each game has been started or not. Games at their player limit are filtered out.

CreateGame:
- Parameters 
-- Game Name
-- Option options (JSON object text)
-- New Maze data

FetchGame:
- Parameters
-- Game Name
- Returns
-- List of all players in the game
-- Game Options (JSON object text)

ChatMsg:
- Parameters
-- game name
-- sending player name
-- recieving player names
-- message text (may be blank)
- Returns
-- Success = 1, failed = 0

ChatCheck:
- Parameters
-- game name
-- reciever player name
- Returns
-- message list consisting of sender name and messages not yet delivered or "" if no unsent messages exist.


