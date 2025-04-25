export function validateAIConfig(config) {
  if (!config.chatUrl) {
    return '请先设置 AI api 地址！'
  }
  if (!config.apiKey) {
    return '请先设置 AI api key！'
  }
  if (!config.model) {
    return '请先设置 AI model！'
  }
  return ''
} 