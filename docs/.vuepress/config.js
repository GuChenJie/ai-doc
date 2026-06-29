import { defaultTheme } from '@vuepress/theme-default'
import { defineUserConfig } from 'vuepress'
import { viteBundler } from '@vuepress/bundler-vite'

export default defineUserConfig({
  lang: 'en-US',
  base: '/ai-doc/',

  title: 'VuePress',
  description: 'My first VuePress Site',

  theme: defaultTheme({
    logo: 'https://vuejs.press/images/hero.png',

    navbar: ['/', '/get-started', '/rag/', '/rag/chunk'],
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
