/**
 * popup.js - 弹出窗口脚本
 * 
 * 这个文件处理扩展的弹出窗口界面交互。
 * 主要功能是加载和保存用户配置：API URL、API KEY和模型选择。
 */

// 导入本地存储相关工具函数
import { getLocal, setLocal } from './js/utils'

// 获取DOM元素引用
const urlInput = document.getElementById('chatUrl')     // API URL输入框
const keyInput = document.getElementById('apiKey')      // API KEY输入框
const modelInput = document.getElementById('modelInput')     // 模型输入框
const modelSelect = document.getElementById('modelSelect')   // 模型选择下拉框
const systemNotification = document.getElementById('systemNotification')  // 系统通知单选框
const browserNotification = document.getElementById('browserNotification')  // 浏览器通知单选框

// 初始化本地配置对象
let local = {}

// 为各输入元素添加变更事件监听器
urlInput.addEventListener('change', (e) => change(e.target.value, 'chatUrl'))
keyInput.addEventListener('change', (e) => change(e.target.value, 'apiKey'))
modelInput.addEventListener('change', (e) => change(e.target.value, 'model'))

// 为模型选择下拉框添加事件监听
modelSelect.addEventListener('change', function() {
  selectModel(this.value);
});

// 为通知类型单选框添加事件监听
systemNotification.addEventListener('change', () => {
  if (systemNotification.checked) {
    change('system', 'notificationType')
  }
})

browserNotification.addEventListener('change', () => {
  if (browserNotification.checked) {
    change('browser', 'notificationType')
  }
})

/**
 * 处理模型选择的函数
 * 
 * @param {string} value - 选择的模型值
 */
function selectModel(value) {
  if (value) {
    modelInput.value = value;
    // 触发change事件以保存选择
    modelInput.dispatchEvent(new Event('change'));
    // 重置选择框
    modelSelect.value = "";
  }
}

// 执行初始化函数
init()

/**
 * 初始化函数，从本地存储加载配置并填充表单
 * 在窗口打开时执行
 */
async function init() {
  // 从本地存储获取配置
  local = await getLocal()
  
  // 使用存储的值填充表单字段
  urlInput.value = local.chatUrl || ''
  keyInput.value = local.apiKey || ''
  modelInput.value = local.model || ''
  
  // 设置通知类型选择
  const notificationType = local.notificationType || 'system'
  if (notificationType === 'system') {
    systemNotification.checked = true
  } else if (notificationType === 'browser') {
    browserNotification.checked = true
  }
}

/**
 * 处理配置变更的函数
 * 
 * @param {string} val - 新的配置值
 * @param {string} key - 配置项的键名
 */
function change(val, key) {
  // 更新内存中的配置对象
  local[key] = val
  
  // 保存配置到本地存储
  setLocal(local)
}
