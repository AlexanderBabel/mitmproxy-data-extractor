const axios = require("axios");
const readline = require("readline");
const fs = require("fs");
const dns = require("node:dns");

const API_KEY = "API_KEY_HERE";
const SOURCE_LOCATION = `52.12773,11.62916`;

const MODES = {
  PRINT_CSV: "csv",
  PRINT_JSON: "json",
  PRINT_GEO_LOC: "geo",
};

const MODE = MODES.PRINT_GEO_LOC; // options: PRINT_CSV, PRINT_JSON, PRINT_GEO_LOC

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});
const uniqueOrigins = {};
const uniqueDomains = {};

function getOrdered(input) {
  return Object.keys(input)
    .sort()
    .reduce((obj, key) => {
      obj[key] = input[key];
      return obj;
    }, {});
}

function getFromGeoCache(domain) {
  if (!fs.existsSync("cache")) {
    fs.mkdirSync("cache");
  }

  if (fs.existsSync(`cache/${domain}`)) {
    return JSON.parse(fs.readFileSync(`cache/${domain}`));
  }
}

function writeToGeoCache(domain, json) {
  if (!fs.existsSync("cache")) {
    fs.mkdirSync("cache");
  }

  fs.writeFileSync(`cache/${domain}`, JSON.stringify(json, null, 2));
}

async function getDnsRecord(domain) {
  return new Promise((res, rej) => {
    dns.resolve4(domain, (err, addresses) => {
      if (err) {
        rej(err);
      }
      res(addresses);
    });
  });
}

rl.on("line", (line) => {
  if (line.includes("//mcf4wh-jdfmxrzzzttwqcrf-d3b4.device.")) {
    line = "https://mcf4wh-jdfmxrzzzttwqcrf-d3b4.device.marketingcloudapis.com";
  }
  if (line.includes("//zn1ynnliufrct75cb-paypalxm.siteintercept.")) {
    line = "https://zn1ynnliufrct75cb-paypalxm.siteintercept.qualtrics.com";
  }
  if (line.includes("//b03e2ef4eecf.755937cb.eu-central-1.token.")) {
    line = "https://b03e2ef4eecf.755937cb.eu-central-1.token.awswaf.com";
  }

  const url = new URL(line);

  uniqueOrigins[url.origin] = uniqueOrigins[url.origin] || 0;
  uniqueOrigins[url.origin] += 1;

  uniqueDomains[url.hostname] = uniqueDomains[url.hostname] || 0;
  uniqueDomains[url.hostname] += 1;
});

rl.once("close", async () => {
  const orderedOrigins = getOrdered(uniqueOrigins);
  const orderedDomains = getOrdered(uniqueDomains);

  switch (MODE) {
    case MODES.PRINT_CSV:
      console.log(`Domain,Connection Count,Data Types,Protocol Action`);
      const data = Object.keys(orderedOrigins).map((k) => {
        return `${k},${orderedOrigins[k]},DT\\textsubscript{5},1`;
      });
      console.log(data.join("\n"));
      return;

    case MODES.PRINT_JSON:
      console.log(JSON.stringify(orderedOrigins, null, 2));
      return;

    case MODES.PRINT_GEO_LOC:
      console.log(`Domain\tTarget\tSource\tCount`);

      for (const domain of Object.keys(orderedDomains)) {
        const cacheEntry = await getFromGeoCache(domain);
        if (cacheEntry) {
          console.log(
            `${domain}\t${cacheEntry.latitude},${cacheEntry.longitude}\t${SOURCE_LOCATION}}\t${orderedDomains[domain]}`
          );
          continue;
        }

        const addresses = await getDnsRecord(domain).catch((err) => {
          console.error(err);
          console.error(`Could not resolve ${domain}`);
          process.exit(1);
        });

        const res = await axios
          .get(
            `https://api.ipgeolocation.io/ipgeo?apiKey=${API_KEY}&ip=${addresses[0]}`
          )
          .catch((err) => {
            console.error(err.response);
            console.error(`Could not get data for ${domain}`);
            process.exit(1);
          });

        console.log(
          `${domain}\t${res.data.latitude},${res.data.longitude}\t52.12773,11.62916\t${orderedDomains[domain]}`
        );
        writeToGeoCache(domain, res.data);
      }
      return;

    default:
      console.error("Unknown mode set. Please use a valid mode!");
      process.exit(1);
  }
});

// Command:
// mitmdump -r netto-setup --flow-detail 1 -n | sd '127\.0\.0\.1:\d+: [A-Z]+ ' '' | sd '\s+<< .*' '' | sd ' HTTP/2.0' '' | sd '…' '' | node dump.js
