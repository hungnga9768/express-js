-- Kiểm tra constraint hiện tại
SHOW CREATE TABLE momo_orders;

-- Bước 1: Xóa constraint cũ
ALTER TABLE momo_orders 
DROP FOREIGN KEY momo_orders_plan_fk;

-- Bước 2: Cho phép plan_id = NULL
ALTER TABLE momo_orders 
MODIFY COLUMN plan_id INT NULL;

-- Bước 3: Thêm constraint mới với ON DELETE SET NULL
ALTER TABLE momo_orders 
ADD CONSTRAINT momo_orders_plan_fk 
FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) 
ON DELETE SET NULL 
ON UPDATE CASCADE;

-- Kiểm tra lại
SHOW CREATE TABLE momo_orders;
