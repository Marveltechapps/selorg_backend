/**
 * Field filtering middleware - Allow clients to select specific fields
 * Usage: ?fields=name,email,mobileNumber
 */

/**
 * Parse fields parameter
 * @param {string} fields - Comma-separated field names
 * @returns {Object} Mongoose select object
 */
function parseFields(fields) {
  if (!fields) return null;
  
  return fields.split(',').reduce((acc, field) => {
    acc[field.trim()] = 1;
    return acc;
  }, {});
}

/**
 * Field filtering middleware
 */
const fieldFilter = (req, res, next) => {
  // Store original json method
  const originalJson = res.json.bind(res);

  // Override json method
  res.json = function(data) {
    if (req.query.fields && data && typeof data === 'object') {
      const fields = req.query.fields.split(',').map(f => f.trim());
      
      // Filter data object
      if (data.data) {
        if (Array.isArray(data.data)) {
          data.data = data.data.map(item => filterObject(item, fields));
        } else if (typeof data.data === 'object') {
          data.data = filterObject(data.data, fields);
        }
      }
    }

    return originalJson(data);
  };

  next();
};

/**
 * Filter object to include only specified fields
 * @param {Object} obj - Object to filter
 * @param {Array<string>} fields - Fields to include
 * @returns {Object}
 */
function filterObject(obj, fields) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const filtered = {};
  
  for (const field of fields) {
    if (obj.hasOwnProperty(field)) {
      filtered[field] = obj[field];
    }
  }
  
  // Always include id if present
  if (obj.id || obj._id) {
    filtered.id = obj.id || obj._id;
  }
  
  return filtered;
}

module.exports = { fieldFilter, parseFields, filterObject };

