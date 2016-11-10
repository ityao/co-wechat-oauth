koa2-wechat-oauth
===============
Wechat OAuth for async/await (koa2)。微信公共平台OAuth接口消息接口服务中间件与API SDK

## 功能列表
- OAuth授权
- 获取基本信息

OAuth2.0网页授权，使用此接口须通过微信认证，如果用户在微信中（Web微信除外）访问公众号的第三方网页，公众号开发者可以通过此接口获取当前用户基本信息（包括昵称、性别、城市、国家）。详见：[官方文档](http://mp.weixin.qq.com/wiki/17/c0f37d5704f0b64713d5d2c37b468d75.html)

详细参见[API文档](http://doxmate.cool/node-webot/co-wechat-oauth/api.html)

## Installation

```sh
$ npm install koa2-wechat-oauth
```

## Usage

### 初始化
引入OAuth并实例化

```js
var OAuth = require('koa2-wechat-oauth');
var client = new OAuth('your appid', 'your secret');
```

以上即可满足单进程使用。
当多进程时，token需要全局维护，以下为保存token的接口。

```js
var oauthApi = new OAuth('appid', 'secret', async (openid) => {
  // 传入一个根据openid获取对应的全局token的方法
  var txt = await fs.readFile(openid +':access_token.txt', 'utf8');
  return JSON.parse(txt);
}, async (openid, token) => {
  // 请将token存储到全局，跨进程、跨机器级别的全局，比如写到数据库、redis等
  // 这样才能在cluster模式及多机情况下使用，以下为写入到文件的示例
  // 持久化时请注意，每个openid都对应一个唯一的token!
  await fs.writeFile(openid + ':access_token.txt', JSON.stringify(token));
});
```

### 引导用户
生成引导用户点击的URL。

```js
var url = client.getAuthorizeURL('redirectUrl', 'state', 'scope');
```

如果是PC上的网页，请使用以下方式生成
```js
var url = client.getAuthorizeURLForWebsite('redirectUrl');
```

### 获取Openid和AccessToken
用户点击上步生成的URL后会被重定向到上步设置的 `redirectUrl`，并且会带有`code`参数，我们可以使用这个`code`换取`access_token`和用户的`openid`

```js
var token = await client.getAccessToken('code');
var accessToken = token.data.access_token;
var openid = token.data.openid;
```

### 获取用户信息
如果我们生成引导用户点击的URL中`scope`参数值为`snsapi_userinfo`，接下来我们就可以使用`openid`换取用户详细信息（必须在getAccessToken方法执行完成之后）

```js
var userInfo = await client.getUser('openid');
```

## 交流群
QQ群：157964097，使用疑问，开发，贡献代码请加群。