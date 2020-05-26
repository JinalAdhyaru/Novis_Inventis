const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const truncate = require('truncate-html');
const _ = require('lodash');
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportlocalMongoose = require("passport-local-mongoose");

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

app.get("/", function(req,res) {
    res.render("index");
});

app.get("/services", function(req,res) {
    res.render("services");
});

app.get("/blog", function(req,res) {
    Award.find({},function(err,awards) {
        if(!err) {
        res.render("blog",{
            awards: awards
        });
        } 
      });
});

app.get("/portfolio", function(req,res) {
  Category.find({},function(err,categories) {
    if(!err) {
    res.render("portfolio",{
      categories: categories
    });
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
      res.render("Category",{
          name: category.name,
          title: category.title,
          content: category.content
      })
    });  
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
            console.log("User found");
              res.redirect("/changes");
          });
          console.log("No user found");
      }
  });
});


 app.post("/changes",function(req,res){
    if(req.isAuthenticated()){
      res.render("changes");
  }
  else {
      res.redirect("/login");
  }
  });

  app.post("/composeAward", function(req,res){
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

  app.post("/composeCategory", function(req,res){
    const category = new Category ({
      name: req.body.categoryName,
      title: req.body.categoryTitle,
      content: req.body.categoryContent
    });
    category.save(function(err){
      if(!err) {
        res.redirect("/changes");
      }
    }); 
  });

  app.post("/updateAward", function(req,res){
    Award.updateOne({name: req.body.awardName}, {description: req.body.awardDescription}, function(err){
      if(err) {
        console.log(err);
      }
      else {
        res.redirect("/changes");
      }
    })
  });

  app.post("/updateCategory", function(req,res){
    Category.updateOne({title: req.body.categoryTitle}, {content: req.body.categoryContent}, function(err){
      if(err) {
        console.log(err);
      }
      else {
        res.redirect("/changes");
      }
    })
  });


  app.post("/deleteAward", function(req,res) {
    Award.deleteOne({name: req.body.awardName}, function(err) {
      if(err) {
        console.log(err);
      }
      else {
        res.redirect("/changes");
      }
    });
  });

  app.post("/deleteCategory", function(req,res) {
    Category.deleteOne({title: req.body.categoryTitle}, function(err) {
      if(err) {
        console.log(err);
      }
      else {
        res.redirect("/changes");
      }
    });
  });
  
app.listen(3000, function() {
    console.log("Server started on port 3000");
});