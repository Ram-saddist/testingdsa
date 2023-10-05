const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const collection = require('./config'); // Import your User model

module.exports = function (passport) {
    // Serialize user object to store in the session
    passport.serializeUser((user, done) => {
        done(null, user._id);
    });
    console.log(collection)
    // Deserialize user from the session
    passport.deserializeUser((id, done) => {
        collection.findById(id)
            .then(user => {
                done(null, user); // Pass the user to the next middleware
            })
            .catch(err => {
                done(err, null); // Pass the error to the next middleware
            });
    });
    
    passport.use(new LocalStrategy(async (username, password, done) => {
        try {
            // Check if the credentials match admin
            if (username === 'admin@gmail.com' && password === 'admin123') {
                let user={
                    firstname:"admin",
                    email:"admin@gmail.com",
                    password:"admin123",
                    phone_number:7780190248,
                    hash:'',
                }
                return done(null, user);
            }
    
            const user = await collection.findOne({ email: username });
            if (!user) {
                return done(null, false, { message: "User not found" });
            }
    
            const isPasswordMatch = await bcrypt.compare(password, user.password);
            if (!isPasswordMatch) {
                return done(null, false, { message: "Wrong password" });
            }
    
            return done(null, user);
        } catch (error) {
            return done(error);
        }
    }));
    



    // Define the local strategy for username and password authentication
    /*passport.use(new LocalStrategy(async (username, password, done) => {
        try {
            const user = await collection.findOne({ email: username });
            if (!user) {
                return done(null, false, { message: "User not found" });
            }

            const isPasswordMatch = await bcrypt.compare(password, user.password);
            if (!isPasswordMatch) {
                return done(null, false, { message: "Wrong password" });
            }

            return done(null, user);
        } catch (error) {
            return done(error);
        }
    }));*/

};
