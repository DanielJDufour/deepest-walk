# deepest-walk
The Deepest JSON Object Walking Library: Traverse and Modify Arrays, Objects, Numbers, Strings, and Substrings.

# why is it the deepest?
There are many great object walking libraries.  However, I'm not aware of any other library that will traverse substrings within the strings found in a JSON Object.

# install
```bash
npm install deepest-walk
```

# types
- array
- object
- array-item-string
- array-item-substring
- object-key-string
- object-key-substring
- object-value-string
- object-value-substring
- undefined
- null
- number

# usage
## basic usage
```javascript
const walk = require("deepest-walk");

const data = [
  { name: 'George Washington' },
  { name: 'John Adams' }
];
const callback = ({ data }) => console.log(data);
walk({ data, callback });
```
This will log:
```
name
George Washington
name
John Adams
```

## breaking on words
Set split_strings_on to " " to break on words
```javascript
const walk = require("deepest-walk");

const data = [
  { name: 'George Washington' },
  { name: 'John Adams' }
];
const callback = ({ data }) => console.log(data);
walk({ data, callback, split_strings_on: " " });
```
This will log:
```
name
name
George Washington
George
Washington
name
name
John Adams
John
Adams
```

## modifying words
The following capitalizes all the strings
```javascript
const walk = require("deepest-walk");

const data = [
  { name: 'George Washington' },
  { name: 'John Adams' }
];
const callback = ({ data: str, mod, type }) => {
  if (type.includes("string")) {
    mod(str.toUpperCase());
  }
};

walk({ data, callback });
```
Data will be:
```javascript
[
  { NAME: 'GEORGE WASHINGTON' },
  { NAME: 'JOHN ADAMS' }
];
```
