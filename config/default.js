module.exports = {
    port: 3010,
    session: { //express-session 的配置信息
        secret: 'aliceblog',
        key: 'aliceblog',
        maxAge: 2160000
    },
    mongodb: 'mongodb://localhost:27017/aliceblog'
};