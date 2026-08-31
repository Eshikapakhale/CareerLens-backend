const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")

const app = express();

const allowedOrigins = [
    "http://localhost:5173",
    "https://career-lens-frontend.vercel.app",
    /https:\/\/career-lens-frontend.*\.vercel\.app$/
]

app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps, curl, Postman)
        if (!origin) return callback(null, true)
        const isAllowed = allowedOrigins.some(allowed =>
            typeof allowed === "string" ? allowed === origin : allowed.test(origin)
        )
        if (isAllowed) {
            callback(null, true)
        } else {
            callback(new Error("Not allowed by CORS: " + origin))
        }
    },
    credentials: true
}))

app.use(express.json());
app.use(cookieParser());
app.use(express.static("public"));

// require all the routes here
const authRouter = require("./routes/auth.routes")
const interviewRouter = require("./routes/interview.routes")

//using the routes here
app.use("/api/auth", authRouter)
app.use("/api/interview",interviewRouter)


module.exports = app