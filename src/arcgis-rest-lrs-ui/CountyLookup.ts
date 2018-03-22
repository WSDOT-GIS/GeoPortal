// #region county features
const countyFeatures = {
  displayFieldName: "JURLBL",
  fieldAliases: {
    JURLBL: "JURISDICTION LABEL",
    JURNM: "JURISDICTION NAME",
    JURDSG: "COUNTY NUMBER",
    JURFIPSDSG: "COUNTY FIPS CODE"
  },
  fields: [
    {
      name: "JURLBL",
      type: "esriFieldTypeString",
      alias: "JURISDICTION LABEL",
      length: 20
    },
    {
      name: "JURNM",
      type: "esriFieldTypeString",
      alias: "JURISDICTION NAME",
      length: 50
    },
    {
      name: "JURDSG",
      type: "esriFieldTypeDouble",
      alias: "COUNTY NUMBER"
    },
    {
      name: "JURFIPSDSG",
      type: "esriFieldTypeDouble",
      alias: "COUNTY FIPS CODE"
    }
  ],
  features: [
    {
      attributes: {
        JURLBL: "Adams",
        JURNM: "Adams County",
        JURDSG: 1,
        JURFIPSDSG: 53001
      }
    },
    {
      attributes: {
        JURLBL: "Asotin",
        JURNM: "Asotin County",
        JURDSG: 2,
        JURFIPSDSG: 53003
      }
    },
    {
      attributes: {
        JURLBL: "Benton",
        JURNM: "Benton County",
        JURDSG: 3,
        JURFIPSDSG: 53005
      }
    },
    {
      attributes: {
        JURLBL: "Chelan",
        JURNM: "Chelan County",
        JURDSG: 4,
        JURFIPSDSG: 53007
      }
    },
    {
      attributes: {
        JURLBL: "Clallam",
        JURNM: "Clallam County",
        JURDSG: 5,
        JURFIPSDSG: 53009
      }
    },
    {
      attributes: {
        JURLBL: "Clark",
        JURNM: "Clark County",
        JURDSG: 6,
        JURFIPSDSG: 53011
      }
    },
    {
      attributes: {
        JURLBL: "Columbia",
        JURNM: "Columbia County",
        JURDSG: 7,
        JURFIPSDSG: 53013
      }
    },
    {
      attributes: {
        JURLBL: "Cowlitz",
        JURNM: "Cowlitz County",
        JURDSG: 8,
        JURFIPSDSG: 53015
      }
    },
    {
      attributes: {
        JURLBL: "Douglas",
        JURNM: "Douglas County",
        JURDSG: 9,
        JURFIPSDSG: 53017
      }
    },
    {
      attributes: {
        JURLBL: "Ferry",
        JURNM: "Ferry County",
        JURDSG: 10,
        JURFIPSDSG: 53019
      }
    },
    {
      attributes: {
        JURLBL: "Franklin",
        JURNM: "Franklin County",
        JURDSG: 11,
        JURFIPSDSG: 53021
      }
    },
    {
      attributes: {
        JURLBL: "Garfield",
        JURNM: "Garfield County",
        JURDSG: 12,
        JURFIPSDSG: 53023
      }
    },
    {
      attributes: {
        JURLBL: "Grant",
        JURNM: "Grant County",
        JURDSG: 13,
        JURFIPSDSG: 53025
      }
    },
    {
      attributes: {
        JURLBL: "Grays Harbor",
        JURNM: "Grays Harbor County",
        JURDSG: 14,
        JURFIPSDSG: 53027
      }
    },
    {
      attributes: {
        JURLBL: "Island",
        JURNM: "Island County",
        JURDSG: 15,
        JURFIPSDSG: 53029
      }
    },
    {
      attributes: {
        JURLBL: "Jefferson",
        JURNM: "Jefferson County",
        JURDSG: 16,
        JURFIPSDSG: 53031
      }
    },
    {
      attributes: {
        JURLBL: "King",
        JURNM: "King County",
        JURDSG: 17,
        JURFIPSDSG: 53033
      }
    },
    {
      attributes: {
        JURLBL: "Kitsap",
        JURNM: "Kitsap County",
        JURDSG: 18,
        JURFIPSDSG: 53035
      }
    },
    {
      attributes: {
        JURLBL: "Kittitas",
        JURNM: "Kittitas County",
        JURDSG: 19,
        JURFIPSDSG: 53037
      }
    },
    {
      attributes: {
        JURLBL: "Klickitat",
        JURNM: "Klickitat County",
        JURDSG: 20,
        JURFIPSDSG: 53039
      }
    },
    {
      attributes: {
        JURLBL: "Lewis",
        JURNM: "Lewis County",
        JURDSG: 21,
        JURFIPSDSG: 53041
      }
    },
    {
      attributes: {
        JURLBL: "Lincoln",
        JURNM: "Lincoln County",
        JURDSG: 22,
        JURFIPSDSG: 53043
      }
    },
    {
      attributes: {
        JURLBL: "Mason",
        JURNM: "Mason County",
        JURDSG: 23,
        JURFIPSDSG: 53045
      }
    },
    {
      attributes: {
        JURLBL: "Okanogan",
        JURNM: "Okanogan County",
        JURDSG: 24,
        JURFIPSDSG: 53047
      }
    },
    {
      attributes: {
        JURLBL: "Pacific",
        JURNM: "Pacific County",
        JURDSG: 25,
        JURFIPSDSG: 53049
      }
    },
    {
      attributes: {
        JURLBL: "Pend Oreille",
        JURNM: "Pend Oreille County",
        JURDSG: 26,
        JURFIPSDSG: 53051
      }
    },
    {
      attributes: {
        JURLBL: "Pierce",
        JURNM: "Pierce County",
        JURDSG: 27,
        JURFIPSDSG: 53053
      }
    },
    {
      attributes: {
        JURLBL: "San Juan",
        JURNM: "San Juan County",
        JURDSG: 28,
        JURFIPSDSG: 53055
      }
    },
    {
      attributes: {
        JURLBL: "Skagit",
        JURNM: "Skagit County",
        JURDSG: 29,
        JURFIPSDSG: 53057
      }
    },
    {
      attributes: {
        JURLBL: "Skamania",
        JURNM: "Skamania County",
        JURDSG: 30,
        JURFIPSDSG: 53059
      }
    },
    {
      attributes: {
        JURLBL: "Snohomish",
        JURNM: "Snohomish County",
        JURDSG: 31,
        JURFIPSDSG: 53061
      }
    },
    {
      attributes: {
        JURLBL: "Spokane",
        JURNM: "Spokane County",
        JURDSG: 32,
        JURFIPSDSG: 53063
      }
    },
    {
      attributes: {
        JURLBL: "Stevens",
        JURNM: "Stevens County",
        JURDSG: 33,
        JURFIPSDSG: 53065
      }
    },
    {
      attributes: {
        JURLBL: "Thurston",
        JURNM: "Thurston County",
        JURDSG: 34,
        JURFIPSDSG: 53067
      }
    },
    {
      attributes: {
        JURLBL: "Wahkiakum",
        JURNM: "Wahkiakum County",
        JURDSG: 35,
        JURFIPSDSG: 53069
      }
    },
    {
      attributes: {
        JURLBL: "Walla Walla",
        JURNM: "Walla Walla County",
        JURDSG: 36,
        JURFIPSDSG: 53071
      }
    },
    {
      attributes: {
        JURLBL: "Whatcom",
        JURNM: "Whatcom County",
        JURDSG: 37,
        JURFIPSDSG: 53073
      }
    },
    {
      attributes: {
        JURLBL: "Whitman",
        JURNM: "Whitman County",
        JURDSG: 38,
        JURFIPSDSG: 53075
      }
    },
    {
      attributes: {
        JURLBL: "Yakima",
        JURNM: "Yakima County",
        JURDSG: 39,
        JURFIPSDSG: 53077
      }
    }
  ]
};
// #endregion

function featureSetToMap(featureSet: any) {
  const map = new Map<number, string>();
  if (!(featureSet && featureSet.features)) {
    throw new TypeError("FeatureSet features not defined.");
  }
  for (const feature of featureSet.features) {
    const attributes = feature.attributes;
    const label = attributes.JURLBL;
    const fips = attributes.JURFIPSDSG;
    if (!fips || !label) {
      throw new TypeError(`FIPS: ${fips}, Label: ${label}`);
    }
    map.set(fips, label);
  }
  return map;
}

const countyLookup = featureSetToMap(countyFeatures);

export default countyLookup;
