const mongoose = require('mongoose');

// In-memory database
const db = {
  users: [],
  equipment: [],
  maintenances: [],
  alerts: []
};

// Map model names to db keys
const getCollection = (modelName) => {
  const name = modelName.toLowerCase();
  if (name === 'user') return db.users;
  if (name === 'equipment') return db.equipment;
  if (name === 'maintenance') return db.maintenances;
  if (name === 'alert') return db.alerts;
  db[name] = db[name] || [];
  return db[name];
};

// Generate MongoDB-like ObjectIds
const generateId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Helper to compare values (handles ObjectId to string and ObjectId to ObjectId)
const isEqual = (a, b) => {
  if (a === b) return true;
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    if (a.toString && b.toString) {
      return a.toString() === b.toString();
    }
  }
  if (a && typeof a === 'object' && a.toString) {
    return a.toString() == b;
  }
  if (b && typeof b === 'object' && b.toString) {
    return b.toString() == a;
  }
  return a == b;
};

// Helper to check match
const matchQuery = (item, query) => {
  if (!query || Object.keys(query).length === 0) return true;
  for (const key in query) {
    if (key === '$or') {
      const orArray = query[key];
      const match = orArray.some(subQuery => matchQuery(item, subQuery));
      if (!match) return false;
      continue;
    }
    if (key === '$match' || key === '$group' || key === '$sort') continue;
    
    // Support regex
    if (query[key] && query[key].$regex) {
      const regex = new RegExp(query[key].$regex, query[key].$options || '');
      if (!regex.test(item[key])) return false;
      continue;
    }
    
    // Support comparison operators
    if (query[key] && typeof query[key] === 'object' && !Array.isArray(query[key])) {
      const val = item[key];
      const operator = Object.keys(query[key])[0];
      const target = query[key][operator];
      if (operator === '$gte' && !(val >= target)) return false;
      if (operator === '$lte' && !(val <= target)) return false;
      if (operator === '$gt' && !(val > target)) return false;
      if (operator === '$lt' && !(val < target)) return false;
      continue;
    }

    if (!isEqual(item[key], query[key])) return false;
  }
  return true;
};

// Chainable query builder mock
class MockQuery {
  constructor(collection, results, modelName) {
    this.collection = collection;
    this.results = results;
    this.modelName = modelName;
    this._populateFields = [];
  }

  populate(fields) {
    if (typeof fields === 'string') {
      this._populateFields.push(fields);
    } else if (Array.isArray(fields)) {
      this._populateFields = [...this._populateFields, ...fields];
    } else if (fields && typeof fields === 'object') {
      if (fields.path) this._populateFields.push(fields.path);
    }
    return this;
  }

  sort(sortObj) {
    if (!sortObj) return this;
    const key = Object.keys(sortObj)[0];
    const order = sortObj[key];
    this.results.sort((a, b) => {
      if (a[key] < b[key]) return order === 1 ? -1 : 1;
      if (a[key] > b[key]) return order === 1 ? 1 : -1;
      return 0;
    });
    return this;
  }

  skip(n) {
    this.results = this.results.slice(n);
    return this;
  }

  limit(n) {
    this.results = this.results.slice(0, n);
    return this;
  }

  select(fields) {
    return this;
  }

  then(onResolve, onReject) {
    // Perform populates before resolving
    const populatedResults = this.results.map(item => {
      const newItem = { ...item };
      this._populateFields.forEach(field => {
        // e.g. field = 'equipment' or 'technician' or 'scheduledBy'
        if (newItem[field]) {
          const refId = newItem[field].toString();
          // Find in other collections
          let refItem = null;
          if (field === 'equipment') {
            refItem = db.equipment.find(e => e._id && e._id.toString() === refId);
          } else if (field === 'technician' || field === 'scheduledBy' || field === 'resolvedBy' || field === 'createdBy') {
            refItem = db.users.find(u => u._id && u._id.toString() === refId);
          }
          if (refItem) {
            newItem[field] = { ...refItem };
          }
        }
      });
      return newItem;
    });

    return Promise.resolve(populatedResults).then(onResolve, onReject);
  }

  catch(onReject) {
    return this.then().catch(onReject);
  }
}

// Intercept mongoose model compilation
const originalModel = mongoose.model;
mongoose.model = function(name, schema) {
  // If model already compiled, return it
  try {
    return originalModel.call(mongoose, name);
  } catch (e) {
    // Model doesn't exist yet, compile it and wrap it
  }

  const model = originalModel.call(mongoose, name, schema);
  const collection = getCollection(name);

  // Override model queries
  model.find = function(query = {}) {
    const matched = collection.filter(item => matchQuery(item, query));
    return new MockQuery(collection, matched, name);
  };

  model.findOne = function(query = {}) {
    const matched = collection.find(item => matchQuery(item, query));
    return {
      then: (resolve) => {
        if (!matched) return resolve(null);
        // Add matchPassword compatibility for User model
        const userObj = {
          ...matched,
          matchPassword: async function(enteredPassword) {
            // Check plain passwords or bcrypt hashed if we want, but since it's a seed we can just compare plain text or do simple validation
            // Let's do simple matching: either bcrypt matches or plain text matches
            const bcrypt = require('bcryptjs');
            try {
              return await bcrypt.compare(enteredPassword, matched.password);
            } catch (err) {
              return enteredPassword === matched.password;
            }
          },
          save: async function() {
            const index = collection.findIndex(item => item._id && matched._id && item._id.toString() === matched._id.toString());
            if (index !== -1) {
              collection[index] = { ...collection[index], ...this };
            }
            return this;
          }
        };
        resolve(userObj);
      },
      select: function(fields) {
        return this;
      }
    };
  };

  model.findById = function(id) {
    const idStr = id ? id.toString() : '';
    const matched = collection.find(item => item._id && item._id.toString() === idStr);
    return {
      populate: function(fields) {
        return this;
      },
      select: function(fields) {
        return this;
      },
      then: (resolve) => {
        if (!matched) return resolve(null);
        resolve({
          ...matched,
          save: async function() {
            const index = collection.findIndex(item => item._id && matched._id && item._id.toString() === matched._id.toString());
            if (index !== -1) {
              collection[index] = { ...collection[index], ...this };
            }
            return this;
          }
        });
      }
    };
  };

  // Get schema defaults helper
  const getDefaults = () => {
    const recordDefaults = {};
    if (schema && schema.paths) {
      for (const path in schema.paths) {
        const defaultValue = schema.paths[path].defaultValue;
        if (defaultValue !== undefined) {
          recordDefaults[path] = typeof defaultValue === 'function'
            ? defaultValue()
            : defaultValue;
        }
      }
    }
    return recordDefaults;
  };

  model.create = async function(data) {
    const records = Array.isArray(data) ? data : [data];
    const createdRecords = [];
    
    for (const record of records) {
      const recordDefaults = getDefaults();
      const newRecord = {
        _id: generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
        ...recordDefaults,
        ...record
      };

      // Hash password if User model
      if (name.toLowerCase() === 'user' && newRecord.password) {
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        newRecord.password = await bcrypt.hash(newRecord.password, salt);
      }

      collection.push(newRecord);
      createdRecords.push(newRecord);
    }

    return Array.isArray(data) ? createdRecords : createdRecords[0];
  };

  model.insertMany = async function(data) {
    return this.create(data);
  };

  model.findByIdAndUpdate = function(id, update, options = {}) {
    const idStr = id ? id.toString() : '';
    const index = collection.findIndex(item => item._id && item._id.toString() === idStr);
    let updatedItem = null;
    if (index !== -1) {
      collection[index] = {
        ...collection[index],
        ...update,
        updatedAt: new Date()
      };
      updatedItem = collection[index];
    }
    return {
      populate: function(fields) {
        return this;
      },
      then: (resolve) => resolve(updatedItem)
    };
  };

  model.findByIdAndDelete = function(id) {
    const idStr = id ? id.toString() : '';
    const index = collection.findIndex(item => item._id && item._id.toString() === idStr);
    let deletedItem = null;
    if (index !== -1) {
      deletedItem = collection.splice(index, 1)[0];
    }
    return {
      then: (resolve) => resolve(deletedItem)
    };
  };

  model.countDocuments = async function(query = {}) {
    return collection.filter(item => matchQuery(item, query)).length;
  };

  model.deleteMany = async function(query = {}) {
    if (Object.keys(query).length === 0) {
      collection.length = 0;
    } else {
      for (let i = collection.length - 1; i >= 0; i--) {
        if (matchQuery(collection[i], query)) {
          collection.splice(i, 1);
        }
      }
    }
    return { deletedCount: collection.length };
  };

  model.aggregate = async function(pipeline) {
    // Support basic group and match aggregates for dashboard statistics
    let results = [...collection];
    
    for (const stage of pipeline) {
      if (stage.$match) {
        results = results.filter(item => matchQuery(item, stage.$match));
      }
      if (stage.$group) {
        const groupField = stage.$group._id;
        const groups = {};
        
        results.forEach(item => {
          let key = '';
          if (typeof groupField === 'string' && groupField.startsWith('$')) {
            key = item[groupField.substring(1)] || 'unknown';
          } else if (groupField && typeof groupField === 'object') {
            if (groupField.$dateToString) {
              const dateField = groupField.$dateToString.date;
              const fieldName = dateField.startsWith('$') ? dateField.substring(1) : dateField;
              const dateVal = item[fieldName];
              if (dateVal && dateVal instanceof Date) {
                const yyyy = dateVal.getFullYear();
                const mm = String(dateVal.getMonth() + 1).padStart(2, '0');
                key = `${yyyy}-${mm}`;
              } else if (dateVal) {
                const dateObj = new Date(dateVal);
                if (!isNaN(dateObj.getTime())) {
                  const yyyy = dateObj.getFullYear();
                  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
                  key = `${yyyy}-${mm}`;
                } else {
                  key = 'unknown';
                }
              } else {
                key = 'unknown';
              }
            }
          }
          
          groups[key] = groups[key] || { _id: key, count: 0, totalCost: 0, cost: 0 };
          groups[key].count += 1;
          if (item.cost) {
            groups[key].totalCost += item.cost;
            groups[key].cost += item.cost;
          }
        });
        
        results = Object.values(groups);
      }
      if (stage.$sort) {
        const key = Object.keys(stage.$sort)[0];
        const order = stage.$sort[key];
        results.sort((a, b) => {
          if (a[key] < b[key]) return order === 1 ? -1 : 1;
          if (a[key] > b[key]) return order === 1 ? 1 : -1;
          return 0;
        });
      }
    }
    
    return results;
  };

  return model;
};

// Override connection to always succeed immediately
mongoose.connect = async function() {
  console.log('✅ Mock MongoDB Active (In-Memory Database Layer Running)');
  return {
    connection: {
      host: 'in-memory-mock-db'
    }
  };
};

module.exports = db;
