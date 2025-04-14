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
const temperature = 0.2  // 温度值控制结果的随机性，值越低结果越确定

/**
 * 系统提示词，定义AI的行为和目标
 * 指导AI根据网站标题和文件夹名称的含义进行最佳匹配
 */
const systemPrompt = 'Please classify the website into the most appropriate folder path based on the title of the website and the meaning of the folder name.'

/**
 * 用户提示词前缀，会和网页标题组合
 * 格式为：'The website title is: {实际标题}'
 */
const userPrompt = 'The website title is:'

/**
 * 函数调用相关配置
 * 使用函数调用可以强制模型返回结构化数据
 */
// 函数名称
const functionName = 'classify_the_website'
// 函数描述
const functionDescription = 'Automatically match the best folder path based on the website title'
// 参数名称
const paramName = 'folder_path'
// 参数描述
const paramDescription = 'Folder path separated by /'

// 导出所有配置项
export {
  temperature,
  functionName,
  functionDescription,
  paramName,
  paramDescription,
  systemPrompt,
  userPrompt
}
