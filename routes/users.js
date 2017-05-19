/**
 * Created by 44254 on 2017/4/30.
 */

var fs = require('fs');
var path = require('path');
var sha1 = require('sha1');
var express = require('express');
var router = express.Router();

var UserModel = require('../models/users');
var checkLogin = require('../middlewares/check').checkLogin;


/*个人信息页
 * GET /users/:userId */
router.get('/:userId', function (req, res, next) {
    var userId = req.params.userId;

    Promise.all([
        UserModel.getUserById(userId),// 获取个人信息
    ]).then(function (result) {
        var user = result[0];
        if (!user) {
            throw new Error('该用户不存在');
        }
        res.render('user', {
            user: user
        });
    }).catch(next);
});

/*更新个人信息页
 * GET /users/:userId/edit */
router.get('/:userId/edit', checkLogin, function (req, res, next) {
    var userId = req.params.userId;

    UserModel.getUserById(userId)
        .then(function (user) {
            if (!user) {
                throw new Error('该用户不存在');
            }
            res.render('user_edit', {
                user: user
            });
        })
        .catch(next);
});

/*修改个人信息
 * POST /users/:userId/edit */
router.post('/:userId/edit', checkLogin, function (req, res, next) {
    var userId = req.params.userId;
    var name = req.fields.name;
    var gender = req.fields.gender;
    var bio = req.fields.bio;
    var avatar = req.files.avatar.path.split(path.sep).pop();
    var password = req.fields.password;
    var repassword = req.fields.repassword;

    // 校验参数
    try {
        if (!(name.length >= 1 && name.length <= 10)) {
            throw new Error('名字请限制在 1-10 个字符');
        }
        if (['m', 'f', 'x'].indexOf(gender) === -1) {
            throw new Error('性别只能是 m、f 或 x');
        }
        if (!(bio.length >= 1 && bio.length <= 30)) {
            throw new Error('个人简介请限制在 1-30 个字符');
        }
        /*if (!req.files.avatar.name) {
            throw new Error('缺少头像');
        }*/
        if (password.length < 6) {
            throw new Error('密码至少 6 个字符');
        }
        if (password !== repassword) {
            throw new Error('两次输入密码不一致');
        }
    } catch (e) {
        /*// 修改信息失败，异步删除上传的头像
        fs.unlink(req.files.avatar.path);*/
        req.flash('error', e.message); //返回错误信息
        return res.redirect('/users/'+userId+'/edit'); //跳转到修改个人信息页面
    }

    // 明文密码加密
    password = sha1(password);

    // 待写入数据库的用户信息
    var user;
    if(avatar !== null){
        user = {
            name: name,
            password: password,
            gender: gender,
            bio: bio,
            avatar: avatar
        };
    }else {
        user = {
            name: name,
            password: password,
            gender: gender,
            bio: bio
        };
    }

    UserModel.updateUserById(userId, user)
        .then(function () {
            req.flash('success', '修改个人信息成功');
            req.session.user.avatar = user.avatar;
            // 编辑成功后跳转到上一页
            res.redirect('/posts?author='+userId);
        })
        .catch(next);
});

module.exports = router;