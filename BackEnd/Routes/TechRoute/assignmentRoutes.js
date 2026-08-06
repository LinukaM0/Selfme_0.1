const express = require("express");
const router = express.Router();
const assignmentController = require("../../Controllers/TechController/assignmentController");

router.post("/assign", assignmentController.assignTask);
router.get("/assigned-tasks", assignmentController.getAssignedTasks);
router.patch("/mark-done/:id", assignmentController.markTaskDone);
router.delete("/delete/:id", assignmentController.deleteTask);
router.patch("/update-employee/:id", assignmentController.updateAssignedEmployee);

module.exports = router;