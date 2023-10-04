const express = require("express");
const collection = require("./config");
const bookCollection = require("./bookConfig");
const bcrypt = require("bcrypt");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");
const flash = require("connect-flash");
const nodemailer = require("nodemailer");
const ejs = require("ejs");
const connectDB = require("./db"); // Import the database connection function
const { createHmac } = require("crypto");
// Call the connectDB function to establish the database connection
connectDB();
const app = express();

// convert data into JSON format
app.use(express.json());
app.set("view engine", "ejs");

// Static file
app.use(express.static("public"));

app.use(express.urlencoded({ extended: false }));

// Use EJS as the view engine
app.set("view engine", "ejs");

// Use sessions for user authentication
app.use(
  session({
    secret: "your-secret-key", // Change this to a secure secret key
    resave: false,
    saveUninitialized: true,
  })
);

// Initialize Passport and session middleware
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
const otp = Math.floor(100000 + Math.random() * 900000);
const host = "smtp.gmail.com";
const userhost = "sivaram@codegnan.com";
const passhost = "iqhakdyilcqvbojb";
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


const transport = nodemailer.createTransport({
  host,
  port: 587,
  auth: {
    user: userhost,
    pass: passhost,
  },
});

transport
  .verify()
  .then(() => console.log("Connected to email server"))

const aVeryLongSafeString =
  "874410ea46e7a92edcffd67911d1819c3d36ab93f00cc3de6f05ade3083a89a316f8d3207d86518f72f845a2ff771a92b98ef6fb233e48391b654240219b45ec";

const generateOtpHash = (email, otp, expires) => {
  const data = `${email}.${otp}.${expires}`;
  return createHmac("sha256", aVeryLongSafeString).update(data).digest("hex");
};

const verifyOtp = (hash, email, otp) => {
  const [hashValue, expires] = hash.split(".");
  const now = Date.now();

  if (now > parseInt(expires, 10)) {
    return {
      error: "OTP Expired",
    };
  }

  const expiresAt = Number(expires);

  const newCalculatedHash = generateOtpHash(email, otp, expiresAt);
  if (newCalculatedHash !== hashValue) {
    return {
      error: "Incorrect OTP",
    };
  }
};

// Configure Passport
require("./passport-config")(passport);

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
  //res.render("index", { user: res.locals.user, toastrSuccessMessage: req.flash("login Succesful")[0], });
  if (req.query.from === "login") {
    res.render("index", {
      user: res.locals.user,
      toastrSuccessMessage: "Login succesful",
    });
  } else {
    res.render("index", {
      user: res.locals.user,
      toastrSuccessMessage: "",
    });
  }
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
    bookings.forEach((item) => {
      bookingList.push({ date: item.date, timeslot: item.timeslot });
    });

    res.render("booking", {
      user: res.locals.user,
      bookingList,
      Bookingsucess: "Booking successful",
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching bookings", error: error.message });
  }
});

app.post("/booking", async (req, res) => {
  const data = {
    email: req.body.email,
    date: req.body.date,
    timeslot: req.body.timeSlot,
    price: req.body.price,
  };
  try {
    const newBook = new bookCollection(data);
    await newBook.save();
    res.json({ redirectTo: "/slotbooked?from=booking" });
  } catch (error) {
    req.flash("error", "An error occurred during signup. Please try again.");
    return null;
  }
});

app.get("/about", isLoggedIn, (req, res) => {
  res.render("about", { user: res.locals.user });
});

app.get("/privacy", isLoggedIn, (req, res) => {
  res.render("privacy", { user: res.locals.user });
});

app.get("/slotbooked", isLoggedIn, (req, res) => {
  if (req.query.from === "booking") {
    res.render("slotbooked", {
      user: res.locals.user,
      toastrBookingMessage: "Booking successful",
    });
  } else {
    res.render("slotbooked", {
      user: res.locals.user,
      toastrBookingMessage: "", // You can set a default value here if needed
    });
  }
});

app.get("/games", isLoggedIn, (req, res) => {
  res.render("games", { user: res.locals.user });
});

app.get("/cancellation", isLoggedIn, (req, res) => {
  res.render("cancellation", { user: res.locals.user });
});

app.get("/signup", (req, res) => {
  if (req.query.from === "login") {
    res.render("signup", {
      user: res.locals.user,
      toastrErrorMessage: "Login failed",
    });
  } else {
    res.render("signup", {
      user: res.locals.user,
      toastrErrorMessage: "Register first to login",
    });
  }
});

app.post("/signup", async (req, res) => {
  const data = {
    email: req.body.username,
    password: req.body.password,
    phone_number: req.body.phone_number,
    firstname: req.body.firstname,
  };
  // Check if the username already exists in the database
  const existingUser = await collection.findOne({ email: data.email });
  if (existingUser) {
    // User already exists, redirect to signup page with a flash message
    req.flash(
      "error",
      "User already exists. Please choose a different username."
    );
    //res.redirect("/signup", { flashMessage: req.flash("error")[0] });
    return res.redirect("/signup?from=exist")
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
      await newUser.save();

      // Redirect to the login page
      return res.redirect("/login");
    } catch (error) {
      req.flash("error", "An error occurred during signup. Please try again.");
      return res.redirect("/signup");
    }
  }
});

app.get("/login", (req, res) => {
  if (req.query.from === "signup") {
    res.render("login", {
      user: res.locals.user,
      toastrLoginMessage: "Register successful",
    });
  } else if (req.query.from === "logout") {
    res.render("login", {
      user: res.locals.user,
      toastrLoginMessage: "Logout successful",
    });
  } else if (req.query.from === "reset") {
    res.render("login", {
      user: res.locals.user,
      toastrLoginMessage: "Reset password successfully",
    });
  } else {
    res.render("login", {
      user: res.locals.user,
      toastrLoginMessage: "Login to access home page",
    });
  }
});

// Login user
app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/?from=login",
    failureRedirect: "/signup?from=login",
    failureFlash: true,
  })
);

//logout user
app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
  
    }
    res.redirect("/login?from=logout"); // Redirect to the login page after logging out
  });
});

//email-auth

app.post("/send-email", async (req, res) => {
  try {
    // Generate a random OTP (e.g., a 6-digit number)
    const email = req.body.email;
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "sivaram@codegnan.com", // Your Gmail email address
        pass: "iqhakdyilcqvbojb", // Your Gmail password
      },
    });
    const text=`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Registration Confirmation</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0 auto;
                max-width: 600px;
                padding: 20px;
                background-color: rgba(206, 238, 255, 0.5);
            }
            h1 {
                text-align: center;
            }
            img {
                display: block;
                margin: 0 auto;
                max-width: 100%;
            }
            .otp {
                color: #323596;
                font-weight: bold;
                font-size: 30px;
            }
        </style>
    </head>
    <body>
        <h1>Welcome to Doctors Sports Academy</h1>
        <p>Greetings from Doctors Sports Academy We are thrilled to have received your
            registration. Get ready to showcase your sportsmanship and camaraderie on the field!
        </p>
        <p>Your One-Time Password (OTP) for registration is:<span class="otp"><strong> ${otp} </strong></span></p>
        
        <p>Warm regards,</p>
        <p>Doctors Sports Academy</p>
    </body>
    </html>
      `
    const mailOptions = {
      from: "sivaram@codegnan.com", // Sender address
      to: email, // Recipient address
      subject: "Registration Confirmation", // Subject line
      html:text
    };

    // Send email
    await transporter.sendMail(mailOptions);

    // Send the generated OTP back to the frontend as JSON
    res.status(200).json({ generatedOTP: otp });
  } catch (error) {
    console.log("An error occurred while sending the email.");
  }
});

//otp validating on page submission
app.post("/validate-otp", (req, res) => {
  const enteredOTP = req.body.otp;
  const generatedOTP = req.body.generatedOTP;

  // Perform OTP validation on the server
  if (enteredOTP === generatedOTP) {
    res.status(200).send("OTP is valid!");
  } else {
    console.log("Invalid OTP. Please try again.");
  }
});


app.get("/forgot-password", (req, res) => {
  console.log("req.query.from",req.query.from)
  if(req.query.from==="invalidemail"){
    console.log("invalid")
    res.render("forgot-password",{
      invalid: "User with this email not found",
    })
  }
  else{
    res.render("forgot-password",{
      invalid: null,
    });
  }
  
});

app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  const user = await collection.findOne({ email: email });
  if (!user) {
   return res.redirect("/forgot-password?from=invalidemail")
  }

  const { otp, fullHash } = generateOtp(email);

  try {
    const subject = "Reset password";
    const text = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0 auto;
                max-width: 600px;
                padding: 20px;
                background-color: #f4f4f4;
            }
            h1 {
                text-align: center;
                color: #333;
            }
            p {
                color: #555;
            }  
        </style>
    </head>
    <body>
        <!-- Replace the image URL below with your own image URL -->
        <!-- <div class="image-container">
            <img src="https://i.ytimg.com/vi/wq13sUIMWB0/maxresdefault.jpg" width="40%" alt="Password Reset Image" />
        </div> -->
        <h1>Password Reset</h1>
        <p>Hello,</p>
        <p>We received a request to reset your password. Please click on the link below to reset your password:</p>
        <p>Your OTP is: <strong>${otp}</strong></p>
        <p>Best regards,</p>
        <p>Your Support Team</p>
    </body>
    </html>              
    `;

    const msg = { from: "sivaram@codegnan.com", to: email, subject, html:text };
    await transport.sendMail(msg);
  } catch (error) {
  }

  Object.assign(user, {
    hash: fullHash,
  });

  await user.save();

  res.redirect(`/reset-password?email=${email}`);
});



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

  res.redirect("/login?from=reset");
});
/* */




// Define Port for Application
const port = 8080;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
