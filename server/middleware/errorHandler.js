const errorHandler = (err, req, res, next) => {
    console.log(err)
    let status = 500
    let message = "internal server error"

    switch (err.name) {
        case "Unauthenticated":
            status = 401;
            message = "Please Login First"
            break
        case "username/password invalid":
            status = 403;
            message = err.name
            break
        case "invalidInput":
            status = 400
            const errorMap = err.error.map(el => {
                message = el
            })
            break
        case "ContentNotFound":
            status = 404
            message = "ContentNotFound"
            break
        case "invalidData":
            status = 400
            message = "invalid data"
            break
        case "forbidden":
            status = 403
            message = "you are not allowed to change this data"
            break
        case "username/registered":
            status = 409
            message = `This username is already registered.`
            break
        default: break
    }
    res.status(status).json({message})

}

module.exports = errorHandler