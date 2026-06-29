import { defaultTheme } from '@vuepress/theme-default'
import { defineUserConfig } from 'vuepress'
import { viteBundler } from '@vuepress/bundler-vite'

export default defineUserConfig({
  lang: 'zh-CN',
  base: '/ai-doc/',

  title: 'ai-doc',
  description: 'ai-doc 的文档站',

  theme: defaultTheme({
    navbar: ['/', '/rag/', '/rag/chunk'],
    sidebar: {
      '/rag/': [
        {
          text: 'RAG',
          children: ['/rag/', '/rag/chunk'],
        },
      ],
    },
  }),

  bundler: viteBundler(),
})
