const userModel = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const tokenBlacklistModel = require("../models/blacklist.model");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * @name registerUserController
 * @description register a new user, expects username, email and password in the request body
 * @access Public
 */
async function registerUserController(req, res) {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const trimmedUsername = username.trim();
        const trimmedEmail = email.trim().toLowerCase();

        if (trimmedUsername.length < 3) {
            return res.status(400).json({ message: "Username must be at least 3 characters long" });
        }

        if (!EMAIL_REGEX.test(trimmedEmail)) {
            return res.status(400).json({ message: "Please provide a valid email address" });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters long" });
        }

        const isUserAlreadyExists = await userModel.findOne({
            $or: [{ username: trimmedUsername }, { email: trimmedEmail }]
        });

        if (isUserAlreadyExists) {
            if (isUserAlreadyExists.email === trimmedEmail) {
                return res.status(400).json({ message: "Email is already registered. Please log in." });
            }
            return res.status(400).json({ message: "Username is already taken. Please choose another." });
        }

        const hash = await bcrypt.hash(password, 10);

        const user = await userModel.create({
            username: trimmedUsername,
            email: trimmedEmail,
            password: hash
        });

        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production"
        });

        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (err) {
        console.error("Error in registerUserController:", err);
        res.status(500).json({ message: "Server error during registration", error: err.message });
    }
}

/**
 * @name loginUserController
 * @description login a user, expects email and password in the request body
 * @access Public
 */
async function loginUserController(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Both email and password are required" });
        }

        const trimmedEmail = email.trim().toLowerCase();

        if (!EMAIL_REGEX.test(trimmedEmail)) {
            return res.status(400).json({ message: "Please enter a valid email format" });
        }

        const user = await userModel.findOne({ email: trimmedEmail });

        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production"
        });

        res.status(200).json({
            message: "User logged in successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (err) {
        console.error("Error in loginUserController:", err);
        res.status(500).json({ message: "Server error during login", error: err.message });
    }
}

async function logoutUserController(req, res) {
    try {
        const token = req.cookies.token;

        if (token) {
            await tokenBlacklistModel.create({ token });
        }

        res.clearCookie("token");

        res.status(200).json({
            message: "User logged out successfully"
        });
    } catch (err) {
        res.status(500).json({ message: "Error logging out", error: err.message });
    }
}

/**
 * @name getMeController
 * @description get the current logged in user details
 * @access private
 */
async function getMeController(req, res) {
    try {
        const user = await userModel.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            message: "User details fetched successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (err) {
        res.status(500).json({ message: "Error fetching user", error: err.message });
    }
}

module.exports = {
    registerUserController,
    loginUserController,
    logoutUserController,
    getMeController
};