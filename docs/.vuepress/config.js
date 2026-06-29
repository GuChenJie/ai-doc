import { defineUserConfig } from 'vuepress'
import { viteBundler } from '@vuepress/bundler-vite'
import { defineNavbarConfig, plumeTheme } from 'vuepress-theme-plume'

export default defineUserConfig({
  lang: 'zh-CN',
  base: '/ai-doc/',

  title: 'ai-doc',
  description: 'ai-doc 的文档站',

  theme: plumeTheme({
    navbar: defineNavbarConfig([
      { text: 'RAG', link: '/rag/' },
      { text: 'Chunk', link: '/rag/chunk' },
    ]),
  }),

  bundler: viteBundler(),
})
