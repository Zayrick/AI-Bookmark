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

/**
 * 从Chrome本地存储中获取扩展配置
 * 
 * @returns {Promise<Object>} 返回存储的配置对象，若不存在则返回空对象
 */
async function getLocal() {
  // 使用Chrome存储API获取数据
  const res = await chrome.storage.local.get(MENU_ID);
  // 如果数据不存在，返回空对象
  return res[MENU_ID] || {}
}

/**
 * 将配置保存到Chrome本地存储
 * 
 * @param {Object} local - 要保存的配置对象
 * @returns {Promise<void>} 存储操作的Promise
 */
async function setLocal(local) {
  // 使用Chrome存储API保存数据，以MENU_ID为键
  return await chrome.storage.local.set({ [MENU_ID]: local })
}

/**
 * popup.js - 弹出窗口脚本
 * 
 * 这个文件处理扩展的弹出窗口界面交互。
 * 主要功能是加载和保存用户配置：API URL、API KEY和模型选择。
 */


// 获取DOM元素引用
const urlInput = document.getElementById('chatUrl');     // API URL输入框
const keyInput = document.getElementById('apiKey');      // API KEY输入框
const modelInput = document.getElementById('model');     // 模型选择下拉框

// 初始化本地配置对象
let local = {};

// 为各输入元素添加变更事件监听器
urlInput.addEventListener('change', (e) => change(e.target.value, 'chatUrl'));
keyInput.addEventListener('change', (e) => change(e.target.value, 'apiKey'));
modelInput.addEventListener('change', (e) => change(e.target.value, 'model'));

// 执行初始化函数
init();

/**
 * 初始化函数，从本地存储加载配置并填充表单
 * 在窗口打开时执行
 */
async function init() {
  // 从本地存储获取配置
  local = await getLocal();
  
  // 使用存储的值填充表单字段
  urlInput.value = local.chatUrl || '';
  keyInput.value = local.apiKey || '';
  modelInput.value = local.model || '';
}

/**
 * 处理配置变更的函数
 * 
 * @param {string} val - 新的配置值
 * @param {string} key - 配置项的键名
 */
function change(val, key) {
  // 更新内存中的配置对象
  local[key] = val;
  
  // 保存配置到本地存储
  setLocal(local);
}
