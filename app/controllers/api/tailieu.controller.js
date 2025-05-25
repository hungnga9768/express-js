const tailieu = require("../../models/tailieu");

module.exports = {
  // Trang danh sách khóa học với phân trang & tìm kiếm
  async index(req, res) {
    const search = req.query.search || "";
    const data = await tailieu.getDs(search);
    res.send({
      data: data ? data : [],
      message: "lấy dữ liệu thành công",
      code: 200,
    });
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
