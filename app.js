import dotenv from "dotenv";
dotenv.config();
import path from "path";
const __dirname = path.resolve();
import express from "express";
import ejs from "ejs";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import notifier from "node-notifier";
import session from "express-session";
import passport from "passport";
import passportLocalMongoose from "passport-local-mongoose";

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(
  "mongodb+srv://" +
    process.env.MDBUSERNAME +
    ":" +
    process.env.MDBPASSWORD +
    "@cluster0.tuathop.mongodb.net/portfolioDB?retryWrites=true&w=majority",
  { useNewUrlParser: true }
);

const expertiseSchema = new mongoose.Schema({
  classType: String,
  headingTxt: String,
  paraTxt: String,
});
const Expertise = new mongoose.model("Expertise", expertiseSchema);

const projectSchema = new mongoose.Schema({
  classType: String,
  headingTxt: String,
  siteLink: String,
  gitLink: String,
  skillList: Array,
  paraTxt: String,
  paraTxtShort: String,
});
const Project = new mongoose.model("Project", projectSchema);

const skillSchema = new mongoose.Schema({
  headingTxt: String,
  styleTxt: String,
});
const Skill = new mongoose.model("Skill", skillSchema);

const noOfProjectsSchema = new mongoose.Schema({
  noOfProjects: Number,
});
const TotalProject = new mongoose.model("TotalProject", noOfProjectsSchema);

const messageSchema = new mongoose.Schema({
  senderName: String,
  senderEmail: String,
  senderMessage: String,
});
const Message = new mongoose.model("Message", messageSchema);

const blogSchema = new mongoose.Schema({
  imgLink: String,
  headingTxt: String,
  likeNumber: Number,
  commentNumber: Number,
  paraTxt: String,
});
const Blog = new mongoose.model("Blog", blogSchema);

const adminSchema = new mongoose.Schema({
  username: String,
  password: String
});
adminSchema.plugin(passportLocalMongoose);
const Admin = new mongoose.model("Admin", adminSchema);
passport.use(Admin.createStrategy());
passport.serializeUser(Admin.serializeUser());
passport.deserializeUser(Admin.deserializeUser());

const hoursWorkedInitial = 500;
const cupsOfTeaInitial = 550;
const dateInitial = new Date("6/21/2023");

app.get("/", async (req, res) => {
  let expertiseList;
  let projectList;
  let skillList;
  let totalNoOfProjects;
  let blogList;
  await Expertise.find().then((expertise) => {
    expertiseList = expertise;
  });
  await Project.find().then((projects) => {
    projectList = projects;
  });
  await Skill.find().then((skills) => {
    skillList = skills;
  });
  await TotalProject.find().then((totalProjects) => {
    totalNoOfProjects = totalProjects[0].noOfProjects;
  });
  await Blog.find().then((blogs) => {
    blogList = blogs;
  });

  const dateToday = new Date();
  const diffTime = Math.abs(dateToday - dateInitial);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const hoursWorked = hoursWorkedInitial + diffDays * 6;
  const cupsOfTea = cupsOfTeaInitial + diffDays * 2;

  const statisticsData = {
    hoursWorked: hoursWorked,
    totalNoOfProjects: totalNoOfProjects,
    cupsOfTea: cupsOfTea,
  };

  res.render("main", {
    expertiseList: expertiseList,
    projectList: projectList,
    skillList: skillList,
    statisticsData: statisticsData,
    blogList: blogList,
  });
});


app.post("/likeBlog", (req, res) => {
  const id = req.body.id;
  Blog.findById(id).then((foundBlog) => {
    if (foundBlog) {
      console.log(foundBlog);
      let likes = foundBlog.likeNumber;
      likes = likes + 1;
      foundBlog.likeNumber = likes;

      foundBlog.save().then(() => {
        res.redirect("/#blog");
      });
    }
  });
});

app.post("/message", (req, res) => {
  const newMessage = new Message({
    senderName: req.body.senderName,
    senderEmail: req.body.senderEmail,
    senderMessage: req.body.senderMessage,
  });
  newMessage.save();
  notifier.notify({
    title: "Ayush",
    message: "Message received successfully",
    icon: path.join(__dirname, "public/assets/imgs/avatar.jpeg"),
  });
  res.redirect("/");
});

// --------------------------------Admin-------------------------------------//
app.get("/admin", async (req, res) => {
  if(req.isAuthenticated()){
      let skillList;
      await Skill.find().then((skills) => {
          skillList = skills;
      });
      let expertiseList;
      await Expertise.find().then((expertise) => {
          expertiseList = expertise;
      });
      let projectList;
      await Project.find().then((projects) => {
          projectList = projects;
      });
      let totalNoOfProjects;
      await TotalProject.find().then((totalProjects) => {
          totalNoOfProjects = totalProjects;
      });
      let blogList;
      await Blog.find().then((blogs) => {
          blogList = blogs;
      });
      let messageList;
      await Message.find().then((messages) => {
          messageList = messages;
      });

      res.render("admin",{
          skillList: skillList,
          expertiseList:expertiseList,
          projectList:projectList,
          totalNoOfProjects: totalNoOfProjects,
          blogList: blogList,
          messageList: messageList
      });
  }
  else{
      res.render("login");
  }
})


//-----------------------Skills-------------------------//

app.post("/deleteSkill", (req, res) => {
  const id = req.body.skillId;
  Skill.findByIdAndDelete(id).then(() => {
      res.redirect("/admin");
  }).catch((err) => {
      console.log(err);
  });
})

app.post("/addSkill", (req, res) => {
  const newSkill = new Skill({
      headingTxt: req.body.skillName,
      styleTxt: req.body.skillPercent
  });
  newSkill.save().then(() => {
      res.redirect("/admin");
  }).catch((err) => {
      console.log(err);
  });
})


//----------------------Expertise------------------------//

app.post("/deleteExpertise", (req, res) => {
  const id = req.body.expertiseId;
  Expertise.findByIdAndDelete(id).then(() => {
      res.redirect("/admin");
  }).catch((err) => {
      console.log(err);
  });
})

app.post("/addExpertise", (req, res) => {
  const newExpertise = new Expertise({
      classType: req.body.iconClass,
      headingTxt: req.body.expertiseName,
      paraTxt: req.body.description
  });
  newExpertise.save().then(() => {
      res.redirect("/admin");
  }).catch((err) => {
      console.log(err);
  });
})


//--------------------Projects---------------------//

app.post("/deleteProject", (req, res) => {
  const id = req.body.projectId;
  Project.findByIdAndDelete(id).then(() => {
      res.redirect("/admin");
  }).catch((err) => {
      console.log(err);
  });
})

app.post("/addProject", (req, res) => {
  const skillsString = req.body.skills;
  const skillsArray = skillsString.split(", ");
  const newProject = new Project({
      classType: req.body.iconClass,
      headingTxt: req.body.name,
      siteLink: req.body.site,
      gitLink: req.body.git,
      skillList: skillsArray,
      paraTxt: req.body.description,
      paraTxtShort: req.body.shortDescription
  });
  newProject.save().then(() => {
      res.redirect("/admin");
  }).catch((err) => {
      console.log(err);
  });
})


//-----------------------No. Of Projects-------------------//

app.post("/changeNoOfProjects", (req, res) => {
  const noOfProjects = req.body.noOfProjects;
  const id = req.body.id;
  TotalProject.findByIdAndUpdate(id, { noOfProjects: noOfProjects }).then(() => {
      res.redirect("/admin");
  }).catch((err) => {
      console.log(err);
  });
})


//-------------------------Blog-----------------------------//

app.post("/deleteBlog", (req, res) => {
  const id = req.body.blogId;
  Blog.findByIdAndDelete(id).then(() => {
      res.redirect("/admin");
  }).catch((err) => {
      console.log(err);
  });
})

app.post("/addBlog", (req, res) => {
  const newBlog = new Blog({
      imgLink: req.body.imgLink,
      headingTxt: req.body.headingTxt,
      likeNumber: 10,
      paraTxt: req.body.paraTxt
  });
  newBlog.save().then(() => {
      res.redirect("/admin");
  }).catch((err) => {
      console.log(err);
  });
})


//-------------------Admin-Login-------------------//

app.post("/login", (req, res) => {
  const admin = new Admin({
      username: req.body.username,
      password: req.body.password
  })

  req.login(admin, function(err){
      if(err){
          console.log(err);
      }
      else{
          const authenticate = Admin.authenticate();
          authenticate('username', 'password', function(err, result) {
              if (!err) { 
                  res.redirect("/admin");
              }
          })
      }
  })
})



app.listen(3001, () => console.log("Server Started at port 3001"));