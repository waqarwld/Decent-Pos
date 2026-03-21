package repository

import "errors"

// ErrNotFound is returned when a requested resource does not exist in the DB.
var ErrNotFound = errors.New("not found")

// ErrDuplicateSKU is returned when a product insert violates the unique SKU constraint.
var ErrDuplicateSKU = errors.New("SKU already exists")
