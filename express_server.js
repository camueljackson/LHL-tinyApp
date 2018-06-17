 const express       =   require('express');
const app           =   express();
const bodyParser    =   require("body-parser");
const cookieParser  =   require('cookie-parser');
const PORT          =   8080;
const bcrypt        =   require('bcrypt');

// ***********************************************************************

app.use(cookieParser())
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');




// ***********************************************************************

var urlDatabase   = {
  "b2xVn2" : {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "userRandomID"
  }
};

// ***********************************************************************


const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("purple-monkey-dinosaur", 10)
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("dishwasher-funk", 10)
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


  if (user) {
    if ((user.email === email) && (bcrypt.compareSync(password, user.password))) {
      res.cookie('user_id', user.id);
      res.redirect('urls');
    } else {
      res.send('Incorrect password!');
    }
  } else {
    res.send('Email not in the database, please register!')
  }
});


//LOGIN
app.get('/login', (req, res) => {
let templateVars = {
  userID: '',
  user: ''
}
if (!req.cookies['user_id']) {
  res.render('login', templateVars);

  } else {
     templateVars = {
      userID: req.cookies['user_id'].id,
      user: req.cookies['user_id']
      }
    res.render('login', templateVars);
  }
});



// LOGOUT
app.post('/logout', (req, res) => {
  let user = req.cookies['user_id'];
  req.cookies['user_id'];
  res.clearCookie("user_id");
  res.redirect('/')
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
              password: bcrypt.hashSync(req.body.password, 10)
          }
          res.cookie("user_id", users[user_id]);
        }
      }
    }
res.redirect('urls')
}); // end of register


// HOME
app.get('/', (req, res) => {
let templateVars = {
  userID: '',
  user: ''
}
if (!req.cookies['user_id']) {
  res.render('home', templateVars);

  } else {
     templateVars = {
      userID: req.cookies['user_id'].id,
      user: req.cookies['user_id']
      }
    res.render('home', templateVars);
  }
});


// INDEX URLS
app.get('/urls', (req, res) => {
  let templateVars = {
    userID: '',
      user: ''
  }
  if (!req.cookies['user_id']) {
    res.render('login', templateVars);

    } else {
      let userID = req.cookies['user_id'].id
      let filterUrls = urlsForUser(userID);
       templateVars = {
        urls: filterUrls,
        userID: req.cookies['user_id'].id,
        user: req.cookies['user_id']
        }
      res.render('urls_index', templateVars);
    }
});


// POST URLS
app.post('/urls', (req, res) => {
  let shortURL  = generateRandomString();
  let longURL   = req.body.longURL
  urlDatabase[shortURL] = {
    longURL: longURL,
    userID: req.cookies['user_id'].id,
    user: req.cookies['user_id']
  };
  res.redirect('/urls');
});


// NEW URLS
app.get('/urls/new', (req, res) => {
let templateVars = {
    userID: '',
      user: ''
  }
  if (!req.cookies['user_id']) {
    res.render('login', templateVars);

    } else {
      let userID = req.cookies['user_id'].id;
      let filterUrls = urlsForUser(userID);
       templateVars = {
        urls: filterUrls,
        userID: req.cookies['user_id'].id,
        user: req.cookies['user_id']
        }
      res.render('urls_new', templateVars);
    }



});


// UPDATE URL (SHOW)
app.post('/urls/:id', (req, res) => {
  let shortURL  = req.params.id;
  let longURL   = req.body.longURL;
  let userID = req.cookies['user_id'].id;
  let user = req.cookies['user_id'];

   if (userID ===  urlDatabase[shortURL].userID) {
      urlDatabase[shortURL] = {
        shortURL: shortURL,
        longURL: longURL,
        userID: req.cookies['user_id'].id
      }
        res.redirect('/urls')
    } else {
      res.send(403, 'Cannot UPDATE')
    }
});


// SHOW URL
app.get('/urls/:id', (req, res) => {
  let userID = req.cookies['user_id'].id;
  let user = req.cookies['user_id'];
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
  let userID = req.cookies['user_id'].id;
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