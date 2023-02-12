# mitmproxy-data-extractor

This script is used to simply the workflow of getting preprocessed data out of `mitmdump`.

The script was used to generate tables, maps and other media used in a research paper.

## Modes

The `dump.js` contains the relevant code. In the header of the file, it is possible to change the output of the script. Three options are available:

### `MODES.PRINT_CSV`:
Prints accumulated data in the CSV format. Example:

```csv
Domain,Connection Count,Data Types,Protocol Action
https://assets.adobedtm.com,3,DT\textsubscript{5},1
https://crashlyticsreports-pa.googleapis.com,1,DT\textsubscript{5},1
https://www.dhl.de,45,DT\textsubscript{5},1
```

This format can be used with tools such as [tablesgenerator.com](https://www.tablesgenerator.com/latex_tables#).

### `MODES.PRINT_JSON`:
Prints accumulated data in JSON format. Example:

```json
{
  "https://assets.adobedtm.com": 3,
  "https://crashlyticsreports-pa.googleapis.com": 1,
  "https://www.dhl.de": 45
}
```

### `MODES.PRINT_GEO_LOC`:
This mode uses an external API ([ipgeolocation.io](https://ipgeolocation.io)) to get geo location information and caches them in the `./cache` directory. You'll need an API key from [ipgeolocation.io](https://ipgeolocation.io) in order to use this mode. The API could also be swapped with another provider. Example:

```tsv
Domain	Target	Source	Count
assets.adobedtm.com	52.51604,13.37691	52.12773,11.62916	3
crashlyticsreports-pa.googleapis.com	37.42240,-122.08421	52.12773,11.62916	1
www.dhl.de	52.51604,13.37691	52.12773,11.62916	45
```

This data can be used to generate a map with [Palladio](https://hdlab.stanford.edu/palladio/) and visualize the destinations of the connections.

The source location can be set in the `SOURCE_LOCATION` variable. Right now it is set to *Magdeburg, Germany*.

## Usage

To make use of the script, you need to have `sd` installed. Guide: [chmln/sd](https://github.com/chmln/sd#installation) Example for macOS: `brew install sd`

Afterwards, you can run the script through piping the output of mitmdump. Example:

```bash
 mitmdump -r FLOW_FILE --flow-detail 1 -n | sd '127\.0\.0\.1:\d+: [A-Z]+ ' '' | sd '\s+<< .*' '' | sd ' HTTP/2.0' '' | sd '…' '' | node ./dump.js
```
