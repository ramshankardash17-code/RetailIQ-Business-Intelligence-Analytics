from sqlalchemy import Column, String, Integer, Float, Date, DateTime, Boolean, ForeignKey, Index
from sqlalchemy.orm import relationship
from retailiq.backend.app.db.session import Base

class Store(Base):
    __tablename__ = "stores"

    store_id = Column(String(20), primary_key=True)
    store_name = Column(String(100), nullable=False)
    city = Column(String(50), nullable=False)
    state = Column(String(50), nullable=False)
    region = Column(String(30), nullable=False, index=True)
    store_type = Column(String(40), nullable=False)
    square_feet = Column(Integer, default=5000)
    opening_date = Column(Date, nullable=False)
    manager_name = Column(String(100), nullable=True)

    sales = relationship("Sale", back_populates="store")
    inventory = relationship("Inventory", back_populates="store")

class Customer(Base):
    __tablename__ = "customers"

    customer_id = Column(String(20), primary_key=True)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    email = Column(String(100), nullable=False)
    phone = Column(String(30), nullable=True)
    city = Column(String(50), nullable=False)
    state = Column(String(50), nullable=False)
    region = Column(String(30), nullable=False, index=True)
    customer_segment = Column(String(40), nullable=False, default="Potential Loyalists", index=True)
    signup_date = Column(Date, nullable=False, index=True)

    sales = relationship("Sale", back_populates="customer")

class Product(Base):
    __tablename__ = "products"

    product_id = Column(String(20), primary_key=True)
    product_name = Column(String(150), nullable=False)
    category = Column(String(50), nullable=False, index=True)
    subcategory = Column(String(50), nullable=False, index=True)
    cost_price = Column(Float, nullable=False)
    unit_price = Column(Float, nullable=False)
    target_margin_pct = Column(Float, default=35.0)
    reorder_point = Column(Integer, default=30)
    safety_stock = Column(Integer, default=15)
    is_active = Column(Boolean, default=True)

    sales = relationship("Sale", back_populates="product")
    inventory = relationship("Inventory", back_populates="product")

class Promotion(Base):
    __tablename__ = "promotions"

    promo_id = Column(String(20), primary_key=True)
    promo_name = Column(String(100), nullable=False)
    promo_type = Column(String(50), nullable=False)
    discount_pct = Column(Float, default=0.0)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)

    sales = relationship("Sale", back_populates="promotion")

class Sale(Base):
    __tablename__ = "sales"

    order_id = Column(String(30), primary_key=True)
    product_id = Column(String(20), ForeignKey("products.product_id"), primary_key=True)
    order_date = Column(Date, nullable=False, index=True)
    order_timestamp = Column(DateTime, nullable=False)
    customer_id = Column(String(20), ForeignKey("customers.customer_id"), nullable=False, index=True)
    store_id = Column(String(20), ForeignKey("stores.store_id"), nullable=False, index=True)
    promo_id = Column(String(20), ForeignKey("promotions.promo_id"), nullable=True)
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Float, nullable=False)
    cost_price = Column(Float, nullable=False)
    discount_amount = Column(Float, default=0.0)
    gross_revenue = Column(Float, nullable=False)
    net_revenue = Column(Float, nullable=False)
    profit = Column(Float, nullable=False)
    payment_method = Column(String(30), default="Credit Card")
    is_returned = Column(Boolean, default=False)

    customer = relationship("Customer", back_populates="sales")
    product = relationship("Product", back_populates="sales")
    store = relationship("Store", back_populates="sales")
    promotion = relationship("Promotion", back_populates="sales")

class Inventory(Base):
    __tablename__ = "inventory"

    inventory_id = Column(String(30), primary_key=True)
    product_id = Column(String(20), ForeignKey("products.product_id"), nullable=False)
    store_id = Column(String(20), ForeignKey("stores.store_id"), nullable=False)
    current_stock = Column(Integer, default=0, index=True)
    safety_stock = Column(Integer, default=15)
    reorder_level = Column(Integer, default=30)
    last_restocked_date = Column(Date, nullable=False)

    product = relationship("Product", back_populates="inventory")
    store = relationship("Store", back_populates="inventory")

class Return(Base):
    __tablename__ = "returns"

    return_id = Column(String(30), primary_key=True)
    order_id = Column(String(30), nullable=False, index=True)
    product_id = Column(String(20), nullable=False, index=True)
    return_date = Column(Date, nullable=False, index=True)
    return_reason = Column(String(100), nullable=False)
    refund_amount = Column(Float, nullable=False)
