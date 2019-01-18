const axios = require('axios');
const express = require('express');

const FIRST_CHANGE_ID = '329660668-341308301-322299911-369365105-349108768';
const BASE_URL = 'http://api.pathofexile.com/public-stash-tabs';

class Store {
  constructor() {
    this.data = {};
  }

  addStash(stash) {
    const { league: leagueName, id: stashId, items } = stash;
    const leagueKey = leagueName.toLowerCase();
    if (!this.data[leagueKey]) this.data[leagueKey] = {};
    this.data[leagueKey][stashId] = stash;
  }
}

const fetchStashes = changeId => axios.get(BASE_URL, { params: { id: changeId } });

const fetchAllStashes = async (changeId, store) => {
  try {
    console.log(changeId);

    const { data } = await fetchStashes(changeId);
    const { stashes, next_change_id: nextChangeId } = data;

    stashes.filter(s => s.league).forEach(s => store.addStash(s));

    if (nextChangeId) return fetchAllStashes(nextChangeId, store);
  } catch (e) {
    console.error(e);
    setTimeout(() => fetchAllStashes(changeId, store), 1000);
  }
};

const main = () => {
  const store = new Store();

  const app = express();
  const port = 3000;

  app.get('/:league', (req, res) => {
    const page = req.query.page ? parseInt(req.query.page, 10) : 0;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize, 10) : 5;
    const leagueKey = req.params.league.toLowerCase();
    let leagueData = store.data[leagueKey];

    if (leagueData) {
      const pagedData = Object.values(leagueData).slice(page * pageSize, page * pageSize + pageSize);
      res.json(pagedData);
    } else {
      res.status(404).json({ error: 'league data not found.' });
    }
  });

  app.listen(port, () => console.log(`Example app listening on port ${port}!`));

  fetchAllStashes(FIRST_CHANGE_ID, store);
};

main();
