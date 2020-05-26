const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const truncate = require('truncate-html');
const _ = require('lodash');
const mongoose = require("mongoose");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/projectTestDB", {useUnifiedTopology: true ,useNewUrlParser: true });

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

app.get("/contact", function(req,res) {
    res.render("contact");
});

  app.get("/compose", function(req,res) {    
    res.render("compose");
  });

  app.post("/composeAward", function(req,res){
    const award = new Award ({
      name: req.body.awardName,
      description: req.body.awardDescription
    });
    award.save(function(err){
      if(!err) {
        res.redirect("/");
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
        res.redirect("/");
      }
    }); 
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

app.listen(3000, function() {
    console.log("Server started on port 3000");
});