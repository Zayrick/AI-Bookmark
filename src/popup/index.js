/**
 * popup/index.js - 弹出窗口脚本入口
 * 
 * 处理扩展的弹出窗口界面交互
 */

import { getConfig, saveConfig } from '../utils/storage.js'
import { NOTIFICATION_TYPES } from '../utils/constants.js'

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init)

/**
 * 初始化函数，从本地存储加载配置并填充表单
 * 在窗口打开时执行
 */
async function init() {
  // 获取DOM元素引用
  const urlInput = document.getElementById('chatUrl')     // API URL输入框
  const keyInput = document.getElementById('apiKey')      // API KEY输入框
  const modelInput = document.getElementById('modelInput')     // 模型输入框
  const modelSelect = document.getElementById('modelSelect')   // 模型选择下拉框
  const systemNotification = document.getElementById('systemNotification')  // 系统通知单选框
  const browserNotification = document.getElementById('browserNotification')  // 浏览器通知单选框
  
  // 从本地存储获取配置
  const config = await getConfig()
  
  // 使用存储的值填充表单字段
  urlInput.value = config.chatUrl || ''
  keyInput.value = config.apiKey || ''
  modelInput.value = config.model || ''
  
  // 设置通知类型选择
  const notificationType = config.notificationType || NOTIFICATION_TYPES.SYSTEM
  if (notificationType === NOTIFICATION_TYPES.SYSTEM) {
    systemNotification.checked = true
  } else if (notificationType === NOTIFICATION_TYPES.BROWSER) {
    browserNotification.checked = true
  }
  
  // 为各输入元素添加变更事件监听器
  urlInput.addEventListener('change', (e) => updateConfig('chatUrl', e.target.value))
  keyInput.addEventListener('change', (e) => updateConfig('apiKey', e.target.value))
  modelInput.addEventListener('change', (e) => updateConfig('model', e.target.value))
  
  // 为模型选择下拉框添加事件监听
  modelSelect.addEventListener('change', function() {
    if (this.value) {
      modelInput.value = this.value
      // 触发change事件以保存选择
      modelInput.dispatchEvent(new Event('change'))
      // 重置选择框
      this.value = ""
    }
  })
  
  // 为通知类型单选框添加事件监听
  systemNotification.addEventListener('change', () => {
    if (systemNotification.checked) {
      updateConfig('notificationType', NOTIFICATION_TYPES.SYSTEM)
    }
  })
  
  browserNotification.addEventListener('change', () => {
    if (browserNotification.checked) {
      updateConfig('notificationType', NOTIFICATION_TYPES.BROWSER)
    }
  })
}

/**
 * 更新配置的函数
 * 
 * @param {string} key - 配置项的键名
 * @param {string} value - 新的配置值
 */
async function updateConfig(key, value) {
  // 获取当前配置
  const config = await getConfig()
  
  // 更新特定配置项
  config[key] = value
  
  // 保存配置到本地存储
  await saveConfig(config)
} 