import { defineVersionedConfig } from '@viteplus/versions';

import { fileURLToPath, URL } from "node:url";

import vuetify from 'vite-plugin-vuetify'

import fs from 'node:fs'

// https://vitepress.dev/reference/site-config
export default defineVersionedConfig({
  title: "Incart",
  description: "A VitePress Site",

  versionsConfig: {
    current: 'latest',  // Label for current version
    sources: 'current-version',     // Current version source directory
    archive: 'versions', // Archive directory for older versions
    versionSwitcher: {
      text: 'Версия',
      includeCurrentVersion: true
    }
  },

  vite: {
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("../src", import.meta.url))
      }, 
    }, 

    plugins: [
      vuetify({autoImport: true})
    ],
  
    ssr: { noExternal: ['@incartdev/jagm-chart', 'vuetify']}, 

    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
        },
        sass: {
          api: 'modern-compiler',
        }
      }
    },

    optimizeDeps: {
      include: ['@viteplus/versions']
    }
  },
  
  vue: {
    script: {
      fs: {
        fileExists: (file) => fs.existsSync(file),
        readFile: (file) => fs.readFileSync(file, 'utf-8')
      }
    }
  },


  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    
    nav: {
      // Последняя версия
      root: [
        { text: 'Главная страница', link: '/' },
        { text: 'Документация', link: '/incart-getting-started' },
        
      ],

      'v1.2':[
        { text: 'Главная страница', link: '/' },
        { text: 'Документация', link: '/version/incart-getting-started' },
        { component: "VersionSwitcher"}
      ], 

      'v1.3':[
        { text: 'Главная страница', link: '/' },
        { text: 'Документация', link: '/version/incart-getting-started' },
        { component: "VersionSwitcher"}
      ] 
    },

    sidebar: {
      root: [
        {
          text: 'Введение',
          items: [
            { text: 'Создание простейшего графика', link: 'incart-getting-started' },
            { text: 'Страница с графиком', link: '/incart-chart-example' }
          ]
        },
        {
          text: 'Vitepress',
          items: [
            { text: 'Примеры разметки', link: '/markdown-examples' },
            { text: 'Примеры API', link: '/api-examples' }
          ]
        }
      ],

      'v1.2': [
        {
          text: 'Введение',
          items: [
            { text: 'Создание простейшего графика', link: '/version/incart-getting-started' },
            { text: 'Страница с графиком', link: '/version/incart-chart-example' }
          ]
        },
        {
          text: 'Vitepress',
          items: [
            { text: 'Примеры разметки', link: '/version/markdown-examples' },
            { text: 'Примеры API', link: '/version/api-examples' }
          ]
        }],

      'v1.3': [
        {
          text: 'Введение',
          items: [
            { text: 'Создание простейшего графика', link: '/version/incart-getting-started' },
            { text: 'Страница с графиком', link: '/version/incart-chart-example' }
          ]
        },
        {
          text: 'Vitepress',
          items: [
            { text: 'Примеры разметки', link: '/version/markdown-examples' },
            { text: 'Примеры API', link: '/version/api-examples' }
          ]
        }]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/Maev1000-7' }
    ]
  }
})
