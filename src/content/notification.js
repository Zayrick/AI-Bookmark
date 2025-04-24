/**
 * notification.js - 浏览器内通知模块
 * 
 * 处理在网页内显示通知的相关功能
 */

/**
 * 在网页内创建并显示通知
 * 
 * @param {string} message - 要显示的消息内容
 */
export function createNotification(message) {
  // 创建通知容器
  const notification = document.createElement('div')
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #4285f4;
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 99999;
    font-family: Arial, sans-serif;
    font-size: 14px;
    max-width: 300px;
    transform: translateX(120%);
    transition: transform 0.3s ease-out;
  `
  
  // 添加图标和消息
  notification.innerHTML = `
    <div style="display: flex; align-items: center;">
      <div style="margin-right: 12px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      </div>
      <div>
        <div style="font-weight: bold; margin-bottom: 3px;">自动收藏</div>
        <div>${message}</div>
      </div>
    </div>
  `
  
  // 添加到文档
  document.body.appendChild(notification)
  
  // 触发过渡动画
  setTimeout(() => {
    notification.style.transform = 'translateX(0)'
  }, 10)
  
  // 3秒后自动移除通知
  setTimeout(() => {
    notification.style.transform = 'translateX(120%)'
    // 等待过渡完成后移除元素
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification)
      }
    }, 300)
  }, 3000)
} 