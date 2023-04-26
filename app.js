require('dotenv').config();
const jwt = require('jsonwebtoken');
const http = require('http');
const express = require('express');
const mongoose = require('mongoose');
const User = require('./models/user');
const Post = require('./models/post');
const path = require('path');
const ejs = require('ejs');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const router = express.Router()
//const userRoutes = require('./routes/user_route');

const app = express();
const server = http.createServer(app);
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

mongoose.connect(process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/socialDB');


app.get('/', (req, res) => {
    res.render('login');
});

app.get('/api/user', authenticateJWT, async (req, res) => {

    const user = await User.findOne({ _id: req.user.userId });

    if (!user) {
        res.status(404).json({ message: 'User not found' });
    } else {
        res.status(200).json({ username: user.username, followers: user.followers.length, following: user.following.length });
    }
})


// Login endpoint
app.post('/api/authenticate', async (req, res) => {
    const { email, password } = req.body;


    try {
        // Find user by email
        const user = await User.findOne({ email: email });

        // If user does not exist, create a new user and return JWT
        if (!user) {
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = User({
                username: email,
                email: email,
                password: hashedPassword
            })
            newUser.save();
            const accessToken = jwt.sign({ userId: newUser._id }, process.env.SECRET_KEY);
            res.cookie('token', accessToken, { httpOnly: true });
            console.log(res.cookie.token);
            return res.json({ accessToken });
        }
        // If user exists, check password
        const passwordMatches = await bcrypt.compare(password, user.password);
        if (!passwordMatches) {
            return res.status(401).json({ message: 'Incorrect password' });
        }

        // If password is correct, return JWT
        const accessToken = jwt.sign({ userId: user._id }, process.env.SECRET_KEY);
        res.cookie('token', accessToken, { httpOnly: true });
        req.body.token = accessToken;
        console.log(res.cookie.token);
        return res.json({ accessToken });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});


// Middleware to authenticate JWT
function authenticateJWT(req, res, next) {
    const authHeader = req.headers['authorization'];

    console.log(authHeader);

    if (authHeader) {
        const token = authHeader && authHeader.split(' ')[1];

        jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
            if (err) {
                return res.status(403).json({ message: "Invalid access token" });
            }
            req.user = user;
            next();
        });
    } else {
        res.status(401).json({ message: "Unauthorized" });
    }
};


// Follow endpoint
app.post('/api/follow/:id', authenticateJWT, async (req, res) => {
    const { id } = req.params;

    try {
        // Find authenticated user by ID
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Find user to follow by ID
        const userToFollow = await User.findById(id);
        if (!userToFollow) {
            return res.status(404).json({ message: 'User to follow not found' });
        }

        const isFollowedByUser = await userToFollow.followers.includes(user._id);
        // only mak changes if not followed by the user
        if (!isFollowedByUser) {
            // Add user to follow to authenticated user's following list
            user.following.push(userToFollow._id);
            await user.save();

            // Increase follower count for user to follow
            userToFollow.followers.push(user._id);
            await userToFollow.save();

            return res.json({ message: 'User followed successfully' });
        }

        return res.json({ message: 'User followed already' });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});


app.post('/api/unfollow/:id', authenticateJWT, async (req, res) => {
    const { id } = req.params;

    try {
        // Find authenticated user by ID
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Find user to Unfollow by ID
        const userToUnFollow = await User.findById(id);
        if (!userToUnFollow) {
            return res.status(404).json({ message: 'User to unfollow not found' });
        }

        const isFollowedByUser = await userToUnFollow.followers.includes(user._id);
        if (isFollowedByUser && userToUnFollow._id !== user._id) {
            // remove user to Unfollow from authenticated user's following list
            user.following.pop(userToUnFollow._id);
            await user.save();

            // decrease follower count for user to follow
            userToUnFollow.followers.pop(user._id);
            await userToUnFollow.save();

            return res.json({ message: 'User unfollowed successfully' });
        }

        return res.json({ message: 'User unfollowed already' });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});


app.get('/api/user', authenticateJWT, async (req, res) => {
    try {
        // Find authenticated user by ID
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.json({ username: user.username, followers: user.followers.length, following: user.following.length });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "internal server error" });
    }
});


///             //////////////////POSTS/////////////////

app.get('/api/posts/:id', authenticateJWT, async (req, res) => {
    // find post by id
    const id = req.params.id;
    try {
        // Find authenticated user by ID
        const post = await Post.findOne({ _id: req.params.id });

        if (!post) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({ post: post });


    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "internal server error/Post not found" });
    }
});

app.get('/api/all_posts', authenticateJWT, async (req, res) => {

    // find all posts
    const posts = await Post.find();

    if (!posts) {
        return res.status(404).json({ message: 'No posts found' });
    }

    return res.status(200).json({ posts: posts });
})


app.post('/api/posts', authenticateJWT, async (req, res) => {
    const { title, description } = req.body;
    try {
        // Find authenticated user by ID
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // create new post
        const newPost = new Post({
            title: title,
            description: description,
            author: user._id,
        })

        newPost.save();
        user.posts.push(newPost._id);
        user.save();
        //RETURN: Post-ID, Title, Description, Created Time(UTC).
        const createdAtTime = newPost.createdAt;
        return res.status(200).json({ postId: newPost._id, title: newPost.title, description: newPost.description });


    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "internal server error" });
    }

});

app.delete('/api/posts/:id', authenticateJWT, async (req, res) => {
    const { id } = req.params;
    console.log(id);
    try {
        // Find authenticated user by ID
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // find post by id
        const post = await Post.findById(id);

        // if post is not found
        if (!post) {
            return res.status(404).json({ message: 'Post deleted already' });
        }

        // if post is not of the authenticated user
        if (!user.posts.includes(post._id)) {
            return res.status(404).json({ message: 'user and post do not match' });
        }

        await Post.deleteOne({ _id: id });

        console.log(user);

        const postArray = await user.posts;

        postArray.pop(id);
        user.save();


        return res.status(200).json({ status: "post deleted" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "internal server error" });
    }

});


app.post('/api/like/:id', authenticateJWT, async (req, res) => {
    const { id } = req.params;
    try {
        // Find authenticated user and by ID
        const user = await User.findById(req.user.userId);
        const post = await Post.findById(id);

        if (!user || !post) {
            return res.status(404).json({ message: 'User/Post not found' });
        }

        post.likes.push(user._id);
        post.save();


        return res.status(200).json({ message: "Post liked" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "internal server error/Post not found" });
    }

});


app.post('/api/unlike/:id', authenticateJWT, async (req, res) => {
    const { id } = req.params;
    try {
        // Find authenticated user and post by ID
        const user = await User.findById(req.user.userId);
        const post = await Post.findById(id);

        if (!user || !post) {
            return res.status(404).json({ message: 'User/Post not found' });
        }

        post.likes.pop(user._id);
        post.save();


        return res.status(200).json({ message: "Post unliked" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "internal server error/Post not found" });
    }

});


app.post('/api/comment/:id', authenticateJWT, async (req, res) => {
    const { id } = req.params;
    const text = req.body.text;
    try {
        // Find authenticated user and post by ID
        const user = await User.findById(req.user.userId);
        const post = await Post.findById(id);

        if (!user || !post) {
            return res.status(404).json({ message: 'User/Post not found' });
        }

        const newComment = {
            author: user._id,
            text: text,
        }

        post.comments.push(newComment);
        post.save();

        const commentsArray = post.comments

        const commentId = commentsArray.forEach((comment) => {
            if (comment.author === user._id) {
                return comment._id;
            }
        })

        return res.status(200).json({ message: "comment added successfully", commentId: commentId });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "internal server error/Post not found" });
    }

});



const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log("app listening on port", port);
})


module.exports = server;