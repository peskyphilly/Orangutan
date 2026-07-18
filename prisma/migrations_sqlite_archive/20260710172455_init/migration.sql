-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "price" INTEGER,
    "perHead" INTEGER,
    "capacity" INTEGER,
    "kitchen" BOOLEAN,
    "rigging" BOOLEAN,
    "stepFree" BOOLEAN,
    "halal" BOOLEAN,
    "needsKitchen" BOOLEAN,
    "needsRigging" BOOLEAN,
    "staging" BOOLEAN,
    "recPct" INTEGER NOT NULL,
    "recEvents" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "Composition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "brief" TEXT NOT NULL,
    "teams" TEXT NOT NULL,
    "reference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'composed'
);
