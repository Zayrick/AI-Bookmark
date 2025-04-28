/**
 * page-transition.js - 处理页面加载和过渡动画
 */

// 将页面加载动画类的添加移到DOMContentLoaded事件中，确保body元素已存在
document.addEventListener('DOMContentLoaded', () => {
  // 先添加页面加载动画类
  document.body.classList.add('page-loading');
  
  // 延迟后移除加载动画类
  setTimeout(() => {
    document.body.classList.remove('page-loading');
  }, 80);
  
  // 如果是由其他页面跳转而来，添加入场动画
  if (document.referrer.includes(window.location.host)) {
    document.body.classList.add('page-entering');
    
    // 监听动画结束事件，移除动画类
    document.body.addEventListener('animationend', (e) => {
      if (e.animationName === 'pageLoading') {
        document.body.classList.remove('page-entering');
      }
    }, { once: true });
  }
}); 