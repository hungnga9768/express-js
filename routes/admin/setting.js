const express = require("express");
const router = express.Router();
const { uploadImage, uploadBannerImage } = require("../../middlewares/upload");
const adminsCtl = require("../../app/controllers/admin/setting.controller");

router.get("/banner/danhsach", adminsCtl.index);
router.get("/banner/add", adminsCtl.showAddForm);
router.post("/banner/add", uploadBannerImage, adminsCtl.create);
router.get("/banner/edit/:id", adminsCtl.showEditForm);
router.post("/banner/edit/:id", uploadBannerImage, adminsCtl.update);
router.post("/banner/delete/:id", adminsCtl.remove);
router.get("/banner/danhsach", adminsCtl.indexSetttings);
router.get("/", adminsCtl.indexSetttings);
router.get("/edit/:id", adminsCtl.showEditForSettings);
router.post("/edit/:id", uploadImage, adminsCtl.updateSettings);

module.exports = router;
