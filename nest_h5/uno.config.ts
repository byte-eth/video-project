import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetMini,
} from 'unocss'

import presetWind3 from '@unocss/preset-wind3'
// https://unocss.dev/presets/rem-to-px
import presetRemToPx from '@unocss/preset-rem-to-px'

export default defineConfig({
  theme: {
    colors: {
      // 一级文字颜色
      lv1: '#14161A',
      lv2: 'rgba(20, 22, 26, 0.9)',
    },
    fontFamily: {
      title: ['"HarmonyOS Sans SC"'], // 标题字体
    },
  },
  presets: [
    presetWind3(),
    presetAttributify,
    presetIcons(),
    presetRemToPx({
      baseFontSize: 4,
    }),
    presetMini(),
  ],
  shortcuts: [
    // shortcuts to multiple utilities
    ['btn', 'px-6 py-3 rounded-3 border-none inline-block bg-green-400 text-white cursor-pointer !outline-none hover:bg-green-600 disabled:cursor-default disabled:bg-gray-600 disabled:opacity-50'],
    ['flex-between', 'flex justify-between items-center'],
    ['flex-center', 'flex justify-center items-center'],
    ['flex-align-center', 'flex items-center'],
  ],
})
