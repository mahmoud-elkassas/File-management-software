// Simple in-memory database for Vercel serverless functions
// In production, you should use a proper database like PostgreSQL, MongoDB, etc.

let persons = [];
let smsHistory = [];

export class DbService {
  // Person methods
  async getAllPersons() {
    return persons;
  }

  async getPersonById(id) {
    return persons.find(p => p.id === parseInt(id));
  }

  async getPersonByListNumber(listNumber) {
    return persons.find(p => p.list_number === listNumber);
  }

  async searchPersons(term) {
    const searchTerm = term.toLowerCase();
    return persons.filter(person => 
      person.name.toLowerCase().includes(searchTerm) ||
      person.phone.includes(searchTerm) ||
      person.list_number.includes(searchTerm) ||
      person.receipt_number.includes(searchTerm) ||
      person.register_number.includes(searchTerm) ||
      person.request_name.toLowerCase().includes(searchTerm)
    );
  }

  async addPerson(personData) {
    const newPerson = {
      id: persons.length + 1,
      ...personData,
      date: personData.date || new Date().toISOString().split('T')[0]
    };
    persons.push(newPerson);
    return newPerson;
  }

  async updatePerson(personData) {
    const index = persons.findIndex(p => p.id === personData.id);
    if (index === -1) {
      throw new Error('Person not found');
    }
    persons[index] = { ...persons[index], ...personData };
    return persons[index];
  }

  updateStatus(criteria, value, status) {
    const updatedPersons = [];
    persons.forEach(person => {
      if (person[criteria] === value) {
        person.status = status;
        updatedPersons.push(person);
      }
    });
    return updatedPersons;
  }

  async deletePerson(listNumber) {
    const index = persons.findIndex(p => p.list_number === listNumber);
    if (index === -1) {
      throw new Error('Person not found');
    }
    persons.splice(index, 1);
    return { success: true };
  }

  async updatePersonStatus(personId, status) {
    const person = persons.find(p => p.id === parseInt(personId));
    if (!person) {
      return null;
    }
    person.status = status;
    return person;
  }

  // SMS methods
  async addSmsHistory(entry) {
    const newEntry = {
      id: smsHistory.length + 1,
      ...entry,
      sent_at: new Date().toISOString()
    };
    smsHistory.push(newEntry);
    return newEntry;
  }

  getSmsHistory() {
    return smsHistory;
  }

  async getSmsHistoryByMessage(to, message) {
    return smsHistory.find(entry => 
      entry.to_number === to && 
      entry.message === message &&
      new Date(entry.sent_at) > new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
    );
  }

  checkDuplicateSms(id) {
    return smsHistory.some(entry => 
      entry.to_number === id &&
      new Date(entry.sent_at) > new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
    );
  }
} 