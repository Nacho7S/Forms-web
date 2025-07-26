const guestAuthorization = ((req, res, next) => {
    if (req.user.roles === "admin" || req.user.roles === "moderator") {
        next()
    } else {
        next({name: "forbidden"})
    }
})

module.exports = guestAuthorization