const express = require('express');
const Joi = require('joi');
var cookieParser = require('cookie-parser');
const multer  = require('multer');
var session = require('express-session');
const app = express();
const port = 3000;
app.set('view engine', 'ejs');
const Admin = require('./models/admin.js');
const User = require('./models/user.js');
const Blog = require('./models/blogs.js');
var validateLogin = require('./validate/loginVal.js');
var validateUser = require('./validate/userVal.js');
const path = require('path');

app.use(express.urlencoded({
    extended: true
}))
app.use(express.json());
app.use(express.static('public'));

app.use(cookieParser());

app.use(
    session({
        key: 'user_sid',
        secret: 'asecretkey',
        resave: false,
        saveUninitialized: false,
        cookie: {
            expires: 86400000
        }
    })
)

app.use(function (req, res, next) {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    next()
});

var sessionCheck = (req, res, next) => {
    if (req.session.loggedin) {
        res.redirect(`/${req.session.role}page`);
    }
    else next();
}


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      return cb(null, './public/uploads')
    },
    filename: function (req, file, cb) {
      return cb(null,`${Date.now()}-${file.originalname}`);
    }
  })
  
const upload = multer({
    storage:storage,
    fileFilter:(req,file,cb)=>{
        if(file.mimetype=="image/png" || file.mimetype=="image/jpg" || file.mimetype=="image/jpeg") cb(null,true);
        else{
            cb(null,false);
            return cb('ONLY JPEG, JPG, PNG ARE ALLOWED');
        }
    },
    limits:{fileSize:3*1024*1024}
    })

app.get('/', async (req, res) => {
    try {
        let result = await Blog.findAll();
        res.render('index', { data: result });
    } catch (err) {
        console.log(err);
    }
})

app.get('/adminpage', async (req, res) => {
    if (req.session.loggedin && req.session.role == 'admin') {
        try {
            let result = await User.findAll();
            let result2 = await Admin.findAll();
            res.render('adminpage', { admindata: result2, userdata: result, name: req.session.name });
        } catch (err) {
            console.log(err);
        }
    }
    else res.redirect('/login');
})

app.get('/login', sessionCheck, (req, res) => {
    res.render('login', { succ: "" });
})

app.post('/login', async (req, res) => {
    let validationResult = validateLogin(req.body);
    if (validationResult.error) {
        return res.status(400).send(validationResult.error.message);
    }
    const { email, password} = req.body;

    try {
        let user = await Admin.findOne({
            where: {
                email: email,
                password: password,
            },
            attributes: ['name'],
        });

        if (user) {
            req.session.loggedin = true;
            req.session.name = user.name;
            req.session.role = "admin";
            return res.redirect('/adminpage');
        }

        else {
            let user = await User.findOne({
                where: {
                    email: email,
                    password: password,
                },
                attributes: ['name'],
            });
            if (user) {
                req.session.loggedin = true;
                req.session.name = user.name;
                req.session.role = "user";
                return res.redirect('/userpage');
            }
            else return res.render('login', { succ: 'Please Enter Correct Credentials!' });
        }
    } catch (err) {
        console.error(err);
    }
});



app.get('/adduser', (req, res) => {
    if (req.session.loggedin) {
        res.render('useradd', { exists: "" });
    }
    else res.redirect('/login');

});



app.post('/adduser', async (req, res) => {
    let validationResult = validateUser(req.body);
    if (validationResult.error) {
        return res.status(400).send(validationResult.error.message);
    }
    const { email, password, name, role } = req.body;
    try {
        let UserModel;
        if (role === 'user') {
            UserModel = User;
        } else UserModel = Admin;

        const existingUser = await UserModel.findOne({
            where: {
                email: email,
            },
            attributes: ['name'],
        });

        if (existingUser) {
            return res.render('useradd', {
                exists: 'User already exists with this email id in this role',
            });
        } else {
            await UserModel.create({
                name: name,
                email: email,
                password: password,
            });
            return res.redirect('/adminpage');
        }
    } catch (err) {
        console.error(err);
        return res.status(500).send('Internal Server Error');
    }
});



app.get('/editblog', async (req, res) => {
    if (req.session.loggedin) {
        try {
            const blogs = await Blog.findAll();
            res.render('editblog', { data: blogs, name: req.session.name });
        } catch (err) {
            console.error(err);
            return res.status(500).send('Internal Server Error');
        }
    } else {
        res.redirect('/login');
    }
});

app.post('/editblog',upload.single("imgurl"), async (req, res) => {
    const { title, des, id } = req.body;
    console.log(req.body.id);
    let iurl;
    if(req.file)iurl=`uploads\\${req.file.filename}`;

    try {
        const blog = await Blog.findByPk(id);
        if (blog) {
            blog.title = title;
            blog.des = des;
            if(req.file)blog.imgurl = iurl;
            await blog.save();
            return res.redirect('/editblog');
        } else {
            console.log(`Blog with id ${id} not found.`);
            return res.status(404).send('Blog not found');
        }
    } catch (err) {
        console.error(err);
        return res.status(500).send('Internal Server Error');
    }
});



app.post('/deleteblog',upload.single(), async (req, res) => {
    const id = req.body.id;
    try {
        const blog = await Blog.findByPk(id);
        if (blog) {
            await blog.destroy();
            return res.redirect('/editblog');
        } else {
            console.log(`Blog with id ${id} not found.`);
            return res.status(404).send('Blog not found');
        }
    } catch (err) {
        console.error(err);
        return res.status(500).send('Internal Server Error');
    }
});


app.get('/addblog', (req, res) => {
    if (req.session.loggedin) {
        res.render('addblog');
    }
    else res.redirect('/login');
})


app.post('/addblog', upload.single("imgurl"),async (req, res) => {
    const { title, des, catg } = req.body;
    let iurl=`uploads\\${req.file.filename}`;
    try {
        await Blog.create({
            title: title,
            des: des,
            imgurl:iurl,
            category: catg,
        });
        return res.redirect('/editblog');
    } catch (err) {
        console.error(err);
        return res.status(500).send('Internal Server Error');
    }
});


app.get('/userpage', async (req, res) => {
    if (req.session.loggedin && req.session.role === 'user') {
        try {
            const blogs = await Blog.findAll();
            res.render('userpage', { data: blogs, name: req.session.name });
        } catch (err) {
            console.error(err);
            return res.status(500).send('Internal Server Error');
        }
    } else {
        res.redirect('/login');
    }
});

app.post('/deleteuser', async (req, res) => {
    const { id, role } = req.body;

    try {
        let UserModel;
        if (role === 'user') {
            UserModel = User;
        }
        else UserModel = Admin;

        const user = await UserModel.findByPk(id);
        if (user) {
            await user.destroy();
            return res.redirect('/adminpage');
        } else {
            console.log(`User with id ${id} not found.`);
            return res.status(404).send('User not found');
        }
    } catch (err) {
        console.error(err);
        return res.status(500).send('Internal Server Error');
    }
});


app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
})


app.get('/category', async (req, res) => {
    const catg = req.query.catg;

    try {
        const blogs = await Blog.findAll({
            where: {
                category: catg,
            },
        });
        res.render('category', { data: blogs });
    } catch (err) {
        console.error(err);
        return res.status(500).send('Internal Server Error');
    }
});


app.listen(port, () => {
    console.log("Listening");
})