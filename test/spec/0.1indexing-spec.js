var fs = require('fs');
var si = require('../../')({indexPath:'si-world-bank'});
var _ = require('lodash');

describe('indexing and search', function () {


  var data = JSON.parse(fs.readFileSync('node_modules/world-bank-dataset/world-bank-projects.json'));

  var processDoc = function(datum) {
    delete datum._id;
    delete datum.projectdocs;
    delete datum.theme1;
    delete datum.majorsector_percent;
    delete datum.mjsector_namecode;
    delete datum.mjtheme_namecode;
    delete datum.sector;
    delete datum.sector_namecode;
    delete datum.sector1;
    delete datum.sector2;
    delete datum.theme_namecode;
    return datum;
  };

//  console.log(_.map(data, processDoc));

  it('should index one file of test data', function () {
    runs(function() {
      this.err = undefined;
      this.done = false;
      var that = this;
      si.add({'batchName': 'world-bank-projects.json',
              'filters': ['mjtheme']},
             _.map(data, processDoc), function(err) {
        that.err = err;
        that.done = true;
      });
    });
    waitsFor(function() {
      return this.done != false;
    }, 'err not to be empty (search err returned)', 30000)
    runs(function () {
      expect(this.err).toEqual(null);
    });
  });

  it('should be able to create a snapshot', function () {    
    runs(function () {
      this.completed = false;
      this.error = false;
      var that = this;
      si.snapShot(function(rs) {
        rs.pipe(fs.createWriteStream('backup.gz'))
          .on('close', function() {
            that.completed = true;
          })
          .on('error', function() {
            that.error = true;
          });
      });
    });
    waitsFor(function() {
      return this.completed;
    }, 'waiting for search results', 60000)
    runs(function() {
      expect(this.completed).toEqual(true);
      expect(this.error).toEqual(false);
    });
  });


  it('should be able to search in indexed data', function () {    
    runs(function () {
      this.searchResults = '';
      var that = this;
      si.search({
        'query': {
          '*': ['ethiopia']
        },
        'facets': ['mjtheme']
      }, function(err, searchResults) {
        that.searchResults = searchResults;
      });
    });
    waitsFor(function() {
      return this.searchResults != '';
    }, 'waiting for search results', 1000)
    runs(function() {
      expect(this.searchResults).toBeDefined();
      expect(this.searchResults.hits.length).toEqual(4);
      expect(this.searchResults.facets.mjtheme).toBeDefined();
      expect(this.searchResults.facets.mjtheme[0].key).toEqual('Human development');
      expect(this.searchResults.facets.mjtheme[0].value).toEqual(2);
      expect(this.searchResults.facets.mjtheme.length).toEqual(7);
      expect(this.searchResults.hits[0].id).toEqual('P129828');
      expect(this.searchResults.hits[1].id).toEqual('P123531');
      expect(this.searchResults.hits[2].id).toEqual('P117731');
      expect(this.searchResults.hits[3].id).toEqual('P128891');
    });
  });


});