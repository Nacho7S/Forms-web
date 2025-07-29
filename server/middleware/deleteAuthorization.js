// middleware/deleteAuthorization.js
const connectMongoDB = require('../config/mongoDb');
const MaterialsModel = require('../models/material');
const FormsModel = require('../models/forms');
const UsersModel = require('../models/users');
const SubMaterialsModel = require("../models/subMaterials");
const QuestionsModel = require('../models/questions');


const deleteAuthorization = (models = { MaterialsModel, FormsModel, UsersModel }) => {
    return async (req, res, next) => {
        try {
            await connectMongoDB();

            // Skip authorization for admin and moderator
            const { id } = req.params;
            const currentUser = req.user;
            let resource;

            console.log(req.method, "methodnya")

            if (req.path.includes('/material/')) {
                resource = await models.MaterialsModel.findById(id);
            }
            else if (req.path.includes('/question/')) {
                resource = await QuestionsModel.findById(id)
            } else if (req.path.includes('/form/')) {
                resource = await models.FormsModel.findById(id);
            }
            else if (req.path.includes('/sub-material/')) {
                resource = await SubMaterialsModel.findById(id);
            }
            // else if (req.path.includes('/user/')) {
            //     resource = await models.UsersModel.findById(id);
            // }

            if (req.user.roles === "admin" ) {
                req.resource = resource;
                return next();
            }


            if (!resource) {
              throw {name: "ContentNotFound"}
            } else if ( resource.createdBy.toString() !== currentUser._id.toString()) {
                if (req.method === "PATCH" | req.method === "PUT") {

                }
                throw { name: "forbidden" };
            }

            // Attach the resource to the request for use in controller
            req.resource = resource;
            next();
        } catch (err) {
            next(err);
        }
    };
};

module.exports = deleteAuthorization;