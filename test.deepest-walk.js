const test = require("flug");
const walk = require("./deepest-walk");

const rec = ({ data, debug, split_strings_on }) => {
  let output = [];
  const callback = ({ data }) => output.push(data);
  walk({ data, debug, callback, split_strings_on });
  return output;
};

test("walking array of strings", ({ eq }) => {
  const data = ["a", "b", "c"];
  eq(rec({ data }), ["a", "b", "c"]);
});

test("walking array of integers", ({ eq }) => {
  const data = [1, 2, 3];
  eq(rec({ data }), [1, 2, 3]);
});

test("walking mixed array", ({ eq }) => {
  const data = [1, "two", undefined, null];
  eq(rec({ data }), [1, "two", undefined, null]);
});

test("walking simple object", ({ eq }) => {
  const data = { name: "United States of America" };
  eq(rec({ data }), ["name", "United States of America"]);
});

test("walking two-property object", ({ eq }) => {
  const data = { name: "United States of America", abbreviation: "USA" };
  eq(rec({ data }), ["name", "United States of America", "abbreviation", "USA"]);
});

test("walking array of objects", ({ eq }) => {
  const data = [{ name: "George Washington" }, { name: "John Adams" }];
  eq(rec({ data }), ["name", "George Washington", "name", "John Adams"]);
});

test("walking array of objects", ({ eq }) => {
  const data = { name: "George" };
  walk({
    data,
    callback: ({ data, mod }) => {
      if (data === "George") mod("John");
    },
  });
  eq(data, { name: "John" });
});

test("walking words", ({ eq }) => {
  const data = { name: "United States of America" };
  eq(rec({ data, debug: false, split_strings_on: " " }), ["name", "United", "States", "of", "America"]);
});

test("walking words with replace", ({ eq }) => {
  const data = { name: "United States of America" };
  walk({
    data,
    callback: ({ data, mod }) => {
      if (data === "United") mod("The United");
    },
    split_strings_on: " ",
  });
  eq(data, { name: "The United States of America" });
});

test("walking words with prepended space", ({ eq }) => {
  const data = { name: "United States of America" };
  walk({
    data,
    callback: ({ data, mod }) => {
      if (data === "United") mod("UNITED");
      if (data === " States") mod(" STATES");
    },
    split_strings_on: " ",
    include_sep: true,
  });
  eq(data, { name: "UNITED STATES of America" });
});

test("capitalizing all keys and values", ({ eq }) => {
  const data = [{ name: "George Washington" }, { name: "John Adams" }];
  const callback = ({ data: str, mod }) => {
    if (str !== "name") mod(str.toUpperCase());
  };
  walk({ data, callback });
  eq(data, [{ name: "GEORGE WASHINGTON" }, { name: "JOHN ADAMS" }]);
});

test("capitalizing everything", ({ eq }) => {
  const data = { name: "George Washington" };
  const callback = ({ data, mod }) => mod(data.toUpperCase());
  walk({ data, callback });
  eq(data, { NAME: "GEORGE WASHINGTON" });
});

test("adding to numbers in an array of objects", ({ eq }) => {
  const data = [{ n: 94 }, { n: 72 }, { n: 76 }];
  const callback = ({ data, mod }) => typeof data === "number" && mod(Math.min(100, data + 10));
  walk({ data, callback });
  eq(data, [{ n: 100 }, { n: 82 }, { n: 86 }]);
});

test("capitalizing select word in subkeys", ({ eq }) => {
  const data = { "key abc": null, "key xyz": null };
  const callback = ({ data, mod }) => data === "key" && mod("KEY");
  walk({ data, callback, split_strings_on: " " });
  eq(data, { "KEY abc": null, "KEY xyz": null });
});
