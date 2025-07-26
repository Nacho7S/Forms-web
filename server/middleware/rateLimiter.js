const { RateLimiterMemory } = require("rate-limiter-flexible");

const limiter = new RateLimiterMemory({
    points: 10,
    duration: 15,
})

const rateLimiterMiddleware = (req, res, next) => {
    console.log(req.ip, "ip iki");
    limiter.consume(req.ip).then(() => next()).catch(() => {
        res.status(429).json({message: "Too Many Requests"})
    })
}

module.exports = rateLimiterMiddleware