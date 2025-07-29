const UsersModel = require('../models/users');
const FormsModel = require("../models/forms");
const QuestionsModel = require('../models/questions');
const connectMongoDB = require('../config/mongoDb');
const { comparePassword, hashPassword } = require("../helper/hashPassword");
const { signToken } = require("../helper/jwt");
const LogController = require("./logController");
const MaterialsModel = require("../models/material");
const SubMaterialsModel = require("../models/subMaterials");
const mongoose = require("mongoose");
const response = require("../utils/response");

class AdminController {
    static async loginAdmin(req, res, next) {
        try {
            let formError = []
            const { username, password } = req.body;
            if (!username) {
                formError.push("please enter username");
            }
            if (!password) {
                formError.push("please enter password");
            }
            if (formError.length > 0) {
                throw ({ name: "invalidInput", error: formError })
            }

            await connectMongoDB();
            const admin = await UsersModel.findOne({ username: { $regex: `.*${username}.*`, $options: 'i' } })
            if (admin) {
                const check = comparePassword(password, admin.password);
                if (!check) {
                    throw ({ name: "username/password is invalid" });
                } else {
                    const token = signToken({ username: admin.username, _id: admin._id, roles:admin.roles});
                    LogController.addLog({ code: 200, log: admin.username + " " + "user has been logged in", by: admin._id.toString() });
                    response.success(res, { token }, "Login successful");
                }
            } else if (!admin) {
                throw ({ name: "username/password invalid" });
            }
        } catch (err) {
            next(err);
        }
    }

    static async createUser(req, res, next) {
        try {
            const { username, password, roles } = req.body;
            const currentUser = req.user;
            const errors = [];

            if (!username) errors.push("Username is required");
            if (!password) errors.push("Password is required");
            if (!roles) errors.push("Role is required");

            if (errors.length > 0) {
                throw {
                    name: "invalidInput",
                    error: errors
                };
            }

            await connectMongoDB();

            const exists = await UsersModel.findOne({ username });
            if (exists) {
                throw {
                    name: "username/registered",
                };
            }

            const user = await UsersModel.create({
                username,
                password: hashPassword(password),
                roles
            });

            await LogController.addLog({
                code: 201,
                log: `${currentUser.username} created user ${user.username}`,
                by: currentUser._id
            });

            response.success(res,
                {
                    id: user._id,
                    username: user.username,
                    roles: user.roles
                },
                "User created successfully",
                201
            );
        } catch (err) {
            next(err);
        }
    }

    static async deleteUser(req, res, next) {
        const { id } = req.params;
        const currentUser = req.user;
        try {
            await connectMongoDB()
            // let user = await UsersModel.findOne({ _id: id })
            const userTobeDeleted = await UsersModel.findOne({ _id: id });
            LogController.addLog({ code: 200, log: currentUser.username + " " + "has delete" + " " + userTobeDeleted._id + " " + "user", by: currentUser._id.toString() })
            await UsersModel.deleteOne({ _id: id });
            res.json({ message: "User Has been deleted successfully" }).status(200)
        } catch (err) {
            next(err)
        }
    }

    static async getAllUsers(req, res, next) {
        try {
            await connectMongoDB();

            const {
                search,
                role,
                sortBy = 'createdAt',
                sortOrder = 'desc',
                page = 1,
                limit = 10
            } = req.query;

            const skip = (page - 1) * limit;


            let query = {};


            if (search) {
                query.username = {
                    $regex: search,
                    $options: 'i'
                };
            }


            if (role) {
                query.roles = role;
            }


            const sortOptions = {};
            sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;


            const users = await UsersModel.find(query)
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit))
                .select('-password')
                .lean();

            const total = await UsersModel.countDocuments(query);

            response.success(res, {
                data: users,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            });

        } catch (err) {
            next(err);
        }
    }

    static async userDetails(req, res, next) {
        const { id } = req.params;
        try {
            await connectMongoDB();

            // Get user details
            const user = await UsersModel.findById(id);
            if (!user) {
                throw { name: "ContentNotFound" };
            }

            // Get forms created by this user
            const forms = await FormsModel.find({ createdBy: user._id })
                .sort({ createdAt: -1 }); // Newest first

            // Get materials created by this user
            const materials = await MaterialsModel.find({ createdBy: user._id })
                .sort({ createdAt: -1 });

            // Get count of sub-materials for each material
            const materialsWithSubCount = await Promise.all(
                materials.map(async material => {
                    const subMaterialCount = await SubMaterialsModel.countDocuments({
                        materialId: material._id
                    });
                    return {
                        ...material.toObject(),
                        subMaterialCount
                    };
                })
            );

            const formsWithQuestionCount = await Promise.all(
                forms.map(async form => {
                    const questionCount = await QuestionsModel.countDocuments({
                        formId: form._id
                    });
                    return {
                        ...form.toObject(),
                        questionCount
                    };
                })
            );

            res.status(200).json({
                user,
                forms: formsWithQuestionCount,
                materials: materialsWithSubCount,
                stats: {
                    totalForms: forms.length,
                    totalMaterials: materials.length,
                    totalQuestions: formsWithQuestionCount.reduce((sum, form) => sum + form.questionCount, 0),
                    totalSubMaterials: materialsWithSubCount.reduce((sum, mat) => sum + mat.subMaterialCount, 0)
                }
            });

        } catch (err) {
            next(err);
        }
    }

    static async getMaterial(req, res, next) {
        try {
            await connectMongoDB();


            const { search, sortBy, sortOrder, page = 1, limit = 10 } = req.query;
            const skip = (page - 1) * limit;


            let materialsQuery = {};


            if (search) {
                materialsQuery.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { details: { $regex: search, $options: 'i' } },
                    { sourceFrom: { $regex: search, $options: 'i' } }
                ];
            }

            const sortOptions = {};
            if (sortBy) {
                sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
            } else {
                sortOptions.createdAt = -1;
            }

            const materials = await MaterialsModel.find(materialsQuery)
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit))
                .lean();

            const creatorIds = [...new Set(materials.map(material => material.createdBy.toString()))];
            const creators = await UsersModel.find(
                { _id: { $in: creatorIds } },
                { username: 1, roles: 1 }
            ).lean();

            const creatorMap = creators.reduce((map, creator) => {
                map[creator._id.toString()] = creator;
                return map;
            }, {});

            const materialIds = materials.map(material => material._id);
            const subMaterials = await SubMaterialsModel.find(
                { materialId: { $in: materialIds } }
            ).sort({ createdAt: -1 }).limit(5 * materials.length).lean();

            const subMaterialsMap = subMaterials.reduce((map, subMaterial) => {
                if (!map[subMaterial.materialId]) {
                    map[subMaterial.materialId] = [];
                }
                if (map[subMaterial.materialId].length < 5) {
                    map[subMaterial.materialId].push(subMaterial);
                }
                return map;
            }, {});

            const enrichedMaterials = materials.map(material => ({
                ...material,
                createdBy: creatorMap[material.createdBy.toString()],
                subMaterials: subMaterialsMap[material._id.toString()] || []
            }));

            const total = await MaterialsModel.countDocuments(materialsQuery);

            res.status(200).json({
                success: true,
                count: enrichedMaterials.length,
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit),
                data: enrichedMaterials
            });

        } catch (err) {
            next(err);
        }
    }

    static async getMaterialById(req, res, next) {
        const { id } = req.params;
        const {
            search,
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        try {
            await connectMongoDB();

            // First get the main material
            const material = await MaterialsModel.findById(id)
                .populate({
                    path: 'createdBy',
                    select: 'username roles'
                });

            if (!material) {
                throw { name: "ContentNotFound" };
            }

            // Then get its sub-materials with pagination/filtering
            let subMaterialQuery = SubMaterialsModel.find({ materialId: id });

            // Apply search if provided
            if (search) {
                subMaterialQuery = subMaterialQuery.or([
                    { name: { $regex: search, $options: 'i' } },
                    { details: { $regex: search, $options: 'i' } }
                ]);
            }

            // Apply sorting
            const sortOptions = {};
            sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
            subMaterialQuery = subMaterialQuery.sort(sortOptions);

            // Apply pagination
            const skip = (page - 1) * limit;
            subMaterialQuery = subMaterialQuery.skip(skip).limit(parseInt(limit));

            const subMaterials = await subMaterialQuery.exec();
            const totalSubMaterials = await SubMaterialsModel.countDocuments({ materialId: id });

            res.status(200).json({
                success: true,
                data: {
                    ...material.toObject(),
                    subMaterials: {
                        data: subMaterials,
                        pagination: {
                            page: parseInt(page),
                            limit: parseInt(limit),
                            total: totalSubMaterials,
                            pages: Math.ceil(totalSubMaterials / limit)
                        }
                    }
                }
            });

        } catch (err) {
            next(err);
        }
    }

    static async createMaterial(req, res, next) {
        const { name, details, sourceFrom } = req.body;
        let formError = []
        const currentUser = req.user;
        try {
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
            const materialCreate = await MaterialsModel.create({ name, details, sourceFrom, createdBy: currentUser._id });
            console.log(materialCreate, "<><><><><>");
            LogController.addLog({ code: 201, log: currentUser.username + " " + "has create" + " " + name + " " + "Material", by: currentUser._id.toString() })
            res.json({ message: "created material" }).status(201)
        } catch (err) {
            next(err);
        }
    }

    static async updateMaterial(req, res, next) {
        const { id } = req.params;
        const { name, details, sourceFrom } = req.body;
        let formError = []
        const currentUser = req.user;
        const findMaterialById = req.resource;
        try {
            if (!name) {
                formError.push("please enter name");
            }
            if (!details) {
                formError.push("please enter details");
            }
            if (formError.length > 0) {
                throw ({ name: "invalidInput", error: formError })
            }
            if (!findMaterialById) {
                throw ({ name: "invalidData" })
            }

            await connectMongoDB();
            const materialEdited = await MaterialsModel.updateOne({ _id: id }, {
                $set: {
                    name,
                    details,
                    sourceFrom
                }
            }, {
                $currentDate: { lastUpdated: true }
            })
            res.json({ message: "updated material" }).status(200)
            LogController.addLog({ code: 200, log: currentUser.username + " " + "has edit" + " " + findMaterialById._id.toString() + " " + " material", by: currentUser._id.toString() })
        } catch (err) {
            next(err);
        }
    }

    static async deleteMaterial(req, res, next) {
        const { id } = req.params;
        const currentUser = req.user;
        try {
            const findMaterialById = req.resource
            if (findMaterialById) {
                await connectMongoDB()
                await MaterialsModel.deleteOne({ _id: id });
                await SubMaterialsModel.deleteMany({ materialId: id })
                res.status(200).send({ message: "deleted material" });
                LogController.addLog({ code: 200, log: currentUser.username + " " + "has delete" + " " + findMaterialById._id.toString() + " " + "material", by: currentUser._id.toString() })
            } else {
                throw ({ name: "invalidData" })
            }

        } catch (err) {
            next(err);
        }
    }

    static async addSubMaterial(req, res, next) {
        const { picture, name, details } = req.body;
        const { id } = req.params;
        const currentUser = req.user;
        let errorForm = []
        try {
            if (!name) {
                errorForm.push("please enter name");
            }
            if (errorForm.length > 0) {
                throw ({ name: "invalidInput", error: errorForm })
            }
            await connectMongoDB();
            await SubMaterialsModel.create({
                name,
                picture,
                details,
                materialId: id,
            })
            LogController.addLog({ code: 201, log: currentUser.username + " " + "has create" + " " + name + " " + "SubMaterial", by: currentUser._id.toString() })
            res.json({ message: "added material" }).status(201)

        } catch (err) {
            next(err);
        }
    }

    static async editSubMaterial(req, res, next) {
        const { id } = req.params; // sub-material ID
        const { picture, name, details } = req.body;
        const currentUser = req.user;
        const subMaterial = req.resource;
        try {
            const errorForm = [];
            if (!name) errorForm.push("Please enter name");
            if (errorForm.length > 0) {
                throw { name: "invalidInput", error: errorForm };
            }

            await connectMongoDB();
            const parentMaterial = await MaterialsModel.findById(subMaterial.materialId)
            if (!parentMaterial) {
                throw { name: "ContentNotFound" };
            }

            const updatedSubMaterial = await SubMaterialsModel.findByIdAndUpdate(
                id,
                {
                    $set: {
                        picture,
                        name,
                        details
                    }
                },
                { new: true }
            );

            LogController.addLog({
                code: 200,
                log: `${currentUser.username} edited sub-material ${name}`,
                by: currentUser._id.toString()
            });

            res.status(200).json({
                message: "Sub-material updated successfully",
                subMaterial: updatedSubMaterial
            });
        } catch (err) {
            next(err);
        }
    }

    static async deleteSubMaterial(req, res, next) {
        const { id } = req.params;
        const currentUser = req.user;
        const subMaterial = req.resource;
        try {
            if (subMaterial) {
                await connectMongoDB();
                await SubMaterialsModel.deleteOne({ _id: id });
                res.status(200).send({ message: "deleted sub-material" });
                LogController.addLog({ code: 200, log: currentUser.username + " " + "has delete" + " " + subMaterial._id.toString() + " " + "sub-material", by: currentUser._id.toString() })
            }
        } catch (err) {
            next(err);
        }
    }

    static async createForm(req, res, next) {
        try {
            const currentUser = req.user;
            const { title, description, materialId } = req.body;
            const formError = []
            if (!title) {
                formError.push("please enter title");

            }
            if (!description) {
                formError.push("please enter description");
            }
            if (formError.length > 0) {
                throw ({ name: "invalidInput", error: formError })
            }
            await connectMongoDB()
            await FormsModel.create({ title, description, createdAt: new Date(), createdBy: currentUser._id.toString(), materialId })
            LogController.addLog({ code: 201, log: currentUser.username + " " + "has create" + " " + title + " " + "Form", by: currentUser._id.toString() })
            res.json({ message: "created form" }).status(201)
        } catch (err) {
            next(err);
        }
    }

    static async deleteForm(req, res, next) {
        const { id } = req.params;
        const currentUser = req.user;
        const session = await mongoose.startSession();

        try {
            await connectMongoDB();
            const formTobeDeleted = req.resource
            session.startTransaction();
                    await FormsModel.deleteOne({ _id: id });
                    await QuestionsModel.deleteMany({ formId: id })
            await session.commitTransaction();
                    res.status(200).send({ message: "deleted form" });
                    LogController.addLog({ code: 200, log: currentUser.username + " " + "has delete" + " " + formTobeDeleted._id.toString() + " " + "form", by: currentUser._id.toString() })
        } catch (err) {
            next(err);
        }
    }

    static async editForm(req, res, next) {
        const { id } = req.params;
        const { title, description, materialId, isActive } = req.body;
        const currentUser = req.user;
        try {
            const formError = []
            if (!title) {
                formError.push("please enter title");

            }
            if (!description) {
                formError.push("please enter description");
            }
            if (formError.length > 0) {
                throw ({ name: "invalidInput", error: formError })
            }
            await connectMongoDB();
            let form = req.resource
            // if (form.isActive === false) {
            //     throw {name: "invalidData"}
            // }
            await FormsModel.updateOne({ _id: id }, {
                $set: {
                    title,
                    description,
                    materialId,
                    isActive
                }
            }, {
                $currentDate: { lastUpdated: true }
            })
            res.status(200).send({ message: "edited form" });
            LogController.addLog({ code: 200, log: currentUser.username + " " + "has edit" + " " + form._id.toString() + " " + "form", by: currentUser._id.toString() })



        } catch (err) {
            next(err);
        }
    }

    static async getAllForms(req, res, next) {
        try {
            await connectMongoDB();

            const {
                search,
                sortBy = 'createdAt',
                sortOrder = 'desc',
                page = 1,
                limit = 10,
                withQuestions = false,
                createdBy
            } = req.query;

            const skip = (page - 1) * limit;


            let query = FormsModel.find();

            if (search) {
                query = query.or([
                    { title: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ]);
            }

            if (createdBy) {
                query = query.where('createdBy').equals(createdBy);
            }


            const sortOptions = {};
            sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
            query = query.sort(sortOptions);


            query = query.skip(skip).limit(parseInt(limit));


            query = query.populate({
                path: 'createdBy',
                select: 'username roles'
            });


            if (withQuestions) {
                query = query.populate({
                    path: 'questions',
                    select: 'questionText questionType order',
                    options: { sort: { order: 1 } }
                });
            }


            const forms = await query.exec();


            let countQuery = FormsModel.find();
            if (search) {
                countQuery = countQuery.or([
                    { title: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ]);
            }
            if (createdBy) {
                countQuery = countQuery.where('createdBy').equals(createdBy);
            }
            const total = await countQuery.countDocuments();

            res.status(200).json({
                success: true,
                count: forms.length,
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit),
                data: forms
            });

        } catch (err) {
            next(err);
        }
    }

    static async getForm(req, res, next) {
        const { id } = req.params;
        const { withQuestions = true } = req.query;

        try {
            await connectMongoDB();


            const form = await FormsModel.findById(id).lean();

            if (!form) {
                throw { name: "ContentNotFound" };
            }


            const creator = await UsersModel.findById(
                form.createdBy,
                { username: 1, roles: 1 }
            ).lean();


            let questions = [];
            if (withQuestions) {
                questions = await QuestionsModel.find(
                    { formId: id },
                    null,
                    { sort: { order: 1 } }
                ).lean();
            }


            const responseData = {
                ...form,
                createdBy: creator,
                questions: withQuestions ? questions : undefined
            };
            response.success(res, responseData, "get forms", 200);

        } catch (err) {
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
                throw ({ name: "ContentNotFound" });
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

    static async editQuestion(req, res, next) {
        const { id } = req.params; // question ID
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
        const currentQuestion = req.resource;

        try {
            // Input validation
            const formError = [];
            if (!questionText) formError.push("Please enter question text");
            if (!questionType) formError.push("Please select question type");
            if (order === undefined || order === null) formError.push("Please specify question order");

            if (formError.length > 0) {
                throw { name: "invalidInput", error: formError };
            }

            // Validate question type specific requirements
            if (['multiple-choice', 'checkboxes', 'dropdown'].includes(questionType) && (!options || options.length < 2)) {
                throw { name: "invalidInput", error: ["At least two options are required for this question type"] };
            }

            if (['linear-scale', 'rating'].includes(questionType) && !scale) {
                throw { name: "invalidInput", error: ["Scale configuration is required for this question type"] };
            }

            await connectMongoDB();

            // Prepare update data
            const updateData = {
                questionText,
                questionType,
                isRequired: isRequired || false,
                order,
                materialId: materialId || null
            };

            // Add type-specific fields
            if (options) updateData.options = options;
            if (scale) updateData.scale = scale;

            // Update the question
            const updatedQuestion = await QuestionsModel.findByIdAndUpdate(
                id,
                { $set: updateData },
                { new: true, runValidators: true }
            );

            // Log the action
            console.log(currentQuestion, "test current")
            LogController.addLog({
                code: 200,
                log: `${currentUser.username} edited question (${questionType}) in form ${currentQuestion.formId.toString()}`,
                by: currentUser._id.toString()
            });

            res.status(200).json({
                message: "Question updated successfully",
                question: updatedQuestion
            });

        } catch (err) {
            next(err);
        }
    }

    static async deleteQuestion(req, res, next) {
        const { id } = req.params;
        const currentUser = req.user;
        const currentQuestion = req.resource;
        try {
            if (currentQuestion) {
                await connectMongoDB()
                await QuestionsModel.deleteOne({ _id: id });
                // await
                res.status(200).json({ message: "Question deleted successfully" });
                LogController.addLog({ code: 200, log: currentUser.username + " " + "has delete" + " " + currentQuestion._id.toString() + " " + "question", by: currentUser._id.toString() })
            } else {
                throw ({ name: "InvalidInput" });
            }
        } catch (e) {
            next(e);
        }
    }

}


module.exports = AdminController;