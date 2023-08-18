const express=require('express');
const con=require("./config/db.js");
var cookieParser=require('cookie-parser');
var session=require('express-session');
const app=express();
const port=3000;
app.set('view engine', 'ejs');

app.use(express.urlencoded({
    extended: true
}))
app.use(express.json());
app.use(express.static('public'));

app.use(cookieParser());

app.use(
    session({
        key:'user_sid',
        secret:'asecretkey',
        resave:false,
        saveUninitialized:false,
        cookie:{
            expires:86400000
        }
    })      
)

app.use(function (req, res, next) {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    next()
});

var sessionCheck=(req,res,next)=>{
    if(req.session.loggedin){
        res.redirect(`/${req.session.role}page`);
    }
    else next();
}

app.get('/',(req,res)=>{
    let sql = 'SELECT * FROM blogs';
    con.query(sql,(err, result)=>{
        if (err) console.log(err);
        else res.render('index',{data:result});
    });
})

app.get('/adminpage',(req,res)=>{
    if(req.session.loggedin && req.session.role=='admin'){
        let sql = 'SELECT * FROM user';
        let sql2= 'SELECT * FROM admin';
        con.query(sql,(err, result)=>{
            if (err) console.log(err);
            else {
                con.query(sql2,(err, result2)=>{
                    if (err) console.log(err);
                    else res.render('adminpage',{admindata:result2,userdata:result,name:req.session.name});
                });
            }
        });
    }
    else res.redirect('/login');
})

app.get('/login',sessionCheck,(req,res)=>{
    res.render('login',{succ:""});
})

app.post('/login',(req, res) => {
    let email = req.body.email;
    let password = req.body.password;
    let role=req.body.role;
    let sql = `SELECT name FROM ${role} WHERE email = ? AND password = ?`;
    con.query(sql, [email,password],(err, result)=>{
        if (err) console.log(err);
        if(result.length){
            req.session.loggedin=true;
            req.session.name=result[0].name;
            req.session.role=role;
            if(role=='admin'){
                return res.redirect('/adminpage');
            }
            else{
                return res.redirect('/userpage');        
            }
        }
        else{
            return res.render('login',{succ:'Please Enter Correct Credentials!'});
        }
      });
  });

app.get('/adduser',(req,res)=>{
    if(req.session.loggedin){
        res.render('useradd',{exists:""});
    }
    else res.redirect('/login');

});
app.post('/adduser',(req,res)=>{
    let email = req.body.email;
    let password = req.body.password;
    let name=req.body.name;
    let role=req.body.role;
    let sql = `SELECT name FROM ${role} WHERE email = ?`;
    con.query(sql, [email],(err, result)=>{
        if (err) console.log(err);
        if(result.length)res.render('useradd',{exists:"User already exists with this email id in this role"});        
        else{
            let q=`Insert Into ${role}(name,email,password) Values (?,?,?)`;
            con.query(q,[name,email,password],(er)=>{
                if (er) console.log(er);
                else res.redirect('/adminpage');
            })
        }
      });
})
app.get('/editblog',(req,res)=>{
    if(req.session.loggedin){
        let sql = 'SELECT * FROM blogs';
        con.query(sql,(err, result)=>{
            if (err) console.log(err);
            else res.render('editblog',{data:result,name:req.session.name});
        });
    }
    else res.redirect('/login');
});

app.post('/editblog',(req,res)=>{
    let t=req.body.title;
    let d=req.body.des;
    let img=req.body.imgurl;
    let b=req.body.id;
    console.log(req.body);
    let sql = 'UPDATE blogs SET title= ? , des= ? , imgurl= ? WHERE bid= ?;';
    con.query(sql,[t,d,img,b],(err,result)=>{
        if (err) console.log(err);
        else{   
            res.redirect('/editblog');
        }
    });
})
app.post('/deleteblog',(req,res)=>{
    let b=req.body.id;
    let sql = 'DELETE FROM blogs WHERE bid= ?;';
    con.query(sql,[b],(err)=>{
        if (err) console.log(err);
        else{   
            res.redirect('/editblog');
        }
    });
})

app.get('/addblog',(req,res)=>{
    if(req.session.loggedin){
        res.render('addblog');
    }
    else res.redirect('/login');
})
app.post('/addblog',(req,res)=>{
    let t=req.body.title;
    let d=req.body.des;
    let img=req.body.imgurl;
    let catg=req.body.catg;
    let q='Insert Into blogs(title,des,imgurl,category) Values (?,?,?,?)';
    con.query(q,[t,d,img,catg],(er)=>{
        if (er) console.log(er);
        else res.redirect('/editblog');
    })
})

app.get('/userpage',(req,res)=>{
    if(req.session.loggedin && req.session.role=='user'){
        let sql = 'SELECT * FROM blogs';
        con.query(sql,(err, result)=>{
            if (err) console.log(err);
            else res.render('userpage',{data:result,name:req.session.name});
        });
    }
    else res.redirect('/login');
})

app.post('/deleteuser',(req,res)=>{
    let id=req.body.id;
    let role=req.body.role;
    let sql = `DELETE FROM ${role} WHERE id= ?;`;
    con.query(sql,[id],(err)=>{
        if (err) console.log(err);
        else{   
            res.redirect('/adminpage');
        }
    });
})

app.get('/logout',(req,res)=>{
    req.session.destroy();
    res.redirect('/');
})

app.get('/category',(req,res)=>{
    let catg=req.query.catg;
    let sql = 'SELECT * FROM blogs where category=?';
    con.query(sql,[catg],(err, result)=>{
        if (err) console.log(err);
        else res.render('category',{data:result});
    });
    
})

app.post('/upgrade',(req,res)=>{
    let id=req.body.id;
    let role=req.body.role;
    let sql = `DELETE FROM ${role} WHERE id= ?;`;
    con.query(sql,[id],(err)=>{
        if (err) console.log(err);
        else{   
            res.redirect('/adminpage');
        }
    });
})
app.listen(port,()=>{
    console.log("Listening");
})