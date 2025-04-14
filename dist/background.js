/**
 * config.js - ChatGPT API 提示词和函数调用配置
 * 
 * 这个文件集中管理ChatGPT API调用的相关配置，包括:
 * - 温度参数
 * - 系统和用户提示词
 * - 函数调用配置
 * - 参数名称和描述
 */

// ChatGPT 请求参数配置
const temperature = 0.2;  // 温度值控制结果的随机性，值越低结果越确定

/**
 * 系统提示词，定义AI的行为和目标
 * 指导AI根据网站标题和文件夹名称的含义进行最佳匹配
 */
const systemPrompt = 'Please classify the website into the most appropriate folder path based on the title of the website and the meaning of the folder name.';

/**
 * 用户提示词前缀，会和网页标题组合
 * 格式为：'The website title is: {实际标题}'
 */
const userPrompt = 'The website title is:';

/**
 * 函数调用相关配置
 * 使用函数调用可以强制模型返回结构化数据
 */
// 函数名称
const functionName = 'classify_the_website';
// 函数描述
const functionDescription = 'Automatically match the best folder path based on the website title';
// 参数名称
const paramName = 'folder_path';
// 参数描述
const paramDescription = 'Folder path separated by /';

/**
 * chat.js - ChatGPT API调用模块
 * 
 * 这个文件封装了与ChatGPT API交互的核心功能，包括:
 * 1. 生成API请求负载
 * 2. 发送请求到OpenAI服务器
 * 3. 解析返回的响应
 * 4. 使用函数调用能力获取分类结果
 */


/**
 * 主要的ChatGPT调用函数
 * 
 * @param {Object} config - 配置对象，包含API URL、KEY和模型
 * @param {Array<string>} folderPaths - 可用书签文件夹路径数组
 * @param {string} title - 网页标题
 * @returns {Promise<string>} 返回最合适的文件夹路径
 * @throws {Error} 如果API调用失败或解析失败
 */
async function chat(config, folderPaths, title) {
  try {
    // 生成请求负载
    const payload = generatePayload(config, folderPaths, title);
    // 发送API请求
    const response = await fetch(config.chatUrl, payload);
    // 解析响应并返回结果
    return await parseResponse(response)
  } catch (err) {
    // 向上层传递错误
    throw err
  }
}

/**
 * 生成ChatGPT API请求的负载数据
 * 
 * @param {Object} config - 配置对象
 * @param {Array<string>} folderPaths - 书签文件夹路径数组
 * @param {string} title - 网页标题
 * @returns {Object} 包含请求头和体的完整请求配置
 */
function generatePayload(config, folderPaths, title) {
  const { apiKey, model } = config;
  
  // 构建对话消息数组
  const messages = [
    {
      role: 'system',
      content: systemPrompt  // 系统指令：告诉模型如何分类网站
    },
    {
      role: 'user',
      content: `${userPrompt}:${title}`  // 用户提问：提供网站标题
    }
  ];
  
  // 构建请求体
  const body = {
    model,             // 使用配置的模型
    temperature,       // 设置温度参数
    messages,          // 对话消息
    // 定义函数工具
    tools: [{
      type: 'function',
      function: {
        name: functionName,
        description: functionDescription,
        parameters: {
          type: 'object',
          properties: {
            // 动态设置参数名称和允许的枚举值（可用的文件夹路径）
            [paramName]: {
              description: paramDescription,
              type: 'string',
              enum: folderPaths
            }
          },
          required: [paramName]
        }
      }
    }],
    // 强制模型使用我们定义的函数
    tool_choice: {
      type: 'function',
      function: {
        name: functionName
      }
    }
  };

  // 返回完整的请求配置
  return {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    method: 'POST',
    body: JSON.stringify(body)
  }
}

/**
 * 解析ChatGPT API的响应
 * 
 * @param {Response} response - fetch API的响应对象
 * @returns {Promise<string>} 提取的文件夹路径
 * @throws {Error} 如果响应包含错误或格式不符合预期
 */
async function parseResponse(response) {
  // 解析JSON响应
  const json = await response.json();
  
  // 检查API返回的错误
  if (json.error) throw new Error(`ChatGPT 调用失败：${json.error.message}`)
  
  try {
    // 提取函数调用结果
    const fn = json.choices[0].message.tool_calls[0].function;
    // 解析函数参数
    const arg = JSON.parse(fn.arguments);
    
    // 验证函数名称和参数
    if (fn.name === functionName && arg[paramName]) {
      return arg[paramName]  // 返回文件夹路径
    } else {
      throw new Error('no function call')
    }
  } catch (err) {
    // 向上层传递错误
    throw err
  }
}

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

/// <reference path="../node_modules/chrome-types/index.d.ts" />
/**
 * background.js - 扩展的后台脚本
 * 
 * 这个文件是扩展的核心，作为后台服务运行，负责：
 * 1. 创建右键菜单
 * 2. 处理菜单点击事件
 * 3. 获取书签树结构
 * 4. 调用AI接口进行分类
 * 5. 创建新的书签
 */


/**
 * 扩展安装或更新时触发的事件
 * 执行初始化操作：设置默认API地址和模型，创建右键菜单
 */
chrome.runtime.onInstalled.addListener(async () => {
  // 获取本地存储的配置
  const local = await getLocal();
  // 设置默认的API地址（如果未设置）
  if (!local.chatUrl) local.chatUrl = 'https://api.openai.com/v1/chat/completions';
  // 设置默认的模型（如果未设置）
  if (!local.model) local.model = 'gpt-3.5-turbo-1106';
  // 保存配置到本地存储
  await setLocal(local);
  
  // 创建右键菜单项
  chrome.contextMenus.create({
    id: MENU_ID,          // 菜单项ID
    title: '自动收藏',     // 显示的菜单文字
    type: 'normal'        // 菜单类型
  });
});

/**
 * 响应右键菜单点击事件的监听器
 * 处理自动收藏功能的核心逻辑
 * 
 * @param {Object} item - 被点击的菜单项信息
 * @param {Object} tab - 当前标签页信息
 */
chrome.contextMenus.onClicked.addListener(async (item, tab) => {
  // 检查是否是我们的菜单项，且有有效的标签页
  if (item.menuItemId !== MENU_ID || !tab) return
  
  // 获取存储的配置信息
  const local = await getLocal();
  let message = '';
  
  // 检查必要的配置是否已设置
  if (!local.chatUrl) {
    message = '请先设置 chatgpt api 地址！';
  } else if (!local.apiKey) {
    message = '请先设置 chatgpt api key！';
  } else if (!local.model) {
    message = '请先设置 chatgpt model！';
  } else {
    try {
      // 获取当前标签页的标题和URL
      const { title, url } = tab;
      
      // 获取完整的书签树结构
      const tree = await chrome.bookmarks.getTree();
      
      // 提取所有书签文件夹的路径信息
      const folders = getFolders('', tree);
      
      // 调用AI接口获取最合适的文件夹路径
      const path = await chat(local, folders.map(i => i.path), title);
      
      // 查找匹配的文件夹对象
      const folder = folders.find(i => i.path === path);
      
      if (!folder) {
        // 如果找不到匹配的文件夹，返回AI推荐的路径
        message = `书签栏中未发现合适的网站目录，ChatGPT 推荐目录路径为: ${path}`;
      } else {
        // 找到匹配的文件夹，创建新书签
        const id = folder.id;
        await chrome.bookmarks.create({
          parentId: id,    // 父文件夹ID
          title,           // 书签标题
          url              // 书签URL
        });
        message = `已收藏至：${path}`;  // 操作成功消息
      }
    } catch (err) {
      // 处理错误情况
      console.error(err);
      message = `收藏失败！\n${err.valueOf()}`;
    }
  }
  
  // 向内容脚本发送消息，显示操作结果
  try {
    // 首先检查标签页是否存在并已加载完成
    const tabInfo = await chrome.tabs.get(tab.id);
    if (tabInfo.status === 'complete') {
      // 使用 try-catch 包装消息发送，处理可能的错误
      chrome.tabs.sendMessage(tab.id, { id: MENU_ID, message }, (response) => {
        // 处理可能的错误
        if (chrome.runtime.lastError) {
          console.log('消息发送失败:', chrome.runtime.lastError.message);
          // 如果无法通过内容脚本显示消息，使用通知 API 作为备选方案
          chrome.notifications.create({
            type: 'basic',
            iconUrl: chrome.runtime.getURL('assets/icon.png'),
            title: '自动收藏',
            message: message
          });
        }
      });
    } else {
      // 如果页面未完全加载，使用通知 API 显示消息
      chrome.notifications.create({
        type: 'basic',
        iconUrl: chrome.runtime.getURL('assets/icon.png'),
        title: '自动收藏',
        message: message
      });
    }
  } catch (error) {
    console.error('发送消息时出错:', error);
    // 使用通知 API 作为备选方案
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('assets/icon.png'),
      title: '自动收藏',
      message: message
    });
  }
});

/**
 * 递归提取书签树中所有文件夹的路径信息
 * 
 * @param {string} prePath - 父级路径前缀
 * @param {Array} tree - 书签树节点数组
 * @returns {Array} 包含id和路径的文件夹对象数组
 */
function getFolders(prePath, tree) {
  const folders = [];
  
  // 遍历树节点
  tree.forEach(i => {
    // 跳过非文件夹项（有URL的是书签而非文件夹）
    if (i.url) return
    
    // 构建完整路径
    const path = prePath + i.title;
    
    // 添加当前文件夹到结果数组
    if (path) folders.push({ id: i.id, path });
    
    // 递归处理子文件夹
    if (i.children) folders.push(...getFolders(path && path + '/', i.children));
  });
  
  return folders
}
