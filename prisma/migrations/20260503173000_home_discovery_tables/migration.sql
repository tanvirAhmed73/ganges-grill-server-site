-- CreateEnum
CREATE TYPE "RestaurantSection" AS ENUM ('featured', 'deal_nao', 'fast_delivery');

-- CreateTable
CREATE TABLE "cuisines" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "filter_tags" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cuisines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_deals" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "bg_class" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "filter_tags" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_deals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "eta" TEXT NOT NULL,
    "rating" DECIMAL(2,1) NOT NULL,
    "image" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "restaurants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurant_placements" (
    "id" TEXT NOT NULL,
    "restaurant_id" TEXT NOT NULL,
    "section" "RestaurantSection" NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "restaurant_placements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "top_brands" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color_class" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "top_brands_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cuisines_name_key" ON "cuisines"("name");

-- CreateIndex
CREATE UNIQUE INDEX "daily_deals_title_key" ON "daily_deals"("title");

-- CreateIndex
CREATE INDEX "restaurants_name_idx" ON "restaurants"("name");

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_placements_restaurant_id_section_key" ON "restaurant_placements"("restaurant_id", "section");

-- CreateIndex
CREATE INDEX "restaurant_placements_section_sort_order_idx" ON "restaurant_placements"("section", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "top_brands_name_key" ON "top_brands"("name");

-- AddForeignKey
ALTER TABLE "restaurant_placements" ADD CONSTRAINT "restaurant_placements_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
