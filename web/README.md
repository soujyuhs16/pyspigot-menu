# PySpigot Menu 在线编辑器

一个用于在线图形化生成与编辑 PySpigot `menu.yml` 配置文件的 Web 应用。

## 功能特性

- ✅ **导入/导出** - 上传现有 menu.yml 文件，编辑后导出或复制到剪贴板
- ✅ **多级菜单管理** - 创建、重命名、删除菜单，查看菜单引用关系
- ✅ **可视化编辑** - 槽位网格显示，点击编辑物品
- ✅ **完整字段支持** - 支持 material、amount、name、lore、glowing、permission 等字段
- ✅ **动作配置** - 支持 open（打开菜单）、command（执行命令）、back（返回）三种动作类型
- ✅ **智能验证** - 自动检测配置错误、循环引用、孤儿菜单等问题
- ✅ **扩展字段支持** - 通过高级字段编辑器添加未来扩展字段（如 close-on-click、sound 等）
- ✅ **中文界面** - 完全中文化的用户界面

## 开发环境

### 前置要求

- Node.js 16+ 
- npm 或 yarn

### 本地开发

```bash
cd web
npm install
npm run dev
```

访问 http://localhost:5173 即可使用。

### 构建生产版本

```bash
cd web
npm run build
```

构建产物将输出到 `web/dist/` 目录。

### 预览生产构建

```bash
cd web
npm run preview
```

## GitHub Pages 部署

### 方式一：使用 GitHub Actions 自动部署（推荐）

本项目已配置 GitHub Actions 工作流，会自动构建并部署到 GitHub Pages。

1. 在仓库的 Settings → Pages 中，将 Source 设置为 "GitHub Actions"
2. 推送代码到 main 分支后，Actions 会自动运行
3. 部署完成后，访问 `https://<username>.github.io/pyspigot-menu/` 即可使用

### 方式二：手动部署

```bash
# 1. 构建项目
cd web
npm run build

# 2. 进入构建目录
cd dist

# 3. 初始化 git 仓库
git init
git add -A
git commit -m 'deploy'

# 4. 推送到 gh-pages 分支
git push -f git@github.com:<username>/pyspigot-menu.git main:gh-pages

# 5. 在仓库 Settings → Pages 中，将 Source 设置为 "gh-pages" 分支
```

## 使用说明

1. **导入配置** - 点击"导入 YAML"按钮，选择现有的 `menu.yml` 文件
2. **编辑菜单** - 在左侧菜单列表中选择要编辑的菜单
3. **编辑槽位** - 在中间的槽位网格中点击要编辑的槽位
4. **配置物品** - 在右侧编辑器中配置物品属性和动作
5. **保存修改** - 点击"保存"按钮保存对槽位的修改
6. **导出配置** - 点击"导出 YAML"下载文件，或"复制到剪贴板"直接复制

## 技术栈

- **Vite** - 快速的前端构建工具
- **React 19** - UI 框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **yaml** - YAML 解析和序列化

## 配置格式说明

编辑器遵循 PySpigot Menu 的标准配置格式，slot key 保持为字符串格式（如 `'10'`）。

支持的字段：
- `inventory.size` - 菜单大小（9-54，9的倍数）
- `inventory.title` - 菜单标题（支持 & 颜色代码）
- `items.<slot>.item` - 物品配置
  - `material` - 物品材质
  - `amount` - 数量
  - `name` - 显示名称
  - `lore` - 描述文本（数组）
  - `glowing` - 是否发光
- `items.<slot>.permission` - 权限要求（可选）
- `items.<slot>.action` - 动作配置
  - `type` - 动作类型（open/command/back）
  - `menu` - 目标菜单（open类型）
  - `commands` - 命令列表（command类型）

## 许可证

与主项目保持一致
