#!/usr/bin/env bash
# 构建官方插件源：检查全部插件 → 打包到 dist/ →（给了密钥时）签名 → 校验。
# PR 检查与发布共用这一个脚本，本地也可以直接跑。
#
#   scripts/build-registry.sh                 # 只检查和打包（不签名）
#   scripts/build-registry.sh --key <密钥文件>  # 打包 + 开发者签名 + 索引签名（发布用）
#
# otpack 默认从 PATH 中找，也可以用 OTPACK=<路径> 指定（在 OpenTools 仓库里 swift build -c release --product otpack）。
set -euo pipefail
cd "$(dirname "$0")/.."

OTPACK="${OTPACK:-otpack}"
KEY=""
if [[ "${1:-}" == "--key" ]]; then KEY="${2:?--key 需要密钥文件路径}"; fi

official() { [[ "$1" == dev.opentools.* ]]; } # 保留前缀：只有官方插件可以用

# 1. 检查：目录名必须等于插件 id；lint 0 错误 0 警告
status=0
for dir in plugins/*/; do
  dir="${dir%/}"
  id="$(basename "$dir")"
  manifest_id="$(plutil -extract id raw -o - "$dir/plugin.json" 2>/dev/null || true)"
  if [[ "$id" != "$manifest_id" ]]; then
    echo "✗ $dir：目录名必须与 plugin.json 中的 id 一致（当前 id：${manifest_id:-读取失败}）"
    status=1
    continue
  fi
  flags=(--strict)
  if official "$id"; then flags+=(--official); fi
  "$OTPACK" lint "$dir" "${flags[@]}" || status=1
done
if [[ $status != 0 ]]; then echo "检查未通过"; exit 1; fi

# 2. 打包：固定文件时间戳，同样的源码打出同样的安装包，审核者可以在本地复现 sha256
rm -rf dist
mkdir -p dist
find plugins -exec touch -h -t 202001010000 {} +
for dir in plugins/*/; do
  dir="${dir%/}"
  args=(pack "$dir" --registry dist)
  if official "$(basename "$dir")"; then args+=(--official); fi
  if [[ -n "$KEY" ]]; then args+=(--sign "$KEY"); fi
  "$OTPACK" "${args[@]}"
done

# 3. 签名索引并校验整个插件源
if [[ -n "$KEY" ]]; then
  "$OTPACK" sign --registry dist --key "$KEY"
  "$OTPACK" verify --registry dist --key "$KEY"
else
  "$OTPACK" verify --registry dist
fi
