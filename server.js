const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const crypto = require('crypto'); // For SHA256

const app = express();
const PORT = 3000;

const USERS_FILE = path.join(__dirname, 'users.json');
const CANDIDATES_FILE = path.join(__dirname, 'candidates.json');
const CHAIN_FILE = path.join(__dirname, 'chain.json');
const CONFIG_FILE = path.join(__dirname, 'config.json');

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// ==========================================
// BLOCKCHAIN IMPLEMENTATION
// ==========================================
class Block {
    constructor(index, timestamp, data, previousHash = '') {
        this.index = index;
        this.timestamp = timestamp;
        this.data = data; // { voterId, candidateId }
        this.previousHash = previousHash;
        this.hash = this.calculateHash();
    }

    calculateHash() {
        return crypto.createHash('sha256').update(
            this.index + this.previousHash + this.timestamp + JSON.stringify(this.data)
        ).digest('hex');
    }
}

class Blockchain {
    constructor() {
        this.chain = this.loadChain();
    }

    createGenesisBlock() {
        return new Block(0, Date.now(), "Genesis Block", "0");
    }

    loadChain() {
        if (fs.existsSync(CHAIN_FILE)) {
            const data = fs.readFileSync(CHAIN_FILE, 'utf8');
            const chainData = JSON.parse(data || '[]');
            if (chainData.length > 0) return chainData;
        }
        const genesis = this.createGenesisBlock();
        this.saveChain([genesis]);
        return [genesis];
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    addBlock(data) {
        const previousBlock = this.getLatestBlock();
        const newBlock = new Block(
            this.chain.length,
            Date.now(),
            data,
            previousBlock.hash
        );
        this.chain.push(newBlock);
        this.saveChain(this.chain);
        return newBlock;
    }

    isChainValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            // Re-calculate hash to ensure data hasn't changed
            const tempBlock = new Block(currentBlock.index, currentBlock.timestamp, currentBlock.data, currentBlock.previousHash);
            if (currentBlock.hash !== tempBlock.calculateHash()) return false;

            if (currentBlock.previousHash !== previousBlock.hash) return false;
        }
        return true;
    }

    saveChain(chain) {
        fs.writeFileSync(CHAIN_FILE, JSON.stringify(chain, null, 2));
    }

    hasUserVoted(voterId) {
        // Skip Genesis block (index 0)
        for (let i = 1; i < this.chain.length; i++) {
            if (this.chain[i].data.voterId === voterId) {
                return true;
            }
        }
        return false;
    }
}

const ballotiqChain = new Blockchain();

// ==========================================
// HELPERS
// ==========================================
const readJson = (file) => {
    if (!fs.existsSync(file)) return [];
    try {
        const data = fs.readFileSync(file, 'utf8');
        return JSON.parse(data || '[]');
    } catch { return []; }
};

const writeJson = (file, data) => {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
};

// ==========================================
// ROUTES
// ==========================================

// --- AUTH & USERS ---

app.get('/users', (req, res) => {
    const users = readJson(USERS_FILE);
    res.json(users);
});

app.post('/register', (req, res) => {
    const newUser = req.body;
    const users = readJson(USERS_FILE);

    const exists = users.find(u => u.email === newUser.email || u.voterid === newUser.voterid);
    if (exists) return res.status(400).json({ error: 'User already exists.' });

    newUser.registrationDate = new Date().toLocaleString();
    if (!newUser.role) newUser.role = 'user';
    newUser.status = 'Verified';
    // Initialize voting status from blockchain existence check could be done here, 
    // but we dynamically check on login/dashboard usually.

    users.push(newUser);
    writeJson(USERS_FILE, users);

    res.status(201).json({ message: 'Registration successful', user: newUser });
});

app.post('/login', (req, res) => {
    // Frontend sends 'identifier', but we support 'email' or 'voterid'
    const { email, identifier, password } = req.body;
    const loginId = identifier || email; // normalize

    const users = readJson(USERS_FILE);

    // 1. Check Admin (Hardcoded: admin@gmail.com / admin123)
    if (loginId === 'admin@gmail.com' && password === 'admin123') {
        return res.json({
            success: true,
            user: {
                fullname: 'Administrator',
                email: 'admin@gmail.com',
                role: 'admin'
            }
        });
    }

    // 2. Check Regular Users (Match Email OR Voter ID)
    const user = users.find(u =>
        (u.email === loginId || u.voterid === loginId) && u.password === password
    );

    if (user) {
        // Update login status/time if needed
        user.loginStatus = 'Logged In';
        user.lastLoginTime = new Date().toLocaleString();

        // Update user in file
        const index = users.findIndex(u => u.email === user.email);
        if (index !== -1) {
            users[index] = user;
            writeJson(USERS_FILE, users);
        }

        return res.json({ success: true, user: user });
    }

    return res.status(401).json({ error: 'Invalid credentials.' });
});

// --- CANDIDATES ---

app.get('/candidates', (req, res) => {
    const candidates = readJson(CANDIDATES_FILE);
    res.json(candidates);
});

app.post('/candidates', (req, res) => {
    // In a real app, verify Admin token here.
    const { candidateId, name, designation } = req.body;
    if (!candidateId || !name) return res.status(400).json({ error: 'Missing fields' });

    const candidates = readJson(CANDIDATES_FILE);
    const newCandidate = {
        id: Date.now(),
        candidateId,
        name,
        designation
    };

    candidates.push(newCandidate);
    writeJson(CANDIDATES_FILE, candidates);

    res.json({ success: true, candidate: newCandidate });
});

app.delete('/candidates/:id', (req, res) => {
    const id = parseInt(req.params.id);
    let candidates = readJson(CANDIDATES_FILE);
    candidates = candidates.filter(c => c.id !== id);
    writeJson(CANDIDATES_FILE, candidates);
    res.json({ success: true });
});

// --- VOTING (BLOCKCHAIN) ---

app.post('/vote', (req, res) => {
    console.log('[VOTE DEBUG] Raw Body:', req.body); // Check what is received
    const { voterId, candidateId, candidateName } = req.body;

    if (!voterId || !candidateId) {
        console.error('[VOTE DEBUG] Missing Fields - Voter:', voterId, 'Candidate:', candidateId);
        return res.status(400).json({ error: 'Missing voterId or candidateId' });
    }

    // 0. Validate Voter and Candidate
    const users = readJson(USERS_FILE);
    const candidates = readJson(CANDIDATES_FILE);

    console.log(`[VOTE DEBUG] Request - User: ${voterId}, Candidate: ${candidateId}`);

    const validVoter = users.find(u => String(u.voterid) === String(voterId));
    if (!validVoter) {
        console.log(`[VOTE DEBUG] Invalid Voter ID: ${voterId}`);
        return res.status(400).json({ error: `Invalid Voter ID: '${voterId}'. Please login again.` });
    }

    const validCandidate = candidates.find(c => String(c.candidateId) === String(candidateId) || String(c.id) === String(candidateId));
    if (!validCandidate) {
        console.log(`[VOTE DEBUG] Invalid Candidate ID: ${candidateId}`);
        return res.status(400).json({ error: `Invalid Candidate ID: '${candidateId}'.` });
    }

    // 1. Check if user already voted
    if (ballotiqChain.hasUserVoted(voterId)) {
        return res.status(400).json({ error: 'You have already voted! Duplicate votes are not allowed.' });
    }

    // 2. Add to Blockchain
    const voteData = { voterId, candidateId, candidateName };
    const newBlock = ballotiqChain.addBlock(voteData);

    console.log(`Vote cast by ${voterId} for ${candidateName}. Block Hash: ${newBlock.hash}`);

    res.json({ success: true, block: newBlock });
});

app.get('/blockchain', (req, res) => {
    res.json(ballotiqChain.chain);
});

app.get('/vote-status/:voterId', (req, res) => {
    const { voterId } = req.params;
    const hasVoted = ballotiqChain.hasUserVoted(voterId);
    res.json({ hasVoted });
});

// --- RESULTS (ADMIN MODULE) ---

app.get('/results', (req, res) => {
    const config = readJson(CONFIG_FILE); // { resultsPublished: true/false }
    const isAdmin = req.query.admin === 'true';

    // If Admin requests it (we'd usually check token, but here we can just pass a query param or assume public/admin distinction)
    // For simplicity: If published=false, return "Pending" unless 'admin' param is present? 
    // Actually, logic is: Public sees pending. Admin sees status.

    if (!config.resultsPublished && !isAdmin) {
        // Return minimal status
        return res.json({ published: false, results: [] });
    }

    // IF published, aggregate votes
    const chain = ballotiqChain.chain;
    const candidates = readJson(CANDIDATES_FILE);

    // Initialize counters
    const results = candidates.map(c => ({
        id: c.candidateId,
        name: c.name,
        party: c.designation,
        votes: 0
    }));

    // Tally votes (Skip Genesis)
    for (let i = 1; i < chain.length; i++) {
        const block = chain[i];
        const vote = block.data; // { candidateId, ... }

        const candidate = results.find(r => r.id === vote.candidateId);
        if (candidate) {
            candidate.votes++;
        }
    }

    res.json({ published: true, results: results });
});

app.post('/publish-results', (req, res) => {
    const config = readJson(CONFIG_FILE);
    config.resultsPublished = true;
    writeJson(CONFIG_FILE, config);
    res.json({ success: true, message: 'Results Published' });
});

app.post('/unpublish-results', (req, res) => {
    const config = readJson(CONFIG_FILE);
    config.resultsPublished = false;
    writeJson(CONFIG_FILE, config);
    res.json({ success: true, message: 'Results Unpublished' });
});

app.get('/results-status', (req, res) => {
    const config = readJson(CONFIG_FILE);
    res.json({ published: config.resultsPublished || false });
});


app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
