"use client";

/**
 * FLOORCRAFT · 铺面工坊 — 商业空间规划
 *
 * 完整复刻自 floorcraft.html：一个自包含的 3D 商业空间规划器，
 * 使用 Three.js（CDN）渲染 3D 场景与平面图、jsPDF 导出图纸。
 *
 * 通过 iframe 加载 /floorcraft.html 静态文件，保持其原本的
 * 蓝图网格纸质感、温暖纸色配色与全部交互逻辑完整无改动。
 * 加载期间展示同语言的「图纸封面」启动屏，就绪后交叉淡入。
 */

import { useEffect, useRef, useState } from "react";

export default function Home() {
  const [loaded, setLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  /* iframe 可能在 React 挂上 onLoad 之前就完成加载（本地缓存 / 快速加载），
     挂载时补一次 readyState 检查，避免启动屏永不退场。 */
  useEffect(() => {
    const f = iframeRef.current;
    if (f && f.contentDocument?.readyState === "complete") setLoaded(true);
  }, []);

  return (
    <main className="fixed inset-0 bg-[#F6F2E9]">
      {/* 启动屏：与运行时开场同一构图 —— 品牌方块 + 字距展开的标题 */}
      <div
        aria-hidden
        className={`pointer-events-none fixed inset-0 z-0 flex flex-col items-center justify-center transition-opacity duration-700 ease-out ${
          loaded ? "opacity-0" : "opacity-100"
        }`}
        style={{
          backgroundImage:
            "linear-gradient(rgba(120,146,168,.13) 1px,transparent 1px),linear-gradient(90deg,rgba(120,146,168,.13) 1px,transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      >
        <div className="relative mb-6 h-9 w-9 animate-[fc-boot_1.5s_ease-in-out_infinite] bg-[#C75B39]">
          <span className="absolute inset-[8px] border-2 border-[#F6F2E9]" />
        </div>
        <p className="text-[26px] font-bold tracking-[0.22em] text-[#26231D] [text-indent:0.22em]">
          FLOORCRAFT
        </p>
        <p
          className="mt-3 text-[11px] tracking-[0.42em] text-[#6B6558] [text-indent:0.42em] [font-family:var(--font-plex-mono),monospace]"
        >
          正在展开图纸…
        </p>
      </div>

      <iframe
        ref={iframeRef}
        src="/floorcraft.html"
        title="FLOORCRAFT · 铺面工坊 — 商业空间规划"
        onLoad={() => setLoaded(true)}
        className={`fixed inset-0 z-10 h-screen w-screen border-0 transition-opacity duration-700 ease-out ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        style={{ display: "block" }}
        allow="fullscreen"
      />
    </main>
  );
}
