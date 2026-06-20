package models

import "time"

type Product struct {
	ProductID     int       `json:"id"`
	SKU           string    `json:"sku"`
	Name          string    `json:"name"`
	Description   *string   `json:"description,omitempty"`
	CategoryID    *int      `json:"category_id,omitempty"`
	UnitOfMeasure string    `json:"unit_of_measure"`
	WeightKg      *float64  `json:"weight_kg,omitempty"`
	CostPrice     *float64  `json:"cost_price,omitempty"`
	SellingPrice  *float64  `json:"price,omitempty"`
	Status        string    `json:"status"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type Category struct {
	CategoryID       int       `json:"id"`
	Name             string    `json:"name"`
	Description      *string   `json:"description,omitempty"`
	ParentCategoryID *int      `json:"parent_category_id,omitempty"`
	IsActive         bool      `json:"is_active"`
	CreatedAt        time.Time `json:"created_at"`
}

type Location struct {
	LocationID       int       `json:"id"`
	Code             string    `json:"code"`
	Name             string    `json:"name"`
	LocationType     string    `json:"location_type"`
	ParentLocationID *int      `json:"parent_location_id,omitempty"`
	Capacity         *int      `json:"capacity,omitempty"`
	IsActive         bool      `json:"is_active"`
	CreatedAt        time.Time `json:"created_at"`
}

type Supplier struct {
	SupplierID    int       `json:"id"`
	Code          string    `json:"code"`
	Name          string    `json:"name"`
	ContactPerson *string   `json:"contact_person,omitempty"`
	Email         *string   `json:"email,omitempty"`
	Phone         *string   `json:"phone,omitempty"`
	PaymentTerms  *string   `json:"payment_terms,omitempty"`
	IsActive      bool      `json:"is_active"`
	CreatedAt     time.Time `json:"created_at"`
}

type Movement struct {
	MovementID        int       `json:"id"`
	ProductID         int       `json:"product_id"`
	LocationID        int       `json:"location_id"`
	MovementTypeID    int       `json:"movement_type_id"`
	Quantity          int       `json:"quantity"`
	UnitCost          *float64  `json:"unit_cost,omitempty"`
	ReferenceDocument *string   `json:"reference_document,omitempty"`
	Notes             *string   `json:"notes,omitempty"`
	CreatedBy         string    `json:"created_by"`
	CreatedAt         time.Time `json:"created_at"`
}

type StockLevel struct {
	ProductID          int        `json:"product_id"`
	SKU                string     `json:"sku"`
	ProductName        string     `json:"product_name"`
	CategoryName       *string    `json:"category_name,omitempty"`
	LocationID         int        `json:"location_id"`
	LocationCode       string     `json:"location_code"`
	LocationName       string     `json:"location_name"`
	QuantityOnHand     int        `json:"quantity_on_hand"`
	QuantityReserved   int        `json:"quantity_reserved"`
	QuantityAvailable  int        `json:"quantity_available"`
	LastMovementAt     *time.Time `json:"last_movement_at,omitempty"`
	InventoryValueCost *float64   `json:"inventory_value_cost,omitempty"`
}

type LowStockAlert struct {
	ProductID         int     `json:"product_id"`
	SKU               string  `json:"sku"`
	ProductName       string  `json:"product_name"`
	LocationCode      string  `json:"location_code"`
	QuantityAvailable int     `json:"quantity_available"`
	ReorderPoint      int     `json:"reorder_point"`
	UnitsBelowReorder int     `json:"units_below_reorder"`
	StockStatus       string  `json:"stock_status"`
	PreferredSupplier *string `json:"preferred_supplier,omitempty"`
	LeadTimeDays      *int    `json:"lead_time_days,omitempty"`
}

type OperationResult struct {
	Success       bool   `json:"success"`
	Message       string `json:"message"`
	MovementID    *int   `json:"movement_id,omitempty"`
	NewStockLevel *int   `json:"new_stock_level,omitempty"`
}

type TransferResult struct {
	Success        bool   `json:"success"`
	Message        string `json:"message"`
	MovementOutID  *int   `json:"movement_out_id,omitempty"`
	MovementInID   *int   `json:"movement_in_id,omitempty"`
	FromStockLevel *int   `json:"from_stock_level,omitempty"`
	ToStockLevel   *int   `json:"to_stock_level,omitempty"`
}

type ProductStockSummary struct {
	ProductID               int      `json:"product_id"`
	SKU                     string   `json:"sku"`
	ProductName             string   `json:"product_name"`
	CategoryName            *string  `json:"category_name,omitempty"`
	LocationCount           int      `json:"location_count"`
	TotalQuantityOnHand     int      `json:"total_quantity_on_hand"`
	TotalQuantityAvailable  int      `json:"total_quantity_available"`
	TotalInventoryValueCost *float64 `json:"total_inventory_value_cost,omitempty"`
}

type AgingRecord struct {
	ProductID      int      `json:"product_id"`
	SKU            string   `json:"sku"`
	ProductName    string   `json:"product_name"`
	LocationCode   string   `json:"location_code"`
	QuantityOnHand int      `json:"quantity_on_hand"`
	DaysInStock    int      `json:"days_in_stock"`
	AgingBucket    string   `json:"aging_bucket"`
	InventoryValue *float64 `json:"inventory_value,omitempty"`
}

type SupplierPerformance struct {
	SupplierID       int      `json:"supplier_id"`
	SupplierName     string   `json:"supplier_name"`
	ProductsSupplied int      `json:"products_supplied"`
	AvgDeliveryDays  *float64 `json:"avg_delivery_days,omitempty"`
	OnTimeRate       *float64 `json:"on_time_rate,omitempty"`
	AvgQuality       *float64 `json:"avg_quality,omitempty"`
}

type ValuationRecord struct {
	ProductID       int      `json:"product_id"`
	LocationID      int      `json:"location_id"`
	QuantityOnHand  int      `json:"quantity_on_hand"`
	Value           *float64 `json:"value,omitempty"`
	AverageUnitCost *float64 `json:"average_unit_cost,omitempty"`
}
