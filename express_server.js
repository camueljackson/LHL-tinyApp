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


const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};


// ***********************************************************************

function generateRandomString() {
  return Math.floor((1 + Math.random()) * 0x1000000).toString(16).substring(1);
}


function findUser(email) {
  for (user in users) {
    if (email === users[user].email) {
      return users[user]
    }
  }
}

// ***********************************************************************


//LOGIN
app.get('/login', (req, res) => {
  let templateVars = {
     user: users[req.cookies['user_id']]
    }
  res.render('login', templateVars);
});


// POST TO LOGIN
app.post('/login', (req, res) => {
  email     = req.body.email;
  password  = req.body.password;
  let user  = findUser(email);
  if (user) {
    if (email === user.email) {
    res.cookie('user_id', user.id)
    }
  } else {
    res.send('NO!')
  }
  res.redirect('urls');
});


// LOGOUT
app.post('/logout', (req, res) => {
  let user = users[req.cookies['user_id']]
  req.cookies['user_id'];
  res.clearCookie("user_id");
  res.redirect('urls')
})


// REGISTER
app.get('/register', (req, res) => {
  res.render('register');
});


// POST REGISTER
app.post('/register', (req, res) => {
  if (!req.body.email) {
    res.status(400).send('Please enter an email');
  } else if (!req.body.password) {
    res.status(400).send('Please enter a password');
 } else {
      for (let user in users) { //access DB
        if (req.body.email === users[user].email) {
          res.status(400).send('email in use');

        } else {
          let user_id = generateRandomString();
              users[user_id] = {
              id: user_id,
              email: req.body.email,
              password: req.body.password
          }
          res.cookie("user_id", users[user_id].id);
        }
      }
    }
res.redirect('urls')
}); // end of register


// HOME
app.get('/', (req, res) => {
  let templateVars = {
    user: users[req.cookies['user_id']]
  }
  res.render('home', templateVars)
});


// INDEX URLS
app.get('/urls', (req, res) => {
  let templateVars  = {
    urls: urlDatabase,
    user: users[req.cookies['user_id']]
  };
  res.render('urls_index', templateVars);
});


// POST URLS
app.post('/urls', (req, res) => {
  let shortURL  = generateRandomString();
  let longURL   = req.body.longURL
  urlDatabase[shortURL] = longURL
  res.redirect('/urls');
});


// NEW URLS
app.get('/urls/new', (req, res) => {
  let templateVars = {
    user: users[req.cookies['user_id']]
  }
  res.render("urls_new", templateVars);
});


// UPDATE URL (SHOW)
app.post('/urls/:id', (req, res) => {
  let shortURL  = req.params.id;
  let longURL   = req.body.longURL;
  urlDatabase[shortURL] = longURL;
  res.redirect('/urls');
});


// SHOW URL
app.get('/urls/:id', (req, res) => {
  let shortURL  = req.params.id;
  let longURL   =  urlDatabase[shortURL];
  let templateVars = {
    shortURL: shortURL,
    longURL: longURL,
    user: users[req.cookies['user_id']]
  };
  res.render('urls_show', templateVars);
});


// REDIRECT TO LONG URL
app.get('/u/:shortURL', (req, res) => {
  let shortURL  = req.params.id;
  let longURL   = urlDatabase[req.params.shortURL];
  let redirect;
  if (!longURL.includes('http')){
    redirect = 'http://' + urlDatabase[req.params.shortURL];
  } else {
    redirect = urlDatabase[req.params.shortURL];
  };
  res.redirect(redirect)
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