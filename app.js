const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const path = require('path')
const truncate = require('truncate-html');
const _ = require('lodash');
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportlocalMongoose = require("passport-local-mongoose");
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false    
}));

app.use(passport.initialize());
app.use(passport.session());
//mongodb URI
const url = 'mongodb://localhost:27017/imagesDB'
const conn = mongoose.createConnection(url, ({useUnifiedTopology: true, useNewUrlParser: true}));

//initialize gridfs
let gfs;

conn.once('open', () => {
    //initialize stream
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads')
  });

//Create Storage engine
const storage = new GridFsStorage({
  url: url,
  options: {useUnifiedTopology: true},
  file: (req, file) => {
    return new Promise((resolve, reject) => {     
        // const filename = buf.toString('hex') + path.extname(file.originalname);
        const fileInfo = {
          filename: file.originalname,
          bucketName: 'uploads'
        };
        resolve(fileInfo);      
    });
  }
});

const upload = multer({ storage });


mongoose.connect("mongodb://localhost:27017/projectTestDB", {useUnifiedTopology: true ,useNewUrlParser: true });
mongoose.set("useCreateIndex",true);

const userSchema = new mongoose.Schema ({
  email: String,
  password: String,
  secret: String
});

userSchema.plugin(passportlocalMongoose);
const User = new mongoose.model("User",userSchema);
passport.use(User.createStrategy());

passport.serializeUser(function(user, done){
    done(null,user.id);
});

passport.deserializeUser(function(id,done){
    User.findById(id,function(err,user){
        done(err,user);
    });
});

const awardSchema = {
    name: String,
    description: String
  };
  
const Award = mongoose.model("Award",awardSchema);

const categorySchema = {
  name: String,
  title: String,
  content: String
}

const Category = mongoose.model("Category",categorySchema);

const postSchema = {
  title: String,
  content: String
};

const Post = mongoose.model("Post",postSchema);

const contactSchema = {
  name: String,
  email: String,
  subject: String,
  message: String
}

const Contact = mongoose.model("Contact",contactSchema);

const ideaSchema = {
  name: String,
  idea: String
}

const Idea = mongoose.model("Idea",ideaSchema);

app.get("/", function(req,res) {
    res.render("index");
});

app.get("/imageAward", function(req,res) {
  res.render("imageAward");
});

app.get("/imageCategory", function(req,res) {
  res.render("imageCategory");
});

app.get("/services", function(req,res) {
  Post.find({},function(err,posts) {
    if(!err) {
    res.render("services",{ posts: posts });
    } 
  });
});

app.get("/posts/:postId", function(req, res){
  const requestedTitle = _.lowerCase(req.params.postName);
  const requestedPostId = req.params.postId;

  Post.findOne({_id: requestedPostId}, function(err,post){
    res.render("post",{
      title: post.title,
      content: post.content
    })
  });
});

app.get('/image/:filename' , (req, res) =>{
  gfs.files.findOne({filename : req.params.filename}, (err, file) =>{
      // Check if file exists at all
      if( !file || file.length === 0){
          return res.status(404).json({
              err : 'File dosent exists'
          })
      }
      if(file.contentType === 'image/jpeg' || file.contentType === 'image/png'){
          const readstream = gfs.createReadStream(file.filename);
          readstream.pipe(res);
      }else{
          res.status(404).json({
              err : 'Not an image....'
          })
      }
  })
})

app.get("/awards", function(req,res) {
  Award.find({},function(err,awards) {
    if(!err) {
     gfs.files.find().toArray((err, files) =>{
      // Check if files exists at all
      if( !files || files.length === 0){
        res.render("awards", {files : false,awards: awards})
      }else{
          files.map(file =>{
              if(file.contentType === 'image/jpeg' || file.contentType === 'image/png'){
                  file.isImage = true;
              }else{
                  file.isImage = false;
              }
          })
          res.render("awards", {files : files,awards: awards})
      }
  })      
    }
  });
});

app.get("/categories", function(req,res) {
  Category.find({},function(err,categories) {
    if(!err) {
      gfs.files.find().toArray((err, files) =>{
        // Check if files exists at all
        if( !files || files.length === 0){
          res.render("categories", {files : false,categories: categories})
        }else{
            files.map(file =>{
                if(file.contentType === 'image/jpeg' || file.contentType === 'image/png'){
                    file.isImage = true;
                }else{
                    file.isImage = false;
                }
            })
            res.render("categories", {files : files,categories: categories})
        }
    })      
    } 
  });
});

app.get("/login", function(req,res){
  res.render("login");
});

app.get("/register",function(req,res){
  res.render("register");
});

app.get("/logout",function(req,res){
  req.logout();
  res.redirect("/");
});


app.get("/changes", function(req,res){
   if(req.isAuthenticated()){
  res.render("changes");
    }
    else {
        res.redirect("/login");
    }
});

app.get("/contact", function(req,res) {
    res.render("contact");
});

  app.get("/compose", function(req,res) {  
    if(req.isAuthenticated()){
      res.render("compose");
  }
  else {
      res.redirect("/login");
  }  
  });

  app.get("/update", function(req,res) {    
    if(req.isAuthenticated()){
      res.render("update");
  }
  else {
      res.redirect("/login");
  }
  });

  app.get("/delete", function(req,res) {    
    if(req.isAuthenticated()){
      res.render("delete");
  }
  else {
      res.redirect("/login");
  }
  });

  app.get("/category/:categoryId", function(req, res){
    const requestedName = _.lowerCase(req.params.categoryName);
    const requestedCategoryId = req.params.categoryId;  
    Category.findOne({_id: requestedCategoryId}, function(err,category){
      gfs.files.find().toArray((err, files) =>{
        // Check if files exists at all
        if( !files || files.length === 0){
          res.render("Category", {files : false,name: category.name,
            title: category.title,
            content: category.content})
        }else{
            files.map(file =>{
                if(file.contentType === 'image/jpeg' || file.contentType === 'image/png'){
                    file.isImage = true;
                }else{
                    file.isImage = false;
                }
            })
            res.render("Category", {files : files,title: category.title, content: category.content})
          }
      })         
    })    
  });
 

  app.post("/register",function(req,res){
    User.register({username: req.body.username}, req.body.password, function(err,user){
        if(err){
            console.log(err);
            res.redirect("/register");
        }
        else {
            passport.authenticate("local")(req ,res, function(){
                res.redirect("/changes");
            });
        }
    });
});

app.post("/login",function(req,res){
  const user = new User ({
      username: req.body.username,
      password: req.body.password
  });
  req.login(user, function(err){
      if(err){
          console.log(err);
      }
      else {
          passport.authenticate("local")(req,res,function(){
              res.redirect("/changes");
          });
      }
  });
});


app.post("/contact",function(req,res) {
  const contact = new Contact ({
    name: req.body.name,
    email: req.body.email,
    subject: req.body.subject,
    message: req.body.message
  });
  contact.save(function(err){
    if(!err) {
      console.log("Stored successfully");
    }
  }); 
});

app.post("/ideas",function(req,res) {
  const idea = new Idea ({
    name: req.body.name,
    idea: req.body.idea
  });
  idea.save(function(err){
    if(!err) {
      console.log("Stored successfully");
    }
  }); 
});


 app.post("/changes",upload.single('file'),function(req,res){
    if(req.isAuthenticated()){
    res.render("changes");
  }
  else {
      res.redirect("/login");
  }
  });

  app.post("/composeAward", upload.single('file'),function(req,res){
    const award = new Award ({
      name: req.body.awardName,
      description: req.body.awardDescription
    });
    award.save(function(err){
      if(!err) {
        res.redirect("/changes");
      }
    }); 
  });

  app.post("/composeCategory",upload.single('file'), function(req,res){
    const category = new Category ({
      name: req.body.categoryName,
      title: req.body.categoryTitle,
      content: req.body.categoryContent
    });
    console.log(req.body.categoryName);
    category.save(function(err){
      if(!err) {
        res.redirect("/changes");
      }
    }); 
  });

  app.post("/composeBlog", function(req,res){
    const post = new Post ({
      title: req.body.postTitle,
      content: req.body.postBody
    });
    post.save(function(err){
      if(!err) {
        res.redirect("/changes");
      }
    }); 
  });

  app.post("/updateBlog",function(req,res){
    Post.updateOne({title: req.body.postTitle}, {content: req.body.postBody}, function(err){
      if(err) {
        console.log(err);
      }
      else {
        res.redirect("/changes");
      }
    })    
});

app.post("/deleteBlog", function(req,res) {
  Post.deleteOne({title: req.body.postTitle}, function(err) {    
    if(err) throw err;
    res.redirect('/changes');
  });
});


app.post("/updateAwardDesc",function(req,res){
    Award.updateOne({name: req.body.awardName}, {description: req.body.awardDescription}, function(err){
      console.log(req.body.awardName);
      if(err) {
        console.log(err);
      }
      else {
        res.redirect("/changes");
      }
    })    
});

app.post("/updateAwardImage",upload.single('file'),function(req,res){
  const name = req.body.NameOfTheAward + ".jpg";
  console.log(name);
  gfs.files.findOne({filename : name}, (err, file) =>{
    // Check if file exists at all
    console.log(file);
    if( !file || file.length === 0){
        console.log("There was no image");
        console.log(file);
        res.render("changes");
    }
    else {
      gfs.remove({ _id: file._id, root: 'uploads' }, (err, gridStore) => {
        if (err) {
          console.log(err);
        }        
        console.log("deleted successfully");
        res.render("changes");
      });    
    }
  })        
});



app.post("/updateCategoryContent", function(req,res){
    Category.updateOne({title: req.body.categoryTitle}, {content: req.body.categoryContent}, function(err){
      if(err) {
        console.log(err);
      }
      else {
        res.redirect("/changes");
      }
    })
});

app.post("/updateCategoryImage",upload.single('file'),function(req,res){
  const name = req.body.title + ".jpg";
  console.log(name);
  gfs.files.findOne({filename : name}, (err, file) =>{
    // Check if file exists at all
    console.log(file);
    if( !file || file.length === 0){
        console.log("There was no image");
        console.log(file);
        res.render("changes");
    }
    else {
      gfs.remove({ _id: file._id, root: 'uploads' }, (err, gridStore) => {
        if (err) {
          console.log(err);
        }        
        console.log("deleted successfully");
        res.render("changes");
      });    
    }
  })        
});  

app.post("/deleteAward", function(req,res) {
    Award.deleteOne({name: req.body.awardName}, function(err) {    
      if(err) {
        console.log(err);
      } 
      else {
        const name = req.body.awardName + ".jpg";
        gfs.files.findOne({filename : name}, (err, file) =>{
          // Check if file exists at all
          if( !file || file.length === 0){
              console.log("There was no image");
          }
          else {
            gfs.remove({ _id: file._id, root: 'uploads' }, (err, gridStore) => {
              if (err) {
                console.log(err);
              }        
              res.redirect('/changes');
            });    
          }
      })        
      }
    });
});

app.post("/deleteCategory", function(req,res) {
    Category.deleteOne({title: req.body.categoryTitle}, function(err) { 
        if(err) {
          console.log(err);
        } 
        else {
          const name = req.body.categoryTitle + ".jpg";
          gfs.files.findOne({filename : name}, (err, file) =>{
            // Check if file exists at all
            if( !file || file.length === 0){
                console.log(err);
            }
            else {
              gfs.remove({ _id: file._id, root: 'uploads' }, (err, gridStore) => {
                if (err) {
                  console.log(err);
                }        
                res.redirect('/changes');
              });    
            }
        })        
        }
    });
});
  
app.listen(3000, function() {
    console.log("Server started on port 3000");
});