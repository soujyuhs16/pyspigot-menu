"""
PySpigot Menu System

This script implements a configurable menu system for Minecraft servers using PySpigot.
Players can open the menu using the /menu command or by right-clicking with a clock.
"""

import pyspigot as ps
import json
import os
from org.bukkit import Bukkit, Material
from org.bukkit.inventory import Inventory, ItemStack
from org.bukkit.event.player import PlayerInteractEvent
from org.bukkit.event.inventory import InventoryClickEvent
from org.bukkit.event import EventPriority
from org.bukkit.event.block import Action
from java.io import File

# Get the script path and config file path
script_path = os.path.dirname(os.path.abspath(__file__))
config_file = os.path.join(script_path, "menu.json")

# Global variable to store menu configuration
menu_config = None

def load_menu_config():
    """Load the menu configuration from menu.json"""
    global menu_config
    try:
        if not os.path.exists(config_file):
            ps.logger.warning(f"Menu configuration file not found at {config_file}")
            return False
        
        with open(config_file, 'r') as f:
            menu_config = json.load(f)
            ps.logger.info("Menu configuration loaded successfully")
            return True
    except Exception as e:
        ps.logger.error(f"Error loading menu configuration: {e}")
        return False

def translate_color_codes(text):
    """Translate & color codes to Minecraft color codes"""
    return text.replace('&', '§')

def create_item(material_name, display_name, lore=None, amount=1):
    """Create an ItemStack with display name and lore"""
    try:
        # Use matchMaterial for better compatibility with newer Bukkit versions
        material = Material.matchMaterial(material_name)
        if material is None:
            ps.logger.warning(f"Invalid material: {material_name}")
            material = Material.STONE
        
        item = ItemStack(material, amount)
        meta = item.getItemMeta()
        
        if display_name:
            meta.setDisplayName(translate_color_codes(display_name))
        
        if lore:
            lore_list = []
            for line in lore:
                lore_list.append(translate_color_codes(line))
            meta.setLore(lore_list)
        
        item.setItemMeta(meta)
        return item
    except Exception as e:
        ps.logger.error(f"Error creating item: {e}")
        return ItemStack(Material.STONE)

def open_menu(player):
    """Open the menu GUI for a player"""
    if menu_config is None:
        player.sendMessage(translate_color_codes("&cMenu configuration not loaded!"))
        return
    
    try:
        title = translate_color_codes(menu_config.get("title", "Menu"))
        size = menu_config.get("size", 27)
        
        # Create inventory
        inventory = Bukkit.createInventory(None, size, title)
        
        # Add items to inventory
        items = menu_config.get("items", [])
        for item_config in items:
            slot = item_config.get("slot", 0)
            material = item_config.get("material", "STONE")
            display_name = item_config.get("display_name", "")
            lore = item_config.get("lore", [])
            
            item = create_item(material, display_name, lore)
            inventory.setItem(slot, item)
        
        # Open inventory for player
        player.openInventory(inventory)
        ps.logger.info(f"Opened menu for player {player.getName()}")
        
    except Exception as e:
        ps.logger.error(f"Error opening menu: {e}")
        player.sendMessage(translate_color_codes("&cError opening menu!"))

def handle_menu_click(event):
    """Handle inventory click events in the menu"""
    if menu_config is None:
        return
    
    try:
        inventory = event.getInventory()
        title = inventory.getTitle()
        expected_title = translate_color_codes(menu_config.get("title", "Menu"))
        
        # Check if this is our menu
        if title != expected_title:
            return
        
        event.setCancelled(True)  # Prevent item manipulation
        
        player = event.getWhoClicked()
        slot = event.getRawSlot()
        
        # Find the action for this slot
        items = menu_config.get("items", [])
        for item_config in items:
            if item_config.get("slot") == slot:
                action = item_config.get("action", {})
                action_type = action.get("type", "")
                action_value = action.get("value", "")
                
                # Replace placeholders with sanitized values
                # Sanitize player name to prevent command injection
                safe_player_name = player.getName().replace(";", "").replace("&", "").replace("|", "")
                action_value = action_value.replace("{player}", safe_player_name)
                location = player.getLocation()
                location_str = f"{location.getBlockX()}, {location.getBlockY()}, {location.getBlockZ()}"
                action_value = action_value.replace("{location}", location_str)
                
                # Execute action
                if action_type == "message":
                    player.sendMessage(translate_color_codes(action_value))
                elif action_type == "command":
                    # Execute command as player (not console) for security
                    # This prevents privilege escalation through menu configuration
                    Bukkit.dispatchCommand(player, action_value)
                    player.sendMessage(translate_color_codes("&aCommand executed!"))
                elif action_type == "close":
                    player.closeInventory()
                
                ps.logger.info(f"Player {player.getName()} clicked slot {slot} with action {action_type}")
                break
                
    except Exception as e:
        ps.logger.error(f"Error handling menu click: {e}")

def on_menu_command(sender, label, args):
    """Handle /menu command"""
    if not sender.isOp():  # Check if player is operator (for basic permission)
        sender.sendMessage(translate_color_codes("&cYou don't have permission to use this command!"))
        return True
    
    open_menu(sender)
    return True

def on_player_interact(event):
    """Handle player interaction events (right-click with clock)"""
    player = event.getPlayer()
    action = event.getAction()
    
    # Check if player right-clicked
    if action != Action.RIGHT_CLICK_AIR and action != Action.RIGHT_CLICK_BLOCK:
        return
    
    # Check if player is holding a clock
    # Use getInventory().getItemInMainHand() for better compatibility with newer versions
    item = player.getInventory().getItemInMainHand()
    if item is None or item.getType() != Material.CLOCK:
        return
    
    # Open menu
    event.setCancelled(True)
    open_menu(player)

# Load configuration on script start
load_menu_config()

# Register command
ps.command.registerCommand(on_menu_command, 'menu')
ps.logger.info("Registered /menu command")

# Register event listeners
ps.listener.registerListener(on_player_interact, PlayerInteractEvent, EventPriority.NORMAL)
ps.logger.info("Registered PlayerInteractEvent listener")

ps.listener.registerListener(handle_menu_click, InventoryClickEvent, EventPriority.NORMAL)
ps.logger.info("Registered InventoryClickEvent listener")

ps.logger.info("PySpigot Menu System loaded successfully!")
