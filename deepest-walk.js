const { forEach, map } = require("advarr");
const replaceKey = require("replace-key");

// utility functions
const isAry = (it) => Array.isArray(it);
const isNul = (it) => it === null;
const isObj = (it) => !Array.isArray(it) && !isNul(it) && typeof it === "object";
const isStr = (it) => typeof it === "string";
const isNum = (it) => typeof it === "number";

// doing split strings on /(?= )/ splits "a cow jumped" to [ 'a', ' cow', ' jumped' ]
function walk({
  callback,
  data,
  debug = false,
  path = [],
  split_strings_on = null, // alternative is " " if you want to split on words
  include_sep = false, // defaults to including separator in beginging if exists
  max_path_length: m = Infinity,
  split_keys = undefined,
  types,
}) {
  // saving args to pass down
  let args = arguments[0];

  if (split_keys === undefined) {
    split_keys = split_strings_on !== undefined;
  }

  if (debug) console.log("starting walk with args", args);
  const hasPath = isAry(path) && path.length > 0;
  const isArrayItem = hasPath && isNum(path[0]) && isAry(path[1]);
  const isObjValue = hasPath && isStr(path[0]) && isObj(path[1]);

  const split_str = (str) =>
    map(str.split(split_strings_on), ({ it, first }) => (include_sep && !first ? split_strings_on : "") + it);
  const join_subs = (subs) => subs.join(include_sep ? "" : split_strings_on);

  if (!hasPath && isStr(data)) throw new Error("you must pass in an object or an array to start");

  const mod_parent = (value) => {
    if (path.length === 0) throw new Error("[deepest-walk] unable to modify the starting data in place");
    if (typeof path[0] === "number") {
      // path[0] is an index in an array
      path[1][path[0]] = value;
    } else if (typeof path[0] === "string") {
      // path[0] is a key in an object
      path[1][path[0]] = value;
    }
  };

  if (isAry(data)) {
    if (!types || types.includes("array")) {
      callback({
        type: "array",
        data,
        mod: mod_parent,
      });
    }
    data.forEach((item, i) => {
      if (isStr(item)) {
        if (!types || types.includes("array-item-string")) {
          callback({
            type: "array-item-string",
            data: item,
            mod: (new_item) => (data[i] = new_item),
          });
        }
        if (split_strings_on && (!types || types.includes("array-item-substring"))) {
          const subItems = split_str(item);
          forEach(subItems, ({ it: subItem, index: ii, next, prev, first: isFirstSubstr, last: isLastSubstr }) => {
            callback({
              type: "array-item-substring",
              data: subItem,
              mod: (newSubItem) => {
                subItems[ii] = newSubItem;
                data[i] = subItems.join(include_sep ? "" : split_strings_on);
              },
              path: [ii, item, data, ...path],
              next,
              prev,
              first: isFirstSubstr,
              last: isLastSubstr,
            });
          });
        }
      } else {
        walk({ ...args, data: item, path: [i, data, ...path].slice(0, m) });
      }
    });
  } else if (isObj(data)) {
    if (!types || types.includes("object")) {
      callback({
        type: "object",
        data,
        mod: mod_parent,
      });
    }
    Object.keys(data).forEach((key) => {
      if (!types || types.includes("object-key-string")) {
        callback({
          type: "object-key-string",
          data: key,
          mod: (new_key) => {
            replaceKey({ obj: data, old_key: key, new_key });
            key = new_key;
          },
        });
      }

      if (split_keys && split_strings_on && (!types || types.includes("object-key-substring"))) {
        const subKeys = split_str(key);
        forEach(subKeys, ({ it: subkey, i, first, last, prev, next }) => {
          const mod = (newSubKey) => {
            subKeys[i] = newSubKey;
            const new_key = join_subs(subKeys);
            replaceKey({ obj: data, old_key: key, new_key });
            key = new_key;
          };
          callback({
            type: "object-key-substring",
            data: subkey,
            mod,
            first,
            last,
            prev,
            next,
          });
        });
      }
      let value = data[key];
      if (debug) console.log("value:", value);
      if (isStr(value)) {
        if (!types || types.includes("object-value-string")) {
          callback({
            type: "object-value-string",
            data: value,
            mod: (newValue) => {
              data[key] = newValue;
              value = newValue;
            },
          });
        }
        if (split_strings_on && (!types || types.includes("object-value-substring"))) {
          const subValues = split_str(value);
          forEach(subValues, ({ it: subvalue, i }) => {
            const mod = (newSubValue) => {
              subValues[i] = newSubValue;
              data[key] = join_subs(subValues);
              subvalue = newSubValue;
            };
            callback({
              type: "object-value-substring",
              data: subvalue,
              mod,
            });
          });
        }
      } else {
        // walk value
        walk({ ...args, data: data[key], path: [key, data, ...path].slice(0, m) });
      }
    });
  } else if (data === undefined || data === null || typeof data === "number") {
    if (!hasPath) {
      const dataType =
        data === undefined ? "undefined" : data === null ? "null" : typeof data === "number" ? "number" : undefined;
      if (!types || types.includes(dataType)) {
        callback({
          data,
          type: dataType,
          mod: () => {
            throw new Error("unable to mod");
          },
        });
      }
    } else if (isArrayItem || isObjValue) {
      let type;
      if (data === undefined) type = "array-item-undefined";
      else if (data === null) type = "array-item-null";
      else if (typeof data === "number") type = "array-item-number";
      if (!types || types.includes(type)) {
        callback({
          data,
          type,
          mod: (new_value) => {
            path[1][path[0]] = new_value;
            value = new_value;
          },
        });
      }
    }
  }
}

module.exports = walk;
