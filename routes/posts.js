/**
 * Created by Alice on 2017/4/1.
 */

var express = require('express');
var router = express.Router();

var PostModel = require('../models/posts');
var CommentModel = require('../models/comments');
var checkLogin = require('../middlewares/check').checkLogin;

/*获取所有用户或特定用户的文章页面
* GET /posts
* GET /posts?author=xxx&page=xxx */
router.get('/', function (req, res, next) {
    var author = req.query.author;
    //判断是否是第一页，并把请求的页数转换成 number 类型
    var page = req.query.page ? parseInt(req.query.page) : 1;

    PostModel.getPosts(author, page)
        .then(function (posts) {
            if(posts.length == 0){
                res.render('noPost');
            }else {
                PostModel.getPostsCount(author).then(function (count) {
                    res.render('posts', {
                        posts: posts,
                        page: page,
                        author: author,
                        isFirstPage: (page - 1) == 0,
                        isLastPage: ((page - 1) * 10 + posts.length) == count
                    });
                })
            }
        })
        .catch(next);
});

/*发表一篇文章
* POST /posts */
router.post('/', checkLogin, function (req, res, next) {
    var author = req.session.user._id;
    var title = req.fields.title;
    var content = req.fields.content;
    try {// 校验参数
        if (!title.length) {
            throw new Error('请填写标题');
        }
        if (!content.length) {
            throw new Error('请填写内容');
        }
    } catch (e) {
        req.flash('error', e.message);
        return res.redirect('back');
    }
    var post = {
        author: author,
        title: title,
        content: content,
        pv: 0
    };
    PostModel.create(post)
        .then(function (result) {
            // 此 post 是插入 mongodb 后的值，包含 _id
            post = result.ops[0];
            req.flash('success', '发表成功');
            // 发表成功后跳转到该文章页
            res.redirect('/posts/'+post._id);
        }).catch(next);
});

/*发表文章页
* GET /posts/create */
router.get('/create', checkLogin, function (req, res, next) {
    res.render('create');
});

/*单独一篇文章页
* GET /posts/:postId */
router.get('/:postId', function (req, res, next) {
    var postId = req.params.postId;

    Promise.all([
        PostModel.getPostById(postId),// 获取文章信息
        CommentModel.getComments(postId),// 获取该文章所有留言
        PostModel.incPv(postId)// pv 加 1
    ]).then(function (result) {
            var post = result[0];
            var comments = result[1];
            if (!post) {
                throw new Error('该文章不存在');
            }
            res.render('post', {
                post: post,
                comments: comments
            });
        }).catch(next);
});

/*更新文章页
 * GET /posts/:postId/edit */
router.get('/:postId/edit', checkLogin, function (req, res, next) {
    var postId = req.params.postId;
    var author = req.session.user._id;

    PostModel.getRawPostById(postId)
        .then(function (post) {
            if (!post) {
                throw new Error('该文章不存在');
            }
            if (author.toString() !== post.author._id.toString()) {
                throw new Error('权限不足');
            }
            res.render('edit', {
                post: post
            });
        })
        .catch(next);
});

/*更新一篇文章
* POST /posts/:postId/edit */
router.post('/:postId/edit', checkLogin, function (req, res, next) {
    var postId = req.params.postId;
    var author = req.session.user._id;
    var title = req.fields.title;
    var content = req.fields.content;

    PostModel.updatePostById(postId, author, { title: title, content: content })
        .then(function () {
            req.flash('success', '编辑文章成功');
            // 编辑成功后跳转到上一页
            res.redirect('/posts/'+postId);
        })
        .catch(next);
});

/*删除一篇文章
 * GET /posts/:postId/remove */
router.get('/:postId/remove', checkLogin, function (req, res, next) {
    var postId = req.params.postId;
    var author = req.session.user._id;

    PostModel.delPostById(postId, author)
        .then(function () {
            req.flash('success', '删除文章成功');
            // 删除成功后跳转到主页
            res.redirect('/posts');
        })
        .catch(next);
});

/*创建一条留言
* POST /posts/:postId/comment */
router.post('/:postId/comment', checkLogin, function (req, res, next) {
    var author = req.session.user._id;
    var postId = req.params.postId;
    var content = req.fields.content;
    var comment = {
        author: author,
        postId: postId,
        content: content
    };

    CommentModel.create(comment)
        .then(function () {
            req.flash('success', '留言成功');
            // 留言成功后跳转到上一页
            res.redirect('back');
        })
        .catch(next);
});

/*删除一条留言
* GET /posts/:postId/comment/:commentId/remove */
router.get('/:postId/comment/:commentId/remove', checkLogin, function(req, res, next) {
    var commentId = req.params.commentId;
    var author = req.session.user._id;

    CommentModel.delCommentById(commentId, author)
        .then(function () {
            req.flash('success', '删除留言成功');
            // 删除成功后跳转到上一页
            res.redirect('back');
        })
        .catch(next);
});

/*根据关键词搜索文章
* POST /posts/search */
router.post('/search', function (req, res, next) {
    var keyword = req.fields.keyword;
    PostModel.search(keyword)
        .then(function (posts) {
                if(!posts) {
                    throw new Error('服务器报错啦');
                }else {
                    if(posts.length == 0) {
                        req.flash('error', '找不到相关文章');
                        res.redirect('back');
                    }else {
                        res.render('search', {
                            posts: posts
                        });
                    }
                }
            })
        .catch(next);
});

module.exports = router;