-- Names may now be any length from 1 to 60 characters (the 20-character minimum is removed)
ALTER TABLE "users"  DROP CONSTRAINT "users_name_length";
ALTER TABLE "stores" DROP CONSTRAINT "stores_name_length";
ALTER TABLE "users"  ADD CONSTRAINT "users_name_length"  CHECK (char_length("name") BETWEEN 1 AND 60);
ALTER TABLE "stores" ADD CONSTRAINT "stores_name_length" CHECK (char_length("name") BETWEEN 1 AND 60);
