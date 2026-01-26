# PySpigot Menu（多级箱子菜单）

这是一个基于 **PySpigot** 的多级菜单（Chest GUI）脚本插件：通过一个可配置的 `menu.yml`，你可以快速创建“主菜单 → 子菜单 → 更深层子菜单”的无限层级 GUI，并支持点击执行命令、返回上一层、以及每个物品单独的权限控制。

---

## 功能特性

- **多级菜单**：支持无限层级嵌套（主菜单 → 子菜单 → 子子菜单……）
- **三种动作类型（Action）**
  - `open`：打开子菜单
  - `command`：以玩家身份执行一条或多条命令
  - `back`：返回上一层；如果当前是根菜单（main），则关闭菜单
- **物品独立权限**：每个菜单项可单独配置 `permission:`（可选）
- **导航栈**：自动记录玩家的菜单打开顺序，实现自然的“返回”
- **冲突避免**：菜单标题会加上 `[Menu]` 前缀，避免与其它插件的 GUI 标题冲突
- **防止拿取物品**：玩家无法从菜单里拖走/拿走物品（点击已取消）

---

## 命令

- `/menu`：打开主菜单（root menu）
  - 别名：`/m`、`/gui`
  - 权限：`menu.command`


---

## 配置文件位置（重要）

本脚本通过 `YamlConfiguration.loadConfiguration(config_file)` 读取配置。**PySpigot 默认会从以下目录加载：**

- `plugins/PySpigot/projects/menu/menu.yml`
  

---

## 配置格式说明（menu.yml）

### 1) 基本结构

```yaml
menus:
  <menu_id>:
    inventory:
      size: 27         # 必须是 9 的倍数：9/18/27/36/45/54
      title: '&e&lMenu Title'
    items:
      '<slot>':        # 槽位（从 0 开始）
        item:
          material: 'DIAMOND'
          amount: 1
          name: '&a&lItem Name'
          lore:
            - '&7第一行 lore'
            - '&7第二行 lore'
          glowing: true     # 可选：发光效果（通过附魔隐藏实现）
        permission: 'menu.example'  # 可选：没有则不限制
        action:
          type: 'open|command|back'
          # type=open 时需要：
          menu: 'submenu_id'
          # type=command 时需要：
          commands:
            - 'spawn'
            - 'help'
```

### 2) Action 动作类型

#### open：打开子菜单
```yaml
action:
  type: 'open'
  menu: 'teleport'
```

#### command：执行命令（以玩家身份执行）
```yaml
action:
  type: 'command'
  commands:
    - 'spawn'
    - 'warp village'
```

- 建议在配置里 **不要写 `/` 前缀**（例如写 `spawn` 而不是 `/spawn`）

#### back：返回/关闭
```yaml
action:
  type: 'back'
```

- 在子菜单：返回上一层
- 在根菜单 `main`：关闭菜单

---

## 消息配置（misc）

```yaml
misc:
  command-message: '&6Executing command...'
  no-permission: '&cYou do not have permission to use this item!'
  only-player: '&cThis command can only be executed by players!'
```

说明：
- `command-message`：点击执行命令时提示（可选）
- `no-permission`：点击无权限菜单项时提示
- `only-player`：控制台执行命令时提示

---

## 示例菜单结构说明

默认示例配置一般包含至少三级结构，例如：

- **Main Menu（main）** → 入口主菜单
- **Teleport Menu（teleport）** → 传送相关命令 + 打开地标菜单
- **Landmarks Menu（landmarks）** → 更深一层的地标命令
- **Commands Menu（commands）** → 常用命令集合

你可以按需继续往下扩展更多层级，只需要在 `menus:` 下新增新的 `<menu_id>`，并用 `open` 指向它即可。

---

## 权限说明

- `menu.command`：允许玩家使用 `/menu`
- 每个物品可通过 `permission:` 单独控制，例如：
  - `menu.warp.shop`
  - `menu.command.weather`

如果某个 item 没有写 `permission:`，则默认任何能打开菜单的玩家都可以点击。

---

## 安装与使用

1. 在服务器安装 **PySpigot**
2. 将脚本文件放入你的 PySpigot 项目/脚本目录（例如 `menu.py`）
3. 将配置文件放入：
   - `plugins/PySpigot/config/menu.yml`
4. 重启服务器或重载 PySpigot
5. 进入游戏执行：
   - `/menu`

---

## 其他说明 / 注意事项

- 菜单物品无法被玩家拖动或取走（点击事件已取消）
- 玩家退出时会自动清理其菜单导航状态
- 脚本停止/重载时会关闭所有当前打开的本插件菜单
- 支持 Minecraft `&` 颜色代码（例如 `&a` 表示绿色）
