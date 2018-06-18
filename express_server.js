const express       =   require('express');
const app           =   express();
const bodyParser    =   require("body-parser");
const PORT          =   8080;
const bcrypt        =   require('bcrypt');
const cookieSession =   require('cookie-session');

// ***********************************************************************

app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');
app.use(cookieSession({
  name: 'session',
  keys: ['My name is Bryan, I like to skateboard'],
  maxAge: 24 * 60 * 60 * 1000
}));

// ***********************************************************************

//URL Database
var urlDatabase   = {
  "b2xVn2" : {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID"
  }
};

// ***********************************************************************

//USER Database
const users = {
  "me@me.ca": {
    id: "userRandomID",
    email: "me@me.ca",
    password: bcrypt.hashSync("pass", 10)
  }
};

// ***********************************************************************


// Helper function to generate random string, used for creating userIDs upon registration and shortURLs
function generateRandomString() {
  return Math.floor((1 + Math.random()) * 0x1000000).toString(16).substring(1);
}


// Helper function which loops through users DB and returns the user object associated with the email entered at login
function findUser(email) {
  for (user in users) {
    if (email === users[user].email) {
      return users[user]
    }
  }
}


// Helper function wwhich loops through the urlDatabase and returns an object containing the urls associated with the used IDs
function urlsForUser(userID) {
  let returnObj = {};

  for (const shortURL in urlDatabase) {
    if (userID === urlDatabase[shortURL].userID) {
      returnObj[shortURL] = urlDatabase[shortURL]
    }
  }
  return returnObj;
}


// ***********************************************************************


// POST TO LOGIN
app.post('/login', (req, res) => {
  let email     = req.body.email;
  let password  = req.body.password;
  let user      = findUser(email);
// Uses the findUser helper function, creating 'user' object to check against req.body. If user exists and credentials match, initiate cookie session.
if (user) {
    if ((user.email === email) && (bcrypt.compareSync(password, user.password))) {   // checking if user DB email matches the req.body email, and comapres hashed password with req.body hashed PW
      req.session.user_id = user.id;
      res.redirect('urls');
    } else {
      res.send('Incorrect password!');
    }
  } else {
    res.send('Email not in the database, please register!');
  }
});


//LOGIN
// Empty templateVars declared so as to prevent the "not declared" error (if there cookies are not declared when pages is rendered).
app.get('/login', (req, res) => {
  let templateVars = {
    userID: '',
    user: ''
  }
// if no session, render login page with _header showing the login details
if (!req.session.user_id) {
  res.render('login', templateVars);
// if SESSION, _header shows "welcome, user.email"
} else {
 templateVars = {
  userID: req.session.user_id.id,
  user: req.session.user_id
}
res.render('login', templateVars);
}
});


// LOGOUT (Clearing Cookie Session)
app.post('/logout', (req, res) => {
  req.session.user_id;
  req.session = null;
  res.redirect('/')
})


// REGISTER
app.get('/register', (req, res) => {
  res.render('register');
});


// POST REGISTER
app.post('/register', (req, res) => {
// Ensuiring both email and PW fields are filled in
if (!req.body.email) {
  res.status(400).send('Please enter an email');
} else if (!req.body.password) {
  res.status(400).send('Please enter a password');
} else {
      // Access first-level key in DB object (if req.body fileds match user details from DB -> then email in use)
      for (let user in users) {
        if (req.body.email === users[user].email) {
          res.status(400).send('Email already in use.  Please chose a different email.');
      //  If both fields are filled in, create user object and assign it a personal ID with generateRandomString function
    } else {
      let user_id = generateRandomString();
      users[user_id] = {
        id: user_id,
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password, 10)
      }
      req.session.user_id = users[user_id];
    }
  }
}
res.redirect('urls');
}); // end of register


// HOME
app.get('/', (req, res) => {
  let templateVars = {
    userID: '',
    user: ''
  }
  if (!req.session.user_id) {
    res.render('home', templateVars);
  } else {
   templateVars = {
    userID: req.session.user_id.id,
    user: req.session.user_id
  }
  res.render('home', templateVars);
}
});


// INDEX URLS
// (Redirected here after successul registration and login, and after a URL is submitted or updated/delete)
app.get('/urls', (req, res) => {
  let templateVars = {
    userID: '',
    user: ''
  }
// If visitor not logged in, redirect to login page.  If logged in -> show that user's URL DB
  if (!req.session.user_id) {
    res.render('login', templateVars);
  } else {
    let userID = req.session.user_id.id;
// Using urlsForUser function to return the userID's urlDB object (and therefore associated URLs)
    templateVars = {
      urls: urlsForUser(userID),
      userID: req.session.user_id.id,
      user: req.session.user_id
    }
    res.render('urls_index', templateVars);
  }
});


// POST URLS
app.post('/urls', (req, res) => {
  let shortURL  = generateRandomString();
  let longURL   = req.body.longURL;
// Updating URL DB with new shortened URL and all other necessary info
  urlDatabase[shortURL] = {
    longURL: longURL,
    userID: req.session.user_id.id,
    //user: req.session.user_id
  };
  res.redirect('/urls');
});


// NEW URLS
// (Page which takes in a new longURL to be shortened and sends it to the /urls endpoint)
app.get('/urls/new', (req, res) => {
  let templateVars = {
    userID: '',
    user: ''
  }
// If a visitor is not logged in, redirected to login page
  if (!req.session.user_id) {
    res.render('login', templateVars);
  } else {
    let userID = req.session.user_id.id;
    let filterUrls = urlsForUser(userID);
    templateVars = {
      urls: filterUrls,
      userID: req.session.user_id.id,
      user: req.session.user_id
    }
    res.render('urls_new', templateVars);
  }
});


// POST - SHOW INDIVIDUAL SHORT URL INFO
app.post('/urls/:id', (req, res) => {
  let shortURL  = req.params.id;
  let longURL   = req.body.longURL;
  let userID    = req.session.user_id.id;
  let user      = req.session.user_id;
// Checking if there is a cookie and if it is associated with the ID of the user which created the short/long URL.  If so, render all the info
  if (userID ===  urlDatabase[shortURL].userID) {
    urlDatabase[shortURL] = {
      shortURL: shortURL,
      longURL: longURL,
      userID: req.session.user_id.id
    }
    res.redirect('/urls')
  } else {
    res.send(403, 'Cannot UPDATE')
  }
});


// GET - SHOW INDIVIDUAL SHORT URL INFO
// (Page which shows the short URL and has a form for updating the associated long URL (which posts to /urls))
app.get('/urls/:id', (req, res) => {
  let userID = req.session.user_id.id;
  let user = req.session.user_id;
  urlsForUser(userID)
  let shortURL  = req.params.id;
  let longURL   =  urlDatabase[shortURL].longURL;
  let templateVars = {
    shortURL: shortURL,
    longURL: longURL,
    userID: userID,
    user: user
  };
  res.render('urls_show', templateVars);
});


// REDIRECT TO LONG URL
app.get('/u/:shortURL', (req, res) => {
  let shortURL  = req.params.id;
  let longURL   = urlDatabase[req.params.shortURL].longURL;
  let redirect;
  // Making sure the URL can be accessed with our without the user adding 'HTTP' to their URL
  if (!longURL.includes('http')) {
    console.log('TESSST. ', 'http://' + urlDatabase[req.params.shortURL].longURL)
    redirect = 'http://' + longURL;
  } else {
    redirect = longURL;
  };
  res.redirect(redirect)
});


// DELETE URL
app.post('/urls/:id/delete', (req, res) => {
  let shortURL  = req.params.id;
  let userID = req.session.user_id.id;
  if (userID ===  urlDatabase[shortURL].userID) {
    delete urlDatabase[shortURL]
    res.redirect('/urls')
  } else {
    res.send(403, 'Cannot delete')
  }
});


// ***********************************************************************

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});