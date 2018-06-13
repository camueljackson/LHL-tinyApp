const express       =   require('express');
const app           =   express();
const bodyParser    =   require("body-parser");
const cookieParser  =   require('cookie-parser');
const PORT          =   8080;


// ***********************************************************************

app.use(cookieParser())
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');

// ***********************************************************************

var urlDatabase   = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// ***********************************************************************

function generateRandomString() {
  return Math.floor((1 + Math.random()) * 0x1000000).toString(16).substring(1);
}

// ***********************************************************************


// LOGIN

app.post('/login', (req, res) => {
  let {username} = req.body;
  res.cookie("username", username)
  let templateVars = {
    username: req.cookies["username"]
  }
  res.redirect('/urls').render(templateVars)
});


// LOGOUT
app.post('/logout', (req, res) => {
  let username = req.body.username;
  res.clearCookie("username", username);
  res.redirect('/urls')
})


// HOME
app.get('/', (req, res) => {
  let templateVars = {
    username: req.cookies["username"]
  }
  res.render('home', templateVars)
});


// INDEX URLS
app.get('/urls', (req, res) => {
  let templateVars  = {
    urls: urlDatabase,
    username: req.cookies["username"]
  };
  res.render('urls_index', templateVars);
});


// POST URLS
app.post('/urls', (req, res) => {
  let shortURL  = generateRandomString();
  let longURL   = req.body.longURL
  urlDatabase[shortURL] = longURL
  res.redirect('/urls').render(templateVars);
});


// NEW URLS
app.get('/urls/new', (req, res) => {
  let templateVars = {
    username: req.cookies["username"]
  }
  res.render("urls_new", templateVars);
});


// UPDATE URL (SHOW)
app.post('/urls/:id', (req, res) => {
  let shortURL  = req.params.id;
  let longURL   = req.body.longURL;
  urlDatabase[shortURL] = longURL;
  res.redirect('/urls').render(templateVars)
});


// SHOW URL
app.get('/urls/:id', (req, res) => {
  let shortURL  = req.params.id;
  let longURL   =  urlDatabase[shortURL];
  let templateVars = {
    shortURL: shortURL,
    longURL: longURL,
    username: req.cookies["username"]

  };
  res.render('urls_show', templateVars);
});


// REDIRECT TO LONG URL
app.get('/u/:shortURL', (req, res) => {
  let shortURL  = req.params.id;
  let longURL   = urlDatabase[req.params.shortURL];
  let redirect;
  let templateVars = {
    username: req.cookies["username"]
  }
  if (!longURL.includes('http')){
    redirect = 'http://' + urlDatabase[req.params.shortURL];
  } else {
    redirect = urlDatabase[req.params.shortURL];
  };
  res.redirect(redirect).render(templateVars)
});


// DELETE URL
app.post('/urls/:id/delete', (req, res) => {
  let shortURL  = req.params.id;
  delete urlDatabase[shortURL]
  res.redirect('/urls')
});


// ***********************************************************************

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});









