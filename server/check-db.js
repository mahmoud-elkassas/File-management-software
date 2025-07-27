import { DbService } from "./db.js";

const db = new DbService();

async function checkDatabase() {
  try {
    console.log("All persons in database:");
    const allPersons = await db.getAllPersons();
    console.log(allPersons);

    if (allPersons.length > 0) {
      console.log("\nPerson with ID 1:");
      const person = await db.getPersonById(1);
      console.log(person);
    }
  } catch (error) {
    console.error("Error checking database:", error);
  }
}

checkDatabase();
