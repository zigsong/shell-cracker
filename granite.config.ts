import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "shell-cracker",
  brand: {
    displayName: "수달의 조개깨기", // 화면에 노출될 앱의 한글 이름으로 바꿔주세요.
    primaryColor: "#ffffff", // 화면에 노출될 앱의 기본 색상으로 바꿔주세요.
    icon: "./images/app_icon_radius_0.png", // 화면에 노출될 앱의 아이콘 이미지 주소로 바꿔주세요.
  },
  web: {
    host: "localhost",
    port: 3000,
    commands: {
      dev: "vite",
      build: "vite build",
    },
  },
  permissions: [],
  outdir: "dist",
});
