import * as yaml from 'yaml';
import type { MenuConfig, Menu, ValidationError } from './types';

export function parseYAML(content: string): MenuConfig {
  try {
    const parsed = yaml.parse(content);
    return parsed as MenuConfig;
  } catch (error) {
    throw new Error(`YAML 解析失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// YAML 序列化选项常量
const YAML_STRINGIFY_OPTIONS = {
  defaultKeyType: 'PLAIN' as const,
  defaultStringType: 'QUOTE_DOUBLE' as const,
  lineWidth: 0  // 禁用行宽限制
};

export function stringifyYAML(config: MenuConfig): string {
  // 确保 slot keys 保持为字符串
  const processedConfig = JSON.parse(JSON.stringify(config));
  
  // 使用 yaml 的 stringify 选项确保数字键保持为字符串
  return yaml.stringify(processedConfig, YAML_STRINGIFY_OPTIONS);
}

export function validateMenu(menuId: string, menu: Menu, allMenus: Record<string, Menu>): ValidationError[] {
  const errors: ValidationError[] = [];

  // 验证 size
  const size = menu.inventory.size;
  if (size < 9 || size > 54 || size % 9 !== 0) {
    errors.push({
      type: 'error',
      message: `菜单 "${menuId}" 的 size (${size}) 必须是 9 的倍数且在 9-54 之间`,
      menuId
    });
  }

  // 验证每个 item
  if (menu.items) {
    Object.entries(menu.items).forEach(([slot, item]) => {
      const slotNum = parseInt(slot);
      
      // 验证 slot 是否超出范围
      if (slotNum < 0 || slotNum >= size) {
        errors.push({
          type: 'error',
          message: `菜单 "${menuId}" 的槽位 ${slot} 超出范围 (size: ${size})`,
          menuId,
          slot
        });
      }

      // 验证 action type
      const actionType = item.action.type;
      if (!['open', 'command', 'back'].includes(actionType)) {
        errors.push({
          type: 'error',
          message: `菜单 "${menuId}" 槽位 ${slot} 的 action.type "${actionType}" 不支持`,
          menuId,
          slot
        });
      }

      // 验证 open action
      if (actionType === 'open' && item.action.menu) {
        if (!allMenus[item.action.menu]) {
          errors.push({
            type: 'warning',
            message: `菜单 "${menuId}" 槽位 ${slot} 引用的菜单 "${item.action.menu}" 不存在`,
            menuId,
            slot
          });
        }
      }

      // 验证 command action
      if (actionType === 'command') {
        if (!item.action.commands || item.action.commands.length === 0) {
          errors.push({
            type: 'warning',
            message: `菜单 "${menuId}" 槽位 ${slot} 的 command action 没有定义命令`,
            menuId,
            slot
          });
        }
      }
    });
  }

  return errors;
}

export function validateConfig(config: MenuConfig): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!config.menus) {
    errors.push({
      type: 'error',
      message: '配置缺少 menus 字段'
    });
    return errors;
  }

  const allMenus = config.menus;

  // 验证每个菜单
  Object.entries(allMenus).forEach(([menuId, menu]) => {
    errors.push(...validateMenu(menuId, menu, allMenus));
  });

  // 检测循环引用
  const visited = new Set<string>();
  const recStack = new Set<string>();

  function detectCycle(menuId: string): boolean {
    if (recStack.has(menuId)) {
      return true;
    }
    if (visited.has(menuId)) {
      return false;
    }

    visited.add(menuId);
    recStack.add(menuId);

    const menu = allMenus[menuId];
    if (menu?.items) {
      for (const item of Object.values(menu.items)) {
        if (item.action.type === 'open' && item.action.menu) {
          if (detectCycle(item.action.menu)) {
            return true;
          }
        }
      }
    }

    recStack.delete(menuId);
    return false;
  }

  // 检查所有菜单是否有循环
  for (const mid of Object.keys(allMenus)) {
    visited.clear();
    recStack.clear();
    if (detectCycle(mid)) {
      errors.push({
        type: 'warning',
        message: `检测到循环引用，涉及菜单 "${mid}"`,
        menuId: mid
      });
      break; // 只报告一次
    }
  }

  // 检测孤儿菜单
  const referencedMenus = new Set<string>();
  Object.entries(allMenus).forEach(([, menu]) => {
    if (menu.items) {
      Object.values(menu.items).forEach(item => {
        if (item.action.type === 'open' && item.action.menu) {
          referencedMenus.add(item.action.menu);
        }
      });
    }
  });

  Object.keys(allMenus).forEach(menuId => {
    if (menuId !== 'main' && !referencedMenus.has(menuId)) {
      errors.push({
        type: 'warning',
        message: `菜单 "${menuId}" 未被任何菜单引用（孤儿菜单）`,
        menuId
      });
    }
  });

  return errors;
}

export function buildMenuTree(menus: Record<string, Menu>): Map<string, string[]> {
  const tree = new Map<string, string[]>();

  Object.entries(menus).forEach(([menuId, menu]) => {
    if (menu.items) {
      const children: string[] = [];
      Object.values(menu.items).forEach(item => {
        if (item.action.type === 'open' && item.action.menu) {
          children.push(item.action.menu);
        }
      });
      tree.set(menuId, children);
    } else {
      tree.set(menuId, []);
    }
  });

  return tree;
}
