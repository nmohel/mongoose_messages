// requirements
var express = require("express");
var path = require("path");
var bodyParser = require('body-parser');
var mongoose = require('mongoose'); 
var session = require('express-session');

//this is my app
var app = express();
// use body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({secret:'NotASecret'}));

mongoose.connect('mongodb://localhost/message_board');

var Schema = mongoose.Schema;
var PostSchema = new mongoose.Schema({
    message: {type: String, required: [true, 'Message cannot be blank']},
    writer: {type: String, required: [true, 'Name cannot be blank'], minlength:[4, 'Name must be at least 4 characters']},
    comments: [{type: Schema.Types.ObjectId, ref: 'Comment'}]
}, {timestamps: true})

var CommentSchema = new mongoose.Schema({
    message: {type: String, required: [true, 'Message cannot be blank']},
    writer: {type: String, required: [true, 'Name cannot be blank'], minlength:[4, 'Name must be at least 4 characters']},
    _post: {type: Schema.Types.ObjectId, ref: 'Post'}
}, {timestamps: true})
mongoose.model('Post', PostSchema); 
mongoose.model('Comment', CommentSchema);
var Post = mongoose.model('Post');
var Comment = mongoose.model('Comment');

// setting up ejs and our views folder
app.set('views', path.join(__dirname, './views'));
app.set('view engine', 'ejs');

// The root route -- we want to get all of the users from the database and then render the index view passing it all of the users
app.get('/', function(req, res) {
    Post.find({}).populate('comments').exec(function(err, data) {
        if (err) {
            console.log(err)
            let errors = []
            for (key in err.errors) {
                errors.push(err.errors[key].message);
            }
            res.render('index', {errors: errors})
        } else {
            res.render('index', {all_posts: data, errors: null, session: req.session});
        }
    });
});

app.post('/posts', function(req, res) {
    var post = new Post(req.body);
    post.save(function(err) {
        if (err) {
            var errors = [];
            for (key in err.errors) {
                errors.push(err.errors[key].message);
            }
            req.session.post_validations = errors;
        } else {
            delete req.session.post_validations;
        }
        res.redirect('/');
    });
});

app.post('/comments/:post_id', function(req, res) {
    Post.findById(req.params.post_id, function(err, post) {
        if (err) {
            console.log(err);
            res.redirect('/')
        } else {
            var comment = new Comment(req.body);
            comment._post = post._id;
            comment.save(function(err) {
                if (err) {
                    var errors = [];
                    for (key in err.errors) {
                        errors.push(err.errors[key].message);
                    }
                    req.session.comment_validations = errors;
                    res.redirect('/');
                } else {
                    delete req.session.comment_validations;
                    post.comments.push(comment);
                    post.save(function(err){

                        res.redirect('/');
                    });
                }
            });
        }
    })
})

app.listen(8000, function() {
    console.log('listening on port 8000 for MESSAGE BOARD');
});