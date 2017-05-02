/**
 * Created by Alice on 2017/4/1.
 */

module.exports = {
    //当用户信息不存在，即用户还未登录，则跳转到登录页，显示未登录的通知
    checkLogin: function checkLogin(req, res, next) {
        if(!req.session.user) {
            req.flash('error', '未登录');
            return res.redirect('signin');
        }
        next();
    },

    //当用户信息存在，即用户已登录，则跳转到之前的页面，显示已登录的通知
    checkNotLogin: function checkNotLogin(req, res, next) {
        if(req.session.user) {
            req.flash('error', '已登录');
            return res.redirect('back'); //返回之前的页面
        }
        next();
    }
};