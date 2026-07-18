# 十三号牌桌 · Table 13 Mini

一款以 **七格牌河、扑克战斗和共享牌连锁** 为核心的 Angular 浏览器肉鸽游戏样品。

## 技术栈

- Angular 17 Standalone Components
- TypeScript 5.4
- Angular Signals 状态管理
- SCSS 组件样式
- Cloudflare Workers Static Assets

仓库不提交 `node_modules`、构建缓存或手工生成的锁文件。本次迁移环境未完成本地依赖安装，因此拉取项目后请先生成自己的 `package-lock.json`：

```bash
npm install
npm start
```

生产构建：

```bash
npm run build
```

构建输出位于 `dist/table-13-mini/browser`。

## 当前玩法

- 标准 52 张牌与七格共享牌河
- 每回合 2 次放置、替换或弃牌行动
- 自动识别并选择最强五张牌型
- 对子提供护盾，同花附加花色效果
- 共享卡牌建立连锁倍率
- “红与黑”赌约奖励红黑交替出牌
- 三名连续敌人与不同攻击强度
- 桌面和移动端响应式牌桌
- 键盘快捷键：`1–5`、`D`、`Enter`、`Esc`

## Angular 架构

```text
src/app/
├── components/
│   ├── playing-card/
│   └── game-dialog/
├── content/
│   └── enemies.ts
├── core/
│   ├── models/
│   ├── poker/
│   └── state/
└── screens/
    └── battle/
```

## 部署到 Cloudflare Workers

安装 Wrangler 并登录后：

```bash
npm run build
npx wrangler deploy
```

## 备份

迁移前的原生 HTML/CSS/JavaScript 版本保存在本地 Git 分支：

```text
backup/vanilla-ui-before-angular
```

## License

MIT
