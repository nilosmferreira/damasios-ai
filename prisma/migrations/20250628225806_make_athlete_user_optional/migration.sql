/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `athletes` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "athletes" DROP CONSTRAINT "athletes_user_id_fkey";

-- AlterTable
ALTER TABLE "athletes" ADD COLUMN     "email" TEXT,
ALTER COLUMN "user_id" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "athletes_email_key" ON "athletes"("email");

-- AddForeignKey
ALTER TABLE "athletes" ADD CONSTRAINT "athletes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
