var PORT = process.env.PORT || 8080; // default port 8080

var express = require("express");
const methodOverride = require('method-override');
const bcrypt = require('bcrypt');
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

var app = express();
app.set ('view engine','ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride('_method'));
app.use(cookieParser());


var cookieSession = require('cookie-session')
app.use(cookieSession({
  name: 'session',
  keys: ["user_id"],
}));



//Function to check whether a user exists in the User database
function doesUserExist(specificUser) {
  if(specificUser === undefined){
    return 0;
  } else {
    for(user in users){
      if(users[user].user_id === specificUser.user_id){
        return 1;
      }
    }
  }
  return 0;
}

//Function to generate a random user ID
function generateRandomString() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 6; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}


//Checks if the username and encrypted password are a perfect match
function matchEmailPassword(email, password){
  for(let user in users){
    console.log(bcrypt.compareSync(password, users[user]["password"]));
    if(users[user]["email"] === email && bcrypt.compareSync(password, users[user]["password"])) {
      return true
    }
  }
  return false
}

//To access the user of a particular email, when passed that email
function userViaEmail(email) {
  for(let user in users) {
    if(users[user]["email"] === email) {
      return users[user];
    }
  }
}

//To check if the shortURL was created by the user accessing it
function shortURLAuth(user, shortURL){
  if(urlDatabase[shortURL].user_id === user){
    return true;
  }
  return false;
}

//Returns an object containing shortUrls corresponding to the user_id
function relevantURL(user_id) {
  let tempObject = {};
  for(let shortURLS in urlDatabase){
    if(urlDatabase[shortURLS].user_id === user_id.user_id) {
      tempObject[shortURLS] = urlDatabase[shortURLS];
    }
  }
  return tempObject; //This is the resulting object
}



function hasEmailBeenTaken(email){
  let taken = false
  for(let user in users){
    if(users[user].email === email){
      taken = true;
      return taken;
    }
  }
  return taken;
}

//--------------------------------------------------


let urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    "user_id": "userRandomID",
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    "user_id": "userRandomID",
  }
};


//Defining a global Users Object
const users = {
  "userRandomID": {
    user_id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    user_id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
}


//--------------------------------------------------

app.get("/", (req, res) => {

  let user = req.session.user_id;
  if(!user) {
    res.redirect("/login");
  } else {
    res.redirect("/urls");
  }

});

//Displaying the database when .json is asked for
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//Sample endpoint
app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

//*******************************************************************************

//GET Request to display all URLs
app.get('/urls', function(req, res) {

  let user = req.session.user_id;

  if( !doesUserExist(user)){
    templateVars = 0;
    console.log("Please enter valid information");
  } else {
    let listOfURLs = relevantURL(user);
    console.log(listOfURLs);
    templateVars = listOfURLs;
  }
  res.render("urls_index", {
    flag: templateVars,
    user: user
  });

});

//From the urls_new.ejs - When a new URL needs to be added via a form
app.get("/urls/new", function (req, res) {

  let user = req.session.user_id;
  if (!doesUserExist(user)) {
    res.redirect("/login"); //Make the user login if they aren't already
  } else {
    res.render("urls_new", {
      user: user,
      flag: 1, //Flag to show that the user is logged in
    });
  }

});

//To handle Short URL requests - Redirect to its corresponding LongURL
app.get("/u/:shortURL", (req, res) => {

  let user = req.session.user_id;

  if(urlDatabase[req.params.shortURL]) {

    res.redirect(urlDatabase[req.params.shortURL].longURL);
    return;
  } else {
    res.statusCode = 404;
    res.send("ERROR 404 - No Link found");
    return;
    }

});

//GET Request to update a URL
app.get("/urls/:id", function (req, res) {

  let user = req.session.user_id;
  if(doesUserExist(user)){
    if(shortURLAuth(user.user_id, req.params.id)){
      console.log("has authority to add short URL link")
      let templateVars = {
        shortURL: req.params.id,
        longURL: urlDatabase[req.params.id].longURL
      };

      res.render("urls_show",{
        user : user,
        urlsHolder: templateVars,
        flag: 1
      })
    } else{
        console.log("Not authorized to add shortURL");
        res.redirect("/login");
    }

  } else{
    res.statusCode = 403;
    res.send("You are not logged in");
  }

});

//GET request for a new login page - urls_login.ejs
app.get("/login", function(req, res) {

  let user = req.session.user_id;
  console.log(user);
  if(doesUserExist(user)){
    templateVars = 1;
  } else {
    templateVars = 0;
  }
  res.render("urls_login",{
    user: user,
    flag: templateVars
  });

});

//Register end point for User Registration
app.get("/register", function(req, res) {

  console.log("Get request received to the register page");
  let user = req.session.user_id;
  res.render("urls_reg",{
    user:user,
    flag: 1
  });

});

//---------------------------------------------------------------------------------------------------------------

//POST request to Register page -

app.post("/register", function(req, res) {

  console.log("The user is using the register page");
  let email = req.body.email;
  let password = req.body.password;
  if(hasEmailBeenTaken(email) || email == "" || password == ""){
    res.statusCode=400;
    res.send("Please register with valid parameters");
  } else {
    let user_id = generateRandomString();
    users[user_id] = {
      user_id: user_id,
      email: email,
      password: bcrypt.hashSync(password, 10) //Using hash sync feature
    }

    req.session.user_id = userViaEmail(email);
    //res.cookie("user_id", userViaEmail(email));
    res.redirect("/urls");
  }

});

//POST request to urlDatabase a new short and long URL (new entry)
app.post("/urls", function (req, res) {

  let id = generateRandomString();
  let user = req.session.user_id;

  if(doesUserExist(user)){

    urlDatabase[id] = {
      longURL : req.body.longURL,
      user_id: user.user_id
    }

    console.log("---------Updated database ----- ", urlDatabase);
    res.redirect("/urls");

  } else {
    res.redirect("/login") //Force user to login if they haven't already
  }

});

//POST Request to handle the login with username
app.post("/login", function (req, res) {

  if(!matchEmailPassword(req.body.email, req.body.password)){
    res.statusCode=403;
    res.send("The email and password do not match");

  } else {
    // res.cookie("user_id", userViaEmail(req.body.email))
    req.session.user_id = userViaEmail(req.body.email);
    res.redirect("/urls");
  }

});

//POST Request to handle the logout if username already exists
app.post("/logout", function (req, res) {
  //console.log("Logout function being accessed");

  req.session.user_id = undefined;
  console.log("The user is logging out");
  res.redirect("/urls");

});

//Setting the user_id and longURL property for a given shortURL in the urlDatabase
//Need to adjust for userauthorisation
app.put("/urls/:id", function(req, res) {

  let user = req.session.user_id;
  if (!doesUserExist(user)) {
    res.redirect("/login"); //Force user to login if they haven't already

  } else if (shortURLAuth(user.user_id, req.params.id)){ //Check if user has access to shortURL
        urlDatabase[req.params.id]["longURL"] =req.body.newlongURL;
        console.log("LongURL is: ", req.body.newlongURL);
        res.redirect("/urls");
    } else {
        res.statusCode=401;
        res.send("Not authorized to this shortURL");
      }

});


//POST Request to delete a URL
app.delete("/urls/:id", function (req, res) {

  let user = req.session.user_id;

  if(!user){

    res.redirect("/login"); //Force user to login if they haven't already

  } else if(shortURLAuth(user.user_id, req.params.id)){

    delete urlDatabase[req.params.id] //Only delete if user has authority to shortURL
    res.redirect("/urls");

  } else {
    res.statusCode=401;
    res.send("Not authorized to this shortURL"); //If user is logged in but NOT authorized
  }

  // delete urlDatabase[req.params.id];
  // res.redirect("/urls");

});










//Listening to the appropriate PORT
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});