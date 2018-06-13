var express       =   require('express');
var app           =   express();
const bodyParser  =   require("body-parser");
var PORT          =   8080;


app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');


var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};


function generateRandomString() {
  return Math.floor((1 + Math.random()) * 0x1000000).toString(16).substring(1);
}


// HOME
app.get('/', (req, res) => {
  res.render('home')
});


// DATABASE URLS
app.get('/urls', (req, res) => {
  let templateVars = {urls: urlDatabase};
  res.render('urls_index', templateVars);
});


// NEW URLS
app.get('/urls/new', (req, res) => {
  res.render("urls_new");
});



// POST URLS
app.post('/urls', (req, res) => {
  let shortURL = generateRandomString();
  let longURL = req.body.longURL
  urlDatabase[shortURL] = longURL
  res.redirect('/urls')
});


// SHOW URL
app.get('/urls/:id', (req, res) => {
  let shortURL = req.params.id;
  let longURL =  urlDatabase[req.params.shortURL];
  let templateVars = {
    shortURL: shortURL,
    longURL: longURL
  }
  res.render('urls_show', templateVars);
});


// REDIRECT TO LONG URL
app.get('/u/:shortURL', (req, res) => {
  let shortURL = req.params.id;
  let longURL = urlDatabase[req.params.shortURL];
  let redirect;
  if (!longURL.includes('http')){
    redirect = 'http://' + urlDatabase[req.params.shortURL];
  } else {
    redirect = urlDatabase[req.params.shortURL];
  }
  res.redirect(redirect);
});


// DELETE URL
app.post('/urls/:id/delete', (req, res) => {
  let shortURL = req.params.id;
  delete urlDatabase[shortURL]
  res.redirect('/urls')

})

// ***********************************************************************

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

