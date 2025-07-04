import { createContext, useState, useContext } from 'react';

const translations = {
  zh: {
    homeTitle: '🐝 发现精彩作品',
    homeSubtitle: '在Bee Store分享自己的创意项目，互相学习，共同成长',
    hot: '🔥 热门作品',
    daily: '⭐ 今日推荐',
    myWorks: '我的作品',
    publishWork: '发布作品',
    favorites: '我的收藏',
    logout: '退出',
    login: '登录',
    register: '注册',
    comments: '评论',
    viewWork: '查看作品 →',
    like: '点赞',
    unlike: '取消点赞'
  },
  en: {
    homeTitle: '🐝 Discover Awesome Projects',
    homeSubtitle: 'Share your creative projects on Bee Store, learn and grow together',
    hot: '🔥 Trending',
    daily: '⭐ Today\'s Picks',
    myWorks: 'My Works',
    publishWork: 'Publish',
    favorites: 'Favorites',
    logout: 'Logout',
    login: 'Login',
    register: 'Sign Up',
    comments: 'Comments',
    viewWork: 'View →',
    like: 'Like',
    unlike: 'Unlike'
  }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState('zh');
  const toggleLang = (l) => setLang(l);

  const t = (key) => translations[lang][key] || key;

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLang = () => useContext(LanguageContext); 