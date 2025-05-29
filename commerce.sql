-- Active: 1741678042001@@127.0.0.1@5432@ecommerce_db
CREATE DATABASE ecommerce_db;
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);
ALTER TABLE users ADD COLUMN access_token VARCHAR(255);
DROP TABLE users;
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100), 
    description TEXT,
    price DECIMAL(10,2),
    image_url TEXT
);
DROP TABLE products;
CREATE TABLE cart (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1
);
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    total_amount DECIMAL(10,2),
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE orders
ADD COLUMN status VARCHAR(50) DEFAULT 'Pending';  
ALTER TABLE orders ADD COLUMN address_id INTEGER REFERENCES address(id) ON DELETE CASCADE;


CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER,
    price DECIMAL(10,2)
);
SELECT * FROM order_items;

INSERT INTO users (name, email, password) 
VALUES 
('Shoyeb', 'shoyeb@example.com', 'password123'),
('joe', 'joe@example.com', 'password456'),
('John Doe', 'john@example.com', 'password789');

INSERT INTO products (name, category, description, price, image_url) 
VALUES 
('Leather Jacket', 'Men', 'Stylish black leather jacket.', 99.99, 'https://images.unsplash.com/photo-1675877879221-871aa9f7c314?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),
('Denim Jeans', 'Men', 'Comfortable denim jeans for casual wear.', 49.99, 'https://www.vecteezy.com/photo/17603213-blue-jeans-isolated-on-white-background-jeans-stacked'),
('Winter Coat', 'Men', 'Warm winter coat for cold weather.', 120.99, 'https://www.vecteezy.com/photo/46861750-man-standing-in-front-of-clothing-rack'),
('Men’s Sneakers', 'Men', 'Comfortable sneakers for all-day wear.', 79.99, 'https://www.vecteezy.com/photo/54579923-brown-suede-sneakers-with-laces'),
('Casual Shirt', 'Men', 'Cotton shirt for casual outings.', 35.99, 'https://www.vecteezy.com/photo/48147472-colorful-casual-sports-shirts-for-summer'),
('Silk Dress', 'Women', 'Elegant red silk dress for parties.', 129.99, 'https://www.vecteezy.com/photo/57684667-model-in-luxurious-fashion-surrounded-by-a-dramatic-intense-background-lighting'),
('Cotton Blouse', 'Women', 'Light and breathable cotton blouse.', 49.99, 'https://www.vecteezy.com/photo/33882965-beautiful-asian-woman-in-white-suit-sitting-on-chair-ai-generated'),
('Leather Boots', 'Women', 'Stylish leather boots for winter.', 89.99, 'https://www.vecteezy.com/photo/37039286-ai-generated-red-boots-and-gardening-gloves-on-wood-floor-red-and-beige-garden-scissors'),
('Floral Skirt', 'Women', 'Colorful floral skirt for summer.', 59.99, 'https://www.vecteezy.com/photo/11920614-spa-treatment-at-tropical-resort'),
('Chic Handbag', 'Women', 'Elegant handbag for everyday use.', 75.99, 'https://www.vecteezy.com/photo/40549051-ai-generated-blank-white-handbag-mockup'),
('Gold Necklace', 'Jewelry', 'Beautiful gold necklace with diamonds.', 199.99, 'https://www.vecteezy.com/photo/50632128-necklace-isolated-on-white-background'),
('Silver Earrings', 'Jewelry', 'Elegant silver earrings for all occasions.', 89.99, 'https://www.vecteezy.com/photo/49603210-a-pair-of-earrings-with-diamonds-on-a-black-background'),
('Diamond Ring', 'Jewelry', 'Luxury diamond ring for special moments.', 499.99, 'https://www.vecteezy.com/photo/53187304-elegant-diamond-ring-on-a-sparkling-purple-background'),
('Gold Bracelet', 'Jewelry', 'Stylish gold bracelet for daily wear.', 129.99, 'https://www.vecteezy.com/photo/58075673-golden-wedding-ring-3d-illustration'),
('Pearl Necklace', 'Jewelry', 'Classic pearl necklace for elegant looks.', 249.99, 'https://www.vecteezy.com/photo/49231661-elegant-white-jewelry-styled-mannequin');

SELECT * FROM PRODUCTS;
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1675877879221-871aa9f7c314?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' WHERE name = 'Leather Jacket';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1666358084770-1ed681525d72?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' WHERE name = 'Denim Jeans';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1513089176717-55db930c2e2a?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' WHERE name = 'Winter Coat';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1723375386859-1731f1518a9c?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' WHERE name = 'Men’s Sneakers';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1623658580851-3b25bf83b4ea?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Q290dG9uJTIwc2hpcnQlMjBmb3IlMjBjYXN1YWwlMjBvdXRpbmdzJTIwZm9yJTIwbWVufGVufDB8fDB8fHww' WHERE name = 'Casual Shirt';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1673637082239-5e88bfcab495?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8RWxlZ2FudCUyMHJlZCUyMHNpbGslMjBkcmVzcyUyMCUyMGZvciUyMHdvbWV8ZW58MHx8MHx8fDA%3D' WHERE name = 'Silk Dress';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1715441330070-3c74704ab287?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8TGlnaHQlMjBhbmQlMjBicmVhdGhhYmxlJTIwY290dG9uJTIwYmxvdXNlfGVufDB8fDB8fHww' WHERE name = 'Cotton Blouse';
UPDATE products SET image_url = 'https://plus.unsplash.com/premium_photo-1681506563584-a47c1856a031?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8U3R5bGlzaCUyMGxlYXRoZXIlMjBib290cyUyMGZvciUyMHdpbnRlciUyMGZvciUyMHdvbWV8ZW58MHx8MHx8fDA%3D' WHERE name = 'Leather Boots';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1656424692994-736ccef90d8e?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8Q29sb3JmdWwlMjBza2lydCUyMGZvciUyMHN1bW1lcnxlbnwwfHwwfHx8MA%3D%3D' WHERE name = 'Floral Skirt';
UPDATE products SET image_url = 'https://plus.unsplash.com/premium_photo-1664392147011-2a720f214e01?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8RWxlZ2FudCUyMGhhbmRiYWclMjBmb3IlMjBldmVyeWRheSUyMHVzZXxlbnwwfHwwfHx8MA%3D%3D' WHERE name = 'Chic Handbag';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1721103418312-b0057a8c31c2?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8QmVhdXRpZnVsJTIwZ29sZCUyMG5lY2tsYWNlJTIwd2l0aCUyMGRpYW1vbmRzfGVufDB8fDB8fHww' WHERE name = 'Gold Necklace';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1721808085170-ee8d1f9c6812?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8RWxlZ2FudCUyMHNpbHZlciUyMGVhcnJpbmdzJTIwZm9yJTIwYWxsJTIwb2NjYXNpb25zfGVufDB8fDB8fHww' WHERE name = 'Silver Earrings';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1677316732918-e1acafda522c?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8THV4dXJ5JTIwZGlhbW9uZCUyMHJpbmd8ZW58MHx8MHx8fDA%3D' WHERE name = 'Diamond Ring';
UPDATE products SET image_url = 'https://plus.unsplash.com/premium_photo-1679768606052-be0b8a88fef1?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8U3R5bGlzaCUyMGdvbGQlMjBicmFjZWxldHxlbnwwfHwwfHx8MA%3D%3D' WHERE name = 'Gold Bracelet';
UPDATE products SET image_url = 'https://plus.unsplash.com/premium_photo-1681276168324-a6f1958aa191?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8Q2xhc3NpYyUyMHBlYXJsJTIwbmVja2xhY2V8ZW58MHx8MHx8fDA%3D' WHERE name = 'Pearl Necklace';

INSERT INTO cart (user_id, product_id, quantity)
VALUES 
(1, 1, 1), 
(1, 2, 1), 
(1, 3, 1),
(2, 4, 1), 
(2, 5, 1), 
(2, 6, 1), 
(3, 7, 1), 
(3, 8, 1), 
(3, 9, 1);

INSERT INTO orders (user_id, total_amount) 
VALUES 
(1, 200.00),  
(2, 129.99),  
(3, 199.99);  

UPDATE users SET password = '$2y$12$RXHs3OsB8FWdW3hQraOQrO2PLh0nMFyjVEjeOxSDQq.x9LNRC/G6q' WHERE email = 'shoyeb@example.com';
UPDATE users SET password = '$2y$12$O8wB.EZUADAzUFI.5ZrSAOS0991.HicpTm8CEcDREi5aowRCEyYRa' WHERE email = 'joe@example.com';
UPDATE users SET password = '$2y$12$7md1No3EzPZX1SIelLctIu0cztFVAXckdWa7uDVQHC5NWIUCufulu' WHERE email = 'john@example.com';

INSERT INTO order_items (order_id, product_id, quantity, price) 
VALUES 
(1, 1, 2, 99.99),  
(2, 2, 1, 49.99),  
(3, 3, 1, 120.99); 


SELECT * from users;

SELECT * from cart;
SELECT * from products;
SELECT * from orders;

SELECT * FROM order_items;
CREATE TABLE admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);
ALTER TABLE admin_users
ADD COLUMN access_token VARCHAR(255);
ALTER TABLE admin_users
ADD COLUMN email VARCHAR(100);
ALTER TABLE admin_users
ALTER COLUMN email SET NOT NULL;
UPDATE products
SET category = 'Jewelry'
WHERE id = 20;
ALTER TABLE admin_users
ADD CONSTRAINT unique_email UNIQUE (email);
SELECT * FROM admin_users;

CREATE TABLE address (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(100),
    phone VARCHAR(15),
    address_line1 TEXT,
    address_line2 TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100)
);
INSERT INTO admin_users (username, password, access_token)
VALUES 
('adminshoyeb', 'admin123', NULL),
('adminjack', 'admin456', NULL);
INSERT INTO address (user_id, full_name, phone, address_line1, address_line2, city, state, postal_code, country) VALUES
(1, 'Shoyeb Ahmed', '9876543210', '123 A Block', 'Near Main Road', 'Hyderabad', 'Telangana', '500001', 'India'),
(2, 'Joe Smith', '9123456789', '456 B Street', 'Next to Supermarket', 'Pune', 'Maharashtra', '411001', 'India'),
(3, 'John Doe', '9988776655', '789 C Lane', 'Opposite Park', 'Delhi', 'Delhi', '110001', 'India'),
(4, 'Dhruvv Thacker', '9001122334', '101 D Tower', 'Beside School', 'Ahmedabad', 'Gujarat', '380001', 'India'),
(5, 'Test User', '9112233445', '999 Z Street', 'Behind Temple', 'Bangalore', 'Karnataka', '560001', 'India');
UPDATE admin_users
SET email = 'adminshoyeb@example.com'
WHERE username = 'adminshoyeb';

UPDATE admin_users
SET email = 'adminjack@example.com'
WHERE username = 'adminjack';
ALTER TABLE admin_users ADD COLUMN admin_id SERIAL PRIMARY KEY;

ALTER TABLE orders
ADD COLUMN payment_status VARCHAR(20) DEFAULT 'unpaid';
ALTER TABLE orders ADD COLUMN payment_id VARCHAR(100);

SELECT * FROM admin_users;
SELECT * FROM cart;
select * from users;
select * from orders;

