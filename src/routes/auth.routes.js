const {Router}= require("express")
const authController = require("../controllers/auth.controller")
const authmiddleware = require("../middlewares/auth.middleware")
const authRouter = Router()

/** jsDoc comment
 * @route  POST /api/auth/register
 * @description Register a new user
 * @access Public
 */

authRouter.post("/register", authController.registerUserController)

/**
 * @route POST /api/auth/login
 * @description login user with email and password
 * @access Public
 */

authRouter.post("/login", authController.loginUserController)

/**
 * @route GET /api/auth/logout
 * @description clear token from cookie and add the token in blakclist
 * @access public
 */

authRouter.get("/logout" , authController.logoutUserController)

/**
 * @route GET/api/auth/get-me
 * @description get the curreny logged in user details
 * @access private
 */

authRouter.get("/get-me" , authmiddleware.authUser , authController.getMeController)

module.exports = authRouter 