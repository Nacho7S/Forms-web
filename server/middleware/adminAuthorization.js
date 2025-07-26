const adminAuthorization = ((req, res, next) => {
    if (req.user.roles === "admin") {
        next()
    } else {
        next({name: "forbidden"})
    }
})

module.exports = adminAuthorization