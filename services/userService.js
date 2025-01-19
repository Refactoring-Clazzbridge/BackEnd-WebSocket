const getUserData = require("./userHandlers/getUserData");
const getUsersByCourse = require("./userHandlers/getUsersByCourse");
const getUsersByRoleOrCourse = require("./userHandlers/getUsersByRoleOrCourse");
const setUserOnlineStatus = require("./userHandlers/setUserOnlineStatus");
const fetchUserData = require("./userHandlers/fetchUserData");
const scanAllUsers = require("./userHandlers/scanAllUsers");
const getUserCourseId = require("./userHandlers/getUserCourseId");

module.exports = { getUserData, getUsersByRoleOrCourse, setUserOnlineStatus, fetchUserData, getUsersByCourse, scanAllUsers, getUserCourseId };