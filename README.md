# From Youtube to Vimeo

This "service" aims to transfer a number of Youtube videos to Vimeo (for whatever reason).

## Making it work

- First create an app with Vimeo, which only you can use. Request upload permissions as well for this app. It may take some days for Vimeo to give you this.
- Copy `config.js.example` to `config.js` and fill in the respective values.
- In the `importIds` file, create a newline separated list of video ids you wish to transfer.
- Run the script with NodeJS 8.11+ with `node index.js`.
- In `map.json` the script will report the status and new ids of every transferred file.

## Configuration

### Environment vars

| Key | Default | Explanation |
|---|---|---|
| `CONCURRENCY` | `2` | How many concurrent videos to handle. |
| `TMP_DIR` | `./tmp` | Where to store temporary files. |

### Configuration file

| Key | Default | Explanation |
|---|---|---|
| `keepVideos` | `true` | Whether to keep the temporary downloaded file after the upload completed. |
| `importFile` | _n/a_ | Which file should be used as an input source |
