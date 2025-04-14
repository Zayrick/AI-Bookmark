/**
 * chat.js - ChatGPT API调用模块
 * 
 * 这个文件封装了与ChatGPT API交互的核心功能，包括:
 * 1. 生成API请求负载
 * 2. 发送请求到OpenAI服务器
 * 3. 解析返回的响应
 * 4. 使用函数调用能力获取分类结果
 */

// 导入配置参数
import {
  temperature,         // 温度参数，控制生成结果的随机性
  functionName,        // 函数名称
  functionDescription, // 函数描述
  paramName,           // 参数名称
  paramDescription,    // 参数描述
  systemPrompt,        // 系统提示词
  userPrompt           // 用户提示词
} from './config'

/**
 * 主要的ChatGPT调用函数
 * 
 * @param {Object} config - 配置对象，包含API URL、KEY和模型
 * @param {Array<string>} folderPaths - 可用书签文件夹路径数组
 * @param {string} title - 网页标题
 * @returns {Promise<string>} 返回最合适的文件夹路径
 * @throws {Error} 如果API调用失败或解析失败
 */
export async function chat(config, folderPaths, title) {
  try {
    // 生成请求负载
    const payload = generatePayload(config, folderPaths, title)
    // 发送API请求
    const response = await fetch(config.chatUrl, payload)
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
  const { apiKey, model } = config
  
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
  ]
  
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
  }

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
  const json = await response.json()
  
  // 检查API返回的错误
  if (json.error) throw new Error(`ChatGPT 调用失败：${json.error.message}`)
  
  try {
    // 提取函数调用结果
    const fn = json.choices[0].message.tool_calls[0].function
    // 解析函数参数
    const arg = JSON.parse(fn.arguments)
    
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
