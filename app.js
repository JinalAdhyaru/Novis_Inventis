const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// mongoose.connect("mongodb://localhost:27017/blogDB", {useUnifiedTopology: true ,useNewUrlParser: true });

app.get("/", function(req,res) {
    res.render("index");
});

app.get("/services", function(req,res) {
    res.render("services");
});

app.get("/blog", function(req,res) {
    res.render("blog");
});

app.get("/portfolio", function(req,res) {
    res.render("portfolio");
});

app.get("/contact", function(req,res) {
    res.render("contact");
});


app.listen(3000, function() {
    console.log("Server started on port 3000");
});