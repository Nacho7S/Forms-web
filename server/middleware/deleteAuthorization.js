// middleware/deleteAuthorization.js
const connectMongoDB = require('../config/mongoDb');
const MaterialsModel = require('../models/material');
const FormsModel = require('../models/forms');
const UsersModel = require('../models/users');

const deleteAuthorization = (models = { MaterialsModel, FormsModel, UsersModel }) => {
    return async (req, res, next) => {
        try {
            await connectMongoDB();

            // Skip authorization for admin and moderator
            const { id } = req.params;
            const currentUser = req.user;
            let resource;

            if (req.path.includes('/material/')) {
                resource = await models.MaterialsModel.findById(id);
            } else if (req.path.includes('/form/')) {
                resource = await models.FormsModel.findById(id);
            // else if (req.path.includes('/user/')) {
            //     resource = await models.UsersModel.findById(id);
            // }

            if (req.user.roles === "admin" ) {
                req.resource = resource;
                return next();
            }

            }

            if (!resource || resource.createdBy.toString() !== currentUser._id.toString()) {
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