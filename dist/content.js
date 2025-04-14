/**
 * utils.js - 工具函数模块
 * 
 * 这个文件提供了扩展程序的通用工具函数和常量，包括:
 * - 插件唯一标识符
 * - 本地存储读写函数
 */

/**
 * 扩展程序的唯一标识符
 * 用于右键菜单ID和本地存储的键名
 */
const MENU_ID = 'auto-mark';

/// <reference path="../node_modules/chrome-types/index.d.ts" />
/**
 * content.js - 内容脚本
 * 
 * 这个文件作为内容脚本注入到网页中执行。
 * 主要功能是接收来自后台脚本的消息，并在网页上显示操作结果。
 */


/**
 * 立即执行函数，创建一个独立的作用域
 * 防止变量污染网页的全局命名空间
 */
(() => {
  /**
   * 注册消息监听器，处理来自后台脚本的消息
   * 
   * @param {Object} request - 接收到的消息对象
   * @param {Object} sender - 消息发送者信息
   * @param {Function} sendResponse - 回复消息的函数
   */
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // 验证消息是否来自我们的插件并且包含正确的ID
    if (request && request.id === MENU_ID) {
      if (request.action === 'confirmBookmark') {
        // 显示自定义对话框让用户确认并编辑标题
        showConfirmDialog(request.title, request.url, request.path, sendResponse);
        return true; // 保持通道开放，等待异步响应
      } else {
        // 显示浏览器内通知
        showBrowserNotification(request.message);
      }
    }
  });

  /**
   * 显示浏览器内通知
   * 
   * @param {string} message - 要显示的消息内容
   */
  function showBrowserNotification(message) {
    // 创建通知容器
    const notification = document.createElement('div');
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
    `;
    
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
    `;
    
    // 添加到文档
    document.body.appendChild(notification);
    
    // 触发过渡动画
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 10);
    
    // 3秒后自动移除通知
    setTimeout(() => {
      notification.style.transform = 'translateX(120%)';
      // 等待过渡完成后移除元素
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  /**
   * 显示自定义确认对话框，允许用户编辑标题
   * 
   * @param {string} title - 网页标题
   * @param {string} url - 网页URL
   * @param {string} path - 收藏夹位置路径
   * @param {Function} sendResponse - 响应函数
   */
  function showConfirmDialog(title, url, path, sendResponse) {
    // 创建对话框容器
    const dialog = document.createElement('div');
    dialog.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:99999;display:flex;justify-content:center;align-items:center;';
    
    // 创建对话框内容
    const dialogContent = document.createElement('div');
    dialogContent.style.cssText = 'background:white;padding:20px;border-radius:8px;width:400px;box-shadow:0 0 10px rgba(0,0,0,0.3);';
    
    // 标题
    const dialogTitle = document.createElement('h3');
    dialogTitle.textContent = '确认添加书签';
    dialogTitle.style.cssText = 'margin-top:0;color:#333;font-size:18px;';
    
    // 收藏夹位置
    const pathInfo = document.createElement('div');
    pathInfo.textContent = `收藏位置: ${path}`;
    pathInfo.style.cssText = 'margin-top:10px;font-size:13px;color:#333;background:#f5f5f5;padding:8px;border-radius:4px;';
    
    // 输入框标签
    const label = document.createElement('div');
    label.textContent = '书签标题:';
    label.style.cssText = 'margin:15px 0 5px;font-size:14px;';
    
    // 输入框
    const input = document.createElement('input');
    input.type = 'text';
    input.value = title;
    input.style.cssText = 'width:100%;padding:8px;box-sizing:border-box;border:1px solid #ccc;border-radius:4px;font-size:14px;';
    
    // URL显示
    const urlDisplay = document.createElement('div');
    urlDisplay.textContent = url;
    urlDisplay.style.cssText = 'margin:10px 0;font-size:12px;color:#666;word-break:break-all;';
    
    // 按钮容器
    const buttons = document.createElement('div');
    buttons.style.cssText = 'display:flex;justify-content:flex-end;gap:10px;margin-top:20px;';
    
    // 取消按钮
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '取消';
    cancelBtn.style.cssText = 'padding:6px 12px;background:#f2f2f2;border:none;border-radius:4px;cursor:pointer;';
    
    // 确认按钮
    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = '确认添加';
    confirmBtn.style.cssText = 'padding:6px 12px;background:#4285f4;color:white;border:none;border-radius:4px;cursor:pointer;';
    
    // 添加按钮事件
    cancelBtn.onclick = () => {
      document.body.removeChild(dialog);
      sendResponse({ confirmed: false });
    };
    
    confirmBtn.onclick = () => {
      document.body.removeChild(dialog);
      sendResponse({ confirmed: true, title: input.value });
    };
    
    // 组装对话框
    buttons.appendChild(cancelBtn);
    buttons.appendChild(confirmBtn);
    
    dialogContent.appendChild(dialogTitle);
    dialogContent.appendChild(pathInfo);
    dialogContent.appendChild(label);
    dialogContent.appendChild(input);
    dialogContent.appendChild(urlDisplay);
    dialogContent.appendChild(buttons);
    
    dialog.appendChild(dialogContent);
    document.body.appendChild(dialog);
    
    // 自动聚焦输入框
    setTimeout(() => input.focus(), 0);
  }
})();
