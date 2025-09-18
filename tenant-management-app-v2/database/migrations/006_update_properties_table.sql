ALTER TABLE properties
RENAME COLUMN zip_code TO postcode;

ALTER TABLE properties
DROP COLUMN total_units;
