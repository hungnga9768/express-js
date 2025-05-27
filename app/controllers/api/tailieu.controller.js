const tailieu = require("../../models/tailieu");
const { listItems } = require("../../utils/listItemsAPI");
module.exports = {
  // Trang danh sách khóa học với phân trang & tìm kiếm
  async index(req, res) {
    await listItems(tailieu, req, res);
  },
  async getID(req, res) {
    const id = req.params.id;
    const data = await tailieu.getById(id);
    if (!data) {
      return res.send({ message: "Không tìm được tài liệu" });
    }
    res.send({ data: data, message: " get dữ liệu thành công", code: 200 });
  },
};
