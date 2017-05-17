/**
 * Created by 44254 on 2017/4/14.
 */

var Post = require('../lib/mongo').Post;
var CommentModel = require('./comments');

// 给 post 添加留言数 commentsCount
Post.plugin('addCommentsCount', {
    afterFind: function (posts) {
        return Promise.all(posts.map(function (post) {
            return CommentModel.getCommentsCount(post._id).then(function (commentsCount) {
                post.commentsCount = commentsCount;
                return post;
            });
        }));
    },
    afterFindOne: function (post) {
        if (post) {
            return CommentModel.getCommentsCount(post._id).then(function (count) {
                post.commentsCount = count;
                return post;
            });
        }
        return post;
    }
});

module.exports = {
    // 创建一篇文章
    create: function create(post) {
        return Post.create(post).exec();
    },

    // 按创建时间降序获取所有用户文章或者某个特定用户的所有文章
    getPosts: function getPosts(author, page) {
        var query = {};
        if (author) {
            query.author = author;
        }
        return Post
            .find(query, {
                skip: (page - 1)*10,
                limit: 10
            })
            .populate({ path: 'author', model: 'User' })
            .sort({ _id: -1 })
            .addCreatedAt()
            .addCommentsCount()
            .exec();
    },
    //获取文章总数
    getPostsCount: function getPostsCount(author){
        var query = {};
        if (author) {
            query.author = author;
        }
        return Post.count(query).exec();
    },
    getHotPosts: function getHotPosts(author) {
        var query = {};
        if (author) {
            query.author = author;
        }
        return Post
            .find(query, {
                limit: 10
            })
            .populate({ path: 'author', model: 'User' })
            .sort({pv: -1})
            .exec();
    },
    // 通过文章 id 获取一篇文章
    getPostById: function getPostById(postId) {
        return Post
            .findOne({ _id: postId })
            .populate({ path: 'author', model: 'User' })
            .addCreatedAt()
            .addCommentsCount()
            .exec();
    },
    // 通过文章 id 给 pv 加 1
    incPv: function incPv(postId) {
        return Post
            .update({ _id: postId }, { $inc: { pv: 1 } })
            .exec();
    },
    // 通过文章 id 获取一篇原生文章（编辑文章）
    getRawPostById: function getRawPostById(postId) {
        return Post
            .findOne({ _id: postId })
            .populate({ path: 'author', model: 'User' })
            .exec();
    },

    // 通过用户 id 和文章 id 更新一篇文章
    updatePostById: function updatePostById(postId, author, data) {
        return Post.update({ author: author, _id: postId }, { $set: data }).exec();
    },

    // 通过用户 id 和文章 id 删除一篇文章和文章下所有留言
    delPostById: function delPostById(postId, author) {
        return Post.remove({ author: author, _id: postId })
            .exec()
            .then(function (res) {
                // 文章删除后，再删除该文章下的所有留言
                if (res.result.ok && res.result.n > 0) {
                    return CommentModel.delCommentsByPostId(postId);
                }
            });
    },

    //全局搜索，根据用户输入的关键词，搜索文章标题或者文章内容，得出所有有关文章
    search: function search(keyword) {
        var pattern;
        if(keyword) {
            pattern = new RegExp(keyword, 'i');
        }
        return Post
            .find({
                "$or":[{"title": pattern}, {"content": pattern}]
            })
            .populate({ path: 'author', model: 'User' })
            .sort({ _id: -1 })
            .addCreatedAt()
            .addCommentsCount()
            .exec();
    }
};
