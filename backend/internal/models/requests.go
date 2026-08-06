package models

type CreateProductRequest struct {
	SKU               string   `json:"sku" validate:"required,min=1,max=50"`
	Name              string   `json:"name" validate:"required,min=1,max=200"`
	Description       *string  `json:"description"`
	CategoryID        *int     `json:"category_id"`
	UnitOfMeasure     string   `json:"unit_of_measure" validate:"required"`
	WeightKg          *float64 `json:"weight_kg" validate:"omitempty,min=0"`
	CostPrice         *float64 `json:"cost_price" validate:"omitempty,min=0"`
	SellingPrice      *float64 `json:"selling_price" validate:"omitempty,min=0"`
	WholesalePrice    *float64 `json:"wholesale_price" validate:"omitempty,min=0"`
	Status            string   `json:"status" validate:"omitempty,oneof=active discontinued pending"`
	InitialQuantity   *int     `json:"initial_quantity" validate:"omitempty,min=0"`
	InitialLocationID *int     `json:"initial_location_id" validate:"omitempty,min=1"`
}

type UpdateProductRequest struct {
	Name          *string  `json:"name" validate:"omitempty,min=1,max=200"`
	Description   *string  `json:"description"`
	CategoryID    *int     `json:"category_id"`
	UnitOfMeasure *string  `json:"unit_of_measure"`
	WeightKg      *float64 `json:"weight_kg" validate:"omitempty,min=0"`
	CostPrice     *float64 `json:"cost_price" validate:"omitempty,min=0"`
	SellingPrice  *float64 `json:"selling_price" validate:"omitempty,min=0"`
	WholesalePrice *float64 `json:"wholesale_price" validate:"omitempty,min=0"`
	Status        *string  `json:"status" validate:"omitempty,oneof=active discontinued pending"`
}

type CreateCategoryRequest struct {
	Name             string  `json:"name" validate:"required,min=1,max=200"`
	Description      *string `json:"description"`
	ParentCategoryID *int    `json:"parent_category_id"`
	IsActive         *bool   `json:"is_active"`
}

type UpdateCategoryRequest struct {
	Name             *string `json:"name" validate:"omitempty,min=1,max=200"`
	Description      *string `json:"description"`
	ParentCategoryID *int    `json:"parent_category_id"`
	IsActive         *bool   `json:"is_active"`
}

type CreateLocationRequest struct {
	Code             string  `json:"code" validate:"required,min=1,max=50"`
	Name             string  `json:"name" validate:"required,min=1,max=200"`
	LocationType     string  `json:"location_type" validate:"required"`
	ParentLocationID *int    `json:"parent_location_id"`
	Capacity         *int    `json:"capacity" validate:"omitempty,min=0"`
	IsActive         *bool   `json:"is_active"`
}

type UpdateLocationRequest struct {
	Name             *string `json:"name" validate:"omitempty,min=1,max=200"`
	LocationType     *string `json:"location_type"`
	ParentLocationID *int    `json:"parent_location_id"`
	Capacity         *int    `json:"capacity" validate:"omitempty,min=0"`
	IsActive         *bool   `json:"is_active"`
}

type CreateSupplierRequest struct {
	Code          string  `json:"code" validate:"required,min=1,max=50"`
	Name          string  `json:"name" validate:"required,min=1,max=200"`
	ContactPerson *string `json:"contact_person"`
	Email         *string `json:"email" validate:"omitempty,email"`
	Phone         *string `json:"phone"`
	PaymentTerms  *string `json:"payment_terms"`
	IsActive      *bool   `json:"is_active"`
}

type UpdateSupplierRequest struct {
	Name          *string `json:"name" validate:"omitempty,min=1,max=200"`
	ContactPerson *string `json:"contact_person"`
	Email         *string `json:"email" validate:"omitempty,email"`
	Phone         *string `json:"phone"`
	PaymentTerms  *string `json:"payment_terms"`
	IsActive      *bool   `json:"is_active"`
}

type CreateCustomerRequest struct {
	Code         string  `json:"code"`
	Name         string  `json:"name" validate:"required,min=1,max=200"`
	Email        *string `json:"email" validate:"omitempty,email"`
	Phone        *string `json:"phone"`
	Address      *string `json:"address"`
	CustomerType string  `json:"customer_type" validate:"omitempty,oneof=wholesale retail"`
	IsActive     *bool   `json:"is_active"`
}

type UpdateCustomerRequest struct {
	Name         *string `json:"name" validate:"omitempty,min=1,max=200"`
	Email        *string `json:"email" validate:"omitempty,email"`
	Phone        *string `json:"phone"`
	Address      *string `json:"address"`
	CustomerType *string `json:"customer_type" validate:"omitempty,oneof=wholesale retail"`
	IsActive     *bool   `json:"is_active"`
}

type SaleItemRequest struct {
	ProductID int `json:"product_id" validate:"required,min=1"`
	Quantity  int `json:"quantity" validate:"required,min=1"`
}

type CreateSaleRequest struct {
	CustomerID    *int              `json:"customer_id" validate:"omitempty,min=1"`
	LocationID    int               `json:"location_id" validate:"required,min=1"`
	PaymentMethod string            `json:"payment_method" validate:"required,oneof=cash card split other"`
	Items         []SaleItemRequest `json:"items" validate:"required,min=1,dive"`
}

type CreateReturnRequest struct {
	SaleItemID int     `json:"sale_item_id" validate:"required,min=1"`
	Quantity   int     `json:"quantity" validate:"required,min=1"`
	Reason     *string `json:"reason"`
}

type ReceiveRequest struct {
	ProductID         int      `json:"product_id" validate:"required,min=1"`
	LocationID        int      `json:"location_id" validate:"required,min=1"`
	Quantity          int      `json:"quantity" validate:"required,min=1"`
	UnitCost          float64  `json:"unit_cost" validate:"min=0"`
	ReferenceDocument *string  `json:"reference_document"`
	Notes             *string  `json:"notes"`
}

type ShipRequest struct {
	ProductID         int      `json:"product_id" validate:"required,min=1"`
	LocationID        int      `json:"location_id" validate:"required,min=1"`
	Quantity          int      `json:"quantity" validate:"required,min=1"`
	UnitCost          float64  `json:"unit_cost" validate:"min=0"`
	ReferenceDocument *string  `json:"reference_document"`
	Notes             *string  `json:"notes"`
}

type TransferRequest struct {
	ProductID         int      `json:"product_id" validate:"required,min=1"`
	FromLocationID    int      `json:"from_location_id" validate:"required,min=1"`
	ToLocationID      int      `json:"to_location_id" validate:"required,min=1"`
	Quantity          int      `json:"quantity" validate:"required,min=1"`
	UnitCost          float64  `json:"unit_cost" validate:"min=0"`
	ReferenceDocument *string  `json:"reference_document"`
	Notes             *string  `json:"notes"`
}

type AdjustRequest struct {
	ProductID         int     `json:"product_id" validate:"required,min=1"`
	LocationID        int     `json:"location_id" validate:"required,min=1"`
	AdjustmentQty     int     `json:"adjustment_quantity" validate:"required,ne=0"`
	Reason            string  `json:"reason" validate:"required,min=1"`
	ReferenceDocument *string `json:"reference_document"`
}
