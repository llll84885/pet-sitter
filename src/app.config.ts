export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/orders/index',
    'pages/mine/index',
    'pages/book-cat/index',
    'pages/book-dog/index',
    'pages/order-detail/index',
    'pages/pets/index',
    'pages/login/index',
    'pages/addresses/index',
    'pages/provider-earnings/index',
    'pages/provider-profile/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#FFFFFF',
    navigationBarTitleText: '萌宠管家',
    navigationBarTextStyle: 'black',
    backgroundColor: '#FFF8F0'
  },
  tabBar: {
    color: '#999999',
    selectedColor: '#FF8C42',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页',
        iconPath: 'assets/tabbar/home.svg',
        selectedIconPath: 'assets/tabbar/home-selected.svg'
      },
      {
        pagePath: 'pages/orders/index',
        text: '订单',
        iconPath: 'assets/tabbar/order.svg',
        selectedIconPath: 'assets/tabbar/order-selected.svg'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的',
        iconPath: 'assets/tabbar/mine.svg',
        selectedIconPath: 'assets/tabbar/mine-selected.svg'
      }
    ]
  }
})
