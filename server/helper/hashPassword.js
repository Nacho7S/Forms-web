const bcryptjs = require('bcryptjs');
const SALT = bcryptjs.genSaltSync(Number(process.env.SALT));

const hashPassword = (plainPassword) => {
    return bcryptjs.hashSync(plainPassword, SALT);
}

const comparePassword = (plainPassword, hashedPassword) => {
    return bcryptjs.compareSync(plainPassword, hashedPassword)
}

module.exports = {hashPassword, comparePassword}
