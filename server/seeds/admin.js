const connectMongoDB = require('../config/mongoDb');
const UsersModel = require('../models/users');
const {hashPassword} = require("../helper/hashPassword");

const injectAdmin = async () => {
    const Admin = {
        username: "OnlyGodKnows",
        password: hashPassword("test1234"),
        roles: 'admin',
    }
    console.log(Admin)
    try{
        await connectMongoDB();
        await UsersModel.insertOne(Admin);

    }catch (err){
        console.log(err);
    }
}

injectAdmin()