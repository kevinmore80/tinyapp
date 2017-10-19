var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080
app.set ('view engine','ejs');

//Including the body-parser middleware
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

//Including the bookie-parser middleware
const cookieParser = require("cookie-parser");
app.use(cookieParser());

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
  "Y43Vb2": "http://www.reddit.com",
  "b0N12x": "http://www.espn.com"
};

function generateRandomString() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 6; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}


//-----------------------------

app.get("/", (req, res) => {
  res.end("Hello!");
});

//Displaying the database when .json is asked for
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//Sample endpoint
app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

//********************************************

//From the urls_new.ejs - When a new URL needs to be added via a form
app.get("/urls/new", function (req, res) {

  let templateVars = {
    urlHolder: urlDatabase,
    username: req.cookies["username"]
  };
  res.render("urls_new", templateVars); //automatically looks in Views folder
  //res.redirect(301, "/urls");
});


//From the urls_show.ejs - Pick out a shortURL from the database object
app.get("/urls/:id", function(req, res) {
  let templateVars = {

    urlHolder: urlDatabase,
    shortURL: req.params.id,
    username: req.cookies["username"]
  };
  res.render("urls_show", templateVars);
});

//To handle Short URL requests - Redirect to its corresponding LongURL
app.get("/u/:shortURL", (req, res) => {
  var myShortURL = req.params.shortURL;
  let handleURL = req.params.shortURL.slice(1);
  res.redirect( 301, urlDatabase[handleURL] );

});

//From the urls_index.ejs - The Index location for URLs
app.get('/urls', function(req, res) {

  let templateVars = {

    urlHolder: urlDatabase,
    username: req.cookies["username"]
  };
  res.render("urls_index", templateVars);
});
//************************************************************************

//POST Request to delete a URL
app.post("/urls/:id/delete", function (req, res) {

  let urlToDelete = req.params.id.toString();
  delete urlDatabase[urlToDelete];
  res.redirect(301,"/urls");

});

//POST Request to update a URL
app.post("/urls/:id", function (req, res) {
  var idToUpdate = req.params.id;
  let urlToUpdate = req.body.longURL;
  urlDatabase[idToUpdate] = urlToUpdate;
  res.redirect(301,"/urls");

});

//To add to urlDatabase a new short and long URL (new entry)
app.post("/urls", function (req, res) {
  let randVal = generateRandomString();
  urlDatabase[randVal] = req.body.longURL;
  console.log(req.body.longURL);
  res.redirect(301,req.body.longURL);
});



//****************************************************

//POST Request to handle the login with username

app.post("/login", function (req, res) {
  console.log("Login username function being accessed");

  res.cookie('username', req.body.username);
  console.log(req.body.username);
  res.redirect(301,"/urls");

});

//POST Request to handle the logout if username already exists

app.post("/logout", function (req, res) {
  console.log("Logout function being accessed");

  res.clearCookie('username');
  res.redirect(301,"/urls");

});

//Listening to the appropriate post
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});