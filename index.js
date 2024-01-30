import express from "express";
const app = express();
import { config } from "dotenv";
import mongoose from "mongoose";


import Auth from './router/authRoute.js'

app.use(express.json())

config({
  path: "./.env",
});


app.use('/auth',Auth)
mongoose.connect(process.env.DB).then(
  app.listen(process.env.PORT, () => {
    console.log("Mongodb connected");

    console.log(`server is running on http://localhost:${process.env.PORT}`);
  })
);



