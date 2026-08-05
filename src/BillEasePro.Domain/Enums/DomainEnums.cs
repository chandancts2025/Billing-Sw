namespace BillEasePro.Domain.Enums;

public enum UserRole { SuperAdmin = 1, Admin = 2, Operator = 3 }
public enum ShopType { Pharmacy = 1, Grocery, Fashion, Restaurant, Hotel, General }
public enum SettingDataType { String = 1, Bool, Int, Decimal, JSON }
public enum TaxType { GST = 1, VAT, Custom }
public enum CouponDiscountType { Percentage = 1, Flat }
public enum CustomerType { Retail = 1, Wholesale }
public enum BillDiscountType { Percentage = 1, Flat }
public enum BillPaymentMode { Cash = 1, Card, UPI, Credit, Mixed }
public enum BillStatus { Draft = 1, Confirmed, Cancelled }
public enum PurchaseStatus { Draft = 1, Received, PartiallyPaid, Paid }
public enum StockMovementType { Purchase = 1, Sale, Return, Adjustment, Opening }
public enum StockMovementDirection { In = 1, Out }
public enum NotificationSeverity { Info = 1, Warning = 2, Critical = 3 }
public enum ExpenseApprovalStatus { Pending = 1, Approved = 2, Rejected = 3 }
public enum AdjustmentStatus { Draft = 1, Pending = 2, Approved = 3, Rejected = 4 }
public enum StockAdjustmentType { Damage = 1, Theft = 2, Found = 3, Correction = 4, OpeningBalance = 5 }
public enum PaymentMethod { Cash = 1, Card, UPI, NetBanking, Cheque, Credit, Split, Others }
public enum PaymentStatus { Pending = 1, Partial = 2, Paid = 3 }
public enum ReturnStatus { Requested = 1, Approved = 2, Rejected = 3 }
public enum SalesInvoiceStatus { Draft = 1, Confirmed = 2, Cancelled = 3 }
public enum UnitType { Piece = 1, Kg = 2, Kilogram = 2, Pack = 3, Liter = 4, Meter = 5, Box = 6 }
public enum TaxRegime { GST = 1, VAT, Other }
public enum DiscountValueType { Percentage = 1, Flat = 2, FlatAmount = 2 }
public enum IndustryType { Pharmacy = 1, Grocery, Fashion, Restaurant, Hotel, Retail }
public enum Gender { NotSpecified = 0, Female = 1, Male = 2, NonBinary = 3, PreferNotToSay = 4 }
public enum OtpPurpose { EmailVerification = 1, PhoneVerification = 2, PasswordReset = 3 }
public enum PurchaseOrderStatus { Draft = 1, Ordered = 2, PartiallyReceived = 3, Received = 4, Cancelled = 5 }
public enum InventoryBatchStatus { Available = 1, Quarantined = 2, Expired = 3, Consumed = 4 }
public enum FoodType { NotApplicable = 0, Veg = 1, NonVeg = 2 }
public enum SupplierLedgerEntryType { Purchase = 1, Payment = 2, DebitNote = 3, OpeningBalance = 4 }
