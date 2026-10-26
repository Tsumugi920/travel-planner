# travel-planner 旅行计划 ✈️

一个前后端完整、开箱即用的旅行规划小项目：管理多个行程，为每个行程**按天安排景点与活动**、记录**预算并自动汇总**、维护可勾选的**打包清单**。

- **后端**：Node.js + Express，REST API，数据持久化到 `server/data.json`
- **前端**：原生 HTML / CSS / JavaScript（无框架），由后端静态托管，与 API 同源
- **内置数据**：3 个示例行程（东京五日游、成都美食周末、巴厘岛海岛度假），含日程安排、预算条目与打包清单

## 目录结构

```
travel-planner/
├── package.json          # 启动脚本 npm start（端口 3011）
├── client/
│   ├── index.html        # 页面结构（列表 / 详情 / 弹窗）
│   ├── style.css         # 样式
│   └── app.js            # 前端逻辑（调用 REST API）
└── server/
    ├── server.js         # Express 后端 + REST API
    ├── seed.js           # 内置示例数据（3 个行程）
    └── data.json         # 数据文件（首次启动自动生成）
```

## 安装与启动

要求 Node.js ≥ 16。

```bash
cd travel-planner
npm install
npm start
```

启动后浏览器访问 **http://localhost:3011** 即可使用（前端页面与 API 由同一个服务提供）。

> - 端口默认 **3011**，可用环境变量 `PORT` 覆盖，例如 `PORT=4000 npm start`。
> - 首次启动时若 `server/data.json` 不存在，会自动写入 3 个示例行程。

## 功能

| 模块 | 说明 |
| --- | --- |
| 行程列表 | 卡片式展示所有行程（目的地、日期、天数、累计支出、日程与打包进度），支持新建 / 编辑 / 删除 |
| 行程安排 | 按天分组展示，可添加 / 编辑 / 删除安排（第几天、时间、类型：景点/活动/美食/交通/住宿/购物/其他、标题、备注） |
| 预算统计 | 按类别记一笔（交通/住宿/餐饮/门票/活动/购物/其他），自动汇总总支出与各类别小计 |
| 打包清单 | 添加物品、勾选打包状态（带进度条）、删除 |

## REST API

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/trips` | 行程列表（每项含预算汇总 `budgetSummary`） |
| POST | `/api/trips` | 新建行程 `{ name, destination, startDate, endDate }` |
| GET | `/api/trips/:id` | 行程详情（含预算汇总） |
| PUT | `/api/trips/:id` | 修改行程（字段可选） |
| DELETE | `/api/trips/:id` | 删除行程（连同日程 / 预算 / 打包清单） |
| GET | `/api/trips/:id/schedule` | 每日安排列表（按天 + 时间排序） |
| POST | `/api/trips/:id/schedule` | 新增安排 `{ day, time, title, type, note }` |
| PUT | `/api/trips/:id/schedule/:itemId` | 修改安排 |
| DELETE | `/api/trips/:id/schedule/:itemId` | 删除安排 |
| GET | `/api/trips/:id/budget` | 预算条目 + 汇总 `{ items, total, byCategory }` |
| POST | `/api/trips/:id/budget` | 新增预算条目 `{ category, amount, note }` |
| PUT | `/api/trips/:id/budget/:itemId` | 修改预算条目 |
| DELETE | `/api/trips/:id/budget/:itemId` | 删除预算条目 |
| GET | `/api/trips/:id/packing` | 打包清单 |
| POST | `/api/trips/:id/packing` | 新增物品 `{ name }` |
| PUT | `/api/trips/:id/packing/:itemId` | 勾选 / 改名 `{ checked, name }` |
| DELETE | `/api/trips/:id/packing/:itemId` | 删除物品 |

## 用 curl 手动验证接口

```bash
# 列出行程（应返回 3 个示例行程）
curl -s http://localhost:3011/api/trips

# 新增行程
curl -s -X POST http://localhost:3011/api/trips \
  -H 'Content-Type: application/json' \
  -d '{"name":"北海道赏雪","destination":"日本 · 北海道","startDate":"2027-01-05","endDate":"2027-01-08"}'

# 新增日程（TRIP_ID 换成上一步返回的 id）
curl -s -X POST http://localhost:3011/api/trips/TRIP_ID/schedule \
  -H 'Content-Type: application/json' \
  -d '{"day":1,"time":"10:00","title":"旭山动物园","type":"景点","note":"看企鹅散步"}'

# 预算汇总（内置示例行程）
curl -s http://localhost:3011/api/trips/trip_tokyo/budget
```

## 数据与持久化

所有数据保存在 `server/data.json`，每次增删改立即写盘，重启服务不丢失。删除该文件并重启即可恢复为内置示例数据。
