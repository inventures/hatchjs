module.exports = 
  { "development":
    { "driver":   "redis-hq"
    , "prefix":   "dev"
    , "database": 0
    , "fulltext": {
        driver: 'reds'
    }
    , "session": {database: 10}
    }
  , "test":
    { "driver":   "redis-hq"
    , "prefix":   "test"
    , "database": 1
    , "fulltext": {driver: 'reds', database: 5}
    , "session": {database: 10}
    }
  , "production":
    { "driver":   "redis-hq"
    , "prefix":   "dev"
    , "database": 0
    , "fulltext": {
        driver: 'reds'
    }
    , "fulltextSOLR": {
        driver: 'solr',
        host: 'index.websolr.com',
        port: 80,
        cores: {
            'prod-Content': '37963d1aa5c',
            'prod-Activity': 'de55defbcfd',
            'prod-User': '6351314a5df',
            'global': '3e73a2f2c7d'
        }
    }
    , "session": {database: 10}
    }
};
