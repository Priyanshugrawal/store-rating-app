-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER', 'OWNER');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "address" VARCHAR(400) NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stores" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "address" VARCHAR(400) NOT NULL,
    "owner_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ratings" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "store_id" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ratings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_name_idx" ON "users"("name");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "stores_email_key" ON "stores"("email");

-- CreateIndex
CREATE UNIQUE INDEX "stores_owner_id_key" ON "stores"("owner_id");

-- CreateIndex
CREATE INDEX "stores_name_idx" ON "stores"("name");

-- CreateIndex
CREATE INDEX "stores_address_idx" ON "stores"("address");

-- CreateIndex
CREATE INDEX "ratings_store_id_idx" ON "ratings"("store_id");

-- CreateIndex
CREATE UNIQUE INDEX "ratings_user_id_store_id_key" ON "ratings"("user_id", "store_id");

-- AddForeignKey
ALTER TABLE "stores" ADD CONSTRAINT "stores_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Extra integrity rules that Prisma cannot express in schema.prisma
-- ---------------------------------------------------------------------------

-- Ratings must be whole numbers from 1 to 5
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_rating_between_1_and_5" CHECK ("rating" BETWEEN 1 AND 5);

-- Lengths required by the validation rules (name 20-60, address <= 400)
ALTER TABLE "users"  ADD CONSTRAINT "users_name_length"    CHECK (char_length("name") BETWEEN 20 AND 60);
ALTER TABLE "stores" ADD CONSTRAINT "stores_name_length"   CHECK (char_length("name") BETWEEN 20 AND 60);
ALTER TABLE "users"  ADD CONSTRAINT "users_address_length"  CHECK (char_length("address") <= 400);
ALTER TABLE "stores" ADD CONSTRAINT "stores_address_length" CHECK (char_length("address") <= 400);

-- A store may only be owned by a user whose role is OWNER
CREATE OR REPLACE FUNCTION enforce_store_owner_role() RETURNS trigger AS $$
BEGIN
  IF NEW."owner_id" IS NOT NULL AND
     (SELECT "role" FROM "users" WHERE "id" = NEW."owner_id") IS DISTINCT FROM 'OWNER' THEN
    RAISE EXCEPTION 'Store owner must be a user with the OWNER role' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "stores_owner_role_check"
BEFORE INSERT OR UPDATE OF "owner_id" ON "stores"
FOR EACH ROW EXECUTE FUNCTION enforce_store_owner_role();
