# OpenTools 官方插件源

[OpenTools](https://github.com/no1coder/opentools) 的官方插件都在这个仓库里。插件以**源码**形式提交，维护者审核后合并；合并后由 CI 统一检查、打包、签名并发布。OpenTools 的插件市场默认读取这里发布的插件源。

```
plugins/
  <插件 id>/           一个插件一个目录，目录名必须等于 plugin.json 里的 id
    plugin.json
    main.js / index.html …
scripts/build-registry.sh   检查 → 打包 → 签名 → 校验（CI 与本地共用）
```

## 用户怎么拿到这些插件

不需要做任何事：OpenTools → 控制中心 → 插件市场里看到的就是这里的插件。

插件源发布在本仓库的 `registry` 分支，OpenTools 会同时请求以下镜像，取最先返回且签名有效的那个：

- `https://cdn.jsdelivr.net/gh/no1coder/opentools-plugins@registry/index.json`
- `https://fastly.jsdelivr.net/gh/no1coder/opentools-plugins@registry/index.json`
- `https://raw.githubusercontent.com/no1coder/opentools-plugins/registry/index.json`

都连不上时，使用 App 内置的离线列表。索引与每个安装包都带签名，镜像被篡改会被识别并跳过。

## 提交新插件

1. Fork 本仓库。
2. 准备 otpack（插件开发工具）：

   ```bash
   git clone https://github.com/no1coder/opentools.git
   cd opentools && swift build -c release --product otpack   # 产物：.build/release/otpack
   ```

3. 在 fork 里生成插件模板（id 用你能控制的反向域名，如 `com.github.yourname.tool`）：

   ```bash
   otpack init plugins/com.github.yourname.tool --mode list   # 或 --mode view / run
   ```

4. 开发：OpenTools → 控制中心 → 已安装插件 → 添加 → **添加开发中的插件目录…**，选择该目录。保存文件自动热重载，日志在插件详情页里。
5. 自查：`otpack lint plugins/<id> --strict` 必须 0 错误 0 警告。
6. 提 PR，按模板填写用途与权限说明。CI 会检查并打包全部插件，构建结果可在 PR 的 Actions 页面下载试装。
7. 维护者审核源码。合并后几分钟内，所有用户的插件市场就能看到。

**更新插件**：修改代码、递增 `version`，再提 PR。插件发布后不要改 id。

审核标准就是 [插件开发规范](https://github.com/no1coder/opentools/blob/main/docs/plugin-guidelines.md)。接口文档见 [插件开发指南](https://github.com/no1coder/opentools/blob/main/docs/plugin-development.md)。

## 签名

插件作者**不需要**自己的签名密钥。CI 用维护者密钥给每个插件和整个索引签名；OpenTools 内置了对应的公钥，用户首次安装时还会记住签名公钥，之后的更新必须来自同一签名者。

想自己托管、自己签名的插件，可以自建插件源（一个静态 `index.json` + zip，用 `otpack pack --sign` 与 `otpack sign` 生成）。用户在“控制中心 → 插件源 → 自定义”中添加。

## 本地构建

```bash
OTPACK=/path/to/otpack scripts/build-registry.sh                    # 检查 + 打包到 dist/（不签名）
OTPACK=/path/to/otpack scripts/build-registry.sh --key <密钥文件>     # 维护者：同时签名
```

## 维护者

- 发布由 `.github/workflows/publish.yml` 在 main 更新时自动执行，结果强制推送到 `registry` 分支（只保留最新一次构建），并刷新 jsDelivr 缓存。
- 签名私钥保存在仓库的 Actions secret **`OPENTOOLS_REGISTRY_KEY`**（`otpack keygen` 生成的整个 JSON 文件内容）。缺少它时发布会失败，不会发布未签名的插件源。
- 公钥写在 OpenTools 的 `Settings.officialRegistryKey`。更换密钥要同时发布新版 OpenTools；已安装插件的用户需要卸载重装才能接受新签名者，所以**不要轻易更换**，并离线备份私钥。

## 许可证

本仓库的组织结构与脚本使用 MIT 许可证；各插件的许可证以插件目录内的声明为准，未声明的同为 MIT。
