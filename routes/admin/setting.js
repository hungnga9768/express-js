const express = require("express");
const router = express.Router();
const upload = require("../../middlewares/upload");
const adminsCtl = require("../../app/controllers/admin/setting.controller");

router.get("/banner/danhsach", adminsCtl.index);
router.get("/banner/add", adminsCtl.showAddForm);
router.post("/banner/add", upload.single("image_url"), adminsCtl.create);
router.get("/banner/edit/:id", adminsCtl.showEditForm);
router.post("/banner/edit/:id", upload.single("image_url"), adminsCtl.update);
router.post("/banner/delete/:id", adminsCtl.remove);

module.exports = router;
