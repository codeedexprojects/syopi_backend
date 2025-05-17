const express = require('express');
const router = express.Router();
const userController = require('../../../Controllers/Admin/User/UserController');
const verifyToken = require('../../../Middlewares/jwtConfig');

//get all users
router.get('/get',verifyToken(['admin']),userController.getAllUsers);

//get user by Id
router.get('/get/:id',verifyToken(['admin']),userController.getUserById);


//search users 
router.get('/search',verifyToken(['admin']),userController.searchUsers);

module.exports = router;