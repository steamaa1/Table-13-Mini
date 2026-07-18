# 十三号牌桌 · Table 13 Mini

一款以 **七格牌河、扑克战斗和共享牌连锁** 为核心的浏览器肉鸽游戏样品。

## 当前可玩内容

- 标准 52 张扑克牌与 7 格共享牌河
- 自动识别高牌、对子、两对、三条、顺子、同花、葫芦、四条和同花顺
- 三场连续赌客战斗
- 对子护盾、同花恢复/增伤等基础牌型特性
- 共享卡牌连锁倍率
- “红与黑”赌约：交替打出红色/黑色占优牌型获得额外倍率
- 鼠标、触摸和键盘操作
- 响应式布局、可见焦点、ARIA 状态和减弱动画支持

## 操作

1. 点击一张手牌。
2. 点击牌河中的空位放牌；点击已有牌可进行替换。
3. 牌河达到 5 张后，可点击“结算牌型”。
4. 结算会保留牌型中点数最高的两张牌，用于下一次连锁。

快捷键：`1–5` 选择手牌、`D` 弃牌、`Enter` 结算。

## 本地运行

无需安装依赖：

```bash
python3 -m http.server 8080 -d public
```

打开 `http://localhost:8080`。

运行牌型测试：

```bash
node --test
```

## Cloudflare Workers 部署

项目已包含 Workers Static Assets 配置。安装并登录 Wrangler 后：

```bash
npx wrangler login
npx wrangler deploy
```

也可以在 Cloudflare Dashboard 中连接此 GitHub 仓库，部署命令填写 `npx wrangler deploy`。

## 技术栈

- HTML5
- CSS3
- 原生 JavaScript ES Modules
- Canvas 2D 粒子效果
- Node.js 内置测试框架
- Cloudflare Workers Static Assets


## License

MIT
