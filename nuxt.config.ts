// https://nuxt.com/docs/api/configuration/nuxt-config\
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: false,
  vite: {
    plugins: [tailwindcss()],
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.API_BASE,
    },
  },
  modules: [],
  css: ["./app/tailwind.css", "leaflet/dist/leaflet.css"],
})
