const UsersModel = require('../models/users');
const FormsModel = require("../models/forms");
const QuestionsModel = require('../models/questions');
const connectMongoDB = require('../config/mongoDb');
const {comparePassword, hashPassword} = require("../helper/hashPassword");
const {signToken} = require("../helper/jwt");
const LogController = require("./logController");
const MaterialsModel = require("../models/material");
const SubMaterialsModel = require("../models/subMaterials");

class AdminController {
    static async loginAdmin(req,res,next){
        try{
            let formError = []
            const {username, password} = req.body;
            if (!username){
                formError.push("please enter username");
            }
            if (!password){
                formError.push("please enter password");
            }
            if (formError.length > 0) {
                throw ({ name: "invalidInput", error: formError })
            }

            await connectMongoDB();
            const admin = await UsersModel.findOne({ username: { $regex: `.*${username}.*`, $options: 'i' } })
            if(admin){
                const check = comparePassword(password, admin.password);
                if(!check){
                    throw({name: "username/password is invalid"});
                }else {
                    const token = signToken({username: admin.username, password: admin.password});
                    LogController.addLog({code: 200,log:admin.username + " " +"user has been logged in",by: admin._id.toString()});
                    res.status(200).send({token: token});
                }
            }else if (!admin) {
                throw ({name: "username/password invalid"});
            }
        }catch(err){
            next(err);
        }
    }

    static async createUser(req,res,next){
        const { username, password, roles } = req.body;
        console.log(username,password);
        try {
            let errorForm = []
            if (!username) {
                errorForm.push("please input username")
            }

            if (!password) {
                errorForm.push("please input password")
            }if (!roles) {
                errorForm.push("please input password")
            }

            if (errorForm.length > 0) {
                throw ({ name: "invalidInput", error: errorForm })
            }

            const dataUsers = {
                username, password: hashPassword(password), roles
            }
            await connectMongoDB()
            const registered = await UsersModel.findOne({ username: { $regex: `.*${username}.*`, $options: 'i' } })
            console.log(registered);
            if (registered?._id) {
                throw ({name: "username/registered"})
            } else {
                const userCreated = await UsersModel.create(dataUsers)
                res.json({ message: "created users into database" }).status(201);
            LogController.addLog({code: 201,log:admin.username + " " +"has create" + " " + userCreated.username ,by: admin._id.toString()})
            }

        } catch (err) {
            next(err)
        }
    }

    static async deleteUser(req,res,next){
        const { id } = req.params;
        const currentUser = req.user;
        try{
            await connectMongoDB()
            // let user = await UsersModel.findOne({ _id: id })
            const userTobeDeleted = await UsersModel.findOne({ _id:id });
            LogController.addLog({code: 200,log:currentUser.username + " " +"has delete" + " " + userTobeDeleted._id + " " + "user" ,by: currentUser._id.toString()})
            await UsersModel.deleteOne({ _id: id });
            res.json({message: "User Has been deleted successfully"}).status(200)
        } catch (err) {
            next(err)
        }
    }

    static async createMaterial(req,res,next){
        const {name, details, sourceFrom} = req.body;
        let formError = []
        const currentUser = req.user;
        try{
            if (!name) {
                formError.push("please enter name");
            }
            if (!details) {
                formError.push("please enter details");
            }
            if (formError.length > 0) {
                throw ({ name: "invalidInput", error: formError })
            }
            await connectMongoDB();
            const materialCreate = await MaterialsModel.create({name, details, sourceFrom, createdBy: currentUser._id});
            console.log(materialCreate, "<><><><><>");
            LogController.addLog({code: 201,log:currentUser.username + " " +"has create" + " " + name + " " + "Material" ,by: currentUser._id.toString()})
            res.json({ message: "created material" }).status(201)
        }catch (err){
            next(err);
        }
    }

    static async updateMaterial(req,res,next){

    }

    static async deleteMaterial(req,res,next){
        const { id } = req.params;
        const currentUser = req.user;
        try{
            const findMaterialById = req.resource
            if (findMaterialById) {
                    await connectMongoDB()
                    await MaterialsModel.deleteOne({_id:id});
                    res.status(200).send({message:"deleted material"});
                    LogController.addLog({code: 200,log:currentUser.username + " " +"has delete" + " " + findMaterialById._id.toString() + " " + "delete" ,by: currentUser._id.toString()})
            } else {
                throw ({name: "invalidData"})
            }

        }catch(err){
            next(err);
        }
    }

    static async addSubMaterial(req,res,next){
        const {picture, name, details} = req.body;
        const {id } = req.params;
        let errorForm = []
        try {
            if (!name) {
                errorForm.push("please enter name");
            }
            await connectMongoDB();
            await SubMaterialsModel.create({
                name,
                picture,
                details,
                MaterialId: id,
            })

        }catch (err){
            next(err);
        }
    }

    static async createForm(req,res,next){
        try{
            const currentUser = req.user;
            const {title, description, materialId} = req.body;
            const formError = []
            if (!title){
                formError.push("please enter title");

            }
            if (!description){
                formError.push("please enter description");
            }
            if(formError.length > 0) {
                throw ({ name: "invalidInput", error: formError })
            }
            connectMongoDB()
            await FormsModel.create({title, description, createdAt: new Date(), createdBy: currentUser._id.toString(), materialId})
            LogController.addLog({code: 201,log:currentUser.username + " " +"has create" + " " + title + " " + "Form" ,by: currentUser._id.toString()})
            res.json({ message: "created form" }).status(201)
        }catch (err){
            next(err);
        }
    }
    static async deleteForm(req,res,next){
        const {id } = req.params;
        const currentUser = req.user;
        try {
        connectMongoDB();
        const formTobeDeleted = await FormsModel.findOne({ _id:id });
        if(formTobeDeleted){
            if (req.user.roles !== "admin" && formTobeDeleted.createdBy.toString() !== currentUser._id.toString()){
                throw ({name: "forbidden"})
            } else {

            await FormsModel.deleteOne({_id:id});
            res.status(200).send({message:"deleted form"});
            LogController.addLog({code: 200,log:currentUser.username + " " +"has delete" + " " + formTobeDeleted._id.toString() + " " + "form" ,by: currentUser._id.toString()})
            }
        }
        }catch (err){
            next(err);
        }
    }
    static async editForm(req,res,next){
        const {id} = req.params;
        const {title, description, materialId} = req.body;
        try{
            await connectMongoDB();
            let form  = await FormsModel.findOne({ _id: id })
            if (form.isActive === false) {
                throw {name: "invalidData"}
            }
            await FormsModel.updateOne({ _id: id }, {
                $set: {
                    title,
                    description,
                    materialId
                }
            }, {
                $currentDate: { lastUpdated: true }
            })

        }catch (err){
            next(err);
        }
    }

    static async addQuestion(req, res, next) {
        const { id } = req.params; // formId
        const {
            questionText,
            questionType,
            options,
            scale,
            isRequired,
            order,
            materialId
        } = req.body;
        const currentUser = req.user;

        try {
            // Input validation
            const formError = [];
            if (!questionText) formError.push("Please enter question text");
            if (!questionType) formError.push("Please select question type");
            if (order === undefined || order === null) formError.push("Please specify question order");

            if (formError.length > 0) {
                throw ({ name: "invalidInput", error: formError });
            }

            await connectMongoDB();

            // Verify form exists and user has permission
            const form = await FormsModel.findById(id);
            if (!form) {
                throw ({ name: "ContentNotFound"});
            }

            // Validate question type specific requirements
            if (['multiple-choice', 'checkboxes', 'dropdown'].includes(questionType) && (!options || options.length < 2)) {
                throw ({ name: "invalidInput", error: ["At least two options are required for this question type"] });
            }

            if (['linear-scale', 'rating'].includes(questionType) && !scale) {
                throw ({ name: "invalidInput", error: ["Scale configuration is required for this question type"] });
            }

            // Create the question
            const questionData = {
                formId: id,
                questionText,
                questionType,
                isRequired: isRequired || false,
                order,
                materialId: materialId || null
            };

            // Add type-specific fields
            if (options) questionData.options = options;
            if (scale) questionData.scale = scale;

            const newQuestion = await QuestionsModel.create(questionData);

            // Log the action
            LogController.addLog({
                code: 201,
                log: `${currentUser.username} added question (${questionType}) to form ${form.title}`,
                by: currentUser._id.toString()
            });

            res.status(201).json({
                message: "Question added successfully",
                question: newQuestion
            });

        } catch (err) {
            next(err);
        }
    };


}


module.exports = AdminController;