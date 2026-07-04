const fs = require('fs');
const path = require('path');

class MockDatabase {
  constructor(dbPath, callback) {
    this.dbPath = dbPath;
    this.data = { ourlog: [], myinfo: [] };

    try {
      if (fs.existsSync(this.dbPath)) {
        const content = fs.readFileSync(this.dbPath, 'utf8');
        try {
          this.data = JSON.parse(content);
          // Ensure structure
          if (!this.data.ourlog) this.data.ourlog = [];
          if (!this.data.myinfo) this.data.myinfo = [];
        } catch (e) {
          // If the file is a binary SQLite file or corrupted, start clean
          console.log('Database file at', dbPath, 'is not valid JSON (could be a binary SQLite database). Initializing fresh state...');
          this.save();
        }
      } else {
        this.save();
      }
    } catch (err) {
      console.error('Failed to initialize mock database:', err.message);
    }

    if (callback) {
      process.nextTick(() => callback(null));
    }
  }

  save() {
    try {
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error('Failed to write mock database:', err.message);
    }
  }

  serialize(callback) {
    if (callback) callback();
  }

  run(sql, params, callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    if (!params) params = [];

    const normalized = sql.trim().replace(/\s+/g, ' ');
    let err = null;
    let context = { lastID: null, changes: 0 };

    try {
      if (normalized.startsWith('CREATE TABLE')) {
        // Mock table creation is a no-op as they are already initialized in constructor
        context.changes = 0;
      } else if (normalized.startsWith('INSERT INTO ourlog')) {
        // INSERT INTO ourlog (fullname, user, password) VALUES (?, ?, ?)
        const [fullname, email, password] = params;
        const nextId = this.data.ourlog.reduce((max, u) => Math.max(max, u.id || 0), 0) + 1;
        const newUser = {
          id: nextId,
          fullname,
          user: email,
          password,
          created_at: new Date().toISOString()
        };
        this.data.ourlog.push(newUser);
        this.save();
        context.lastID = nextId;
        context.changes = 1;
      } else if (normalized.startsWith('INSERT OR REPLACE INTO myinfo') || normalized.startsWith('INSERT INTO myinfo')) {
        // INSERT OR REPLACE INTO myinfo (id, firstname, lastname, gender) VALUES (?, ?, ?, ?)
        const [id, firstname, lastname, gender] = params;
        const idx = this.data.myinfo.findIndex(m => m.id === id);
        const member = { id, firstname, lastname, gender };
        if (idx !== -1) {
          this.data.myinfo[idx] = member;
        } else {
          this.data.myinfo.push(member);
        }
        this.save();
        context.lastID = id;
        context.changes = 1;
      } else {
        console.warn('Unhandled SQL run statement in Mock DB:', sql);
      }
    } catch (e) {
      err = e;
    }

    if (callback) {
      process.nextTick(() => callback.call(context, err));
    }
  }

  get(sql, params, callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    if (!params) params = [];

    const normalized = sql.trim().replace(/\s+/g, ' ');
    let row = null;
    let err = null;

    try {
      if (normalized.startsWith('SELECT id FROM ourlog WHERE user =')) {
        const email = params[0];
        const user = this.data.ourlog.find(u => u.user === email);
        if (user) {
          row = { id: user.id };
        }
      } else if (normalized.startsWith('SELECT * FROM ourlog WHERE user =')) {
        const email = params[0];
        row = this.data.ourlog.find(u => u.user === email) || null;
      } else {
        console.warn('Unhandled SQL get statement in Mock DB:', sql);
      }
    } catch (e) {
      err = e;
    }

    if (callback) {
      process.nextTick(() => callback(null, row));
    }
  }

  all(sql, params, callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    if (!params) params = [];

    const normalized = sql.trim().replace(/\s+/g, ' ');
    let rows = [];
    let err = null;

    try {
      if (normalized.startsWith('SELECT id, firstname, lastname, gender FROM myinfo')) {
        rows = this.data.myinfo;
      } else {
        console.warn('Unhandled SQL all statement in Mock DB:', sql);
      }
    } catch (e) {
      err = e;
    }

    if (callback) {
      process.nextTick(() => callback(null, rows));
    }
  }

  close(callback) {
    if (callback) {
      process.nextTick(() => callback(null));
    }
  }
}

module.exports = {
  Database: MockDatabase,
  verbose: function() {
    return this;
  }
};
