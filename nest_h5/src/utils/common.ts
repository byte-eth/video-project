import {showSuccessToast} from 'vant'
export const getImg = (url: string) => {
    return new URL(`../assets/images/${url}`, import.meta.url).href;
};

/** 宠物页本地图：`src/assets/images/pet/` 下的文件名，如 `dragon_1.png` */
export const getPetImg = (filename: string) => {
    return new URL(`../assets/images/pet/${filename}`, import.meta.url).href;
};

/** 宠物页本地视频：同目录，如 `tiger_1v.mp4` */
export const getPetVideo = (filename: string) => {
    return new URL(`../assets/images/pet/${filename}`, import.meta.url).href;
};

// 滚动条滚动到顶部
export const scrollToTop = () => {
    const app = document.getElementById('app');
    if (app) {
        app.scrollTo({
            top: 0,
        });
    }
}

// 复制文本的方法
export function copyText(text) {
  if (navigator.clipboard) {
    // 使用 Clipboard API
    navigator.clipboard.writeText(text)
      .then(() => {
        showSuccessToast({ message: '复制成功' })
      })
      .catch((error) => {
        console.error('复制失败:', error)
      })
  }
  else {
    // 使用 document.execCommand 作为备用方案
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    try {
      const successful = document.execCommand('copy')
      if (successful) {
        showSuccessToast({ message: '复制成功' })
      }
      else {
        console.error('复制失败')
      }
    }
    catch (err) {
      console.error('复制出错:', err)
    }
    finally {
      document.body.removeChild(textarea)
    }
  }
}