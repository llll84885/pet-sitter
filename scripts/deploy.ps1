# ============================================
# 萌宠管家 - 一键发版脚本
# 用法：
#   .\deploy.ps1              （自动用时间作为提交说明）
#   .\deploy.ps1 "更新了定价规则"  （自定义提交说明）
# 执行后：提交代码 -> 推送 GitHub -> 自动构建镜像 -> 自动更新线上
# 全程约 3-5 分钟，无需其他操作。
# ============================================

param(
    [string]$Message = ""
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

if (-not $Message) {
    $Message = "deploy: 更新 " + (Get-Date -Format "yyyy-MM-dd HH:mm")
}

Write-Host "==> 1/4 检查变更..." -ForegroundColor Cyan
$status = git status --porcelain
if (-not $status) {
    Write-Host "没有需要提交的变更，线上已是最新版本。" -ForegroundColor Yellow
    exit 0
}
$status | ForEach-Object { Write-Host "  $_" }

Write-Host "==> 2/4 提交代码..." -ForegroundColor Cyan
git add -A
git commit -m $Message

Write-Host "==> 3/4 推送到 GitHub..." -ForegroundColor Cyan
git push origin main

Write-Host "==> 4/4 已触发自动构建与部署" -ForegroundColor Green
Write-Host ""
Write-Host "接下来 GitHub 会自动：构建镜像 -> 推送 -> 重启线上容器" -ForegroundColor Green
Write-Host "预计 3-5 分钟完成，可在此查看进度：" -ForegroundColor Green
Write-Host "  https://github.com/llll84885/pet-sitter/actions" -ForegroundColor White
Write-Host ""
Write-Host "线上地址（部署完成后刷新即可）：" -ForegroundColor Green
Write-Host "  https://jpecbjloikpd.cloud.sealos.io" -ForegroundColor White
Write-Host ""

$open = Read-Host "是否现在打开 Actions 页面查看进度？(y/n)"
if ($open -eq "y" -or $open -eq "Y") {
    Start-Process "https://github.com/llll84885/pet-sitter/actions"
}
