require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const nodemailer = require('nodemailer');
const cool = require('cool-ascii-faces');
const ejs = require("ejs");
const { hostname } = require("os");

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"));

const dbUrl = process.env.MONGODB_URI;
mongoose.connect(dbUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB cluster');
}).catch((error) => {
  console.log('Error connecting to MongoDB cluster:', error.message);
});


const AppointmentSchema = new mongoose.Schema({
  user: {
    name: String,
    surname: String,
    email: String,
    phone: String,
  },
  appointment: {
    date: Date,
    service: String,
    location: String,
  }
});


const Appointment = mongoose.model('Appointment', AppointmentSchema);

app.get('/cool', (req, res) => res.send(cool()));
app.get("/", function(req, res) {
	res.render("home");
});

app.get("/booking", (req, res) => {
    res.render("booking");
});

app.get("/contact-us", (req, res) => {
  res.render("contact-us");
})
app.get("/success", (req, res) => {
    res.render("success");
})
app.get("/login", (req, res) => {
  res.render("login");
})
app.get("/appointments", (req, res) => {
  res.render("/appointments");
})
app.post("/login", (req, res) => {
  Appointment.findOne({email: req.user.email}, function (err, appointment) {
    if (err) {
      console.log(err.message);
      res.sendStatus(500);
    } else if (!appointment) {
      res.status(401).send("Invalid email address");
    } else {
      res.render("/appointments");
    }
  });
})
app.post("/success", (req, res) => {
  res.render("success");
});
app.post('/booking', (req, res) => {
   
  // Saving new user data in database
  const newAppointment = new Appointment({
      user: {
        name: req.body.name,
        surname: req.body.surname,
        email: req.body.userEmail,
        phone: req.body.phone
      },
      appointment: {
        date: req.body.appointDate,
        service: req.body.service,
        location:  req.body.location
      }
    });
      
      newAppointment.save()
        .then(savedAppointment => {
          console.log('Saved appointment:', savedAppointment);
        })
        .catch(error => {
          console.error('Error saving appointment:', error);
        });


    // Sending an email to the customer with their appointment details
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD
    }
  });


  // Creating new email
  let emailContent = {
    from: `Eric Edger ${process.env.EMAIL}`,
    to: newAppointment.user.email,
    subject: 'Your Appointment Booking Confirmation',
    text: `Dear ${newAppointment.user.name},

        This email is to confirm your appointment on ${newAppointment.appointment.date}.

        Thank you for choosing our service.

        Best regards,
        Appointment Booking Team`
  };

  transporter.sendMail(emailContent, function(error, info){
    if (error) {
      console.log(error);
      return;
    } else {
      console.log('Email sent: ' + info.messageId);
    }
  });

  res.render("success");

});
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Appointment booking server listening on port ${port}`);
});

