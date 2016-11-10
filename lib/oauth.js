'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var urllib = require('urllib');
var extend = require('util')._extend;
var querystring = require('querystring');

var AccessToken = function AccessToken(data) {
  if (!(this instanceof AccessToken)) {
    return new AccessToken(data);
  }
  this.data = data;
};

/*!
 * 检查AccessToken是否有效，检查规则为当前时间和过期时间进行对比
 *
 * Examples:
 * ```
 * token.isValid();
 * ```
 */
AccessToken.prototype.isValid = function () {
  return !!this.data.access_token && new Date().getTime() < this.data.create_at + this.data.expires_in * 1000;
};

/**
 * 根据appid和appsecret创建OAuth接口的构造函数
 * 如需跨进程跨机器进行操作，access token需要进行全局维护
 * 使用使用token的优先级是：
 *
 * 1. 使用当前缓存的token对象
 * 2. 调用开发传入的获取token的异步方法，获得token之后使用（并缓存它）。

 * Examples:
 * ```
 * var OAuth = require('wechat-oauth');
 * var api = new OAuth('appid', 'secret');
 * ```
 * @param {String} appid 在公众平台上申请得到的appid
 * @param {String} appsecret 在公众平台上申请得到的app secret
 * @param {Generator} getToken 用于获取token的方法
 * @param {Generator} saveToken 用于保存token的方法
 */
var OAuth = function OAuth(appid, appsecret, getToken, saveToken) {
  this.appid = appid;
  this.appsecret = appsecret;
  // token的获取和存储
  this.store = {};
  this.getToken = getToken || function (openid) {
    return this.store[openid];
  };
  if (!saveToken && process.env.NODE_ENV === 'production') {
    console.warn("Please dont save oauth token into memory under production");
  }
  this.saveToken = saveToken || function (openid, token) {
    this.store[openid] = token;
  };
  this.defaults = {};
};

/**
 * 用于设置urllib的默认options
 *
 * Examples:
 * ```
 * oauth.setOpts({timeout: 15000});
 * ```
 * @param {Object} opts 默认选项
 */
OAuth.prototype.setOpts = function (opts) {
  this.defaults = opts;
};

/*!
 * urllib的封装
 *
 * @param {String} url 路径
 * @param {Object} opts urllib选项
 */
OAuth.prototype.request = function () {
  var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(url, opts) {
    var options, key, result, data, err;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            options = {};

            extend(options, undefined.defaults);
            opts || (opts = {});
            for (key in opts) {
              if (key !== 'headers') {
                options[key] = opts[key];
              } else {
                if (opts.headers) {
                  options.headers = options.headers || {};
                  extend(options.headers, opts.headers);
                }
              }
            }

            _context.prev = 4;
            _context.next = 7;
            return urllib.requestThunk(url, options);

          case 7:
            result = _context.sent;
            _context.next = 14;
            break;

          case 10:
            _context.prev = 10;
            _context.t0 = _context['catch'](4);

            _context.t0.name = 'WeChatAPI' + _context.t0.name;
            throw _context.t0;

          case 14:
            data = result.data;

            if (!data.errcode) {
              _context.next = 20;
              break;
            }

            err = new Error(data.errmsg);

            err.name = 'WeChatAPIError';
            err.code = data.errcode;
            throw err;

          case 20:
            return _context.abrupt('return', data);

          case 21:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined, [[4, 10]]);
  }));

  return function (_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

/**
 * 获取授权页面的URL地址
 * @param {String} redirect 授权后要跳转的地址
 * @param {String} state 开发者可提供的数据
 * @param {String} scope 作用范围，值为snsapi_userinfo和snsapi_base，前者用于弹出，后者用于跳转
 */
OAuth.prototype.getAuthorizeURL = function (redirect, state, scope) {
  var url = 'https://open.weixin.qq.com/connect/oauth2/authorize';
  var info = {
    appid: this.appid,
    redirect_uri: redirect,
    response_type: 'code',
    scope: scope || 'snsapi_base',
    state: state || ''
  };

  return url + '?' + querystring.stringify(info) + '#wechat_redirect';
};

/**
 * 获取授权页面的URL地址
 * @param {String} redirect 授权后要跳转的地址
 * @param {String} state 开发者可提供的数据
 * @param {String} scope 作用范围，值为snsapi_login，前者用于弹出，后者用于跳转
 */
OAuth.prototype.getAuthorizeURLForWebsite = function (redirect, state, scope) {
  var url = 'https://open.weixin.qq.com/connect/qrconnect';
  var info = {
    appid: this.appid,
    redirect_uri: redirect,
    response_type: 'code',
    scope: scope || 'snsapi_login',
    state: state || ''
  };

  return url + '?' + querystring.stringify(info) + '#wechat_redirect';
};

/*!
 * 处理token，更新过期时间
 */
OAuth.prototype.processToken = function () {
  var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(data) {
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            data.create_at = new Date().getTime();
            // 存储token
            _context2.next = 3;
            return undefined.saveToken(data.openid, data);

          case 3:
            return _context2.abrupt('return', AccessToken(data));

          case 4:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, undefined);
  }));

  return function (_x3) {
    return _ref2.apply(this, arguments);
  };
}();

/**
 * 根据授权获取到的code，换取access token和openid
 * 获取openid之后，可以调用`wechat.API`来获取更多信息
 * Examples:
 * ```
 * api.getAccessToken(code);
 * ```
 * Exception:
 *
 * - `err`, 获取access token出现异常时的异常对象
 *
 * 返回值:
 * ```
 * {
 *  data: {
 *    "access_token": "ACCESS_TOKEN",
 *    "expires_in": 7200,
 *    "refresh_token": "REFRESH_TOKEN",
 *    "openid": "OPENID",
 *    "scope": "SCOPE"
 *  }
 * }
 * ```
 * @param {String} code 授权获取到的code
 */
OAuth.prototype.getAccessToken = function () {
  var _ref3 = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(code) {
    var url, info, args, data;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            url = 'https://api.weixin.qq.com/sns/oauth2/access_token';
            info = {
              appid: undefined.appid,
              secret: undefined.appsecret,
              code: code,
              grant_type: 'authorization_code'
            };
            args = {
              data: info,
              dataType: 'json'
            };
            _context3.next = 5;
            return undefined.request(url, args);

          case 5:
            data = _context3.sent;
            _context3.next = 8;
            return undefined.processToken(data);

          case 8:
            return _context3.abrupt('return', _context3.sent);

          case 9:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, undefined);
  }));

  return function (_x4) {
    return _ref3.apply(this, arguments);
  };
}();

/**
 * 根据refresh token，刷新access token，调用getAccessToken后才有效
 * Examples:
 * ```
 * api.refreshAccessToken(refreshToken);
 * ```
 * Exception:
 *
 * - `err`, 刷新access token出现异常时的异常对象
 *
 * Return:
 * ```
 * {
 *  data: {
 *    "access_token": "ACCESS_TOKEN",
 *    "expires_in": 7200,
 *    "refresh_token": "REFRESH_TOKEN",
 *    "openid": "OPENID",
 *    "scope": "SCOPE"
 *  }
 * }
 * ```
 * @param {String} refreshToken refreshToken
 */
OAuth.prototype.refreshAccessToken = function () {
  var _ref4 = _asyncToGenerator(regeneratorRuntime.mark(function _callee4(refreshToken) {
    var url, info, args, data;
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            url = 'https://api.weixin.qq.com/sns/oauth2/refresh_token';
            info = {
              appid: undefined.appid,
              grant_type: 'refresh_token',
              refresh_token: refreshToken
            };
            args = {
              data: info,
              dataType: 'json'
            };
            _context4.next = 5;
            return undefined.request(url, args);

          case 5:
            data = _context4.sent;
            _context4.next = 8;
            return undefined.processToken(data);

          case 8:
            return _context4.abrupt('return', _context4.sent);

          case 9:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, undefined);
  }));

  return function (_x5) {
    return _ref4.apply(this, arguments);
  };
}();

OAuth.prototype._getUser = function (options, accessToken) {
  var url = 'https://api.weixin.qq.com/sns/userinfo';
  var info = {
    access_token: accessToken,
    openid: options.openid,
    lang: options.lang || 'en'
  };
  var args = {
    data: info,
    dataType: 'json'
  };
  return this.request(url, args);
};

/**
 * 根据openid，获取用户信息。
 * 当access token无效时，自动通过refresh token获取新的access token。然后再获取用户信息
 * Examples:
 * ```
 * api.getUser(options);
 * ```
 *
 * Options:
 * ```
 * openId
 * // 或
 * {
 *  "openId": "the open Id", // 必须
 *  "lang": "the lang code" // zh_CN 简体，zh_TW 繁体，en 英语
 * }
 * ```
 * Callback:
 *
 * - `err`, 获取用户信息出现异常时的异常对象
 *
 * Result:
 * ```
 * {
 *  "openid": "OPENID",
 *  "nickname": "NICKNAME",
 *  "sex": "1",
 *  "province": "PROVINCE"
 *  "city": "CITY",
 *  "country": "COUNTRY",
 *  "headimgurl": "http://wx.qlogo.cn/mmopen/g3MonUZtNHkdmzicIlibx6iaFqAc56vxLSUfpb6n5WKSYVY0ChQKkiaJSgQ1dZuTOgvLLrhJbERQQ4eMsv84eavHiaiceqxibJxCfHe/46",
 *  "privilege": [
 *    "PRIVILEGE1"
 *    "PRIVILEGE2"
 *  ]
 * }
 * ```
 * @param {Object|String} options 传入openid或者参见Options
 */
OAuth.prototype.getUser = function () {
  var _ref5 = _asyncToGenerator(regeneratorRuntime.mark(function _callee5(options) {
    var data, error, token, accessToken, newToken;
    return regeneratorRuntime.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            if ((typeof options === 'undefined' ? 'undefined' : _typeof(options)) !== 'object') {
              options = {
                openid: options
              };
            }

            _context5.next = 3;
            return undefined.getToken(options.openid);

          case 3:
            data = _context5.sent;

            if (data) {
              _context5.next = 8;
              break;
            }

            error = new Error('No token for ' + options.openid + ', please authorize first.');

            error.name = 'NoOAuthTokenError';
            throw error;

          case 8:
            token = AccessToken(data);

            if (!token.isValid()) {
              _context5.next = 13;
              break;
            }

            accessToken = token.data.access_token;
            _context5.next = 17;
            break;

          case 13:
            _context5.next = 15;
            return undefined.refreshAccessToken(token.data.refresh_token);

          case 15:
            newToken = _context5.sent;

            accessToken = newToken.data.access_token;

          case 17:
            _context5.next = 19;
            return undefined._getUser(options, accessToken);

          case 19:
            return _context5.abrupt('return', _context5.sent);

          case 20:
          case 'end':
            return _context5.stop();
        }
      }
    }, _callee5, undefined);
  }));

  return function (_x6) {
    return _ref5.apply(this, arguments);
  };
}();

OAuth.prototype._verifyToken = function () {
  var _ref6 = _asyncToGenerator(regeneratorRuntime.mark(function _callee6(openid, accessToken) {
    var url, info, args;
    return regeneratorRuntime.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            url = 'https://api.weixin.qq.com/sns/auth';
            info = {
              access_token: accessToken,
              openid: openid
            };
            args = {
              data: info,
              dataType: 'json'
            };
            _context6.next = 5;
            return undefined.request(url, args);

          case 5:
            return _context6.abrupt('return', _context6.sent);

          case 6:
          case 'end':
            return _context6.stop();
        }
      }
    }, _callee6, undefined);
  }));

  return function (_x7, _x8) {
    return _ref6.apply(this, arguments);
  };
}();

/**
 * 根据code，获取用户信息。
 * Examples:
 * ```
 * var user = yield api.getUserByCode(code);
 * ```
 * Exception:
 *
 * - `err`, 获取用户信息出现异常时的异常对象
 *
 * Result:
 * ```
 * {
 *  "openid": "OPENID",
 *  "nickname": "NICKNAME",
 *  "sex": "1",
 *  "province": "PROVINCE"
 *  "city": "CITY",
 *  "country": "COUNTRY",
 *  "headimgurl": "http://wx.qlogo.cn/mmopen/g3MonUZtNHkdmzicIlibx6iaFqAc56vxLSUfpb6n5WKSYVY0ChQKkiaJSgQ1dZuTOgvLLrhJbERQQ4eMsv84eavHiaiceqxibJxCfHe/46",
 *  "privilege": [
 *    "PRIVILEGE1"
 *    "PRIVILEGE2"
 *  ]
 * }
 * ```
 * @param {String} code 授权获取到的code
 */
OAuth.prototype.getUserByCode = function () {
  var _ref7 = _asyncToGenerator(regeneratorRuntime.mark(function _callee7(code) {
    var token;
    return regeneratorRuntime.wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            _context7.next = 2;
            return undefined.getAccessToken(code);

          case 2:
            token = _context7.sent;
            _context7.next = 5;
            return undefined.getUser(token.data.openid);

          case 5:
            return _context7.abrupt('return', _context7.sent);

          case 6:
          case 'end':
            return _context7.stop();
        }
      }
    }, _callee7, undefined);
  }));

  return function (_x9) {
    return _ref7.apply(this, arguments);
  };
}();

module.exports = OAuth;