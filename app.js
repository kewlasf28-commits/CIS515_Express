const express = require("express");
const ejs=require("ejs");
const app = express();

app.set("view engine", "ejs");
app.engine("ejs",ejs.renderFile);
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

module.exports = app;