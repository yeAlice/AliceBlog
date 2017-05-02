/**
 * Created by 44254 on 2017/4/13.
 */

var User = require('../lib/mongo').User;

module.exports = {
    //注册一个新用户
    create: function create(user) {
        return User.create(user).exec();
    },

    // 通过用户名获取用户信息
    getUserByName: function getUserByName(name) {
        return User
            .findOne({ name: name })
            .addCreatedAt()
            .exec();
    },

    // 通过用户 id 获取个人信息
    getUserById: function getUserById(userId) {
        return User
            .findOne({ _id: userId })
            .populate({ path: 'author', model: 'User' })
            .exec();
    },

    updateUserById: function updateUserById(userId, data) {
        return User.update({ _id: userId }, { $set: data }).exec();
    },


};

