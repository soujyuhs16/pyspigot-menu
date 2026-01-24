import pyspigot as ps

from org.bukkit import Bukkit
from org.bukkit.inventory import ItemStack
from org.bukkit import Material
from org.bukkit import ChatColor
from org.bukkit.enchantments import Enchantment
from org.bukkit.inventory import ItemFlag
from org.bukkit.event.inventory import InventoryClickEvent
from org.bukkit.event.player import PlayerQuitEvent
from org.bukkit.entity import Player
from java.util import UUID

# Global state
config = None
menus = {}  # menu_id -> menu data
inventories = {}  # menu_id -> inventory object
title_to_menu = {}  # title -> menu_id mapping
player_menu_stack = {}  # player UUID -> list of menu_ids
messages = {}  # misc messages
TITLE_PREFIX = "[Menu] "


def load_item(config_section):
    """Load an ItemStack from config section"""
    material = Material.matchMaterial(config_section.getString('material'))

    if config_section.contains('amount'):
        item = ItemStack(material, config_section.getInt('amount'))
    else:
        item = ItemStack(material)

    item_meta = item.getItemMeta()

    if config_section.contains('name'):
        item_meta.setDisplayName(ChatColor.translateAlternateColorCodes('&', config_section.getString('name')))

    if config_section.contains('lore'):
        lore_translated = [ChatColor.translateAlternateColorCodes('&', line) for line in config_section.getStringList('lore')]
        item_meta.setLore(lore_translated)

    if config_section.contains('glowing'):
        if config_section.getBoolean('glowing'):
            item_meta.addEnchant(Enchantment.SHARPNESS, 1, True)
            item_meta.addItemFlags(ItemFlag.HIDE_ENCHANTS)

    item.setItemMeta(item_meta)

    return item


def load_menus():
    """Load all menus from configuration"""
    global menus, inventories, title_to_menu, messages

    config = ps.config.loadConfig('menu.yml')

    # Load misc messages
    misc_section = config.getConfigurationSection('misc')
    messages['command-message'] = ChatColor.translateAlternateColorCodes('&', misc_section.getString('command-message'))
    messages['no-permission'] = ChatColor.translateAlternateColorCodes('&', misc_section.getString('no-permission'))
    messages['only-player'] = ChatColor.translateAlternateColorCodes('&', misc_section.getString('only-player'))

    # Load all menus
    menus_section = config.getConfigurationSection('menus')
    for menu_id in menus_section.getKeys(False):
        menu_config = menus_section.getConfigurationSection(menu_id)
        
        # Load inventory settings
        inventory_section = menu_config.getConfigurationSection('inventory')
        size = inventory_section.getInt('size')
        title = ChatColor.translateAlternateColorCodes('&', inventory_section.getString('title'))
        
        # Add prefix to title to avoid conflicts
        full_title = TITLE_PREFIX + title
        
        # Create inventory
        inventory = Bukkit.createInventory(None, size, full_title)
        
        # Store menu data
        menu_data = {
            'id': menu_id,
            'size': size,
            'title': full_title,
            'items': {}
        }
        
        # Load items
        if menu_config.contains('items'):
            items_section = menu_config.getConfigurationSection('items')
            for slot_key in items_section.getKeys(False):
                slot = int(slot_key)
                item_config = items_section.getConfigurationSection(slot_key)
                
                # Load item
                item_section = item_config.getConfigurationSection('item')
                item = load_item(item_section)
                
                # Load action
                action_section = item_config.getConfigurationSection('action')
                action_type = action_section.getString('type')
                
                action_data = {
                    'type': action_type
                }
                
                if action_type == 'open':
                    action_data['menu'] = action_section.getString('menu')
                elif action_type == 'command':
                    action_data['commands'] = list(action_section.getStringList('commands'))
                
                # Load permission if exists
                permission = None
                if item_config.contains('permission'):
                    permission = item_config.getString('permission')
                
                # Store item data
                menu_data['items'][slot] = {
                    'item': item,
                    'action': action_data,
                    'permission': permission
                }
                
                # Add item to inventory
                inventory.setItem(slot, item)
        
        menus[menu_id] = menu_data
        inventories[menu_id] = inventory
        title_to_menu[full_title] = menu_id


def open_menu(player, menu_id):
    """Open a menu for a player"""
    if menu_id not in inventories:
        player.sendMessage(ChatColor.RED + "Menu not found: " + menu_id)
        return
    
    player.openInventory(inventories[menu_id])
    
    # Add to player's menu stack
    player_uuid = player.getUniqueId()
    if player_uuid not in player_menu_stack:
        player_menu_stack[player_uuid] = []
    player_menu_stack[player_uuid].append(menu_id)


def get_current_menu(player):
    """Get the current menu ID for a player based on their open inventory"""
    if player.getOpenInventory() is not None:
        title = player.getOpenInventory().getTitle()
        if title in title_to_menu:
            return title_to_menu[title]
    return None


def go_back(player):
    """Navigate back to the previous menu or close if at root"""
    player_uuid = player.getUniqueId()
    
    if player_uuid not in player_menu_stack or len(player_menu_stack[player_uuid]) == 0:
        player.closeInventory()
        return
    
    # Remove current menu from stack
    player_menu_stack[player_uuid].pop()
    
    # If stack is empty or has only one item (main menu), close
    if len(player_menu_stack[player_uuid]) <= 1:
        player.closeInventory()
        # Clear the stack
        if player_uuid in player_menu_stack:
            player_menu_stack[player_uuid] = []
    else:
        # Open previous menu
        previous_menu = player_menu_stack[player_uuid][-1]
        # Remove it first so open_menu can add it back
        player_menu_stack[player_uuid].pop()
        open_menu(player, previous_menu)


def execute_commands(player, commands):
    """Execute a list of commands as the player"""
    for command in commands:
        # Strip leading '/' if present
        cmd = command.strip()
        if cmd.startswith('/'):
            cmd = cmd[1:]
        
        # Execute command
        player.performCommand(cmd)


def on_inventory_click(event):
    """Handle inventory click events"""
    if event.getClickedInventory() is None:
        return
    
    title = event.getView().getTitle()
    
    # Check if this is one of our menus
    if title not in title_to_menu:
        return
    
    # Cancel the event to prevent item movement
    event.setCancelled(True)
    
    menu_id = title_to_menu[title]
    menu_data = menus[menu_id]
    
    slot = event.getSlot()
    
    # Check if this slot has an item
    if slot not in menu_data['items']:
        return
    
    item_data = menu_data['items'][slot]
    player = event.getWhoClicked()
    
    # Check permission
    if item_data['permission'] is not None:
        if not player.hasPermission(item_data['permission']):
            player.sendMessage(messages['no-permission'])
            return
    
    action = item_data['action']
    action_type = action['type']
    
    if action_type == 'open':
        # Open submenu
        target_menu = action['menu']
        open_menu(player, target_menu)
    
    elif action_type == 'command':
        # Execute commands
        commands = action['commands']
        player.closeInventory()
        
        # Send message if configured
        if messages['command-message']:
            player.sendMessage(messages['command-message'])
        
        # Execute commands
        execute_commands(player, commands)
        
        # Clear menu stack
        player_uuid = player.getUniqueId()
        if player_uuid in player_menu_stack:
            player_menu_stack[player_uuid] = []
    
    elif action_type == 'back':
        # Go back to previous menu or close
        go_back(player)


def on_player_quit(event):
    """Clean up player menu stack when they quit"""
    player = event.getPlayer()
    player_uuid = player.getUniqueId()
    
    if player_uuid in player_menu_stack:
        del player_menu_stack[player_uuid]


def on_command(sender, label, args):
    """Handle the /menu command"""
    if isinstance(sender, Player):
        if sender.hasPermission('menu.command'):
            # Open the main menu
            open_menu(sender, 'main')
        else:
            sender.sendMessage(ChatColor.RED + 'You do not have permission to execute this command!')
    else:
        sender.sendMessage(messages['only-player'])
    
    return True


def stop():
    """Clean up when the script stops"""
    # Close all open plugin menus
    for player in Bukkit.getOnlinePlayers():
        if player.getOpenInventory() is not None:
            title = player.getOpenInventory().getTitle()
            if title in title_to_menu:
                player.closeInventory()
    
    # Clear all player menu stacks
    player_menu_stack.clear()


# Initialize
load_menus()

# Register event listeners
ps.listener_manager().registerListener(on_inventory_click, InventoryClickEvent)
ps.listener_manager().registerListener(on_player_quit, PlayerQuitEvent)

# Register command
ps.command_manager().registerCommand(on_command, 'menu', 'Open the menu GUI', '/menu', ['m', 'gui'])
