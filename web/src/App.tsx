import { useState } from 'react';
import type { MenuConfig, Menu, MenuItem, ValidationError } from './types';
import { parseYAML, stringifyYAML, validateConfig, buildMenuTree } from './utils';

function App() {
  const [config, setConfig] = useState<MenuConfig | null>(null);
  const [selectedMenuId, setSelectedMenuId] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [errors, setErrors] = useState<ValidationError[]>([]);

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = parseYAML(content);
        setConfig(parsed);
        setErrors(validateConfig(parsed));
        if (parsed.menus && Object.keys(parsed.menus).length > 0) {
          setSelectedMenuId(Object.keys(parsed.menus)[0]);
        }
      } catch (error) {
        alert(error instanceof Error ? error.message : '导入失败');
      }
    };
    reader.readAsText(file);
  };

  const handleExport = () => {
    if (!config) return;

    try {
      const yamlContent = stringifyYAML(config);
      const blob = new Blob([yamlContent], { type: 'text/yaml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'menu.yml';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('导出失败: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleCopyToClipboard = async () => {
    if (!config) return;

    try {
      const yamlContent = stringifyYAML(config);
      await navigator.clipboard.writeText(yamlContent);
      alert('已复制到剪贴板！');
    } catch (error) {
      alert('复制失败: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleCreateMenu = () => {
    const menuId = prompt('输入新菜单 ID:');
    if (!menuId) return;

    if (config?.menus[menuId]) {
      alert('菜单 ID 已存在！');
      return;
    }

    const newMenu: Menu = {
      inventory: {
        size: 27,
        title: '新菜单'
      },
      items: {}
    };

    setConfig(prev => {
      if (!prev) {
        return {
          menus: { [menuId]: newMenu }
        };
      }
      return {
        ...prev,
        menus: {
          ...prev.menus,
          [menuId]: newMenu
        }
      };
    });
    setSelectedMenuId(menuId);
  };

  const handleRenameMenu = () => {
    if (!selectedMenuId || !config) return;

    const newId = prompt('输入新菜单 ID:', selectedMenuId);
    if (!newId || newId === selectedMenuId) return;

    if (config.menus[newId]) {
      alert('菜单 ID 已存在！');
      return;
    }

    const newMenus = { ...config.menus };
    newMenus[newId] = newMenus[selectedMenuId];
    delete newMenus[selectedMenuId];

    // 更新所有引用
    Object.values(newMenus).forEach(menu => {
      if (menu.items) {
        Object.values(menu.items).forEach(item => {
          if (item.action.type === 'open' && item.action.menu === selectedMenuId) {
            item.action.menu = newId;
          }
        });
      }
    });

    setConfig({ ...config, menus: newMenus });
    setSelectedMenuId(newId);
  };

  const handleDeleteMenu = () => {
    if (!selectedMenuId || !config) return;

    if (!confirm(`确定要删除菜单 "${selectedMenuId}" 吗？`)) return;

    const newMenus = { ...config.menus };
    delete newMenus[selectedMenuId];

    setConfig({ ...config, menus: newMenus });
    setSelectedMenuId(Object.keys(newMenus)[0] || null);
  };

  const handleUpdateMenu = (updates: Partial<Menu>) => {
    if (!selectedMenuId || !config) return;

    setConfig({
      ...config,
      menus: {
        ...config.menus,
        [selectedMenuId]: {
          ...config.menus[selectedMenuId],
          ...updates
        }
      }
    });
  };

  const handleUpdateItem = (slot: string, item: MenuItem | null) => {
    if (!selectedMenuId || !config) return;

    const menu = config.menus[selectedMenuId];
    const newItems = { ...menu.items };

    if (item === null) {
      delete newItems[slot];
    } else {
      newItems[slot] = item;
    }

    handleUpdateMenu({ items: newItems });
    if (item === null) {
      setSelectedSlot(null);
    }
  };

  const selectedMenu = selectedMenuId && config ? config.menus[selectedMenuId] : null;
  const selectedItem = selectedSlot && selectedMenu ? selectedMenu.items[selectedSlot] : null;

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white p-4">
        <h1 className="text-2xl font-bold">PySpigot Menu 编辑器</h1>
      </header>

      <div className="container mx-auto p-4">
        {/* 导入/导出工具栏 */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="flex gap-2 flex-wrap">
            <label className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-600">
              导入 YAML
              <input type="file" accept=".yml,.yaml" onChange={handleImport} className="hidden" />
            </label>
            <button
              onClick={handleExport}
              disabled={!config}
              className="bg-green-500 text-white px-4 py-2 rounded disabled:bg-gray-300 hover:bg-green-600"
            >
              导出 YAML
            </button>
            <button
              onClick={handleCopyToClipboard}
              disabled={!config}
              className="bg-purple-500 text-white px-4 py-2 rounded disabled:bg-gray-300 hover:bg-purple-600"
            >
              复制到剪贴板
            </button>
            <button
              onClick={handleCreateMenu}
              disabled={!config}
              className="bg-indigo-500 text-white px-4 py-2 rounded disabled:bg-gray-300 hover:bg-indigo-600"
            >
              新建菜单
            </button>
          </div>
        </div>

        {config && (
          <>
            {/* 错误和警告 */}
            {errors.length > 0 && (
              <div className="bg-white rounded-lg shadow p-4 mb-4">
                <h2 className="text-lg font-bold mb-2">验证结果</h2>
                <div className="space-y-1">
                  {errors.map((error, idx) => (
                    <div
                      key={idx}
                      className={`text-sm ${error.type === 'error' ? 'text-red-600' : 'text-yellow-600'}`}
                    >
                      {error.type === 'error' ? '❌' : '⚠️'} {error.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 菜单列表 */}
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="text-lg font-bold mb-2">菜单列表</h2>
                <MenuList
                  menus={config.menus}
                  selectedMenuId={selectedMenuId}
                  onSelectMenu={setSelectedMenuId}
                  onRenameMenu={handleRenameMenu}
                  onDeleteMenu={handleDeleteMenu}
                />
              </div>

              {/* 菜单编辑器 */}
              {selectedMenu && (
                <div className="bg-white rounded-lg shadow p-4">
                  <h2 className="text-lg font-bold mb-2">
                    菜单编辑: {selectedMenuId}
                  </h2>
                  <MenuEditor
                    menu={selectedMenu}
                    onUpdate={handleUpdateMenu}
                    selectedSlot={selectedSlot}
                    onSelectSlot={setSelectedSlot}
                  />
                </div>
              )}

              {/* 物品编辑器 */}
              {selectedSlot !== null && (
                <div className="bg-white rounded-lg shadow p-4">
                  <h2 className="text-lg font-bold mb-2">
                    槽位编辑: {selectedSlot}
                  </h2>
                  <ItemEditor
                    item={selectedItem}
                    allMenus={config.menus}
                    onUpdate={(item) => handleUpdateItem(selectedSlot, item)}
                    onDelete={() => handleUpdateItem(selectedSlot, null)}
                  />
                </div>
              )}
            </div>
          </>
        )}

        {!config && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 text-lg">请导入一个 menu.yml 文件开始编辑</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface MenuListProps {
  menus: Record<string, Menu>;
  selectedMenuId: string | null;
  onSelectMenu: (menuId: string) => void;
  onRenameMenu: () => void;
  onDeleteMenu: () => void;
}

function MenuList({ menus, selectedMenuId, onSelectMenu, onRenameMenu, onDeleteMenu }: MenuListProps) {
  const menuTree = buildMenuTree(menus);

  return (
    <div>
      <div className="space-y-2">
        {Object.keys(menus).map(menuId => (
          <div
            key={menuId}
            className={`p-2 rounded cursor-pointer ${
              selectedMenuId === menuId ? 'bg-blue-100 border border-blue-500' : 'bg-gray-50 hover:bg-gray-100'
            }`}
            onClick={() => onSelectMenu(menuId)}
          >
            <div className="font-semibold">{menuId}</div>
            <div className="text-sm text-gray-600">{menus[menuId].inventory.title}</div>
            {menuTree.get(menuId) && menuTree.get(menuId)!.length > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                → {menuTree.get(menuId)!.join(', ')}
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedMenuId && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={onRenameMenu}
            className="flex-1 bg-yellow-500 text-white px-2 py-1 rounded text-sm hover:bg-yellow-600"
          >
            重命名
          </button>
          <button
            onClick={onDeleteMenu}
            className="flex-1 bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
          >
            删除
          </button>
        </div>
      )}
    </div>
  );
}

interface MenuEditorProps {
  menu: Menu;
  onUpdate: (updates: Partial<Menu>) => void;
  selectedSlot: string | null;
  onSelectSlot: (slot: string) => void;
}

function MenuEditor({ menu, onUpdate, selectedSlot, onSelectSlot }: MenuEditorProps) {
  const handleSizeChange = (size: number) => {
    onUpdate({
      inventory: { ...menu.inventory, size }
    });
  };

  const handleTitleChange = (title: string) => {
    onUpdate({
      inventory: { ...menu.inventory, title }
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">大小 (Size)</label>
        <select
          value={menu.inventory.size}
          onChange={(e) => handleSizeChange(Number(e.target.value))}
          className="w-full border rounded px-2 py-1"
        >
          {[9, 18, 27, 36, 45, 54].map(size => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">标题 (Title)</label>
        <input
          type="text"
          value={menu.inventory.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="w-full border rounded px-2 py-1"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">槽位网格</label>
        <SlotGrid
          size={menu.inventory.size}
          items={menu.items}
          selectedSlot={selectedSlot}
          onSelectSlot={onSelectSlot}
        />
      </div>
    </div>
  );
}

interface SlotGridProps {
  size: number;
  items: Record<string, MenuItem>;
  selectedSlot: string | null;
  onSelectSlot: (slot: string) => void;
}

function SlotGrid({ size, items, selectedSlot, onSelectSlot }: SlotGridProps) {
  const slots = Array.from({ length: size }, (_, i) => i);

  return (
    <div className="grid grid-cols-9 gap-1">
      {slots.map(slot => {
        const slotStr = String(slot);
        const hasItem = items[slotStr];
        const isSelected = selectedSlot === slotStr;

        return (
          <button
            key={slot}
            onClick={() => onSelectSlot(slotStr)}
            className={`aspect-square border rounded text-xs flex items-center justify-center ${
              isSelected
                ? 'bg-blue-500 text-white border-blue-700'
                : hasItem
                ? 'bg-green-100 border-green-500 hover:bg-green-200'
                : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
            }`}
            title={hasItem ? items[slotStr].item.material : `空槽位 ${slot}`}
          >
            {slot}
          </button>
        );
      })}
    </div>
  );
}

interface ItemEditorProps {
  item: MenuItem | null;
  allMenus: Record<string, Menu>;
  onUpdate: (item: MenuItem) => void;
  onDelete: () => void;
}

function ItemEditor({ item, allMenus, onUpdate, onDelete }: ItemEditorProps) {
  const [editingItem, setEditingItem] = useState<MenuItem>(
    item || {
      item: {
        material: 'STONE',
        amount: 1,
        name: '',
        lore: [],
        glowing: false
      },
      action: {
        type: 'back'
      }
    }
  );

  const [advancedJson, setAdvancedJson] = useState('{}');

  const handleSave = () => {
    try {
      // 合并高级字段
      const advanced = JSON.parse(advancedJson);
      const merged = { ...editingItem, ...advanced };
      onUpdate(merged);
    } catch (error) {
      alert('高级字段 JSON 格式错误');
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setEditingItem(prev => ({
      ...prev,
      item: {
        ...prev.item,
        [field]: value
      }
    }));
  };

  const handleActionChange = (field: string, value: any) => {
    setEditingItem(prev => ({
      ...prev,
      action: {
        ...prev.action,
        [field]: value
      }
    }));
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1">材质 (Material)</label>
        <input
          type="text"
          value={editingItem.item.material}
          onChange={(e) => handleFieldChange('material', e.target.value)}
          className="w-full border rounded px-2 py-1 text-sm"
          placeholder="DIAMOND"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">数量 (Amount)</label>
        <input
          type="number"
          value={editingItem.item.amount || 1}
          onChange={(e) => handleFieldChange('amount', Number(e.target.value))}
          className="w-full border rounded px-2 py-1 text-sm"
          min="1"
          max="64"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">名称 (Name)</label>
        <input
          type="text"
          value={editingItem.item.name || ''}
          onChange={(e) => handleFieldChange('name', e.target.value)}
          className="w-full border rounded px-2 py-1 text-sm"
          placeholder="&a&l物品名"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">描述 (Lore)</label>
        <textarea
          value={(editingItem.item.lore || []).join('\n')}
          onChange={(e) => handleFieldChange('lore', e.target.value.split('\n'))}
          className="w-full border rounded px-2 py-1 text-sm"
          rows={3}
          placeholder="每行一条描述"
        />
      </div>

      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={editingItem.item.glowing || false}
            onChange={(e) => handleFieldChange('glowing', e.target.checked)}
          />
          <span className="text-sm font-medium">发光 (Glowing)</span>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">权限 (Permission)</label>
        <input
          type="text"
          value={editingItem.permission || ''}
          onChange={(e) => setEditingItem(prev => ({ ...prev, permission: e.target.value }))}
          className="w-full border rounded px-2 py-1 text-sm"
          placeholder="menu.example"
        />
      </div>

      <hr />

      <div>
        <label className="block text-sm font-medium mb-1">动作类型 (Action Type)</label>
        <select
          value={editingItem.action.type}
          onChange={(e) => handleActionChange('type', e.target.value)}
          className="w-full border rounded px-2 py-1 text-sm"
        >
          <option value="open">打开菜单 (open)</option>
          <option value="command">执行命令 (command)</option>
          <option value="back">返回 (back)</option>
        </select>
      </div>

      {editingItem.action.type === 'open' && (
        <div>
          <label className="block text-sm font-medium mb-1">目标菜单 (Menu)</label>
          <select
            value={editingItem.action.menu || ''}
            onChange={(e) => handleActionChange('menu', e.target.value)}
            className="w-full border rounded px-2 py-1 text-sm"
          >
            <option value="">选择菜单...</option>
            {Object.keys(allMenus).map(menuId => (
              <option key={menuId} value={menuId}>{menuId}</option>
            ))}
          </select>
        </div>
      )}

      {editingItem.action.type === 'command' && (
        <div>
          <label className="block text-sm font-medium mb-1">命令列表 (Commands)</label>
          <textarea
            value={(editingItem.action.commands || []).join('\n')}
            onChange={(e) => handleActionChange('commands', e.target.value.split('\n').filter(c => c.trim()))}
            className="w-full border rounded px-2 py-1 text-sm"
            rows={3}
            placeholder="每行一条命令"
          />
        </div>
      )}

      <hr />

      <div>
        <button
          onClick={() => setAdvancedJson(JSON.stringify(editingItem, null, 2))}
          className="text-sm text-blue-600 hover:underline"
        >
          显示高级字段编辑
        </button>
        <details className="mt-2">
          <summary className="text-sm font-medium cursor-pointer">高级/扩展字段 (JSON)</summary>
          <textarea
            value={advancedJson}
            onChange={(e) => setAdvancedJson(e.target.value)}
            className="w-full border rounded px-2 py-1 text-xs font-mono mt-2"
            rows={6}
            placeholder='{"close-on-click": true, "sound": "CLICK"}'
          />
        </details>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="flex-1 bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600"
        >
          保存
        </button>
        {item && (
          <button
            onClick={onDelete}
            className="flex-1 bg-red-500 text-white px-3 py-2 rounded text-sm hover:bg-red-600"
          >
            删除
          </button>
        )}
      </div>
    </div>
  );
}

export default App;
