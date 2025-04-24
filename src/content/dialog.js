/**
 * dialog.js - 确认对话框模块
 * 
 * 处理在网页内显示确认对话框的相关功能
 */

/**
 * 在网页内创建并显示确认对话框
 * 
 * @param {string} title - 书签标题
 * @param {string} url - 书签URL
 * @param {string} path - 书签路径
 * @param {Function} sendResponse - 回调函数，用于发送用户的响应
 */
export function createConfirmDialog(title, url, path, sendResponse) {
  // 创建对话框容器
  const dialog = document.createElement('div')
  dialog.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:99999;display:flex;justify-content:center;align-items:center;'
  
  // 创建对话框内容
  const dialogContent = document.createElement('div')
  dialogContent.style.cssText = 'background:white;padding:20px;border-radius:8px;width:400px;box-shadow:0 0 10px rgba(0,0,0,0.3);'
  
  // 标题
  const dialogTitle = document.createElement('h3')
  dialogTitle.textContent = '确认添加书签'
  dialogTitle.style.cssText = 'margin-top:0;color:#333;font-size:18px;'
  
  // 收藏夹位置
  const pathInfo = document.createElement('div')
  pathInfo.textContent = `收藏位置: ${path}`
  pathInfo.style.cssText = 'margin-top:10px;font-size:13px;color:#333;background:#f5f5f5;padding:8px;border-radius:4px;'
  
  // 输入框标签
  const label = document.createElement('div')
  label.textContent = '书签标题:'
  label.style.cssText = 'margin:15px 0 5px;font-size:14px;'
  
  // 输入框
  const input = document.createElement('input')
  input.type = 'text'
  input.value = title
  input.style.cssText = 'width:100%;padding:8px;box-sizing:border-box;border:1px solid #ccc;border-radius:4px;font-size:14px;'
  
  // URL显示
  const urlDisplay = document.createElement('div')
  urlDisplay.textContent = url
  urlDisplay.style.cssText = 'margin:10px 0;font-size:12px;color:#666;word-break:break-all;'
  
  // 按钮容器
  const buttons = document.createElement('div')
  buttons.style.cssText = 'display:flex;justify-content:flex-end;gap:10px;margin-top:20px;'
  
  // 取消按钮
  const cancelBtn = document.createElement('button')
  cancelBtn.textContent = '取消'
  cancelBtn.style.cssText = 'padding:6px 12px;background:#f2f2f2;border:none;border-radius:4px;cursor:pointer;'
  
  // 确认按钮
  const confirmBtn = document.createElement('button')
  confirmBtn.textContent = '确认添加'
  confirmBtn.style.cssText = 'padding:6px 12px;background:#4285f4;color:white;border:none;border-radius:4px;cursor:pointer;'
  
  // 添加按钮事件
  cancelBtn.onclick = () => {
    document.body.removeChild(dialog)
    sendResponse({ confirmed: false })
  }
  
  confirmBtn.onclick = () => {
    document.body.removeChild(dialog)
    sendResponse({ confirmed: true, title: input.value })
  }
  
  // 组装对话框
  buttons.appendChild(cancelBtn)
  buttons.appendChild(confirmBtn)
  
  dialogContent.appendChild(dialogTitle)
  dialogContent.appendChild(pathInfo)
  dialogContent.appendChild(label)
  dialogContent.appendChild(input)
  dialogContent.appendChild(urlDisplay)
  dialogContent.appendChild(buttons)
  
  dialog.appendChild(dialogContent)
  document.body.appendChild(dialog)
  
  // 自动聚焦输入框
  setTimeout(() => input.focus(), 0)
} 