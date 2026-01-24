# PySpigot Menu

A flexible multi-level menu plugin for PySpigot that allows you to create custom chest GUI menus with multiple levels, command execution, and permission support.

## Features

- **Multi-level Menus**: Create nested menus with unlimited depth
- **Three Action Types**:
  - `open`: Open a submenu
  - `command`: Execute one or multiple commands as the player
  - `back`: Return to the previous menu or close if at the root
- **Permission Support**: Optional per-item permission checks
- **Navigation Stack**: Automatically tracks menu navigation for seamless back navigation
- **Conflict Prevention**: Uses title prefix `[Menu]` to avoid conflicts with other plugins

## Commands

- `/menu` - Open the main menu
  - Aliases: `/m`, `/gui`
  - Permission: `menu.command`

## Configuration

The plugin uses `menu.yml` for configuration. Here's the structure:

### Menu Structure

```yaml
menus:
  <menu_id>:
    inventory:
      size: 27  # Must be multiple of 9 (9, 18, 27, 36, 45, 54)
      title: '&e&lMenu Title'
    items:
      '<slot>':  # Slot number (0-based)
        item:
          material: 'DIAMOND'
          amount: 1
          name: '&a&lItem Name'
          lore:
            - '&7Line 1 of lore'
            - '&7Line 2 of lore'
          glowing: true  # Optional, adds enchantment glow
        permission: 'menu.example'  # Optional
        action:
          type: 'open|command|back'
          # For 'open' type:
          menu: 'submenu_id'
          # For 'command' type:
          commands:
            - 'spawn'
            - 'help'
```

### Action Types

1. **open**: Opens another menu (submenu)
   ```yaml
   action:
     type: 'open'
     menu: 'teleport'
   ```

2. **command**: Executes commands as the player (automatically strips `/` prefix)
   ```yaml
   action:
     type: 'command'
     commands:
       - 'spawn'
       - 'warp village'
   ```

3. **back**: Returns to the previous menu or closes the menu if at root
   ```yaml
   action:
     type: 'back'
   ```

### Messages

```yaml
misc:
  command-message: '&6Executing command...'
  no-permission: '&cYou do not have permission to use this item!'
  only-player: '&cThis command can only be executed by players!'
```

## Example Configuration

The default configuration includes a three-level menu structure:
- **Main Menu** → Root menu with access to all sections
- **Teleport Menu** → Warp commands and access to landmarks
- **Landmarks Menu** → Specific landmark locations
- **Commands Menu** → Various utility commands

## Permissions

- `menu.command` - Access to `/menu` command
- Custom permissions can be added per item using the `permission:` field in the config

## Installation

1. Install PySpigot on your server
2. Place `menu.py` and `menu.yml` in your PySpigot scripts folder
3. Restart the server or reload PySpigot
4. Use `/menu` to open the menu

## Notes

- Commands in the configuration should not include the `/` prefix (it will be automatically removed if present)
- The menu automatically cleans up player state when they quit
- All open menus are closed when the script is stopped/reloaded
- Color codes support Minecraft's `&` format (e.g., `&a` for green)