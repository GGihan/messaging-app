import { prisma } from "../../lib/prisma.js";
import { matchedData } from "express-validator";
import bcrypt from "bcryptjs";
import configuredPassport from '../config/passport.js';

export const registerUser = async (req, res) => {
  let { username, password } = matchedData(req);
  const hashedPassword = await bcrypt.hash(password, 10);
  const displayName = username;
  const bio = "Hey, I am new here!"

  const newUser = await prisma.user.create({
    data: {
      username,
      password: hashedPassword,
      profile: {
        create: {
          displayName,
          bio,
        },
      },
    },
    select: {
      id: true,
      username: true,
      createdAt: true,
      profile: true,
    },
  });

  res.status(201).json({
    success: true,
    message: 'Registration complete.',
    data: {
      user: newUser,
    },
  });
};

export const loginUser = (req, res, next) => {
  const validatedData = matchedData(req);
  // Overwrite req.body so Passport's LocalStrategy reads the validated data
  req.body.username = validatedData.username;
  req.body.password = validatedData.password;

  configuredPassport.authenticate("local", (err, user, info) => {
    // Handle unexpected system/database errors
    if (err) {
      return next(err);
    }
    // Credentials failed! (Triggered by done(null, false, { message }) in LocalStrategy)
    if (!user) {
      return res.status(401).json({
        success: false,
        message: info?.message || "Invalid username or password.",
      });
    }

    req.login(user, (err) => {
      if (err) {
        return next(err);
      }

      return res.json({
        success: true,
        message: "Login successful.",
        data: {
          user: {
            id: user.id,
            username: user.username,
            createdAt: user.createdAt,
            profile: user.profile,
          },
        },
      });
    });
  })(req, res, next);
};

export const logoutUser = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.session.destroy((destroyErr) => {
      if (destroyErr) {
        return next(destroyErr);
      }

      res.clearCookie('sid');
      
      return res.json({
        success: true,
        message: "Successfully logged out.",
      });
    });
  });
};

export const getMe = (req, res) => {
  // Return the user already deserialized by Passport
  return res.json({
    success: true,
    message: "Current user found.",
    data: {
      user: req.user || null,
    },  
  });
};