// Frontend database service that communicates with the backend
export class Database {
  constructor() {
    // Use environment variable for API URL, fallback to relative path
    this.apiUrl = import.meta.env.VITE_API_URL || "/api";
    
    // Debug: Log the API URL being used
    console.log('🔧 Database API URL:', this.apiUrl);
    console.log('🔧 Current origin:', window.location.origin);
  }

  async handleResponse(response) {
    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Unknown error occurred" }));
      console.error("API Error:", errorData);
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }
    return response.json();
  }

  async getAllPersons() {
    try {
      const response = await fetch(`${this.apiUrl}/persons`);
      return this.handleResponse(response);
    } catch (error) {
      console.error("Error in getAllPersons:", error);
      throw error;
    }
  }

  async searchPersons(term) {
    try {
      const response = await fetch(
        `${this.apiUrl}/persons/search?term=${encodeURIComponent(term)}`
      );
      return this.handleResponse(response);
    } catch (error) {
      console.error("Error in searchPersons:", error);
      throw error;
    }
  }

  async addPerson(personData) {
    try {
      const response = await fetch(`${this.apiUrl}/persons`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(personData),
      });
      return this.handleResponse(response);
    } catch (error) {
      console.error("Error in addPerson:", error);
      throw error;
    }
  }

  async updateStatus(criteria, value, status) {
    try {
      const response = await fetch(`${this.apiUrl}/persons/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ criteria, value, status }),
      });
      return this.handleResponse(response);
    } catch (error) {
      console.error("Error in updateStatus:", error);
      throw error;
    }
  }

  async updatePerson(updatedPerson) {
    try {
      const response = await fetch(
        `${this.apiUrl}/persons/${updatedPerson.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedPerson),
        }
      );
      return this.handleResponse(response);
    } catch (error) {
      console.error("Error in updatePerson:", error);
      throw error;
    }
  }

  async deletePerson(listNumber) {
    try {
      const deleteUrl = `${this.apiUrl}/persons?id=${listNumber}`;
      console.log('🔧 DELETE URL:', deleteUrl);
      
      const response = await fetch(deleteUrl, {
        method: "DELETE",
      });
      return this.handleResponse(response);
    } catch (error) {
      console.error("Error in deletePerson:", error);
      throw error;
    }
  }

  async getPersonById(id) {
    try {
      const response = await fetch(`${this.apiUrl}/persons/${id}`);
      return this.handleResponse(response);
    } catch (error) {
      console.error("Error in getPersonById:", error);
      throw error;
    }
  }

  async updatePersonStatus(personId, status) {
    try {
      const response = await fetch(
        `${this.apiUrl}/persons/${personId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update person status");
      }

      return await response.json();
    } catch (error) {
      console.error("Error updating person status:", error);
      throw error;
    }
  }
}
