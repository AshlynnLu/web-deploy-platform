/**
 * 截图功能使用示例
 * 展示如何在前端使用新的智能缓存截图API
 */

// 获取应用截图（智能缓存）
async function getAppScreenshot(appId, forceRefresh = false) {
  try {
    const url = `/api/apps/${appId}/screenshot${forceRefresh ? '?force_refresh=true' : ''}`;
    const response = await fetch(url);
    
    if (response.ok) {
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } else {
      const error = await response.json();
      throw new Error(error.message);
    }
  } catch (error) {
    console.error('获取截图失败:', error);
    return null;
  }
}

// 重新生成截图（需要认证）
async function regenerateScreenshot(appId) {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('请先登录');
    }

    const response = await fetch(`/api/apps/${appId}/regenerate-screenshot`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const result = await response.json();
      console.log('截图重新生成成功:', result);
      return true;
    } else {
      const error = await response.json();
      throw new Error(error.message);
    }
  } catch (error) {
    console.error('重新生成截图失败:', error);
    return false;
  }
}

// 使用示例：在应用卡片中显示截图
function createAppCard(app) {
  const cardElement = document.createElement('div');
  cardElement.className = 'app-card';
  cardElement.innerHTML = `
    <div class="app-screenshot">
      <img id="screenshot-${app.id}" alt="${app.title} 截图" style="display: none;">
      <div class="screenshot-placeholder">
        <span>📸</span>
        <div class="loading-text">加载中...</div>
      </div>
    </div>
    <div class="app-info">
      <h3>${app.title}</h3>
      <p>${app.description}</p>
      <div class="app-actions">
        <button onclick="refreshScreenshot('${app.id}')" class="refresh-btn">
          🔄 刷新截图
        </button>
      </div>
    </div>
  `;

  // 加载截图
  loadScreenshot(app.id);
  
  return cardElement;
}

// 加载截图函数
async function loadScreenshot(appId) {
  const imgElement = document.getElementById(`screenshot-${appId}`);
  const placeholder = imgElement.nextElementSibling;
  
  try {
    // 首先尝试加载缓存的截图
    const screenshotUrl = await getAppScreenshot(appId);
    
    if (screenshotUrl) {
      imgElement.src = screenshotUrl;
      imgElement.style.display = 'block';
      placeholder.style.display = 'none';
      console.log(`✅ 截图加载成功 (缓存): ${appId}`);
    } else {
      // 如果没有截图，显示占位符
      placeholder.innerHTML = '<span>📸</span><div>暂无截图</div>';
    }
  } catch (error) {
    console.error('加载截图失败:', error);
    placeholder.innerHTML = '<span>❌</span><div>加载失败</div>';
  }
}

// 刷新截图函数
async function refreshScreenshot(appId) {
  const button = event.target;
  const originalText = button.textContent;
  
  try {
    // 显示加载状态
    button.textContent = '🔄 重新生成中...';
    button.disabled = true;
    
    // 重新生成截图
    const success = await regenerateScreenshot(appId);
    
    if (success) {
      // 重新加载截图（强制刷新）
      const screenshotUrl = await getAppScreenshot(appId, true);
      const imgElement = document.getElementById(`screenshot-${appId}`);
      
      if (screenshotUrl && imgElement) {
        imgElement.src = screenshotUrl;
        console.log(`✅ 截图刷新成功: ${appId}`);
      }
    }
  } catch (error) {
    console.error('刷新截图失败:', error);
    alert('刷新截图失败，请稍后重试');
  } finally {
    // 恢复按钮状态
    button.textContent = originalText;
    button.disabled = false;
  }
}

// 批量加载多个应用的截图
async function loadMultipleScreenshots(apps) {
  console.log(`开始加载 ${apps.length} 个应用的截图...`);
  
  const promises = apps.map(app => loadScreenshot(app.id));
  await Promise.allSettled(promises);
  
  console.log('所有截图加载完成');
}

// 导出函数供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getAppScreenshot,
    regenerateScreenshot,
    loadScreenshot,
    refreshScreenshot,
    loadMultipleScreenshots
  };
}

/*
使用方法示例：

1. 在应用列表页面：
```javascript
// 获取应用列表后，批量加载截图
const apps = await fetchApps();
await loadMultipleScreenshots(apps);
```

2. 在应用详情页面：
```javascript
// 显示单个应用的截图
await loadScreenshot(appId);
```

3. 手动刷新截图：
```javascript
// 用户点击刷新按钮时
await refreshScreenshot(appId);
```

4. 强制重新获取截图：
```javascript
// 跳过缓存，直接从API获取
const screenshotUrl = await getAppScreenshot(appId, true);
```

注意事项：
- 截图数据会自动缓存，不会重复调用API
- 只有应用所有者才能重新生成截图
- 重新生成截图会消耗API额度，请谨慎使用
- 缓存的截图加载速度更快，用户体验更好
*/ 