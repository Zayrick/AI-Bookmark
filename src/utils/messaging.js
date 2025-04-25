export async function sendMessageWithInjection(tabId, message) {
  return await new Promise((resolve) => {
    // 首次尝试直接发送消息
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        // 如果失败，则尝试动态注入内容脚本后再次发送
        chrome.scripting.executeScript(
          {
            target: { tabId },
            files: ['dist/content.js']
          },
          () => {
            if (chrome.runtime.lastError) {
              console.log('注入内容脚本失败:', chrome.runtime.lastError.message)
              resolve(null) // 注入失败，返回 null
            } else {
              // 注入成功后再次发送消息
              chrome.tabs.sendMessage(tabId, message, (resp) => {
                if (chrome.runtime.lastError) {
                  console.log('发送消息失败:', chrome.runtime.lastError.message)
                  resolve(null)
                } else {
                  resolve(resp)
                }
              })
            }
          }
        )
      } else {
        resolve(response)
      }
    })
  })
} 