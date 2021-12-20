const test = require("flug");
const walk = require("./deepest-walk");

const rec = ({ data, debug, split_strings_on, types }) => {
  let output = [];
  const callback = ({ data, type }) => {
    if (!Array.isArray(types) || types.includes(type)) {
      output.push(data);
    }
  };
  walk({ data, debug, callback, split_strings_on });
  if (debug) console.log("output:", output);
  return output;
};

test("walking array of strings", ({ eq }) => {
  const data = ["a", "b", "c"];
  eq(rec({ data, types: ["array-item-string"] }), ["a", "b", "c"]);
});

test("walking array of integers", ({ eq }) => {
  const data = [1, 2, 3];
  eq(rec({ data, types: ["array-item-number"] }), [1, 2, 3]);
});

test("walking mixed array", ({ eq }) => {
  const data = [1, "two", undefined, null];
  eq(rec({ data, types: ["array-item-null", "array-item-number", "array-item-string", "array-item-undefined"] }), [
    1,
    "two",
    undefined,
    null,
  ]);
});

test("walking simple object", ({ eq }) => {
  const data = { name: "United States of America" };
  eq(rec({ data, types: ["object-key-string", "object-value-string"] }), ["name", "United States of America"]);
});

test("walking two-property object", ({ eq }) => {
  const data = { name: "United States of America", abbreviation: "USA" };
  eq(rec({ data, types: ["object-key-string", "object-value-string"] }), [
    "name",
    "United States of America",
    "abbreviation",
    "USA",
  ]);
});

test("walking array of objects", ({ eq }) => {
  const data = [{ name: "George Washington" }, { name: "John Adams" }];
  eq(rec({ data, types: ["object-key-string", "object-value-string"] }), [
    "name",
    "George Washington",
    "name",
    "John Adams",
  ]);
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
  eq(
    rec({
      data,
      types: ["object-key-string", "object-value-string", "object-value-substring"],
      debug: false,
      split_strings_on: " ",
    }),
    ["name", "United States of America", "United", "States", "of", "America"]
  );
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
  const callback = ({ data: str, mod, type }) => {
    if (!type.endsWith("-string")) return;
    if (str !== "name") mod(str.toUpperCase());
  };
  walk({ data, callback });
  eq(data, [{ name: "GEORGE WASHINGTON" }, { name: "JOHN ADAMS" }]);
});

test("capitalizing everything", ({ eq }) => {
  const data = { name: "George Washington" };
  const callback = ({ data, mod, type }) => {
    if (type.includes("string")) {
      mod(data.toUpperCase());
    }
  };
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

test("walking Well-Known Text", ({ eq }) => {
  const data = [
    [
      "PROJCS",
      "NAD27 / UTM zone 16N",
      [
        "GEOGCS",
        "NAD27",
        [
          "DATUM",
          "North_American_Datum_1927",
          ["SPHEROID", "Clarke 1866", 6378206.4, 294.9786982139006, ["AUTHORITY", "EPSG", "7008"]],
          ["AUTHORITY", "EPSG", "6267"],
        ],
        ["PRIMEM", "Greenwich", 0, ["AUTHORITY", "EPSG", "8901"]],
        ["UNIT", "degree", 0.0174532925199433, ["AUTHORITY", "EPSG", "9122"]],
        ["AUTHORITY", "EPSG", "4267"],
      ],
      ["PROJECTION", "Transverse_Mercator"],
      ["PARAMETER", "latitude_of_origin", 0],
      ["PARAMETER", "central_meridian", -87],
      ["PARAMETER", "scale_factor", 0.9996],
      ["PARAMETER", "false_easting", 500000],
      ["PARAMETER", "false_northing", 0],
      ["UNIT", "metre", 1, ["AUTHORITY", "EPSG", "9001"]],
      ["AXIS", "Easting", "EAST"],
      ["AXIS", "Northing", "NORTH"],
      ["AUTHORITY", "EPSG", "26716"],
    ],
  ];
  const vars = {
    EPSG_7008: ["AUTHORITY", "EPSG", "7008"],
    EPSG_6267: ["AUTHORITY", "EPSG", "6267"],
    EPSG_8901: ["AUTHORITY", "EPSG", "8901"],
    EPSG_9122: ["AUTHORITY", "EPSG", "9122"],
    EPSG_4267: ["AUTHORITY", "EPSG", "4267"],
    AXE: ["AXIS", "Easting", "EAST"],
    AXN: ["AXIS", "Northing", "NORTH"],
    EPSG_26716: ["AUTHORITY", "EPSG", "26716"],
  };
  const arr2var = Object.fromEntries(Object.entries(vars).map(([k, arr]) => [JSON.stringify(arr), k]));
  walk({
    data,
    callback: ({ data, mod, type }) => {
      if (Array.isArray(data) && data.every((it) => it === "null" || typeof it !== "object")) {
        const str = JSON.stringify(data);
        if (str in arr2var) {
          mod(arr2var[str]);
        }
      }
    },
  });
  const modded = JSON.stringify(data);
  eq(
    modded,
    `[["PROJCS","NAD27 / UTM zone 16N",["GEOGCS","NAD27",["DATUM","North_American_Datum_1927",["SPHEROID","Clarke 1866",6378206.4,294.9786982139006,"EPSG_7008"],"EPSG_6267"],["PRIMEM","Greenwich",0,"EPSG_8901"],["UNIT","degree",0.0174532925199433,"EPSG_9122"],"EPSG_4267"],["PROJECTION","Transverse_Mercator"],["PARAMETER","latitude_of_origin",0],["PARAMETER","central_meridian",-87],["PARAMETER","scale_factor",0.9996],["PARAMETER","false_easting",500000],["PARAMETER","false_northing",0],["UNIT","metre",1,["AUTHORITY","EPSG","9001"]],"AXE","AXN","EPSG_26716"]]`
  );
});
