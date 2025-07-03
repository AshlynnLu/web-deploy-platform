require('dotenv').config();
const https = require('https');

/**
 * 测试screenshotAPI功能
 * 运行此脚本前，请确保在.env文件中设置了SCREENSHOT_API_KEY
 */
async function testScreenshotAPI() {
  const screenshotApiKey = process.env.SCREENSHOT_API_KEY;
  
  if (!screenshotApiKey) {
    console.error('❌ 错误：未找到SCREENSHOT_API_KEY环境变量');
    console.log('请在.env文件中设置SCREENSHOT_API_KEY=your-api-key');
    console.log('获取API key：https://app.screenshotapi.net/');
    return;
  }

  console.log('🔧 开始测试screenshotAPI...');
  console.log('📸 目标网站：https://example.com');

  try {
    // 构建screenshotAPI请求URL
    const apiUrl = `https://shot.screenshotapi.net/screenshot`;
    const params = new URLSearchParams({
      token: screenshotApiKey,
      url: 'https://example.com',
      output: 'image',
      file_type: 'png',
      width: '1200',
      height: '800',
      full_page: 'false',
      delay: '1000'
    });

    const requestUrl = `${apiUrl}?${params}`;
    console.log('🌐 请求URL:', requestUrl.replace(screenshotApiKey, 'API_KEY_HIDDEN'));

    return new Promise((resolve, reject) => {
      const req = https.get(requestUrl, (res) => {
        console.log('📊 响应状态码:', res.statusCode);
        console.log('📋 响应头:', res.headers);

        // 处理重定向
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          console.log('🔄 收到重定向，跟随至:', res.headers.location);
          const redirectReq = https.get(res.headers.location, (redirectRes) => {
            console.log('📊 重定向响应状态码:', redirectRes.statusCode);
            if (redirectRes.statusCode === 200) {
              const chunks = [];
              redirectRes.on('data', chunk => chunks.push(chunk));
              redirectRes.on('end', () => {
                const imageBuffer = Buffer.concat(chunks);
                console.log('✅ 截图成功！图片大小:', imageBuffer.length, 'bytes');
                console.log('🎉 screenshotAPI集成测试通过！');
                resolve();
              });
            } else {
              console.error('❌ 重定向请求失败:', redirectRes.statusCode);
              reject(new Error(`重定向请求失败: ${redirectRes.statusCode}`));
            }
          });
          redirectReq.on('error', reject);
          return;
        }

        if (res.statusCode === 200) {
          const chunks = [];
          res.on('data', chunk => chunks.push(chunk));
          res.on('end', () => {
            const imageBuffer = Buffer.concat(chunks);
            console.log('✅ 截图成功！图片大小:', imageBuffer.length, 'bytes');
            console.log('🎉 screenshotAPI集成测试通过！');
            resolve();
          });
        } else {
          let errorData = '';
          res.on('data', chunk => errorData += chunk);
          res.on('end', () => {
            console.error('❌ 截图API返回错误:', res.statusCode);
            console.error('错误详情:', errorData);
            reject(new Error(`截图API返回错误: ${res.statusCode} - ${errorData}`));
          });
        }
      });

      req.on('error', (error) => {
        console.error('❌ 请求失败:', error.message);
        reject(error);
      });

      req.setTimeout(30000, () => {
        req.destroy();
        console.error('❌ 请求超时');
        reject(new Error('请求超时'));
      });
    });

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    throw error;
  }
}

// 运行测试
if (require.main === module) {
  testScreenshotAPI()
    .then(() => {
      console.log('\n🚀 测试完成！现在可以在应用中使用截图功能了。');
      console.log('💡 提示：确保在Netlify部署时也设置了SCREENSHOT_API_KEY环境变量。');
    })
    .catch((error) => {
      console.error('\n💥 测试失败:', error.message);
      console.log('\n🔧 解决方案：');
      console.log('1. 检查API key是否正确');
      console.log('2. 确认网络连接正常');
      console.log('3. 查看ScreenshotAPI服务状态');
      console.log('4. 确认API配额是否充足');
      process.exit(1);
    });
}

module.exports = { testScreenshotAPI }; 