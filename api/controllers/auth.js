// controllers/auth.js

import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { createError } from "../utils/error.js";
import jwt from "jsonwebtoken";

export const register = async (req, res, next) => {
  try {
    // Check if the username or email is already taken
    const existingUser = await User.findOne({
      $or: [{ username: req.body.username }, { email: req.body.email }],
    });

    if (existingUser) {
      return next(createError(400, "Username or email already exists"));
    }

    // Hash the password
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(req.body.password, salt);

    // Create a new user
    const newUser = new User({
      username: req.body.username,
      email: req.body.email,
      country: req.body.country,
      city: req.body.city,
      phone: req.body.phone,
      password: hash,
      img:req.body.img,
    });

    // Save the new user to the database
    await newUser.save();

    // Generate a JWT token
    const token = jwt.sign(
      { id: newUser._id, isAdmin: newUser.isAdmin },
      process.env.JWT
    );

    // Exclude sensitive information from the response
    const { password, isAdmin, ...otherDetails } = newUser._doc;

    // Set the JWT token as a cookie
    res
      .cookie("access_token", token, {
        httpOnly: true,
      })
      .status(200)
      .json({ details: { ...otherDetails }, isAdmin });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    // Find the user by username
    const user = await User.findOne({ username: req.body.username });

    // Check if the user exists
    if (!user) {
      return next(createError(404, "User not found!"));
    }

    // Check if the password is correct
    const isPasswordCorrect = await bcrypt.compare(req.body.password, user.password);

    if (!isPasswordCorrect) {
      return next(createError(400, "Wrong password or username!"));
    }

    // Generate a JWT token
    const token = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin },
      process.env.JWT
    );

    // Exclude sensitive information from the response
    const { password, isAdmin, ...otherDetails } = user._doc;

    // Set the JWT token as a cookie
    res
      .cookie("access_token", token, {
        httpOnly: true,
      })
      .status(200)
      .json({ details: { ...otherDetails }, isAdmin });
  } catch (err) {
    next(err);
  }
};
