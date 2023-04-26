require('dotenv').config();
const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../app');



//Assertion style
chai.should();

chai.use(chaiHttp);

describe("Api Test", () => {

    //Post - Positive test for api/authenticate
    describe('POST /api/authenticate', () => {
        it('should authenticate the user', (done) => {
            const user = {
                email: "abc@abc.com",
                password: "1234",
            };
            chai.request(server)
                .post('/api/authenticate')
                .send(user)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property('accessToken');
                    done();
                });
        });
    });


    // put access token after generating and getting the access token while login
    const accessToken = process.env.ACCESS_TOKEN || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NDQ4ZmE4NDVkN2UwYzUyNjY2MTEzNGEiLCJpYXQiOjE2ODI1MDQzMjR9.lbLT6tTlIhIu9q5bwBw8fel5N6PaJ30YZ1B7KnPc7MA";

    //Post - negative test for api/authenticate
    describe('POST /api/authenticate', () => {
        it('should not authenticate a user with incorrect credentials', (done) => {
            const user = {
                email: "abc@abc.com",
                password: "12345",
            };
            chai.request(server)
                .post('/api/authenticate')
                .send(user)
                .end((err, res) => {
                    res.should.have.status(401);
                    res.body.should.be.a('object');
                    res.body.should.have.property('message').eql('Incorrect password');
                    done();
                });
        });
    });




    //POST - Positive -api/follow/:id
    describe('POST /api/follow/:id', () => {
        it('should follow the user with the specified ID', (done) => {
            const userId = '6448aa1c966b20f0a82dfcf9'; // replace with a valid user ID
            chai.request(server)
                .post(`/api/follow/${userId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property('message').that.is.oneOf(['User followed successfully', 'User followed already']);
                    done();
                });
        });
    });




    describe('POST /api/follow/{id}', () => {
        // POST - negative - /api/follow/{id} - incorrect id
        it('should return an error if the user ID is invalid', (done) => {
            const userId = '6448aa1c66b20f0a82dfcf9'; // replace with an invalid user ID
            chai.request(server)
                .post(`/api/follow/${userId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .end((err, res) => {
                    res.should.have.status(500);
                    res.body.should.be.a('object');
                    res.body.should.have.property('message').eql("Internal server error");
                    done();
                });
        });

        // POST - negative - /api/follow/{id} - invalid access token
        it('should return an error if the access token is invalid', (done) => {
            const userId = 'abc123';
            chai.request(server)
                .post(`/api/follow/${userId}`)
                .set('Authorization', 'Bearer invalidToken')
                .end((err, res) => {
                    res.should.have.status(403);
                    res.body.should.be.a('object');
                    res.body.should.have.property('message').eql('Invalid access token');
                    done();
                });
        });
    });

    //POST - Positive - /api/unfollow/:id
    describe('POST /api/unfollow/:id', () => {
        it('should unfollow the user with the specified ID', (done) => {
            const userId = '6448aa1c966b20f0a82dfcf9'; // replace with a valid user ID
            chai.request(server)
                .post(`/api/unfollow/${userId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property('message').that.is.oneOf(['User unfollowed successfully', 'User unfollowed already']);
                    done();
                });
        });
    });


    //POST - Positive - /api/unfollow/:id -incorrect id
    describe('POST /api/unfollow/:id', () => {
        it('should not unfollow the user with the specified ID', (done) => {
            const userId = '6448aa1c966b20f0a8fcf9'; // invalid user ID
            chai.request(server)
                .post(`/api/unfollow/${userId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .end((err, res) => {
                    res.should.have.status(500);
                    res.body.should.be.a('object');
                    res.body.should.have.property('message').that.is.oneOf(['User not found', 'Internal server error']);
                    done();
                });
        });
    });


    //GET - Positive - /api/user -get user details
    describe('GET /api/user', () => {
        it('should return user details', (done) => {
            chai.request(server)
                .get('/api/user')
                .set('Authorization', `Bearer ${accessToken}`)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property('username')
                    res.body.should.have.property('followers')
                    res.body.should.have.property('following')
                    done();
                });
        });
    });


    //GET - Negative - /api/user -do not get user details
    describe('GET /api/user', () => {
        it('should return error if not authenticated', (done) => {
            chai.request(server)
                .get('/api/user')
                .end((err, res) => {
                    res.should.have.status(401);
                    res.body.should.be.a('object');
                    res.body.should.have.property('message').eql('Unauthorized');
                    done();
                });
        });
    });



    describe('POST /api/posts', () => {
        //POST - Positive - add a new post 
        it('should create a new post and return its details', (done) => {
            const newPost = {
                title: 'My First Post',
                description: 'This is my first post on the platform',
            };
            chai.request(server)
                .post('/api/posts')
                .set('Authorization', `Bearer ${accessToken}`) // Wrong access token
                .send(newPost)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property('postId').that.is.a('string');
                    res.body.should.have.property('title')
                    res.body.should.have.property('description').that.is.a('string');
                    done();
                });
        });

        //POST - Negative - should not add a new post 
        it('should not create a new post', (done) => {
            const newPost = {
                title: 'My First Post',
                description: 'This is my first post on the platform',
            };
            chai.request(server)
                .post('/api/posts')
                .set('Authorization', `Bearer ${accessToken + "pqr"}`) // Invalid token
                .send(newPost)
                .end((err, res) => {
                    res.should.have.status(403);
                    res.body.should.be.a('object');
                    res.body.should.have.property('message').eql('Invalid access token');
                    done();
                });
        });
    });

    describe('POST /api/like/:id', () => {
        //positive
        it('should add a like to the specified post and return updated post details', (done) => {
            const postId = '64490b1b8e9e268b1a2ccefa';
            chai.request(server)
                .post(`/api/like/${postId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property('message').eq('Post liked');
                    done();
                });
        });

        //negative
        it('should return 404 error if post or user is not found', (done) => {
            const postId = 'nonExistentPostId';
            chai.request(server)
                .post(`/api/like/${postId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .end((err, res) => {
                    res.should.have.status(500);
                    res.body.should.be.a('object');
                    res.body.should.have.property('message').eql('internal server error/Post not found');
                    done();
                });
        });
    });

    describe('POST /api/unlike/:id', () => {
        //positive
        it('should add a like to the specified post and return updated post details', (done) => {
            const postId = '64490b1b8e9e268b1a2ccefa';
            chai.request(server)
                .post(`/api/unlike/${postId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property('message').eq('Post unliked');
                    done();
                });
        });

        //negative
        it('should return 404 error if post or user is not found', (done) => {
            const postId = 'nonExistentPostId';
            chai.request(server)
                .post(`/api/unlike/${postId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .end((err, res) => {
                    res.should.have.status(500);
                    res.body.should.be.a('object');
                    res.body.should.have.property('message').eql('internal server error/Post not found');
                    done();
                });
        });
    });


    //Add comment
    describe('POST /api/comment/:id', () => {
        //positive
        it('should create a new comment for a post and return its details', (done) => {
            const newComment = {
                text: 'Great post!',
            };
            const postId = '64490b1b8e9e268b1a2ccefa';
            chai.request(server)
                .post(`/api/comment/${postId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send(newComment)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property('message').that.equals("comment added successfully");
                    done();
                });
        });

        it('should return an error message if the post ID is invalid', (done) => {
            const newComment = {
                text: 'Great post!',
            };
            chai.request(server)
                .post('/api/comment/invalidId')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(newComment)
                .end((err, res) => {
                    res.should.have.status(500);
                    res.body.should.be.a('object');
                    res.body.should.have.property('message').that.equals('internal server error/Post not found');
                    done();
                });
        });

    });

    // get a single post
    describe('GET /api/posts/:id', () => {
        //Positive 
        it('should return a single post with likes and comments', (done) => {
            const postId = '6449097b8e9e268b1a2cceee'; 
            chai.request(server)
                .get(`/api/posts/${postId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property('post');
                    res.body.post.should.have.property('title');
                    res.body.post.should.have.property('description');
                    res.body.post.should.have.property('likes');
                    res.body.post.should.have.property('comments');
                    res.body.post.should.have.property('createdAt');
                    res.body.post.should.have.property('updatedAt');
                    done();
                });
        });

        // Negative
        it('should return a 404 error when the post ID is invalid', (done) => {
            const postId = 'invalid-post-id';
            chai.request(server)
                .get(`/api/posts/${postId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .end((err, res) => {
                    res.should.have.status(500);
                    res.body.should.be.a('object');
                    res.body.should.have.property('message').equal('internal server error/Post not found');
                    done();
                });
        });
    });


    // get all posts
    describe('GET /api/all_posts', () => {
        it('should return all posts in the database', (done) => {
            chai.request(server)
                .get('/api/all_posts')
                .set('Authorization', `Bearer ${accessToken}`)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property('posts');
                    res.body.posts.forEach(post => {
                        post.should.have.property('title');
                        post.should.have.property('description');
                        post.should.have.property('likes');
                        post.should.have.property('comments');
                        post.should.have.property('createdAt');
                        post.should.have.property('updatedAt');
                    });
                    done();
                });
        });

        it('should return an error if user is not authenticated', (done) => {
            chai.request(server)
                .get('/api/all_posts')
                .end((err, res) => {
                    res.should.have.status(401);
                    done();
                });
        });
    });
})