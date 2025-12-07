const API_URL = 'http://127.0.0.1:3000';

const api = {
    async register(userData) {
        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return { error: 'Connection failed' };
        }
    },

    async login(credentials) {
        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials)
            });
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return { error: 'Connection failed' };
        }
    },

    async getUsers() {
        try {
            const response = await fetch(`${API_URL}/users`);
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return [];
        }
    },

    async getCandidates() {
        try {
            const response = await fetch(`${API_URL}/candidates`);
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return [];
        }
    },

    async addCandidate(candidateData) {
        try {
            const response = await fetch(`${API_URL}/candidates`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(candidateData)
            });
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return { error: 'Connection failed' };
        }
    },

    async removeCandidate(id) {
        try {
            const response = await fetch(`${API_URL}/candidates/${id}`, {
                method: 'DELETE'
            });
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return { error: 'Connection failed' };
        }
    },

    async vote(voteData) {
        try {
            const response = await fetch(`${API_URL}/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(voteData)
            });
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return { error: 'Connection failed' };
        }
    },

    async getVoteStatus(voterId) {
        try {
            const response = await fetch(`${API_URL}/vote-status/${voterId}`);
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            // Default to false so we don't block them if offline, but server will reject if true
            return { hasVoted: false, error: 'Connection failed' };
        }
    },

    // Results Module
    async getResults(isAdmin = false) {
        try {
            const query = isAdmin ? '?admin=true' : '';
            const response = await fetch(`${API_URL}/results${query}`);
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return { published: false, error: 'Connection failed' };
        }
    },

    async getResultsStatus() {
        try {
            const response = await fetch(`${API_URL}/results-status`);
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return { published: false };
        }
    },

    async publishResults() {
        try {
            const response = await fetch(`${API_URL}/publish-results`, { method: 'POST' });
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return { error: 'Connection failed' };
        }
    },

    async unpublishResults() {
        try {
            const response = await fetch(`${API_URL}/unpublish-results`, { method: 'POST' });
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return { error: 'Connection failed' };
        }
    }
};
