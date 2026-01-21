# PySpigot Menu System

A simple, configurable player menu system for Minecraft servers using PySpigot.

## Features

- **Multiple Menu Triggers**: Players can open the menu using:
  - `/menu` command (requires OP permissions)
  - Right-clicking while holding a clock
- **JSON Configuration**: All menu items and actions are defined in `menu.json`
- **Chest GUI Interface**: Menu is displayed as a chest inventory with clickable items
- **Multiple Action Types**: 
  - Send messages to players
  - Execute server commands
  - Close the menu
- **Placeholder Support**: Use `{player}` and `{location}` in actions

## Installation

1. Install [PySpigot](https://github.com/magicmq/PySpigot) on your Minecraft server
2. Place `menu.py` in your PySpigot scripts folder
3. Place `menu.json` in the same directory as `menu.py`
4. Restart your server or use `/pyspigot reload` to load the script

## Configuration

The `menu.json` file defines your menu structure:

```json
{
  "title": "Main Menu",
  "size": 27,
  "items": [
    {
      "slot": 10,
      "material": "DIAMOND",
      "display_name": "&b&lTeleport Home",
      "lore": [
        "&7Click to teleport home",
        "&7Cost: Free"
      ],
      "action": {
        "type": "command",
        "value": "spawn"
      }
    }
  ]
}
```

### Configuration Options

- **title**: Menu title (supports color codes with &)
- **size**: Inventory size (must be multiple of 9, max 54)
- **items**: Array of menu items
  - **slot**: Inventory slot (0-53)
  - **material**: Minecraft material name (e.g., "DIAMOND", "EMERALD")
  - **display_name**: Item display name (supports & color codes)
  - **lore**: Array of lore lines (supports & color codes)
  - **action**: Action to perform when clicked
    - **type**: "message", "command", or "close"
    - **value**: Message text or command to execute

### Color Codes

Use `&` followed by a color code:
- `&a` = Green
- `&b` = Aqua
- `&c` = Red
- `&e` = Yellow
- `&l` = Bold
- `&7` = Gray

### Placeholders

Available placeholders in action values:
- `{player}` - Player's name
- `{location}` - Player's coordinates (X, Y, Z)

## Usage

### Opening the Menu

**Method 1: Command**
```
/menu
```
Note: Requires OP permissions

**Method 2: Clock Item**
1. Obtain a clock item (`/give @p clock`)
2. Hold the clock in your hand
3. Right-click (either in the air or on a block)

### Example Actions

**Send a message to the player:**
```json
{
  "action": {
    "type": "message",
    "value": "&aHello {player}! You are at {location}"
  }
}
```

**Execute a command:**
```json
{
  "action": {
    "type": "command",
    "value": "give {player} diamond 5"
  }
}
```

**Close the menu:**
```json
{
  "action": {
    "type": "close"
  }
}
```

## Requirements

- Minecraft Server (Spigot/Paper)
- PySpigot plugin
- Python 3.x (via PySpigot)

## License

This project is open source and available under the MIT License.
