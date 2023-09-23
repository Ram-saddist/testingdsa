const express = require("express");
const path = require("path");
const collection = require("./config");
const bookCollection = require("./bookConfig")
const bcrypt = require('bcrypt');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const flash = require('connect-flash');
const nodemailer = require('nodemailer');
const ejs = require('ejs');
const connectDB = require("./db"); // Import the database connection function
const { createHmac } = require("crypto");
// Call the connectDB function to establish the database connection
connectDB();
const app = express();

// convert data into JSON format
app.use(express.json());
app.set('view engine', 'ejs');

// Static file
app.use(express.static("public"));

app.use(express.urlencoded({ extended: false }));

// Use EJS as the view engine
app.set("view engine", "ejs");

// Use sessions for user authentication
app.use(session({
  secret: 'your-secret-key', // Change this to a secure secret key
  resave: false,
  saveUninitialized: true
}));

// Initialize Passport and session middleware
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
const { sendOTP } = require('./otp-service'); // Implement this module


// Configure Passport
require('./passport-config')(passport);

// Define the isLoggedIn middleware
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    // If the user is authenticated, store user info in res.locals
    res.locals.user = req.user;
    next();
  } else {
    res.locals.user = null;
    next();
  }
}

// Routes

app.get("/", isLoggedIn, (req, res) => {
  res.render("index", { user: res.locals.user });
});


app.get("/terms", isLoggedIn, (req, res) => {
  res.render("terms", { user: res.locals.user });
});

app.get("/refunds", isLoggedIn, (req, res) => {
  res.render("refunds", { user: res.locals.user });
});



app.get("/booking", isLoggedIn, async (req, res) => {
  try {
    const bookings = await bookCollection.find();
    
    const bookingList = [];
bookings.forEach(item => {
  bookingList.push({date:item.date,timeslot:item.timeslot});
});

    res.render("booking", { user: res.locals.user, bookingList});
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bookings', error: error.message });
  }
});

app.post("/booking", async (req, res) => {
  const data = {
    email: req.body.email,
    date: req.body.date,
    timeslot: req.body.timeSlot,
    price: req.body.price
  }
  try {

    const newBook = new bookCollection(data);
    await newBook.save();
    res.json({ redirectTo: '/about' });
  } catch (error) {
    console.error("Error in signup:", error);
    console.error("Attempted data:", data);
    req.flash('error', 'An error occurred during signup. Please try again.');
    return null;
  }
})

app.get("/privacy", isLoggedIn, (req, res) => {
  res.render("privacy", { user: res.locals.user });
});

app.get("/about", isLoggedIn, (req, res) => {
  res.render("about", { user: res.locals.user });
});

app.get("/games", isLoggedIn, (req, res) => {
  res.render("games", { user: res.locals.user });
});

app.get("/cancellation", isLoggedIn, (req, res) => {
  res.render("cancellation", { user: res.locals.user });
});

app.get("/signup", (req, res) => {
  res.render("signup", { user: res.locals.user });
});

app.post("/signup", async (req, res) => {
  const data = {
    email: req.body.username,
    password: req.body.password,
    phone_number: req.body.phone_number,
    firstname: req.body.firstname
  }
  // Check if the username already exists in the database
  const existingUser = await collection.findOne({ email: data.email });
  console.log("existing user", existingUser)
  if (existingUser) {
    console.log("existing user function logic")
    // User already exists, redirect to signup page with a flash message
    req.flash('error', 'User already exists. Please choose a different username.');
    res.redirect("/signup");
  } else {
    // Hash the password using bcrypt
    const saltRounds = 10; // Number of salt rounds for bcrypt
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);

    data.password = hashedPassword; // Replace the original password with the hashed one

    // Create a new user document
    try {
      // Your existing code

      // Create a new user document
      const newUser = new collection(data);
      console.log("newuser in try block", newUser)
      await newUser.save();

      // Redirect to the login page
      return res.redirect("/login");
    } catch (error) {
      console.error("Error in signup:", error);
      console.error("Attempted data:", data);
      req.flash('error', 'An error occurred during signup. Please try again.');
      return res.redirect("/signup");
    }

    // Redirect to the login page
    return res.redirect("/login");
  }
});

app.get("/login", (req, res) => {
  res.render("login");
});

// Login user 
app.post("/login", passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/signup',
  failureFlash: true
}));


//logout user
app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error("Error logging out:", err);
    }
    res.redirect("/login"); // Redirect to the login page after logging out
  });
});

//email-auth
const otp = Math.floor(100000 + Math.random() * 900000);
app.post('/send-email', async (req, res) => {
  try {
    // Generate a random OTP (e.g., a 6-digit number)

    const email = req.body.email;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'raghuveer@codegnan.com', // Your Gmail email address
        pass: 'dfkofuklqzcgxbzo' // Your Gmail password
      }
    });

    const mailOptions = {
      from: 'raghuveer@codegnan.com', // Sender address
      to: `${email}`, // Recipient address
      subject: 'Test Email from Node.js', // Subject line
      html: `
          <html>
            <body>
              <h1>Hello, John Doe</h1>
              <p>Your OTP is: <strong>${otp}</strong></p>
            </body>
          </html>
        `
    };

    // Send email
    await transporter.sendMail(mailOptions);

    // Send the generated OTP back to the frontend as JSON
    res.status(200).json({ generatedOTP: otp });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).send('An error occurred while sending the email.');
  }
});

//otp validating on page submission
app.post('/validate-otp', (req, res) => {
  const enteredOTP = req.body.otp;
  const generatedOTP = req.body.generatedOTP;

  // Perform OTP validation on the server
  if (enteredOTP === generatedOTP) {
    res.status(200).send('OTP is valid!');
  } else {
    res.status(400).send('Invalid OTP. Please try again.');
  }
});

/* */
app.get("/forgot-password", (req, res) => {
  res.render("forgot-password");
});

app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  const user = await collection.findOne({ email: email });
  console.log("from forget password route", email, user)
  if (!user) {
    res.status(404).send("User with this email not found");
  }

  const { otp, fullHash } = generateOtp(email);

  try {
    const subject = "Reset password";
    const text = `
                  <html>
                    <body>
                      <h1>Hello, ${user.email}</h1>
                      <p>Your OTP is: <strong>${otp}</strong></p>
                    </body>
                  </html>`;

    const msg = { from: "max@arleven.com", to: email, subject, text };
    await transport.sendMail(msg);
  } catch (error) {
    console.error(error);
  }

  Object.assign(user, {
    hash: fullHash,
  });

  await user.save();

  res.redirect(`/reset-password?email=${email}`);
});




const generateOtp = (email) => {
  const otp = Math.floor(100000 + Math.random() * 900000);
  const ttl = 5 * 60 * 1000;
  const expires = Date.now() + ttl;
  const hash = generateOtpHash(email, otp, expires);
  const fullHash = `${hash}.${expires}`;

  return {
    otp,
    fullHash,
  };
};

const host = "smtp.gmail.com";
const userhost = "raghuveer@codegnan.com";
const passhost = "dfkofuklqzcgxbzo";

const transport = nodemailer.createTransport({
  host,
  port: 587,
  auth: {
    user: userhost,
    pass: passhost,
  }
});

transport
  .verify()
  .then(() => console.log("Connected to email server"))
  .catch(() =>
    console.error(
      "Unable to connect to email server. Make sure you have configured the SMTP options right"
    )
  );

const aVeryLongSafeString =
  "874410ea46e7a92edcffd67911d1819c3d36ab93f00cc3de6f05ade3083a89a316f8d3207d86518f72f845a2ff771a92b98ef6fb233e48391b654240219b45ec";

const generateOtpHash = (email, otp, expires) => {
  const data = `${email}.${otp}.${expires}`;
  return createHmac("sha256", aVeryLongSafeString).update(data).digest("hex");
};

const verifyOtp = (hash, email, otp) => {
  console.log("from verify otp", hash)
  const [hashValue, expires] = hash.split(".");
  const now = Date.now();

  if (now > parseInt(expires, 10)) {
    return {
      error: "OTP Expired",
    };
  }

  const expiresAt = Number(expires);

  const newCalculatedHash = generateOtpHash(email, otp, expiresAt);
  console.log("from verify otp function hashvalue and newcalculated", newCalculatedHash, hashValue)
  if (newCalculatedHash !== hashValue) {
    return {
      error: "Incorrect OTP",
    };
  }
};




app.get("/reset-password", (req, res) => {
  const { email } = req.query;
  res.render("reset-password", { email });
});

app.post("/reset-password", async (req, res) => {
  const { email, otp, password } = req.body;
  const user = await collection.findOne({ email: email });

  if (!user) {
    res.status(404).send("No user found with this email");
  }

  const status = verifyOtp(user.hash, email, otp);

  if (status && status.error) {
    return res.status(400).json(status.error);
  }

  const saltRounds = 10; // Number of salt rounds for bcrypt
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  Object.assign(user, {
    hash: "",
    password: hashedPassword,
  });

  await user.save();

  res.redirect("/login");
});
/* */

// Define Port for Application
const port = 5000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
