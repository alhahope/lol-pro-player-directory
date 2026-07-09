# 英雄联盟职业选手资料库

这是一个部署在 GitHub Pages 上的英雄联盟职业选手资料汇总网站。项目默认收录 Leaguepedia `Players` 表中可查询到的全部选手记录，包括现役、退役、替补、青训和历史选手。

## 功能

- 全量汇总 Leaguepedia 公开职业选手记录
- 支持按 ID、姓名、国家、赛区、位置、战队搜索
- 支持现役、退役、替补、青训、人物身份筛选
- 展示选手详情和 Leaguepedia 原始页面链接
- GitHub Actions 每天自动更新数据
- GitHub Pages 静态部署

## 数据来源

主要数据来自 Leaguepedia / LoL Esports Wiki 的公开 Cargo 数据：

- https://lol.fandom.com/wiki/Special:CargoTables/Players

“所有职业选手”以 Leaguepedia 公开数据为准；本站会尽量保留原始字段并标注来源。

## 本地运行

```bash
npm install
npm run update:data
npm run dev
```

## 测试和构建

```bash
npm test
npm run build
```
