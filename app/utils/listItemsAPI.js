async function listItems(model, req, res) {
  const search = req.query.search || "";
  const page = parseInt(req.query.page) || 1;
  const limit = req.query.limit || 10;

  const totalItems = await model.getTotalRow(search);
  const totalPages = Math.max(Math.ceil(totalItems / limit), 1);
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const offset = (currentPage - 1) * limit;

  const data = await model.getAll(search, offset, limit);

  res.status(200).json({
    data,
    pagination: {
      totalItems,
      totalPages,
      currentPage,
      limit,
    },
    message: "Lấy dữ liệu thành công",
  });
}

module.exports = { listItems };
