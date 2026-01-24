// 类型定义
export interface MenuConfig {
  menus: Record<string, Menu>;
  misc?: {
    'command-message'?: string;
    'no-permission'?: string;
    'only-player'?: string;
  };
  [key: string]: any; // 保留未知字段
}

export interface Menu {
  inventory: {
    size: number;
    title: string;
  };
  items: Record<string, MenuItem>;
  [key: string]: any; // 保留未知字段
}

export interface MenuItem {
  item: {
    material: string;
    amount?: number;
    name?: string;
    lore?: string[];
    glowing?: boolean;
    [key: string]: any; // 保留未知字段
  };
  action: Action;
  permission?: string;
  [key: string]: any; // 保留未知字段
}

export type ActionType = 'open' | 'command' | 'back';

export interface Action {
  type: ActionType;
  menu?: string; // for 'open' type
  commands?: string[]; // for 'command' type
  [key: string]: any; // 保留未知字段
}

export interface ValidationError {
  type: 'error' | 'warning';
  message: string;
  menuId?: string;
  slot?: string;
}
