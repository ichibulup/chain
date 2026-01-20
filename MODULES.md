# Phân tích Schema và Đề xuất Cấu trúc Service

Dựa trên phân tích schema, tôi sẽ đề xuất cách chia nhóm các bảng một cách có tổ chức:

## 📋 Đề xuất chia nhóm Database Tables cho Service & Controller

1.  **🏢 CORE ORGANIZATION & ACCESS**
    ```plaintext
    📁 /services/organization.ts
    📁 /controllers/organization.ts
    📁 /schemas/organization.ts
    📁 /routes/organization.ts
    ```
    * `User` - Quản lý người dùng
    * `Organization` - Tổ chức/chuỗi nhà hàng
    * `OrganizationMembership` - Thành viên tổ chức
    * `RestaurantChain` - Chuỗi nhà hàng
    * `Restaurant` - Nhà hàng
    * `RestaurantUserRole` - Vai trò nhân viên trong nhà hàng

2.  **🍽️ MENU & CATALOG**
    ```plaintext
    📁 /services/menu.ts
    📁 /controllers/menu.ts
    📁 /schemas/menu.ts
    📁 /routes/menu.ts
    ```
    * `Category` - Danh mục món ăn
    * `Menu` - Thực đơn
    * `MenuItem` - Món ăn
    * `Recipe` - Công thức nấu ăn
    * `RecipeIngredient` - Nguyên liệu trong công thức
    * `OptionGroup` - Nhóm tùy chọn
    * `Option` - Tùy chọn món ăn
    * `MenuItemOptionGroup` - Liên kết món ăn với nhóm tùy chọn

3.  **🏪 RESTAURANT OPERATIONS**
    ```plaintext
    📁 /services/restaurant.ts
    📁 /controllers/restaurant.ts
    📁 /schemas/restaurant.ts
    📁 /routes/restaurant.ts
    ```
    * `Table` - Bàn ăn
    * `Reservation` - Đặt bàn
    * `TableOrder` - Đơn hàng tại bàn
    * `StaffSchedule` - Lịch làm việc
    * `StaffAttendance` - Chấm công

4.  **🛒 ORDER & PAYMENT**
    ```plaintext
    📁 /services/order.ts
    📁 /controllers/order.ts
    📁 /schemas/order.ts
    📁 /routes/order.ts
    ```
    * `Order` - Đơn hàng
    * `OrderItem` - Chi tiết đơn hàng
    * `OrderItemOption` - Tùy chọn món ăn trong đơn
    * `OrderStatusHistory` - Lịch sử trạng thái đơn hàng
    * `Payment` - Thanh toán
    * `Refund` - Hoàn tiền
    * `PaymentIntent` - Ý định thanh toán

5.  **🚚 DELIVERY & LOGISTICS**
    ```plaintext
    📁 /services/delivery.ts
    📁 /controllers/delivery.ts
    📁 /schemas/delivery.ts
    📁 /routes/delivery.ts
    ```
    * `DeliveryStaff` - Nhân viên giao hàng
    * `Delivery` - Giao hàng
    * `DeliveryLocation` - Vị trí giao hàng
    * `DeliveryZone` - Khu vực giao hàng

6.  **📦 INVENTORY & WAREHOUSE**
    ```plaintext
    📁 /services/inventory.ts
    📁 /controllers/inventory.ts
    📁 /schemas/inventory.ts
    📁 /routes/inventory.ts
    ```
    * `Warehouse` - Kho hàng
    * `InventoryItem` - Nguyên liệu
    * `InventoryTransaction` - Giao dịch kho
    * `InventoryBalance` - Số dư kho
    * `WarehouseTransfer` - Chuyển kho
    * `WarehouseTransferItem` - Chi tiết chuyển kho
    * `WarehouseReceipt` - Phiếu nhập kho
    * `WarehouseReceiptItem` - Chi tiết nhập kho
    * `WarehouseIssue` - Phiếu xuất kho
    * `WarehouseIssueItem` - Chi tiết xuất kho

7.  **🏭 SUPPLY CHAIN**
    ```plaintext
    📁 /services/supply.ts
    📁 /controllers/supply.ts
    📁 /schemas/supply.ts
    📁 /routes/supply.ts
    ```
    * `Supplier` - Nhà cung cấp
    * `SupplierItem` - Sản phẩm nhà cung cấp
    * `PurchaseOrder` - Đơn mua hàng
    * `PurchaseOrderItem` - Chi tiết đơn mua hàng

8.  **💰 PROMOTION & MARKETING**
    ```plaintext
    📁 /services/promotion.ts
    📁 /controllers/promotion.ts
    📁 /schemas/promotion.ts
    📁 /routes/promotion.ts
    ```
    * `Voucher` - Mã giảm giá
    * `VoucherUsage` - Sử dụng mã giảm giá
    * `Promotion` - Khuyến mại
    * `PromotionMenuItem` - Món ăn khuyến mại

9.  **⭐ REVIEW & FEEDBACK**
    ```plaintext
    📁 /services/feedback.ts
    📁 /controllers/feedback.ts
    📁 /schemas/feedback.ts
    📁 /routes/feedback.ts
    ```
    * `Review` - Đánh giá
    * `Conversation` - Cuộc trò chuyện
    * `Message` - Tin nhắn

10. **📊 ANALYTICS & REPORTING**
    ```plaintext
    📁 /services/analytics.ts
    📁 /controllers/analytics.ts
    📁 /schemas/analytics.ts
    📁 /routes/analytics.ts
    ```
    * `RevenueReport` - Báo cáo doanh thu
    * `KpiMetric` - Chỉ số KPI
    * `AnalyticsEventLog` - Log sự kiện phân tích
    * `UserStatistics` - Thống kê người dùng

11. **🔔 NOTIFICATION & SYSTEM**
    ```plaintext
    📁 /services/notification.ts
    📁 /controllers/notification.ts
    📁 /schemas/notification.ts
    📁 /routes/notification.ts
    ```
    * `Notification` - Thông báo
    * `SystemConfig` - Cấu hình hệ thống
    * `AuditLog` - Log kiểm toán
    * `DeviceToken` - Token thiết bị

12. **🛍️ MARKETPLACE & RETAIL**
    ```plaintext
    📁 /services/marketplace.ts
    📁 /controllers/marketplace.ts
    📁 /schemas/marketplace.ts
    📁 /routes/marketplace.ts
    ```
    * `RetailProduct` - Sản phẩm bán lẻ
    * `Cart` - Giỏ hàng
    * `CartItem` - Sản phẩm trong giỏ
    * `CartItemOption` - Tùy chọn sản phẩm trong giỏ

13. **🏠 CUSTOMER & ADDRESS**
    ```plaintext
    📁 /services/customer.ts
    📁 /controllers/customer.ts
    📁 /schemas/customer.ts
    📁 /routes/customer.ts
    ```
    * `Address` - Địa chỉ khách hàng

14. **💳 TAX & FINANCE**
    ```plaintext
    📁 /services/finance.ts
    📁 /controllers/finance.ts
    📁 /schemas/finance.ts
    📁 /routes/finance.ts
    ```
    * `TaxRate` - Thuế suất
    * `OrderTax` - Thuế đơn hàng

15. **📁 STORAGE & ASSETS**
    ```plaintext
    📁 /services/storage.ts
    📁 /controllers/storage.ts
    📁 /schemas/storage.ts
    📁 /routes/storage.ts
    ```
    * `Asset` - Tài nguyên file

---

## 🎯 Cấu trúc thư mục đề xuất:

```plaintext
apps/api/
├── services/
│   ├── organization.ts # User, Organization, Restaurant
│   ├── menu.ts         # Menu, Category, MenuItem
│   ├── restaurant.ts   # Table, Reservation, Staff
│   ├── order.ts        # Order, Payment
│   ├── delivery.ts     # Delivery, Logistics
│   ├── inventory.ts    # Warehouse, Inventory
│   ├── supply.ts       # Supplier, Purchase
│   ├── promotion.ts    # Voucher, Promotion
│   ├── feedback.ts     # Review, Conversation
│   ├── analytics.ts    # Reports, KPI
│   ├── notification.ts # Notification, Config
│   ├── marketplace.ts  # Retail, Cart
│   ├── customer.ts     # Address
│   ├── finance.ts      # Tax
│   └── storage.ts      # Assets
├── controllers/
│   ├── organization.ts
│   ├── menu.ts
│   ├── restaurant.ts
│   ├── order.ts
│   ├── delivery.ts
│   ├── inventory.ts
│   ├── supply.ts
│   ├── promotion.ts
│   ├── feedback.ts
│   ├── analytics.ts
│   ├── notification.ts
│   ├── marketplace.ts
│   ├── customer.ts
│   ├── finance.ts
│   └── storage.ts
├── schemas/
│   ├── organization.ts
│   ├── menu.ts
│   ├── restaurant.ts
│   ├── order.ts
│   ├── delivery.ts
│   ├── inventory.ts
│   ├── supply.ts
│   ├── promotion.ts
│   ├── feedback.ts
│   ├── analytics.ts
│   ├── notification.ts
│   ├── marketplace.ts
│   ├── customer.ts
│   ├── finance.ts
│   └── storage.ts
└── routes/
    ├── organization.ts
    ├── menu.ts
    ├── restaurant.ts
    ├── order.ts
    ├── delivery.ts
    ├── inventory.ts
    ├── supply.ts
    ├── promotion.ts
    ├── feedback.ts
    ├── analytics.ts
    ├── notification.ts
    ├── marketplace.ts
    ├── customer.ts
    ├── finance.ts
    └── storage.ts
```

---

## 🚀 Lợi ích của cách chia này:
1.  **Modularity:** Mỗi nhóm có trách nhiệm rõ ràng
2.  **Scalability:** Dễ mở rộng và maintain
3.  **Team Collaboration:** Nhiều dev có thể làm việc song song
4.  **Code Organization:** Dễ tìm và sửa code
5.  **Testing:** Dễ viết unit test cho từng module
6.  **API Design:** RESTful API rõ ràng theo domain

---