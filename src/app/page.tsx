"use client";

/**
 * FLOORCRAFT · 铺面工坊 — 商业空间规划
 *
 * 完整复刻自 floorcraft.html：一个自包含的 3D 商业空间规划器，
 * 使用 Three.js（CDN）渲染 3D 场景与平面图、jsPDF 导出图纸。
 *
 * 通过 iframe 加载 /floorcraft.html 静态文件，保持其原本的
 * 蓝图网格纸质感、温暖纸色配色与全部交互逻辑完整无改动。
 */

export default function Home() {
  return (
    <iframe
      src="/floorcraft.html"
      title="FLOORCRAFT · 铺面工坊 — 商业空间规划"
      className="fixed inset-0 h-screen w-screen border-0"
      style={{ display: "block" }}
      allow="fullscreen"
    />
  );
}
