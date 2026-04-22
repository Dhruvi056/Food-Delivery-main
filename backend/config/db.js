import insforge from "./insforge.js";

/**
 * Generic database query wrapper for InsForge PostgreSQL.
 * @param {string} table - Table name
 * @param {function} callback - Query builder function
 * @returns {Promise<any>} - Query result data
 */
export const dbQuery = async (table, callback) => {
  const query = insforge.database.from(table);
  const { data, error } = await callback(query);
  
  if (error) {
    console.error(`DB Error [${table}]:`, error.message);
    throw new Error(error.message);
  }
  
  return data;
};
